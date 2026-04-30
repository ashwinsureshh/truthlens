import json
from flask import Blueprint, request, jsonify, Response, stream_with_context, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from .. import db, limiter
from ..models.analysis import Analysis
from ..services.scraper import scrape_url
from ..services.analyzer import analyze_text, analyze_text_stream
from ..services.llm import explain_verdict, chat_about_article, rewrite_article, llm_available
from ..services.source_credibility import lookup_source, enrich

analyze_bp = Blueprint("analyze", __name__)

# In-memory caches — avoid burning LLM quota on repeat visits.
_EXPLANATION_CACHE: dict[int, str] = {}
_REWRITE_CACHE:     dict[int, str] = {}


def get_optional_user_id():
    """Returns user ID if JWT present, else None (guest mode)."""
    try:
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        return int(identity) if identity else None
    except Exception:
        return None


@analyze_bp.route("/analyze/text", methods=["POST"])
@limiter.limit("5/minute;20/hour")
def analyze_text_route():
    data = request.get_json()
    text = data.get("text", "").strip()

    if not text or len(text) < 50:
        return jsonify({"error": "Please provide at least 50 characters of text"}), 400

    if len(text) > 8000:
        return jsonify({"error": "Text is too long. Please keep it under 8,000 characters."}), 400

    result = analyze_text(text)
    user_id = get_optional_user_id()

    analysis = Analysis(
        user_id=user_id,
        input_type="text",
        article_text=text,
        overall_score=result["overall_score"],
        sensationalism_score=result["scores"]["sensationalism"],
        bias_score=result["scores"]["bias"],
        emotion_score=result["scores"]["emotion"],
        factual_score=result["scores"]["factual"],
        sentence_results=result["sentence_results"],
    )
    db.session.add(analysis)
    db.session.commit()

    return jsonify({"analysis_id": analysis.id, **result}), 200


@analyze_bp.route("/analyze/url", methods=["POST"])
@limiter.limit("5/minute;20/hour")
def analyze_url_route():
    data = request.get_json()
    url = data.get("url", "").strip()

    if not url:
        return jsonify({"error": "URL is required"}), 400

    text, error = scrape_url(url)
    if error:
        return jsonify({"error": error}), 422

    result = analyze_text(text, url=url)   # pass url for in-memory caching
    user_id = get_optional_user_id()

    analysis = Analysis(
        user_id=user_id,
        input_type="url",
        source_url=url,
        article_text=text,
        overall_score=result["overall_score"],
        sensationalism_score=result["scores"]["sensationalism"],
        bias_score=result["scores"]["bias"],
        emotion_score=result["scores"]["emotion"],
        factual_score=result["scores"]["factual"],
        sentence_results=result["sentence_results"],
    )
    db.session.add(analysis)
    db.session.commit()

    return jsonify({"analysis_id": analysis.id, **result}), 200


def _sse_event(data: dict) -> str:
    """Format a dict as an SSE event."""
    return f"data: {json.dumps(data)}\n\n"


def _stream_and_save(text: str, url: str | None, input_type: str, user_id: int | None, app):
    """Generator that streams events and saves to DB on completion."""
    final_result = None
    try:
        # Send source-credibility info up-front for URL inputs
        if url:
            src = enrich(lookup_source(url))
            if src:
                yield _sse_event({"type": "source", "source": src})

        for event in analyze_text_stream(text, url=url):
            if event.get("type") == "complete":
                final_result = event
            yield _sse_event(event)

        # Save to DB after streaming completes
        if final_result and not final_result.get("cached"):
            with app.app_context():
                analysis = Analysis(
                    user_id=user_id,
                    input_type=input_type,
                    source_url=url,
                    article_text=text,
                    overall_score=final_result["overall_score"],
                    sensationalism_score=final_result["scores"]["sensationalism"],
                    bias_score=final_result["scores"]["bias"],
                    emotion_score=final_result["scores"]["emotion"],
                    factual_score=final_result["scores"]["factual"],
                    sentence_results=final_result["sentence_results"],
                )
                db.session.add(analysis)
                db.session.commit()
                yield _sse_event({"type": "saved", "analysis_id": analysis.id})
    except Exception as e:
        yield _sse_event({"type": "error", "message": str(e)})


@analyze_bp.route("/analyze/text/stream", methods=["POST"])
@limiter.limit("5/minute;20/hour")
def analyze_text_stream_route():
    data = request.get_json()
    text = data.get("text", "").strip()

    if not text or len(text) < 50:
        return jsonify({"error": "Please provide at least 50 characters of text"}), 400
    if len(text) > 8000:
        return jsonify({"error": "Text is too long. Please keep it under 8,000 characters."}), 400

    user_id = get_optional_user_id()
    app = current_app._get_current_object()
    return Response(
        stream_with_context(_stream_and_save(text, None, "text", user_id, app)),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@analyze_bp.route("/analyze/url/stream", methods=["POST"])
@limiter.limit("5/minute;20/hour")
def analyze_url_stream_route():
    data = request.get_json()
    url = data.get("url", "").strip()

    if not url:
        return jsonify({"error": "URL is required"}), 400

    text, error = scrape_url(url)
    if error:
        return jsonify({"error": error}), 422

    user_id = get_optional_user_id()
    app = current_app._get_current_object()
    return Response(
        stream_with_context(_stream_and_save(text, url, "url", user_id, app)),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@analyze_bp.route("/analyze/<int:analysis_id>/explain", methods=["GET"])
@limiter.limit("30/hour")
def ai_explain(analysis_id):
    """AI-generated plain-English explanation of the verdict."""
    if not llm_available():
        return jsonify({"error": "AI explanations are not configured."}), 503

    if analysis_id in _EXPLANATION_CACHE:
        return jsonify({"explanation": _EXPLANATION_CACHE[analysis_id], "cached": True}), 200

    a = Analysis.query.get_or_404(analysis_id)
    top = sorted(
        (a.sentence_results or []),
        key=lambda s: s.get("score", 0),
        reverse=True,
    )[:3]
    try:
        text = explain_verdict(
            overall_score=a.overall_score,
            scores={
                "sensationalism": a.sensationalism_score,
                "bias": a.bias_score,
                "emotion": a.emotion_score,
                "factual": a.factual_score,
            },
            article_text=a.article_text,
            top_sentences=top,
        )
        _EXPLANATION_CACHE[analysis_id] = text
        # cap cache size — keep most recent 200
        if len(_EXPLANATION_CACHE) > 200:
            for k in list(_EXPLANATION_CACHE.keys())[:50]:
                _EXPLANATION_CACHE.pop(k, None)
        return jsonify({"explanation": text}), 200
    except Exception as e:
        current_app.logger.warning("Gemini explain failed: %s", e)
        return jsonify({"error": f"AI explanation failed: {e}"}), 502


@analyze_bp.route("/analyze/<int:analysis_id>/chat", methods=["POST"])
@limiter.limit("30/hour")
def ai_chat(analysis_id):
    """Conversational Q&A grounded in the analyzed article."""
    if not llm_available():
        return jsonify({"error": "AI chat is not configured."}), 503

    data = request.get_json() or {}
    msg = (data.get("message") or "").strip()
    history = data.get("history") or []
    if not msg:
        return jsonify({"error": "message is required"}), 400
    if len(msg) > 1000:
        return jsonify({"error": "Question is too long (max 1000 chars)."}), 400

    a = Analysis.query.get_or_404(analysis_id)
    try:
        reply = chat_about_article(
            article_text=a.article_text,
            scores={
                "sensationalism": a.sensationalism_score,
                "bias": a.bias_score,
                "emotion": a.emotion_score,
                "factual": a.factual_score,
            },
            overall_score=a.overall_score,
            history=history,
            user_message=msg,
        )
        return jsonify({"reply": reply}), 200
    except Exception as e:
        current_app.logger.warning("Gemini chat failed: %s", e)
        return jsonify({"error": f"AI chat failed: {e}"}), 502


@analyze_bp.route("/analyze/<int:analysis_id>/rewrite", methods=["GET"])
@limiter.limit("20/hour")
def ai_rewrite(analysis_id):
    """AI-generated credible rewrite of the article."""
    if not llm_available():
        return jsonify({"error": "AI rewrites are not configured."}), 503

    if analysis_id in _REWRITE_CACHE:
        return jsonify({"rewrite": _REWRITE_CACHE[analysis_id], "cached": True}), 200

    a = Analysis.query.get_or_404(analysis_id)
    try:
        text = rewrite_article(
            article_text=a.article_text,
            scores={
                "sensationalism": a.sensationalism_score,
                "bias": a.bias_score,
                "emotion": a.emotion_score,
                "factual": a.factual_score,
            },
            overall_score=a.overall_score,
        )
        _REWRITE_CACHE[analysis_id] = text
        if len(_REWRITE_CACHE) > 100:
            for k in list(_REWRITE_CACHE.keys())[:30]:
                _REWRITE_CACHE.pop(k, None)
        return jsonify({"rewrite": text}), 200
    except Exception as e:
        current_app.logger.warning("AI rewrite failed: %s", e)
        return jsonify({"error": f"AI rewrite failed: {e}"}), 502


@analyze_bp.route("/stats", methods=["GET"])
def get_stats():
    """Public endpoint — returns total analyses count for homepage display."""
    count = Analysis.query.count()
    return jsonify({"total_analyses": count}), 200


@analyze_bp.route("/trending", methods=["GET"])
def get_trending():
    """Public trending stats from recent analyses."""
    from sqlalchemy import func
    # Total analyses
    total = Analysis.query.count()
    # Last 7 days
    from datetime import datetime, timezone, timedelta
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent = Analysis.query.filter(Analysis.created_at >= week_ago).count()
    # Average score
    avg_score = db.session.query(func.avg(Analysis.overall_score)).scalar() or 0
    # Score distribution
    credible = Analysis.query.filter(Analysis.overall_score < 45).count()
    uncertain = Analysis.query.filter(Analysis.overall_score >= 45, Analysis.overall_score < 62).count()
    suspicious = Analysis.query.filter(Analysis.overall_score >= 62).count()
    # Recent 8 public analyses
    recent_analyses = (Analysis.query
        .order_by(Analysis.created_at.desc())
        .limit(8)
        .all())
    return jsonify({
        "total": total,
        "this_week": recent,
        "avg_score": round(float(avg_score), 1),
        "distribution": {"credible": credible, "uncertain": uncertain, "suspicious": suspicious},
        "recent": [{"id": a.id, "score": a.overall_score, "input_type": a.input_type, "source_url": a.source_url, "created_at": a.created_at.isoformat(), "snippet": a.article_text[:80] if a.article_text else None} for a in recent_analyses]
    }), 200

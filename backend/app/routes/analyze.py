from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from .. import db, limiter
from ..models.analysis import Analysis
from ..services.scraper import scrape_url
from ..services.analyzer import analyze_text

analyze_bp = Blueprint("analyze", __name__)


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

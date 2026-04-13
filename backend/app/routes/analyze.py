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

    result = analyze_text(text)
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

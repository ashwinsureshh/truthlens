from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from ..models.analysis import Analysis
from ..services.source_credibility import lookup_source, enrich

history_bp = Blueprint("history", __name__)


def _attach_source(payload: dict, source_url: str | None) -> dict:
    """Attach source-credibility metadata when the URL is known."""
    if source_url:
        src = enrich(lookup_source(source_url))
        if src:
            payload["source"] = src
    return payload


@history_bp.route("/analyze/<int:analysis_id>", methods=["GET"])
def get_analysis_public(analysis_id):
    """Public endpoint — returns any analysis by ID (guest + logged-in users)."""
    analysis = Analysis.query.get(analysis_id)
    if not analysis:
        return jsonify({"error": "Analysis not found"}), 404
    payload = _attach_source(analysis.to_dict(), analysis.source_url)
    return jsonify(payload), 200


@history_bp.route("/history", methods=["GET"])
@jwt_required()
def get_history():
    user_id = int(get_jwt_identity())
    analyses = (
        Analysis.query.filter_by(user_id=user_id)
        .order_by(Analysis.created_at.desc())
        .limit(50)
        .all()
    )
    return jsonify([a.to_dict() for a in analyses]), 200


@history_bp.route("/history/<int:analysis_id>", methods=["GET"])
@jwt_required()
def get_analysis(analysis_id):
    user_id = int(get_jwt_identity())
    analysis = Analysis.query.filter_by(id=analysis_id, user_id=user_id).first()

    if not analysis:
        return jsonify({"error": "Analysis not found"}), 404

    return jsonify(_attach_source(analysis.to_dict(), analysis.source_url)), 200

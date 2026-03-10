from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.analysis import Analysis

history_bp = Blueprint("history", __name__)


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

    return jsonify(analysis.to_dict()), 200

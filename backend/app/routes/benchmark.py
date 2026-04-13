from flask import Blueprint, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from ..models.analysis import Analysis
from ..services.benchmark import get_benchmark_scores

benchmark_bp = Blueprint("benchmark", __name__)


@benchmark_bp.route("/benchmark/<int:analysis_id>", methods=["GET"])
def get_benchmark(analysis_id):
    try:
        verify_jwt_in_request(optional=True)
    except Exception:
        pass

    analysis = Analysis.query.get(analysis_id)
    if not analysis:
        return jsonify({"error": "Analysis not found"}), 404

    scores = get_benchmark_scores(analysis)

    return jsonify({
        "analysis_id":       analysis_id,
        "truthlens_score":   analysis.overall_score,
        "claimbuster_score": scores["claimbuster_score"],
        "google_score":      scores["google_score"],
        "claimbuster_enabled": scores["claimbuster_enabled"],
        "google_enabled":      scores["google_enabled"],
    }), 200

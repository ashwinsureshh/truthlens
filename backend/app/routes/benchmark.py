from flask import Blueprint, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from ..models.analysis import Analysis

benchmark_bp = Blueprint("benchmark", __name__)


@benchmark_bp.route("/benchmark/<int:analysis_id>", methods=["GET"])
def get_benchmark(analysis_id):
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
    except Exception:
        user_id = None

    analysis = Analysis.query.get(analysis_id)
    if not analysis:
        return jsonify({"error": "Analysis not found"}), 404

    # TODO Week 7: integrate ClaimBuster + Google Fact Check API
    benchmark = {
        "analysis_id": analysis_id,
        "truthlens_score": analysis.overall_score,
        "claimbuster": None,   # populated in Week 7
        "google_fact_check": None,  # populated in Week 7
        "note": "Benchmark comparison coming in Week 7",
    }
    return jsonify(benchmark), 200

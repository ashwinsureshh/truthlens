"""
Benchmark service — integrates ClaimBuster and Google Fact Check APIs.
Falls back gracefully when API keys are not configured.
"""
import os
import logging
import requests

logger = logging.getLogger(__name__)

CLAIMBUSTER_API_KEY = os.environ.get("CLAIMBUSTER_API_KEY", "")
GOOGLE_API_KEY      = os.environ.get("GOOGLE_API_KEY", "")

CLAIMBUSTER_URL  = "https://idir.uta.edu/factcheck/api/v1/claim/search/"
GOOGLE_FC_URL    = "https://factchecktools.googleapis.com/v1alpha1/claims:search"

# Verdict → suspicion score mapping for Google Fact Check
VERDICT_SCORES = {
    "true":          5,
    "mostly true":   15,
    "half true":     40,
    "mixture":       45,
    "mostly false":  70,
    "false":         90,
    "pants on fire": 100,
    "misleading":    75,
    "unverified":    50,
    "disputed":      60,
}


# ── ClaimBuster ──────────────────────────────────────────────────────────────

def _claimbuster_score(article_text: str) -> float | None:
    """
    Send article text to ClaimBuster and return an average check-worthiness
    score mapped to 0-100 (higher = more suspicious / check-worthy).
    Returns None if the API is unavailable or key is missing.
    """
    if not CLAIMBUSTER_API_KEY:
        logger.info("CLAIMBUSTER_API_KEY not set — skipping ClaimBuster")
        return None

    # ClaimBuster accepts up to ~1000 chars per request; send first chunk
    text_chunk = article_text[:1000]
    try:
        resp = requests.post(
            CLAIMBUSTER_URL,
            headers={"x-api-key": CLAIMBUSTER_API_KEY, "Content-Type": "application/json"},
            json={"input_col": text_chunk},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()

        results = data.get("results", [])
        if not results:
            return None

        # Each result has a `score` between 0-1 (check-worthiness)
        scores = [r["score"] for r in results if "score" in r]
        if not scores:
            return None

        avg = sum(scores) / len(scores)
        return round(avg * 100, 1)

    except Exception as e:
        logger.warning(f"ClaimBuster API error: {e}")
        return None


# ── Google Fact Check ─────────────────────────────────────────────────────────

def _verdict_to_score(verdict_text: str) -> float:
    """Map a textual verdict to a 0-100 suspicion score."""
    v = verdict_text.lower().strip()
    for key, score in VERDICT_SCORES.items():
        if key in v:
            return score
    return 50.0  # unknown verdict → neutral


def _google_factcheck_score(article_text: str, sentence_results: list) -> float | None:
    """
    Query Google Fact Check for the most suspicious sentences.
    Returns average suspicion score based on matched verdicts,
    or None if API is unavailable or no claims matched.
    """
    if not GOOGLE_API_KEY:
        logger.info("GOOGLE_API_KEY not set — skipping Google Fact Check")
        return None

    # Pick up to 3 most suspicious sentences as search queries
    sorted_sentences = sorted(sentence_results, key=lambda s: s["score"], reverse=True)
    queries = [s["sentence"][:100] for s in sorted_sentences[:3]]

    verdict_scores = []
    for query in queries:
        try:
            resp = requests.get(
                GOOGLE_FC_URL,
                params={"query": query, "key": GOOGLE_API_KEY, "languageCode": "en"},
                timeout=8,
            )
            resp.raise_for_status()
            data = resp.json()

            claims = data.get("claims", [])
            for claim in claims[:2]:  # take up to 2 matches per query
                for review in claim.get("claimReview", [])[:1]:
                    verdict = review.get("textualRating", "")
                    if verdict:
                        verdict_scores.append(_verdict_to_score(verdict))

        except Exception as e:
            logger.warning(f"Google Fact Check API error for query '{query[:40]}': {e}")
            continue

    if not verdict_scores:
        return None

    return round(sum(verdict_scores) / len(verdict_scores), 1)


# ── Public interface ──────────────────────────────────────────────────────────

def get_benchmark_scores(analysis) -> dict:
    """
    Run ClaimBuster and Google Fact Check for a given Analysis object.
    Returns a dict with claimbuster_score and google_score (None if unavailable).
    """
    cb_score = _claimbuster_score(analysis.article_text)
    gf_score = _google_factcheck_score(
        analysis.article_text,
        analysis.sentence_results or [],
    )

    return {
        "claimbuster_score":   cb_score,
        "google_score":        gf_score,
        "claimbuster_enabled": cb_score is not None,
        "google_enabled":      gf_score is not None,
    }

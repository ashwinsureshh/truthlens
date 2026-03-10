import re
from typing import Any

# TODO Week 2: replace stub with real RoBERTa model
# from transformers import pipeline
# _model = pipeline("text-classification", model="../model/checkpoints/roberta-truthlens")


def _split_sentences(text: str) -> list[str]:
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    return [s for s in sentences if len(s.split()) >= 4]


def _stub_score(sentence: str) -> float:
    """
    Placeholder scoring: returns a random-ish score based on sentence length.
    Replace with actual RoBERTa inference in Week 2.
    """
    import hashlib
    h = int(hashlib.md5(sentence.encode()).hexdigest(), 16)
    return round((h % 1000) / 10, 1)  # 0.0 – 100.0


def analyze_text(text: str) -> dict[str, Any]:
    """
    Analyze article text and return credibility scores + sentence-level results.
    Currently returns stub data; replace model calls in Week 2.
    """
    sentences = _split_sentences(text)
    sentence_results = []

    for sentence in sentences:
        score = _stub_score(sentence)
        sentence_results.append({
            "sentence": sentence,
            "score": score,           # 0 = credible, 100 = suspicious
            "label": _score_to_label(score),
            "explanation": "Model explanation will appear here after Week 3 (LIME integration)",
        })

    scores = [r["score"] for r in sentence_results]
    overall = round(sum(scores) / len(scores), 1) if scores else 50.0

    return {
        "overall_score": overall,
        "scores": {
            "sensationalism": round(overall * 0.9, 1),   # stub — derive properly in Week 3
            "bias": round(overall * 1.1, 1),
            "emotion": round(overall * 0.85, 1),
            "factual": round(100 - overall, 1),
        },
        "sentence_results": sentence_results,
    }


def _score_to_label(score: float) -> str:
    if score < 33:
        return "credible"
    elif score < 66:
        return "uncertain"
    return "suspicious"

"""
TruthLens Analyzer
------------------
Strategy (in priority order):
  1. Fine-tuned RoBERTa (checkpoints/roberta-truthlens) — fastest, most accurate
  2. Zero-shot BART (facebook/bart-large-mnli)           — fallback when fine-tuned model unavailable

Dimensions (sensationalism/bias/emotion/factual) always come from BART zero-shot
because the fine-tuned binary model only outputs credible/suspicious.

LIME explanations use whichever model is active for the main score.
"""

import os
import re
import hashlib
import logging
import numpy as np
from typing import Any
from lime.lime_text import LimeTextExplainer

logger = logging.getLogger(__name__)

# ── Model state ───────────────────────────────────────────────────────────────
_finetuned_classifier = None   # fine-tuned RoBERTa binary classifier
_zeroshot_classifier  = None   # BART zero-shot for dimensions + fallback
_lime_explainer       = LimeTextExplainer(class_names=["credible", "suspicious"])
_explanation_cache: dict[str, str] = {}

MODEL_PATH = os.environ.get("MODEL_PATH", "../model/checkpoints/roberta-truthlens")

CANDIDATE_LABELS = [
    "factual and credible",
    "misleading or false",
    "sensationalized",
    "politically biased",
    "emotionally manipulative",
]


# ── Model loaders ─────────────────────────────────────────────────────────────

def _is_finetuned_available() -> bool:
    """Check if the fine-tuned checkpoint exists."""
    config_path = os.path.join(MODEL_PATH, "config.json")
    return os.path.isfile(config_path)


def _get_finetuned():
    global _finetuned_classifier
    if _finetuned_classifier is None:
        from transformers import pipeline
        import torch
        device = "mps" if torch.backends.mps.is_available() else -1
        logger.info(f"Loading fine-tuned RoBERTa from {MODEL_PATH}...")
        _finetuned_classifier = pipeline(
            "text-classification",
            model=MODEL_PATH,
            tokenizer=MODEL_PATH,
            device=device,
        )
        logger.info("Fine-tuned model loaded.")
    return _finetuned_classifier


def _get_zeroshot():
    global _zeroshot_classifier
    if _zeroshot_classifier is None:
        from transformers import pipeline
        import torch
        device = "mps" if torch.backends.mps.is_available() else -1
        logger.info("Loading BART zero-shot model...")
        _zeroshot_classifier = pipeline(
            "zero-shot-classification",
            model="facebook/bart-large-mnli",
            device=device,
        )
        logger.info("BART model loaded.")
    return _zeroshot_classifier


# ── Sentence splitting ────────────────────────────────────────────────────────

def _split_sentences(text: str, max_sentences: int = 20) -> list[str]:
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    filtered = [s for s in sentences if len(s.split()) >= 4]
    return filtered[:max_sentences]


# ── Scoring ───────────────────────────────────────────────────────────────────

def _finetuned_score(sentence: str) -> float:
    """Get suspicion score (0-100) from the fine-tuned binary RoBERTa."""
    classifier = _get_finetuned()
    result = classifier(sentence[:512], truncation=True)[0]
    label = result["label"].lower()   # "suspicious" or "credible"
    confidence = result["score"]
    if label == "suspicious":
        return round(confidence * 100, 1)
    else:
        return round((1 - confidence) * 100, 1)


def _zeroshot_scores(sentence: str) -> dict:
    """Get all dimension scores from BART zero-shot."""
    classifier = _get_zeroshot()
    result = classifier(sentence, CANDIDATE_LABELS, multi_label=True)
    scores_map = dict(zip(result["labels"], result["scores"]))

    misleading  = scores_map.get("misleading or false", 0.0)
    sensational = scores_map.get("sensationalized", 0.0)
    biased      = scores_map.get("politically biased", 0.0)
    emotional   = scores_map.get("emotionally manipulative", 0.0)
    factual     = scores_map.get("factual and credible", 0.0)

    suspicion = min(misleading * 0.5 + sensational * 0.2 + biased * 0.2 + emotional * 0.1, 1.0)

    return {
        "overall": round(suspicion * 100, 1),
        "dim_scores": {
            "sensationalism": round(sensational * 100, 1),
            "bias":           round(biased * 100, 1),
            "emotion":        round(emotional * 100, 1),
            "factual":        round(factual * 100, 1),
        },
        "scores_map": scores_map,
    }


# ── LIME ──────────────────────────────────────────────────────────────────────

def _lime_explain_finetuned(sentence: str) -> str:
    """LIME with the fine-tuned binary classifier — much faster than BART."""
    cache_key = "ft_" + hashlib.md5(sentence.encode()).hexdigest()
    if cache_key in _explanation_cache:
        return _explanation_cache[cache_key]

    classifier = _get_finetuned()

    def predict_proba(texts: list[str]) -> np.ndarray:
        results = classifier(list(texts), truncation=True, max_length=128)
        probs = []
        for r in results:
            label = r["label"].lower()
            conf  = r["score"]
            susp  = conf if label == "suspicious" else 1 - conf
            probs.append([1.0 - susp, susp])
        return np.array(probs)

    explanation = _run_lime(sentence, predict_proba)
    _explanation_cache[cache_key] = explanation
    return explanation


def _lime_explain_zeroshot(sentence: str) -> str:
    """LIME with batched BART zero-shot calls."""
    cache_key = "zs_" + hashlib.md5(sentence.encode()).hexdigest()
    if cache_key in _explanation_cache:
        return _explanation_cache[cache_key]

    classifier = _get_zeroshot()

    def predict_proba(texts: list[str]) -> np.ndarray:
        results = classifier(list(texts), CANDIDATE_LABELS, multi_label=True)
        probs = []
        for r in results:
            sm = dict(zip(r["labels"], r["scores"]))
            s  = min(
                sm.get("misleading or false", 0) * 0.5 +
                sm.get("sensationalized", 0) * 0.2 +
                sm.get("politically biased", 0) * 0.2 +
                sm.get("emotionally manipulative", 0) * 0.1,
                1.0,
            )
            probs.append([1.0 - s, s])
        return np.array(probs)

    explanation = _run_lime(sentence, predict_proba)
    _explanation_cache[cache_key] = explanation
    return explanation


def _run_lime(sentence: str, predict_proba) -> str:
    try:
        exp = _lime_explainer.explain_instance(
            sentence, predict_proba, num_features=6, num_samples=30,
        )
        features = exp.as_list()
        flagged  = [w for w, s in features if s >  0.02][:3]
        credible = [w for w, s in features if s < -0.02][:3]
        parts = []
        if flagged:
            parts.append(f"Flagged: {', '.join(flagged)}")
        if credible:
            parts.append(f"Credible signals: {', '.join(credible)}")
        return (". ".join(parts) + ".") if parts else "No strong word-level signals detected."
    except Exception as e:
        logger.warning(f"LIME failed: {e}")
        return "Explanation unavailable."


# ── Main classify ─────────────────────────────────────────────────────────────

def _classify_sentence(sentence: str) -> dict:
    use_finetuned = _is_finetuned_available()

    # Dimension scores always from BART
    zs = _zeroshot_scores(sentence)

    if use_finetuned:
        # Fine-tuned model for main credibility score
        overall_score = _finetuned_score(sentence)
        explanation   = _lime_explain_finetuned(sentence)
        model_used    = "roberta-finetuned"
    else:
        # Fall back to BART for main score too
        overall_score = zs["overall"]
        explanation   = _lime_explain_zeroshot(sentence)
        model_used    = "bart-zeroshot"

    logger.debug(f"Sentence scored with {model_used}: {overall_score:.1f}")

    return {
        "score":       overall_score,
        "label":       _score_to_label(overall_score),
        "dim_scores":  zs["dim_scores"],
        "explanation": explanation,
    }


# ── Public API ────────────────────────────────────────────────────────────────

def analyze_text(text: str) -> dict[str, Any]:
    sentences = _split_sentences(text)
    if not sentences:
        return {
            "overall_score": 50.0,
            "scores": {"sensationalism": 50.0, "bias": 50.0, "emotion": 50.0, "factual": 50.0},
            "sentence_results": [],
        }

    sentence_results = []
    dim_totals = {"sensationalism": 0.0, "bias": 0.0, "emotion": 0.0, "factual": 0.0}

    for sentence in sentences:
        result = _classify_sentence(sentence)
        sentence_results.append({
            "sentence":    sentence,
            "score":       result["score"],
            "label":       result["label"],
            "explanation": result["explanation"],
        })
        for k in dim_totals:
            dim_totals[k] += result["dim_scores"][k]

    n        = len(sentence_results)
    overall  = round(sum(r["score"] for r in sentence_results) / n, 1)
    avg_dims = {k: round(v / n, 1) for k, v in dim_totals.items()}

    return {
        "overall_score":    overall,
        "scores":           avg_dims,
        "sentence_results": sentence_results,
        "model":            "roberta-finetuned" if _is_finetuned_available() else "bart-zeroshot",
    }


def _score_to_label(score: float) -> str:
    if score < 33:
        return "credible"
    elif score < 66:
        return "uncertain"
    return "suspicious"

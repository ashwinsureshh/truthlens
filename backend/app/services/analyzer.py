"""
TruthLens Analyzer
------------------
Strategy (in priority order):
  1. Fine-tuned RoBERTa (checkpoints/roberta-truthlens) — main credibility score
  2. MiniLM NLI (cross-encoder/nli-MiniLM2-L6-H768)    — dimension scores (fast, 85MB)
     Fallback: if no fine-tuned model, MiniLM handles credibility too.

Speed optimisations (v3):
  - MiniLM replaces BART (1.6GB → 85MB, ~10x faster, fits free-tier 512MB RAM)
  - MiniLM runs ONCE on the full article for dimension scores (not per sentence)
  - RoBERTa sentence scoring runs in parallel via ThreadPoolExecutor
  - LIME only runs on the top-3 most suspicious sentences, 10 samples
  - URL results cached in-memory (1-hour TTL)
"""

import os
import re
import hashlib
import logging
import time
import numpy as np
from typing import Any
from concurrent.futures import ThreadPoolExecutor, as_completed
from lime.lime_text import LimeTextExplainer

# Disable LIME on CPU-only cloud deployments (too slow without fine-tuned model + GPU)
LIME_ENABLED = os.environ.get("ENABLE_LIME", "true").lower() == "true"

logger = logging.getLogger(__name__)

# ── Model state ───────────────────────────────────────────────────────────────
_finetuned_classifier = None   # fine-tuned RoBERTa binary classifier
_nli_classifier       = None   # MiniLM NLI for dimensions + fallback scoring
_lime_explainer       = LimeTextExplainer(class_names=["credible", "suspicious"])
_explanation_cache: dict[str, str] = {}

# URL result cache: { url -> (timestamp, result_dict) }
_url_cache: dict[str, tuple[float, dict]] = {}
URL_CACHE_TTL = 3600  # 1 hour

MODEL_PATH = os.environ.get("MODEL_PATH", "venooma/roberta-truthlens")
NLI_MODEL  = "cross-encoder/nli-MiniLM2-L6-H768"

CANDIDATE_LABELS = [
    "factual and credible",
    "misleading or false",
    "sensationalized",
    "politically biased",
    "emotionally manipulative",
]


# ── Model loaders ─────────────────────────────────────────────────────────────

def _is_finetuned_available() -> bool:
    # Local checkpoint
    if os.path.isfile(os.path.join(MODEL_PATH, "config.json")):
        return True
    # HuggingFace Hub model ID (contains a slash or no path separators)
    if "/" in MODEL_PATH and not os.path.sep in MODEL_PATH:
        return True
    return False


def _get_device():
    """Pick the best available device: CUDA → MPS → CPU."""
    import torch
    if torch.cuda.is_available():
        logger.info(f"GPU detected: {torch.cuda.get_device_name(0)}")
        return 0
    if torch.backends.mps.is_available():
        return "mps"
    return -1


def _get_finetuned():
    global _finetuned_classifier
    if _finetuned_classifier is None:
        from transformers import pipeline
        device = _get_device()
        logger.info(f"Loading fine-tuned RoBERTa from {MODEL_PATH} on device={device}...")
        _finetuned_classifier = pipeline(
            "text-classification",
            model=MODEL_PATH,
            tokenizer=MODEL_PATH,
            device=device,
        )
        logger.info("Fine-tuned RoBERTa loaded.")
    return _finetuned_classifier


def _get_nli():
    global _nli_classifier
    if _nli_classifier is None:
        from transformers import pipeline
        device = _get_device()
        logger.info(f"Loading MiniLM NLI model ({NLI_MODEL}) on device={device}...")
        _nli_classifier = pipeline(
            "zero-shot-classification",
            model=NLI_MODEL,
            device=device,
        )
        logger.info("MiniLM NLI model loaded.")
    return _nli_classifier


# ── Sentence splitting ────────────────────────────────────────────────────────

def _split_sentences(text: str, max_sentences: int = 15) -> list[str]:
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    filtered = [s for s in sentences if len(s.split()) >= 4]
    return filtered[:max_sentences]


# ── Scoring ───────────────────────────────────────────────────────────────────

def _finetuned_score(sentence: str) -> float:
    """Get suspicion score (0-100) from the fine-tuned binary RoBERTa."""
    classifier = _get_finetuned()
    result = classifier(sentence[:512], truncation=True)[0]
    label = result["label"].lower()
    confidence = result["score"]
    if label == "suspicious":
        return round(confidence * 100, 1)
    else:
        # The model's credible confidence tops out at ~0.73-0.75 in practice,
        # meaning the raw formula (1 - confidence) * 100 never goes below ~25.
        # Remap the observed credible range [0.5, 0.75] → suspicion score [50, 0]
        # so truly credible sentences get scores near 0, not stuck at 27.
        CREDIBLE_MAX = 0.75
        if confidence >= CREDIBLE_MAX:
            return 0.0
        return round((CREDIBLE_MAX - confidence) / (CREDIBLE_MAX - 0.5) * 50, 1)


def _nli_scores(text: str) -> dict:
    """
    Get dimension scores using MiniLM NLI (fast, 85MB).
    Runs on a text snippet — call once per article, not per sentence.
    """
    classifier = _get_nli()
    result = classifier(text[:512], CANDIDATE_LABELS, multi_label=True)
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
    }


# ── LIME ──────────────────────────────────────────────────────────────────────

def _lime_explain_finetuned(sentence: str) -> str:
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


def _lime_explain_nli(sentence: str) -> str:
    cache_key = "nli_" + hashlib.md5(sentence.encode()).hexdigest()
    if cache_key in _explanation_cache:
        return _explanation_cache[cache_key]

    classifier = _get_nli()

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
            sentence, predict_proba, num_features=6, num_samples=10,
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


# ── Public API ────────────────────────────────────────────────────────────────

def analyze_text(text: str, url: str | None = None) -> dict[str, Any]:
    # ── URL cache hit ──────────────────────────────────────────────────────────
    if url:
        cached = _url_cache.get(url)
        if cached:
            ts, result = cached
            if time.time() - ts < URL_CACHE_TTL:
                logger.info(f"URL cache hit: {url}")
                return result
            else:
                del _url_cache[url]

    # ── Split sentences ────────────────────────────────────────────────────────
    sentences = _split_sentences(text)
    if not sentences:
        return {
            "overall_score": 50.0,
            "scores": {"sensationalism": 50.0, "bias": 50.0, "emotion": 50.0, "factual": 50.0},
            "sentence_results": [],
        }

    use_finetuned = _is_finetuned_available()

    # ── Dimension scores: ONE MiniLM call on article snippet ───────────────────
    article_snippet = " ".join(sentences[:5])
    nli = _nli_scores(article_snippet)
    shared_dim_scores = nli["dim_scores"]

    # ── Sentence scoring ───────────────────────────────────────────────────────
    if use_finetuned:
        # Parallel RoBERTa inference
        scores = [None] * len(sentences)
        with ThreadPoolExecutor(max_workers=4) as executor:
            future_to_idx = {
                executor.submit(_finetuned_score, s): i
                for i, s in enumerate(sentences)
            }
            for future in as_completed(future_to_idx):
                idx = future_to_idx[future]
                try:
                    scores[idx] = future.result()
                except Exception as e:
                    logger.warning(f"Sentence {idx} scoring failed: {e}")
                    scores[idx] = 50.0

        model_used = "roberta-finetuned"
    else:
        # Fallback: use NLI overall score per sentence
        scores = []
        for s in sentences:
            nli_s = _nli_scores(s)
            scores.append(nli_s["overall"])
        model_used = "minilm-nli"

    sentence_results = [
        {
            "sentence":    s,
            "score":       scores[i],
            "label":       _score_to_label(scores[i]),
            "explanation": "",
        }
        for i, s in enumerate(sentences)
    ]

    # LIME only on top-3 most suspicious sentences (skip if disabled or no fine-tuned model)
    if LIME_ENABLED and use_finetuned:
        top3_idx = sorted(range(len(sentence_results)),
                          key=lambda i: sentence_results[i]["score"],
                          reverse=True)[:3]
        for i in top3_idx:
            sentence_results[i]["explanation"] = _lime_explain_finetuned(sentences[i])

    for r in sentence_results:
        if not r["explanation"]:
            r["explanation"] = "No strong word-level signals detected."

    # ── Aggregate ──────────────────────────────────────────────────────────────
    n       = len(sentence_results)
    overall = round(sum(r["score"] for r in sentence_results) / n, 1)

    result = {
        "overall_score":    overall,
        "scores":           shared_dim_scores,
        "sentence_results": sentence_results,
        "model":            model_used,
    }

    if url:
        _url_cache[url] = (time.time(), result)

    return result


def _score_to_label(score: float) -> str:
    if score < 30:
        return "credible"
    elif score < 55:
        return "uncertain"
    return "suspicious"

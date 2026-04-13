"""
TruthLens Analyzer
------------------
Strategy (in priority order):
  1. Fine-tuned RoBERTa (checkpoints/roberta-truthlens) — fastest, most accurate
  2. Zero-shot BART (facebook/bart-large-mnli)           — fallback when fine-tuned model unavailable

Speed optimisations (v2):
  - When RoBERTa is available, BART runs ONCE on the full article (not per sentence)
    to get dimension scores, cutting BART calls from 20 → 1.
  - RoBERTa sentence scoring runs in parallel via ThreadPoolExecutor.
  - LIME only runs on the top-3 most suspicious sentences, with 10 samples (down from 30).
  - URL results are cached in-memory (1-hour TTL) so repeat visits are instant.
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

logger = logging.getLogger(__name__)

# ── Model state ───────────────────────────────────────────────────────────────
_finetuned_classifier = None   # fine-tuned RoBERTa binary classifier
_zeroshot_classifier  = None   # BART zero-shot for dimensions + fallback
_lime_explainer       = LimeTextExplainer(class_names=["credible", "suspicious"])
_explanation_cache: dict[str, str] = {}

# URL result cache: { url -> (timestamp, result_dict) }
_url_cache: dict[str, tuple[float, dict]] = {}
URL_CACHE_TTL = 3600  # 1 hour

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

def _split_sentences(text: str, max_sentences: int = 15) -> list[str]:
    """Split into sentences, filter noise, cap at max_sentences."""
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
        return round((1 - confidence) * 100, 1)


def _zeroshot_scores(text: str) -> dict:
    """Get all dimension scores from BART zero-shot (call once on article snippet)."""
    classifier = _get_zeroshot()
    result = classifier(text[:1024], CANDIDATE_LABELS, multi_label=True)
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
    """LIME with the fine-tuned binary classifier — fast, 10 samples."""
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
    """LIME with BART zero-shot calls."""
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
            sentence, predict_proba, num_features=6, num_samples=10,  # 10 (was 30)
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
    """
    Analyse article text.
    - url: if provided, results are cached by URL (1-hour TTL).
    """
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

    # ── Dimension scores: ONE BART call on article snippet ─────────────────────
    # (was: one BART call per sentence — 15-20x slower)
    if use_finetuned:
        article_snippet = " ".join(sentences[:5])   # representative first 5 sentences
        zs_article = _zeroshot_scores(article_snippet)
        shared_dim_scores = zs_article["dim_scores"]
    else:
        # Fallback: will use BART per sentence for main score too
        shared_dim_scores = None

    # ── Sentence scoring ───────────────────────────────────────────────────────
    if use_finetuned:
        # Parallel RoBERTa inference across sentences
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

        sentence_results = [
            {
                "sentence":    s,
                "score":       scores[i],
                "label":       _score_to_label(scores[i]),
                "dim_scores":  shared_dim_scores,
                "explanation": "",   # filled below for top sentences
            }
            for i, s in enumerate(sentences)
        ]

        # LIME only on the top-3 most suspicious sentences
        top3_idx = sorted(range(len(sentence_results)),
                          key=lambda i: sentence_results[i]["score"],
                          reverse=True)[:3]
        for i in top3_idx:
            sentence_results[i]["explanation"] = _lime_explain_finetuned(sentences[i])

        # Fill remaining with a lightweight label
        for r in sentence_results:
            if not r["explanation"]:
                r["explanation"] = "No strong word-level signals detected."

        model_used = "roberta-finetuned"

    else:
        # Fallback: BART per sentence (no fine-tuned model)
        sentence_results = []
        for sentence in sentences:
            zs = _zeroshot_scores(sentence)
            sentence_results.append({
                "sentence":    sentence,
                "score":       zs["overall"],
                "label":       _score_to_label(zs["overall"]),
                "dim_scores":  zs["dim_scores"],
                "explanation": _lime_explain_zeroshot(sentence),
            })
        model_used = "bart-zeroshot"

    # ── Aggregate ──────────────────────────────────────────────────────────────
    n       = len(sentence_results)
    overall = round(sum(r["score"] for r in sentence_results) / n, 1)

    if use_finetuned:
        avg_dims = shared_dim_scores
    else:
        dim_totals = {"sensationalism": 0.0, "bias": 0.0, "emotion": 0.0, "factual": 0.0}
        for r in sentence_results:
            for k in dim_totals:
                dim_totals[k] += r["dim_scores"][k]
        avg_dims = {k: round(v / n, 1) for k, v in dim_totals.items()}

    # Strip internal dim_scores from sentence_results (not needed by frontend)
    for r in sentence_results:
        r.pop("dim_scores", None)

    result = {
        "overall_score":    overall,
        "scores":           avg_dims,
        "sentence_results": sentence_results,
        "model":            model_used,
    }

    # ── Cache by URL ───────────────────────────────────────────────────────────
    if url:
        _url_cache[url] = (time.time(), result)

    return result


def _score_to_label(score: float) -> str:
    if score < 33:
        return "credible"
    elif score < 66:
        return "uncertain"
    return "suspicious"

"""
Multi-model ensemble + source-credibility-weighted scoring.

Layered on top of the per-sentence analyzer to produce a calibrated
article-level credibility score:

    final = clip(
        weighted_average(roberta_truthlens, hamzab_fakenews) +
        source_credibility_modifier
    )

Both stages fail-safe: if a model can't load or a source isn't known,
we degrade gracefully back to the single-model score.
"""
from __future__ import annotations

import logging
from concurrent.futures import ThreadPoolExecutor, Future
from typing import Optional

import numpy as np

from .source_credibility import lookup_source

# Single shared executor for fire-and-forget aux scoring during streaming.
# 2 workers is enough — only one aux call per analysis.
_aux_executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="aux-llm")

log = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────
# Auxiliary classifier — RoBERTa fine-tuned on Kaggle Fake News dataset
# ─────────────────────────────────────────────────────────────────────
AUX_MODEL_NAME = "hamzab/roberta-fake-news-classification"
_aux_pipe = None
_aux_disabled = False
_MAX_CHARS = 800   # truncate long articles for fast inference


def _get_aux_pipe():
    """Lazy-load auxiliary fake-news classifier. Disable on failure."""
    global _aux_pipe, _aux_disabled
    if _aux_pipe is not None or _aux_disabled:
        return _aux_pipe
    try:
        from transformers import pipeline
        log.info("Loading auxiliary ensemble model: %s", AUX_MODEL_NAME)
        _aux_pipe = pipeline(
            "text-classification",
            model=AUX_MODEL_NAME,
            top_k=None,            # return both class probabilities
            truncation=True,
            max_length=512,
        )
        return _aux_pipe
    except Exception as e:
        log.warning("Auxiliary model unavailable, ensemble disabled: %s", e)
        _aux_disabled = True
        return None


def auxiliary_article_score(text: str) -> Optional[float]:
    """
    Score a full article 0-100 using the auxiliary fake-news classifier.
    Returns None if model unavailable.

    Higher = more likely fake / less credible.
    """
    pipe = _get_aux_pipe()
    if pipe is None or not text or not text.strip():
        return None

    try:
        # Truncate to keep inference fast
        snippet = text.strip()[:_MAX_CHARS]
        out = pipe(snippet)
        # `out` is a list of dicts: [{label, score}] or [[{...},{...}]]
        if isinstance(out, list) and out and isinstance(out[0], list):
            preds = out[0]
        else:
            preds = out

        # Extract the FAKE probability robustly
        fake_prob = None
        for p in preds:
            label = str(p.get("label", "")).upper()
            if label in ("FAKE", "LABEL_1", "1"):
                fake_prob = p["score"]
                break
            if label in ("TRUE", "REAL", "LABEL_0", "0") and fake_prob is None:
                fake_prob = 1.0 - p["score"]

        if fake_prob is None:
            return None
        return round(float(fake_prob) * 100.0, 1)
    except Exception as e:
        log.warning("Auxiliary inference failed: %s", e)
        return None


def is_aux_available() -> bool:
    return _get_aux_pipe() is not None


def start_aux_score_async(text: str) -> Future:
    """
    Kick off aux-model inference on a background thread immediately.
    Caller awaits the future at the end of streaming so the aux runs
    in parallel with sentence scoring. Adds ~zero latency end-to-end.
    """
    return _aux_executor.submit(auxiliary_article_score, text)


def collect_aux_score(future: Optional[Future], timeout: float = 6.0) -> Optional[float]:
    """Block on the future with a timeout. Returns None on failure / timeout."""
    if future is None:
        return None
    try:
        return future.result(timeout=timeout)
    except Exception as e:
        log.warning("Aux future failed/timed-out: %s", e)
        return None


# ─────────────────────────────────────────────────────────────────────
# Source credibility weighting
# ─────────────────────────────────────────────────────────────────────
# Modifier added to score when the source domain is known. Positive =
# bumps risk up, negative = pulls risk down.
_SOURCE_MODIFIER = {
    "high":     -15.0,
    "mixed":     -3.0,
    "low":      +12.0,
    "very_low": +22.0,
    "satire":   +30.0,
}


def source_modifier(url: Optional[str]) -> tuple[float, dict | None]:
    """
    Return (modifier, source_entry).
    modifier is 0 for unknown / no URL.
    """
    if not url:
        return 0.0, None
    src = lookup_source(url)
    if not src or not src.get("known"):
        return 0.0, src
    mod = _SOURCE_MODIFIER.get(src.get("trust"), 0.0)
    return mod, src


# ─────────────────────────────────────────────────────────────────────
# Final calibration
# ─────────────────────────────────────────────────────────────────────
def calibrate_score(
    primary_score: float,
    article_text: str,
    url: Optional[str] = None,
    *,
    primary_weight: float = 0.6,
    aux_weight: float = 0.4,
    aux_future: Optional[Future] = None,
) -> dict:
    """
    Combine the primary analyzer score with the auxiliary ensemble model
    and source credibility, producing the final article score.

    If `aux_future` is provided, await it (with timeout) instead of
    running the aux model synchronously — this lets the caller fire
    the aux call early and overlap it with other work.
    """
    if aux_future is not None:
        aux = collect_aux_score(aux_future)
    else:
        aux = auxiliary_article_score(article_text)
    mod, _ = source_modifier(url)

    models = ["roberta-truthlens", "minilm-nli"]
    if aux is not None:
        ensemble = primary_weight * primary_score + aux_weight * aux
        models.append("roberta-fake-news")
    else:
        ensemble = primary_score

    final = max(0.0, min(100.0, ensemble + mod))

    return {
        "final_score":     round(final, 1),
        "primary_score":   round(primary_score, 1),
        "aux_score":       None if aux is None else round(aux, 1),
        "source_modifier": round(mod, 1),
        "ensemble_used":   aux is not None,
        "models_used":     models,
    }

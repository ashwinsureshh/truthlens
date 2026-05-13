"""
Unified LLM service with a 4-tier fallback chain:

    Tier 1: Groq (Llama 3.3 70B Versatile)         — fast, free, primary
    Tier 2: Google Gemini 1.5 Flash                  — free, automatic fallback
    Tier 3: HuggingFace Inference API                — free, slower, secondary fallback
    Tier 4: Local template-based synthesis           — always works, zero deps

The high-level helpers (`explain_verdict`, `chat_about_article`,
`rewrite_article`) NEVER raise to the caller — if every external provider
fails, a deterministic local template guarantees the user sees useful
output. This was a reviewer suggestion (May 2026) to prevent the
"AI unavailable" error during demos when both cloud quotas hit at once.
"""
import os
import re
import logging
from typing import Optional, Callable

import requests

log = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────
# Provider config
# ─────────────────────────────────────────────────────────────────────
GROQ_MODEL   = os.environ.get("GROQ_MODEL",   "llama-3.3-70b-versatile")
GROQ_URL     = "https://api.groq.com/openai/v1/chat/completions"

GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")

# HuggingFace Inference API — free tier requires HF_TOKEN env var.
# Default model is small + fast; override with HF_MODEL env if needed.
HF_MODEL     = os.environ.get("HF_MODEL", "mistralai/Mistral-7B-Instruct-v0.3")
HF_URL       = f"https://api-inference.huggingface.co/models/{HF_MODEL}"


def _groq_key()    -> Optional[str]: return os.environ.get("GROQ_API_KEY")
def _gemini_key()  -> Optional[str]: return os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
def _hf_key()      -> Optional[str]: return os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_TOKEN")


def llm_available() -> bool:
    """Always True now — the template tier is always available even with
    zero API keys configured. Kept for backward compatibility."""
    return True


# ─────────────────────────────────────────────────────────────────────
# Tier 1: Groq
# ─────────────────────────────────────────────────────────────────────
def _call_groq(prompt: str, *, temperature: float, max_tokens: int) -> str:
    key = _groq_key()
    if not key:
        raise RuntimeError("Groq not configured")
    payload = {
        "model": os.environ.get("GROQ_MODEL", GROQ_MODEL),
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
        "max_tokens": max_tokens,
        "top_p": 0.9,
    }
    r = requests.post(
        GROQ_URL,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        json=payload,
        timeout=20,
    )
    if r.status_code == 429:
        raise RuntimeError("Groq quota reached.")
    if r.status_code != 200:
        log.warning("Groq %s: %s", r.status_code, r.text[:300])
        raise RuntimeError(f"Groq error {r.status_code}")
    return r.json()["choices"][0]["message"]["content"].strip()


# ─────────────────────────────────────────────────────────────────────
# Tier 2: Gemini
# ─────────────────────────────────────────────────────────────────────
def _call_gemini(prompt: str, *, temperature: float, max_tokens: int) -> str:
    key = _gemini_key()
    if not key:
        raise RuntimeError("Gemini not configured")
    model = os.environ.get("GEMINI_MODEL", GEMINI_MODEL)
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_tokens,
            "topP": 0.9,
        },
    }
    r = requests.post(url, params={"key": key}, json=payload, timeout=25)
    if r.status_code == 429:
        raise RuntimeError("Gemini quota reached.")
    if r.status_code != 200:
        log.warning("Gemini %s: %s", r.status_code, r.text[:300])
        raise RuntimeError(f"Gemini error {r.status_code}")
    return r.json()["candidates"][0]["content"]["parts"][0]["text"].strip()


# ─────────────────────────────────────────────────────────────────────
# Tier 3: HuggingFace Inference API
# ─────────────────────────────────────────────────────────────────────
def _call_huggingface(prompt: str, *, temperature: float, max_tokens: int) -> str:
    key = _hf_key()
    if not key:
        raise RuntimeError("HuggingFace not configured")
    payload = {
        "inputs": prompt,
        "parameters": {
            "temperature": max(0.01, temperature),  # HF requires > 0
            "max_new_tokens": max_tokens,
            "top_p": 0.9,
            "return_full_text": False,
            "do_sample": True,
        },
        "options": {"wait_for_model": True},
    }
    r = requests.post(
        HF_URL,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        json=payload,
        timeout=45,   # HF can be slow on cold start
    )
    if r.status_code == 429:
        raise RuntimeError("HuggingFace quota reached.")
    if r.status_code == 503:
        raise RuntimeError("HuggingFace model loading; try again shortly.")
    if r.status_code != 200:
        log.warning("HuggingFace %s: %s", r.status_code, r.text[:300])
        raise RuntimeError(f"HuggingFace error {r.status_code}")
    data = r.json()
    if isinstance(data, list) and data and "generated_text" in data[0]:
        return data[0]["generated_text"].strip()
    if isinstance(data, dict) and "generated_text" in data:
        return data["generated_text"].strip()
    raise RuntimeError(f"Unexpected HuggingFace response shape: {str(data)[:200]}")


# ─────────────────────────────────────────────────────────────────────
# Chained dispatch
# ─────────────────────────────────────────────────────────────────────
def _call_llm(
    prompt: str,
    *,
    temperature: float = 0.4,
    max_tokens: int = 400,
    template_fn: Optional[Callable[[], str]] = None,
) -> str:
    """
    Try Groq → Gemini → HuggingFace in order. If all fail and a
    `template_fn` is supplied, return its output (always succeeds).
    Otherwise, raise a RuntimeError with the chained errors.
    """
    errors = []
    for name, has_key, fn in (
        ("groq",   _groq_key,   _call_groq),
        ("gemini", _gemini_key, _call_gemini),
        ("hf",     _hf_key,     _call_huggingface),
    ):
        if not has_key():
            continue
        try:
            return fn(prompt, temperature=temperature, max_tokens=max_tokens)
        except Exception as e:
            errors.append(f"{name}: {e}")
            log.info("%s failed (%s), continuing fallback chain", name, e)

    # Tier 4 — always-works template fallback
    if template_fn is not None:
        log.warning("All LLM tiers failed (%s) — using template fallback",
                    " | ".join(errors) or "none configured")
        return template_fn()

    if not errors:
        raise RuntimeError("No LLM provider configured")
    raise RuntimeError(" | ".join(errors))


# ─────────────────────────────────────────────────────────────────────
# Tier-4 templates  —  deterministic fallbacks that NEVER fail
# ─────────────────────────────────────────────────────────────────────
def _template_explanation(*, overall_score: float, scores: dict,
                          top_sentences: list[dict], label: str) -> str:
    """Synthesise a coherent paragraph from the scores alone."""
    sens = round(scores.get("sensationalism", 0))
    bias = round(scores.get("bias", 0))
    emot = round(scores.get("emotion", 0))
    fact = round(scores.get("factual", 0))
    overall = round(overall_score)

    # Identify the top dimension
    dims = [("sensational language", sens),
            ("partisan bias",        bias),
            ("emotional manipulation", emot),
            ("factual concerns",     fact)]
    dims.sort(key=lambda x: -x[1])
    top1, top2 = dims[0], dims[1]

    if label == "credible":
        verdict_line = (
            f"This article was rated as credible (score {overall}/100). "
            f"Risk signals across all four dimensions are low, suggesting "
            f"factual language and minimal manipulation."
        )
    elif label == "uncertain":
        verdict_line = (
            f"This article was rated as uncertain (score {overall}/100). "
            f"Mixed signals were detected — the strongest concerns were "
            f"{top1[0]} ({top1[1]}/100) and {top2[0]} ({top2[1]}/100)."
        )
    else:
        verdict_line = (
            f"This article was rated as suspicious (score {overall}/100). "
            f"The model identified strong {top1[0]} ({top1[1]}/100) and "
            f"{top2[0]} ({top2[1]}/100) signals, both indicating elevated "
            f"misinformation risk."
        )

    sentence_line = ""
    if top_sentences:
        n_high = sum(1 for s in top_sentences if (s.get("score") or 0) >= 60)
        if n_high:
            sentence_line = (
                f" {n_high} sentence{'s' if n_high != 1 else ''} carried "
                f"high individual risk scores, suggesting the concerns are "
                f"concentrated rather than spread evenly through the article."
            )

    advice_line = (
        " Cross-verify key claims with primary sources before sharing."
        if label != "credible"
        else " Even credible articles should be checked against primary sources."
    )

    return verdict_line + sentence_line + advice_line


def _template_chat(user_message: str, *, scores: dict,
                   overall_score: float, label: str) -> str:
    """Polite fallback when no LLM can answer a chat question."""
    overall = round(overall_score)
    msg = (user_message or "").lower()

    # Tiny keyword routing for common questions
    if any(k in msg for k in ("score", "rating", "rate", "verdict")):
        return (f"This article scored {overall}/100, which TruthLens "
                f"classifies as {label}. The four-axis breakdown is: "
                f"sensationalism {round(scores.get('sensationalism', 0))}, "
                f"bias {round(scores.get('bias', 0))}, "
                f"emotion {round(scores.get('emotion', 0))}, "
                f"factual risk {round(scores.get('factual', 0))}. "
                f"AI chat is temporarily unavailable for follow-up questions.")
    if any(k in msg for k in ("why", "explain", "reason")):
        return _template_explanation(
            overall_score=overall_score, scores=scores,
            top_sentences=[], label=label,
        ) + (" Note: conversational AI is temporarily unavailable; "
             "please retry in a minute for a more detailed answer.")

    if any(k in msg for k in ("bias", "partisan", "slant", "one-sided")):
        b = round(scores.get("bias", 0))
        return (f"The bias dimension scored {b}/100. "
                + ("This indicates strong partisan framing — the article uses language "
                   "that favours one political perspective over presenting a balanced view."
                   if b >= 60
                   else "Moderate bias signals were detected — some framing language was found "
                        "but it does not dominate the piece."
                   if b >= 30
                   else "Low partisan bias was detected in this article."))

    if any(k in msg for k in ("sensational", "clickbait", "headline", "exaggerat")):
        s = round(scores.get("sensationalism", 0))
        return (f"The sensationalism dimension scored {s}/100. "
                + ("Strong clickbait patterns, emotional headlines, or exaggerated language "
                   "were detected throughout this article."
                   if s >= 60
                   else "Some sensational language was found but it is not the dominant style."
                   if s >= 30
                   else "The article's language appears measured and avoids sensationalism."))

    if any(k in msg for k in ("emotion", "manipulat", "fear", "anger", "outrage")):
        e = round(scores.get("emotion", 0))
        return (f"The emotional manipulation dimension scored {e}/100. "
                + ("This article uses high emotional intensity — fear, outrage, or urgency "
                   "are used to influence the reader's reaction rather than inform."
                   if e >= 60
                   else "Some emotional language is present but within a normal range for journalism."
                   if e >= 30
                   else "Emotional manipulation signals are low in this article."))

    # Generic fallback — still give a score summary rather than saying "unavailable"
    return (f"Based on TruthLens's analysis, this article scored {overall}/100 "
            f"and is classified as {label}. "
            f"The main risk signals are: sensationalism {round(scores.get('sensationalism', 0))}/100, "
            f"bias {round(scores.get('bias', 0))}/100, "
            f"emotion {round(scores.get('emotion', 0))}/100, "
            f"factual risk {round(scores.get('factual', 0))}/100. "
            f"For a more detailed answer to your question, please retry in a minute "
            f"when the AI chat service is back online.")


def _strip_link_footer(text: str) -> str:
    """Remove the 'Cited links:' footer that scraper.py appends to article bodies.
    The footer is useful for the hyperlink scanner but should never appear in
    LLM prompts or template rewrites — it would produce a wall of raw URLs."""
    if "\n\nCited links:" in text:
        text = text[:text.index("\n\nCited links:")]
    return text.strip()


def _template_rewrite(article_text: str) -> str:
    """Rule-based neutralization when no LLM can rewrite the article."""
    if not article_text:
        return ""
    text = _strip_link_footer(article_text)
    # Strip leading "BREAKING:", "SHOCKING:", etc.
    text = re.sub(r"^(BREAKING|SHOCKING|EXCLUSIVE|URGENT|ALERT)[\s:!-]+",
                  "", text, flags=re.I)
    # Soften ALL CAPS words longer than 3 chars (likely shouting)
    text = re.sub(
        r"\b([A-Z]{3,})\b",
        lambda m: m.group(1).capitalize(),
        text,
    )
    # Cap consecutive exclamation/question marks
    text = re.sub(r"[!]{2,}", ".", text)
    text = re.sub(r"[?]{2,}", "?", text)
    # Hedge unsupported claims
    text = re.sub(r"\bproves?\b",       "suggests",          text, flags=re.I)
    text = re.sub(r"\bclearly shows?\b","appears to show",   text, flags=re.I)
    text = re.sub(r"\bdefinitely\b",    "reportedly",        text, flags=re.I)
    text = re.sub(r"\bobviously\b",     "according to the source,", text, flags=re.I)
    text = re.sub(r"\bundeniabl[ey]\b", "reportedly",        text, flags=re.I)
    # Remove emotionally-loaded adjectives where safe
    text = re.sub(r"\b(devastating|outrageous|jaw-dropping|stunning|"
                  r"horrifying|terrifying|catastrophic)\s+",
                  "notable ", text, flags=re.I)

    note = ("\n\n[This is a rule-based fallback rewrite. The full "
            "AI rewrite service is temporarily unavailable; please retry "
            "in a minute for a higher-quality version.]")
    return text.strip() + note


# ─────────────────────────────────────────────────────────────────────
# Public high-level API — ALL with template fallbacks
# ─────────────────────────────────────────────────────────────────────
def explain_verdict(*, overall_score: float, scores: dict,
                    article_text: str, top_sentences: list[dict]) -> str:
    label = ("credible" if overall_score < 45
             else "uncertain" if overall_score < 62
             else "suspicious")
    top_lines = "\n".join(
        f"- ({round(s.get('score', 0))}) {s.get('sentence', '')[:160]}"
        for s in (top_sentences or [])[:3]
    ) or "- (no sentence-level signals)"
    excerpt = (article_text or "")[:600]
    prompt = f"""You are a media-literacy assistant. A misinformation detector
analyzed an article and produced these scores (0-100, higher = more concerning):

Overall risk: {round(overall_score)}/100  →  verdict: {label.upper()}
Sensationalism: {round(scores.get('sensationalism', 0))}
Bias:           {round(scores.get('bias', 0))}
Emotion:        {round(scores.get('emotion', 0))}
Factual risk:   {round(scores.get('factual', 0))}

Top flagged sentences:
{top_lines}

Article excerpt:
\"\"\"{excerpt}\"\"\"

Write a concise, neutral, plain-English explanation (3-4 sentences, no
markdown, no bullet points, no headings) that tells the reader WHY this
article received the "{label}" verdict. Reference the specific dimensions
that drove the score. Do not moralise. Do not repeat the scores verbatim."""

    return _call_llm(
        prompt, temperature=0.4, max_tokens=300,
        template_fn=lambda: _template_explanation(
            overall_score=overall_score, scores=scores,
            top_sentences=top_sentences, label=label,
        ),
    )


def chat_about_article(*, article_text: str, scores: dict,
                       overall_score: float, history: list[dict],
                       user_message: str) -> str:
    # Strip the hyperlink-scanner footer — it's noise for the LLM
    clean_text = _strip_link_footer(article_text or "")
    convo = "\n".join(
        f"{'User' if m.get('role') == 'user' else 'Assistant'}: {m.get('content','')}"
        for m in (history or [])[-6:]
    )
    prompt = f"""You are a helpful media-literacy assistant. The user is reading
an article that TruthLens scored as {round(overall_score)}/100 risk
(sensationalism={round(scores.get('sensationalism',0))},
 bias={round(scores.get('bias',0))},
 emotion={round(scores.get('emotion',0))},
 factual={round(scores.get('factual',0))}).

Article:
\"\"\"{clean_text[:1800]}\"\"\"

Conversation so far:
{convo or '(none)'}

User: {user_message}

Reply in 1-3 short paragraphs. Stay grounded in the article. If the user
asks something the article doesn't answer, say so. No markdown."""

    label = ("credible" if overall_score < 45
             else "uncertain" if overall_score < 62
             else "suspicious")
    return _call_llm(
        prompt, temperature=0.5, max_tokens=500,
        template_fn=lambda: _template_chat(
            user_message, scores=scores,
            overall_score=overall_score, label=label,
        ),
    )


def rewrite_article(*, article_text: str, scores: dict, overall_score: float) -> str:
    # Strip the hyperlink-scanner footer before sending to any LLM or template
    clean_text = _strip_link_footer(article_text or "")

    prompt = f"""Below is an article that a misinformation detector flagged as
{round(overall_score)}/100 risk (sensationalism={round(scores.get('sensationalism',0))},
bias={round(scores.get('bias',0))}, emotion={round(scores.get('emotion',0))},
factual risk={round(scores.get('factual',0))}).

Rewrite the article in a neutral, factual, journalistic style that would
score low on all four risk dimensions. Keep the verifiable facts. Strip
out sensational language, loaded adjectives, emotional appeals, and
unsupported claims. If a claim cannot be verified, hedge it ("according
to X" or "reportedly"). Keep it roughly the same length as the original.

Output ONLY the rewritten article body. No headings, no commentary,
no markdown, no preamble like "Here is the rewrite". Just clean prose.

Original article:
\"\"\"{clean_text[:2500]}\"\"\""""

    return _call_llm(
        prompt, temperature=0.3, max_tokens=900,
        template_fn=lambda: _template_rewrite(clean_text),
    )

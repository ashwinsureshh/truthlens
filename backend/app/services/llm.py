"""
Unified LLM service — tries Groq first (fast + generous free tier),
falls back to Gemini if Groq is unavailable.

Both providers expose simple chat-completion APIs; this module hides
the difference behind explain_verdict() / chat_about_article().
"""
import os
import logging
from typing import Optional

import requests

log = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────
# Provider config
# ─────────────────────────────────────────────────────────────────────
GROQ_MODEL  = os.environ.get("GROQ_MODEL",  "llama-3.3-70b-versatile")
GROQ_URL    = "https://api.groq.com/openai/v1/chat/completions"

GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")


def _groq_key() -> Optional[str]:
    return os.environ.get("GROQ_API_KEY")


def _gemini_key() -> Optional[str]:
    return os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")


def llm_available() -> bool:
    return bool(_groq_key() or _gemini_key())


# ─────────────────────────────────────────────────────────────────────
# Provider calls
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
        raise RuntimeError("Groq quota reached — try again in a minute.")
    if r.status_code != 200:
        log.warning("Groq %s: %s", r.status_code, r.text[:300])
        raise RuntimeError(f"Groq API error {r.status_code}")
    data = r.json()
    return data["choices"][0]["message"]["content"].strip()


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
        raise RuntimeError("Gemini quota reached — try again in a minute.")
    if r.status_code != 200:
        log.warning("Gemini %s: %s", r.status_code, r.text[:300])
        raise RuntimeError(f"Gemini API error {r.status_code}")
    data = r.json()
    return data["candidates"][0]["content"]["parts"][0]["text"].strip()


def _call_llm(prompt: str, *, temperature: float = 0.4, max_tokens: int = 400) -> str:
    """Try Groq first, fall back to Gemini. Raises if both fail."""
    errors = []

    if _groq_key():
        try:
            return _call_groq(prompt, temperature=temperature, max_tokens=max_tokens)
        except Exception as e:
            errors.append(f"Groq: {e}")
            log.info("Groq failed (%s), trying Gemini fallback", e)

    if _gemini_key():
        try:
            return _call_gemini(prompt, temperature=temperature, max_tokens=max_tokens)
        except Exception as e:
            errors.append(f"Gemini: {e}")

    if not errors:
        raise RuntimeError("No LLM provider configured")
    raise RuntimeError(" | ".join(errors))


# ─────────────────────────────────────────────────────────────────────
# High-level helpers
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
    return _call_llm(prompt, temperature=0.4, max_tokens=300)


def chat_about_article(*, article_text: str, scores: dict,
                       overall_score: float, history: list[dict],
                       user_message: str) -> str:
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
\"\"\"{(article_text or '')[:1800]}\"\"\"

Conversation so far:
{convo or '(none)'}

User: {user_message}

Reply in 1-3 short paragraphs. Stay grounded in the article. If the user
asks something the article doesn't answer, say so. No markdown."""
    return _call_llm(prompt, temperature=0.5, max_tokens=500)

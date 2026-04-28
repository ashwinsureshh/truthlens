"""
Gemini service — thin wrapper around the Google Generative Language REST API.

Uses `requests` (already pulled in by transformers) so we don't add the heavy
`google-generativeai` SDK to the deployment.
"""
import os
import json
import logging
from typing import Optional

import requests

log = logging.getLogger(__name__)

GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")


def _api_key() -> Optional[str]:
    return os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")


def gemini_available() -> bool:
    return bool(_api_key())


def _call_gemini(prompt: str, *, temperature: float = 0.3, max_tokens: int = 400) -> str:
    """Low-level call. Raises RuntimeError on failure."""
    key = _api_key()
    if not key:
        raise RuntimeError("Gemini API key not configured")

    model = os.environ.get("GEMINI_MODEL", GEMINI_MODEL)
    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_tokens,
            "topP": 0.9,
        },
    }
    try:
        r = requests.post(
            api_url,
            params={"key": key},
            json=payload,
            timeout=25,
        )
    except requests.RequestException as e:
        raise RuntimeError(f"Gemini network error: {e}") from e

    if r.status_code == 429:
        raise RuntimeError("Free-tier quota reached — try again in about a minute.")
    if r.status_code != 200:
        body = r.text[:300]
        log.warning("Gemini API %s: %s", r.status_code, body)
        raise RuntimeError(f"Gemini API error {r.status_code}")

    data = r.json()
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except (KeyError, IndexError) as e:
        raise RuntimeError(f"Unexpected Gemini response shape: {e}") from e


# ─────────────────────────────────────────────────────────────────────
# High-level helpers used by routes
# ─────────────────────────────────────────────────────────────────────

def explain_verdict(*, overall_score: float, scores: dict,
                    article_text: str, top_sentences: list[dict]) -> str:
    """
    Generate a short, plain-English explanation of why the article got
    its verdict. Returned as 2-4 sentences, no markdown.
    """
    label = ("credible" if overall_score < 45
             else "uncertain" if overall_score < 62
             else "suspicious")

    top_lines = "\n".join(
        f"- ({round(s.get('score', 0))}) {s.get('sentence', '')[:200]}"
        for s in (top_sentences or [])[:3]
    ) or "- (no sentence-level signals available)"

    article_excerpt = (article_text or "")[:600]

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
\"\"\"{article_excerpt}\"\"\"

Write a concise, neutral, plain-English explanation (3-4 sentences, no
markdown, no bullet points, no headings) that tells the reader WHY this
article received the "{label}" verdict. Reference the specific dimensions
that drove the score. Do not moralise. Do not repeat the scores verbatim."""

    return _call_gemini(prompt, temperature=0.4, max_tokens=300)


def chat_about_article(*, article_text: str, scores: dict,
                       overall_score: float, history: list[dict],
                       user_message: str) -> str:
    """
    Conversational Q&A about the article. `history` is a list of
    {role:"user"|"assistant", content:str}.
    """
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
    return _call_gemini(prompt, temperature=0.5, max_tokens=500)

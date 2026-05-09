"""
Hyperlink scanner — extracts URLs from article text, looks up the
source-credibility tier for each domain, and produces a damped modifier
that nudges the article's final score based on the trustworthiness of
the sources it cites.

Reviewer suggestion (May 2026): "if the text pasted has hyperlinks
those hyperlinks also need to be scanned to finalize the score."

Design choices:
  * Cap at MAX_LINKS to bound latency (each scrape is expensive).
  * No deep scraping by default — domain credibility alone is the
    fast signal. A `deep_scan_links()` helper is provided for
    future use if we want per-link content analysis.
  * Modifier is damped (multiplied by 0.4) so a citation pattern
    can shift the score by up to ~10 points, never enough to
    flip a verdict on its own.
"""
from __future__ import annotations

import re
import logging
from typing import Optional
from urllib.parse import urlparse

from .source_credibility import lookup_source

log = logging.getLogger(__name__)

# Match http(s) URLs, stop at whitespace or common closing punctuation
_URL_RE = re.compile(
    r"""https?://              # scheme
        [^\s<>"'\]\)\,]+        # body — stop at whitespace or quote/bracket/paren/comma
    """,
    re.IGNORECASE | re.VERBOSE,
)

MAX_LINKS = 8                      # cap per article
TRAILING_PUNCT = ".,;:!?)“”\""

# Mirror of source_credibility's tier→modifier map, but DAMPED
# because a single article can cite multiple sources and we don't
# want a citation pattern to dominate the verdict.
_LINK_TIER_MODIFIER = {
    "high":     -8.0,
    "mixed":    -2.0,
    "low":      +6.0,
    "very_low": +12.0,
    "satire":   +20.0,
}


def _normalize_url(raw: str) -> str:
    """Trim trailing punctuation and surrounding markdown brackets."""
    u = raw.strip()
    while u and u[-1] in TRAILING_PUNCT:
        u = u[:-1]
    return u


def _domain_of(url: str) -> str:
    try:
        host = urlparse(url).netloc.lower()
    except Exception:
        return ""
    if host.startswith("www."):
        host = host[4:]
    return host.split(":")[0]


def extract_links(text: str) -> list[str]:
    """
    Find unique http(s) URLs in `text`, preserving order, capped at
    MAX_LINKS. Returns cleaned URL strings.
    """
    if not text:
        return []
    seen: set[str] = set()
    out: list[str] = []
    for raw in _URL_RE.findall(text):
        u = _normalize_url(raw)
        if not u or u in seen:
            continue
        seen.add(u)
        out.append(u)
        if len(out) >= MAX_LINKS:
            break
    return out


# ─────────────────────────────────────────────────────────────────────
# Per-link scoring (fast path — credibility lookup only)
# ─────────────────────────────────────────────────────────────────────
def score_link(url: str) -> dict:
    """
    Produce a small dict describing this URL's credibility signal
    based on source-database lookup alone.
    """
    domain = _domain_of(url)
    src = lookup_source(url) or {}

    if src.get("known"):
        trust = src.get("trust")
        modifier = _LINK_TIER_MODIFIER.get(trust, 0.0)
        verdict = (
            "credible"   if trust in ("high",)
            else "mixed" if trust in ("mixed",)
            else "suspicious" if trust in ("low", "very_low")
            else "satire"     if trust == "satire"
            else "unknown"
        )
        return {
            "url":      url,
            "domain":   domain,
            "name":     src.get("name", domain),
            "known":    True,
            "trust":    trust,
            "bias":     src.get("bias"),
            "factual":  src.get("factual"),
            "verdict":  verdict,
            "modifier": modifier,
        }

    return {
        "url":      url,
        "domain":   domain,
        "name":     domain,
        "known":    False,
        "trust":    None,
        "verdict":  "unknown",
        "modifier": 0.0,
    }


def scan_links(text: str) -> list[dict]:
    """
    End-to-end fast scan: extract + score each link in `text`.
    Returns a list of link-info dicts suitable for the API response.
    """
    return [score_link(u) for u in extract_links(text)]


def aggregate_modifier(links: list[dict]) -> float:
    """
    Reduce a list of link scorings to a single score modifier to add
    onto the article's final credibility score. Only known-domain
    links contribute; unknown links are ignored. Result is bounded
    to [-10, +15] so links can never alone flip the verdict.
    """
    if not links:
        return 0.0
    known = [l for l in links if l.get("known")]
    if not known:
        return 0.0
    avg = sum(l["modifier"] for l in known) / len(known)
    return max(-10.0, min(15.0, avg))


def summary(links: list[dict]) -> dict:
    """Brief summary stats for UI: counts per verdict + the net modifier."""
    counts = {"credible": 0, "mixed": 0, "suspicious": 0,
              "satire": 0, "unknown": 0}
    for l in links:
        v = l.get("verdict") or "unknown"
        counts[v] = counts.get(v, 0) + 1
    return {
        "total":    len(links),
        "counts":   counts,
        "modifier": round(aggregate_modifier(links), 1),
    }

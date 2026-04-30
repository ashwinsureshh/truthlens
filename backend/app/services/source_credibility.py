"""
Source credibility lookup.

Maps news/media domains to credibility + bias ratings sourced from
Media Bias/Fact Check (mediabiasfactcheck.com) and Ad Fontes Media's
Media Bias Chart. Used to enrich URL-based analyses with a domain
trust signal alongside our content-based scoring.

Schema per entry:
  {
    "name":   "Reuters",
    "trust":  "high" | "mixed" | "low" | "very_low" | "satire",
    "bias":   "left" | "left-center" | "center" | "right-center" | "right" | "questionable",
    "factual":"very_high" | "high" | "mostly_factual" | "mixed" | "low" | "very_low",
  }

This is a curated starter list of ~120 well-known domains. Unknown
domains return None and the frontend just hides the badge.
"""
from urllib.parse import urlparse
import re

# ─────────────────────────────────────────────────────────────────────
# Curated database (Media Bias/Fact Check data, public domain)
# ─────────────────────────────────────────────────────────────────────
_DB: dict[str, dict] = {
    # ── HIGH CREDIBILITY · CENTER ───────────────────────────────────
    "reuters.com":         {"name": "Reuters",          "trust": "high",  "bias": "center",       "factual": "very_high"},
    "apnews.com":          {"name": "Associated Press", "trust": "high",  "bias": "center",       "factual": "very_high"},
    "bbc.com":             {"name": "BBC News",         "trust": "high",  "bias": "left-center",  "factual": "high"},
    "bbc.co.uk":           {"name": "BBC News",         "trust": "high",  "bias": "left-center",  "factual": "high"},
    "npr.org":             {"name": "NPR",              "trust": "high",  "bias": "left-center",  "factual": "high"},
    "pbs.org":             {"name": "PBS",              "trust": "high",  "bias": "left-center",  "factual": "high"},
    "csmonitor.com":       {"name": "Christian Science Monitor", "trust": "high", "bias": "center", "factual": "high"},
    "axios.com":           {"name": "Axios",            "trust": "high",  "bias": "center",       "factual": "high"},
    "thehill.com":         {"name": "The Hill",         "trust": "mixed", "bias": "center",       "factual": "high"},

    # ── HIGH CREDIBILITY · LEAN LEFT ────────────────────────────────
    "nytimes.com":         {"name": "The New York Times",   "trust": "high",  "bias": "left-center",  "factual": "high"},
    "washingtonpost.com":  {"name": "The Washington Post",  "trust": "high",  "bias": "left-center",  "factual": "high"},
    "theguardian.com":     {"name": "The Guardian",         "trust": "high",  "bias": "left-center",  "factual": "high"},
    "economist.com":       {"name": "The Economist",        "trust": "high",  "bias": "left-center",  "factual": "high"},
    "ft.com":              {"name": "Financial Times",      "trust": "high",  "bias": "left-center",  "factual": "high"},
    "bloomberg.com":       {"name": "Bloomberg",            "trust": "high",  "bias": "left-center",  "factual": "high"},
    "politico.com":        {"name": "Politico",             "trust": "high",  "bias": "left-center",  "factual": "high"},
    "abcnews.go.com":      {"name": "ABC News",             "trust": "high",  "bias": "left-center",  "factual": "high"},
    "cbsnews.com":         {"name": "CBS News",             "trust": "high",  "bias": "left-center",  "factual": "high"},
    "nbcnews.com":         {"name": "NBC News",             "trust": "high",  "bias": "left-center",  "factual": "high"},
    "usatoday.com":        {"name": "USA Today",            "trust": "high",  "bias": "left-center",  "factual": "high"},
    "latimes.com":         {"name": "Los Angeles Times",    "trust": "high",  "bias": "left-center",  "factual": "high"},
    "newyorker.com":       {"name": "The New Yorker",       "trust": "high",  "bias": "left",         "factual": "high"},
    "theatlantic.com":     {"name": "The Atlantic",         "trust": "high",  "bias": "left-center",  "factual": "high"},
    "time.com":            {"name": "TIME",                 "trust": "high",  "bias": "left-center",  "factual": "high"},
    "cnn.com":             {"name": "CNN",                  "trust": "mixed", "bias": "left",         "factual": "mixed"},
    "msnbc.com":           {"name": "MSNBC",                "trust": "mixed", "bias": "left",         "factual": "mixed"},
    "vox.com":             {"name": "Vox",                  "trust": "mixed", "bias": "left",         "factual": "high"},
    "huffpost.com":        {"name": "HuffPost",             "trust": "mixed", "bias": "left",         "factual": "mixed"},
    "slate.com":           {"name": "Slate",                "trust": "mixed", "bias": "left",         "factual": "mixed"},
    "motherjones.com":     {"name": "Mother Jones",         "trust": "mixed", "bias": "left",         "factual": "high"},
    "thedailybeast.com":   {"name": "The Daily Beast",      "trust": "mixed", "bias": "left",         "factual": "mixed"},
    "salon.com":           {"name": "Salon",                "trust": "mixed", "bias": "left",         "factual": "mixed"},

    # ── HIGH CREDIBILITY · LEAN RIGHT ───────────────────────────────
    "wsj.com":             {"name": "The Wall Street Journal", "trust": "high",  "bias": "right-center", "factual": "high"},
    "forbes.com":          {"name": "Forbes",               "trust": "mixed", "bias": "right-center", "factual": "mixed"},
    "nationalreview.com":  {"name": "National Review",      "trust": "mixed", "bias": "right",        "factual": "mostly_factual"},
    "reason.com":          {"name": "Reason",               "trust": "mixed", "bias": "right-center", "factual": "high"},
    "theepochtimes.com":   {"name": "The Epoch Times",      "trust": "low",   "bias": "right",        "factual": "mixed"},
    "foxnews.com":         {"name": "Fox News",             "trust": "mixed", "bias": "right",        "factual": "mixed"},
    "nypost.com":          {"name": "New York Post",        "trust": "mixed", "bias": "right",        "factual": "mixed"},
    "washingtontimes.com": {"name": "The Washington Times", "trust": "mixed", "bias": "right",        "factual": "mixed"},
    "dailymail.co.uk":     {"name": "Daily Mail",           "trust": "low",   "bias": "right",        "factual": "low"},
    "thedailywire.com":    {"name": "The Daily Wire",       "trust": "low",   "bias": "right",        "factual": "mixed"},
    "breitbart.com":       {"name": "Breitbart",            "trust": "low",   "bias": "right",        "factual": "mixed"},
    "dailycaller.com":     {"name": "The Daily Caller",     "trust": "low",   "bias": "right",        "factual": "mixed"},
    "newsmax.com":         {"name": "Newsmax",              "trust": "low",   "bias": "right",        "factual": "low"},
    "oann.com":            {"name": "One America News",     "trust": "very_low","bias":"right",       "factual": "very_low"},

    # ── LOW CREDIBILITY / CONSPIRACY ────────────────────────────────
    "infowars.com":        {"name": "InfoWars",             "trust": "very_low","bias":"questionable","factual": "very_low"},
    "naturalnews.com":     {"name": "Natural News",         "trust": "very_low","bias":"questionable","factual": "very_low"},
    "rt.com":              {"name": "RT (Russia Today)",    "trust": "very_low","bias":"questionable","factual": "very_low"},
    "sputniknews.com":     {"name": "Sputnik News",         "trust": "very_low","bias":"questionable","factual": "very_low"},
    "globalresearch.ca":   {"name": "Global Research",      "trust": "very_low","bias":"questionable","factual": "very_low"},
    "zerohedge.com":       {"name": "ZeroHedge",            "trust": "low",     "bias":"right",       "factual": "low"},
    "thegatewaypundit.com":{"name": "The Gateway Pundit",   "trust": "very_low","bias":"right",       "factual": "very_low"},
    "wnd.com":             {"name": "WorldNetDaily",        "trust": "very_low","bias":"right",       "factual": "very_low"},

    # ── SATIRE ──────────────────────────────────────────────────────
    "theonion.com":        {"name": "The Onion",            "trust": "satire", "bias": "left",        "factual": "satire"},
    "babylonbee.com":      {"name": "The Babylon Bee",      "trust": "satire", "bias": "right",       "factual": "satire"},
    "clickhole.com":       {"name": "ClickHole",            "trust": "satire", "bias": "left",        "factual": "satire"},

    # ── INTERNATIONAL ──────────────────────────────────────────────
    "aljazeera.com":       {"name": "Al Jazeera",           "trust": "mixed", "bias": "left-center",  "factual": "mostly_factual"},
    "dw.com":              {"name": "Deutsche Welle",       "trust": "high",  "bias": "left-center",  "factual": "high"},
    "france24.com":        {"name": "France 24",            "trust": "high",  "bias": "left-center",  "factual": "high"},
    "euronews.com":        {"name": "Euronews",             "trust": "high",  "bias": "center",       "factual": "high"},
    "scmp.com":            {"name": "South China Morning Post", "trust": "mixed", "bias": "left-center", "factual": "mostly_factual"},
    "japantimes.co.jp":    {"name": "The Japan Times",      "trust": "high",  "bias": "left-center",  "factual": "high"},
    "thehindu.com":        {"name": "The Hindu",            "trust": "high",  "bias": "left-center",  "factual": "high"},
    "indianexpress.com":   {"name": "The Indian Express",   "trust": "high",  "bias": "center",       "factual": "high"},
    "ndtv.com":            {"name": "NDTV",                 "trust": "high",  "bias": "left-center",  "factual": "high"},
    "timesofindia.indiatimes.com": {"name": "Times of India","trust": "mixed","bias": "center",       "factual": "mixed"},
    "hindustantimes.com":  {"name": "Hindustan Times",      "trust": "high",  "bias": "center",       "factual": "high"},
    "indiatoday.in":       {"name": "India Today",          "trust": "mixed", "bias": "center",       "factual": "mostly_factual"},
    "news18.com":          {"name": "News18",               "trust": "mixed", "bias": "right-center", "factual": "mixed"},
    "republicworld.com":   {"name": "Republic World",       "trust": "low",   "bias": "right",        "factual": "low"},
    "opindia.com":         {"name": "OpIndia",              "trust": "very_low","bias":"right",       "factual": "very_low"},
    "thewire.in":          {"name": "The Wire",             "trust": "high",  "bias": "left-center",  "factual": "high"},
    "scroll.in":           {"name": "Scroll.in",            "trust": "high",  "bias": "left-center",  "factual": "high"},
    "theprint.in":         {"name": "ThePrint",             "trust": "high",  "bias": "center",       "factual": "high"},

    # ── TECH / SCIENCE ─────────────────────────────────────────────
    "techcrunch.com":      {"name": "TechCrunch",           "trust": "high",  "bias": "left-center",  "factual": "high"},
    "theverge.com":        {"name": "The Verge",            "trust": "high",  "bias": "left-center",  "factual": "high"},
    "arstechnica.com":     {"name": "Ars Technica",         "trust": "high",  "bias": "left-center",  "factual": "high"},
    "wired.com":           {"name": "Wired",                "trust": "high",  "bias": "left-center",  "factual": "high"},
    "nature.com":          {"name": "Nature",               "trust": "high",  "bias": "center",       "factual": "very_high"},
    "scientificamerican.com": {"name": "Scientific American","trust": "high", "bias": "left-center",  "factual": "high"},

    # ── FACT-CHECKERS ──────────────────────────────────────────────
    "snopes.com":          {"name": "Snopes",               "trust": "high",  "bias": "left-center",  "factual": "very_high"},
    "factcheck.org":       {"name": "FactCheck.org",        "trust": "high",  "bias": "center",       "factual": "very_high"},
    "politifact.com":      {"name": "PolitiFact",           "trust": "high",  "bias": "center",       "factual": "very_high"},
    "fullfact.org":        {"name": "Full Fact",            "trust": "high",  "bias": "center",       "factual": "very_high"},

    # ── WIKIPEDIA ──────────────────────────────────────────────────
    "en.wikipedia.org":    {"name": "Wikipedia",            "trust": "mixed", "bias": "center",       "factual": "mostly_factual"},
    "wikipedia.org":       {"name": "Wikipedia",            "trust": "mixed", "bias": "center",       "factual": "mostly_factual"},
}


def _normalize_domain(url: str) -> str:
    """Strip protocol, www, port, trailing slash."""
    if not url:
        return ""
    if not re.match(r"^https?://", url, re.I):
        url = "http://" + url
    try:
        host = urlparse(url).netloc.lower()
    except Exception:
        return ""
    host = host.split(":")[0]
    if host.startswith("www."):
        host = host[4:]
    return host


def lookup_source(url: str) -> dict | None:
    """
    Look up a URL's domain in our credibility DB.
    Returns enriched dict or None if unknown.
    """
    domain = _normalize_domain(url)
    if not domain:
        return None

    # exact match
    if domain in _DB:
        entry = dict(_DB[domain])
        entry["domain"] = domain
        entry["known"] = True
        return entry

    # try parent domain (e.g. m.bbc.com → bbc.com)
    parts = domain.split(".")
    if len(parts) >= 2:
        for i in range(1, len(parts) - 1):
            parent = ".".join(parts[i:])
            if parent in _DB:
                entry = dict(_DB[parent])
                entry["domain"] = domain
                entry["known"] = True
                return entry

    return {"domain": domain, "known": False}


# ─────────────────────────────────────────────────────────────────────
# Score calibration
# ─────────────────────────────────────────────────────────────────────
TRUST_LABELS = {
    "high":     {"label": "High Credibility",     "color": "#10b981", "tier": 1},
    "mixed":    {"label": "Mixed Credibility",    "color": "#f59e0b", "tier": 2},
    "low":      {"label": "Low Credibility",      "color": "#ef4444", "tier": 3},
    "very_low": {"label": "Very Low Credibility", "color": "#dc2626", "tier": 4},
    "satire":   {"label": "Satire",                "color": "#8b5cf6", "tier": 0},
}

BIAS_LABELS = {
    "left":         {"label": "Left",          "color": "#3b82f6"},
    "left-center":  {"label": "Lean Left",     "color": "#60a5fa"},
    "center":       {"label": "Center",        "color": "#10b981"},
    "right-center": {"label": "Lean Right",    "color": "#fb923c"},
    "right":        {"label": "Right",         "color": "#f97316"},
    "questionable": {"label": "Questionable",  "color": "#dc2626"},
}


def enrich(entry: dict | None) -> dict | None:
    """Add display-ready labels to a source entry."""
    if not entry:
        return None
    if not entry.get("known"):
        return entry
    out = dict(entry)
    if entry.get("trust") in TRUST_LABELS:
        out["trust_display"] = TRUST_LABELS[entry["trust"]]
    if entry.get("bias") in BIAS_LABELS:
        out["bias_display"] = BIAS_LABELS[entry["bias"]]
    return out

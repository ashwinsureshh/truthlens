"""
Article scraper.

Returns the article body text PLUS a footer of all hyperlinks found in
the page's HTML (deduplicated against URLs already visible in the body).
This ensures the link scanner downstream can detect hidden hyperlinks
even when the visible anchor text doesn't show the URL.

Reviewer-driven enhancement (May 2026): hyperlinks within an article's
HTML — even when masked under styled link text like "click here" — must
be picked up by the link-scanning pipeline.
"""
import re
from urllib.parse import urlparse, urljoin

from newspaper import Article
from bs4 import BeautifulSoup
import requests


MAX_TEXT_CHARS  = 12_000   # cap article body for inference speed
MAX_HARVEST     = 30       # cap hidden-link harvest before deduplication
DOWNLOAD_TIMEOUT = 10
HARVEST_TIMEOUT  = 6       # secondary fetch for href harvest


_URL_RE = re.compile(r"https?://[^\s<>\"'\)\]\,]+", re.IGNORECASE)
# Skip junk hrefs that aren't real article citations
_SKIP_DOMAINS = (
    "twitter.com/share",   "facebook.com/sharer", "facebook.com/dialog",
    "linkedin.com/sharing","whatsapp.com/send",   "t.me/share",
    "mailto:",             "tel:",                "javascript:",
)


def _harvest_hrefs(url: str, body_text: str) -> list[str]:
    """
    Fetch the page HTML separately and pull every <a href> URL.
    Filters out share buttons, javascript:, mailto:, and any URL whose
    domain or full string already appears in the visible article text
    (those are caught by the regex on body_text already).
    """
    try:
        resp = requests.get(
            url,
            timeout=HARVEST_TIMEOUT,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (compatible; TruthLensBot/1.0; "
                    "+https://truthlensai.me)"
                )
            },
        )
        if resp.status_code != 200:
            return []
        soup = BeautifulSoup(resp.text, "html.parser")
    except Exception:
        return []

    def _apex(host: str) -> str:
        """Return the apex (registered) domain for a host.
        Simple last-two-parts heuristic, e.g.
            af.wikipedia.org → wikipedia.org
            www.bbc.co.uk    → co.uk  ← imperfect; acceptable trade-off
            news.example.com → example.com
        For credibility-noise filtering this is good enough."""
        parts = (host or "").lower().split(".")
        if len(parts) >= 2:
            return ".".join(parts[-2:])
        return host or ""

    base = urlparse(url)
    base_origin = f"{base.scheme}://{base.netloc}"
    base_apex   = _apex(base.netloc)

    # Prefer anchors INSIDE the main article container; fall back to all
    # anchors if no recognisable container exists. This skips global
    # navigation, sidebars, and footer links on most modern sites.
    article_root = (
        soup.find("article")
        or soup.find("main")
        or soup.find(attrs={"role": "main"})
        or soup.find(class_=re.compile(r"(article|content|story|post)[-_]?(body|content|text)?", re.I))
        or soup
    )

    seen: set[str] = set()
    visible_lower = body_text.lower()
    out: list[str] = []

    for a in article_root.find_all("a", href=True):
        href = (a["href"] or "").strip()
        if not href:
            continue
        # skip share / mailto / javascript / fragment-only
        if any(skip in href.lower() for skip in _SKIP_DOMAINS):
            continue
        if href.startswith("#"):
            continue
        # resolve relative URLs to absolute
        if not href.lower().startswith(("http://", "https://")):
            href = urljoin(base_origin, href)
        # skip self-referential nav links to the same page
        if href.split("#")[0].rstrip("/") == url.split("#")[0].rstrip("/"):
            continue
        # ── Skip same-apex-domain links (internal nav, language variants,
        # category pages on the same publisher). External links to other
        # publishers are what actually carry credibility signal.
        try:
            href_apex = _apex(urlparse(href).netloc)
        except Exception:
            continue
        if href_apex == base_apex:
            continue
        # dedupe
        if href in seen:
            continue
        seen.add(href)
        # if it already appears in visible body text, skip
        if href.lower() in visible_lower:
            continue
        out.append(href)
        if len(out) >= MAX_HARVEST:
            break

    return out


def scrape_url(url: str) -> tuple[str, str | None]:
    """
    Scrape article text from a URL using newspaper3k.

    Returns (text, error). On success, `text` is the article body, with
    any hidden hyperlinks discovered in the page's HTML appended as a
    plain "Cited links:" footer so the downstream link scanner can see
    them. On failure, text is empty and error is a human-readable string.
    """
    try:
        article = Article(url, request_timeout=DOWNLOAD_TIMEOUT)
        article.download()
        article.parse()

        body = article.text.strip()
        if not body or len(body) < 100:
            return "", ("Could not extract article text. The page may be "
                        "paywalled or unsupported.")

        # Truncate body for inference speed
        if len(body) > MAX_TEXT_CHARS:
            body = body[:MAX_TEXT_CHARS]

        # Harvest hidden hyperlinks from the page HTML and append them
        # to the body so the link scanner sees them. This is best-effort
        # and never fails the scrape.
        try:
            hidden = _harvest_hrefs(url, body)
        except Exception:
            hidden = []

        if hidden:
            footer = "\n\nCited links:\n" + "\n".join(hidden)
            body = body + footer

        return body, None

    except Exception as e:
        err = str(e).lower()
        if "connection" in err or "adapter" in err or "invalid" in err or "no connection" in err:
            return "", "Invalid URL. Please enter a valid web address starting with https://"
        if "timeout" in err:
            return "", "Request timed out. The site may be slow or unreachable."
        if "403" in err or "401" in err or "blocked" in err or "forbidden" in err:
            return "", ("This site blocks automated access. Try copying the "
                        "article text and using Paste Text mode instead.")
        if "404" in err:
            return "", "Page not found. Please check the URL and try again."
        return "", ("Could not access this URL. Try copying the article "
                    "text and using Paste Text mode instead.")

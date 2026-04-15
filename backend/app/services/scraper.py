from newspaper import Article


# Max characters to pass to the analyser (prevents huge pages slowing inference)
MAX_TEXT_CHARS = 12_000


def scrape_url(url: str) -> tuple[str, str | None]:
    """
    Scrape article text from a URL using newspaper3k.
    Returns (text, error). If scraping fails, text is empty and error is set.
    """
    try:
        article = Article(url, request_timeout=10)   # explicit 10s timeout
        article.download()
        article.parse()

        text = article.text.strip()
        if not text or len(text) < 100:
            return "", "Could not extract article text. The page may be paywalled or unsupported."

        # Truncate very long articles — enough for 15 sentences, saves inference time
        if len(text) > MAX_TEXT_CHARS:
            text = text[:MAX_TEXT_CHARS]

        return text, None
    except Exception as e:
        err = str(e).lower()
        if "connection" in err or "adapter" in err or "invalid" in err or "no connection" in err:
            return "", "Invalid URL. Please enter a valid web address starting with https://"
        if "timeout" in err:
            return "", "Request timed out. The site may be slow or unreachable."
        if "403" in err or "401" in err or "blocked" in err or "forbidden" in err:
            return "", "This site blocks automated access. Try copying the article text and using Paste Text mode instead."
        if "404" in err:
            return "", "Page not found. Please check the URL and try again."
        return "", "Could not access this URL. Try copying the article text and using Paste Text mode instead."

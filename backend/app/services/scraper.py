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
        return "", f"Failed to scrape URL: {str(e)}"

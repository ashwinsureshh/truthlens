from newspaper import Article


def scrape_url(url: str) -> tuple[str, str | None]:
    """
    Scrape article text from a URL using newspaper3k.
    Returns (text, error). If scraping fails, text is empty and error is set.
    """
    try:
        article = Article(url)
        article.download()
        article.parse()

        text = article.text.strip()
        if not text or len(text) < 100:
            return "", "Could not extract article text. The page may be paywalled or unsupported."

        return text, None
    except Exception as e:
        return "", f"Failed to scrape URL: {str(e)}"

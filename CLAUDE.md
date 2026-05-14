# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TruthLens is a misinformation detection platform. Users paste text or enter a URL; the system scores every sentence for credibility using a 3-model AI ensemble, then returns a live-streamed verdict. It ships as a web app (React + Flask), a Chrome extension, and a REST API.

Live at: **truthlensai.me** — backend hosted on Railway, frontend on Vercel/Railway, PostgreSQL on Railway.

---

## Dev Commands

### Backend (Flask)
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env          # fill DATABASE_URL, GROQ_API_KEY, GEMINI_API_KEY
flask run --port 5001         # or: gunicorn -w 2 "app:create_app()"
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev      # localhost:5173
npm run build    # production build
npm run lint     # ESLint
```

### Full stack with Docker
```bash
docker compose up --build     # backend :5001, frontend :80, postgres :5432
```

### Chrome Extension
Load `extension/` as an unpacked extension in `chrome://extensions`. No build step needed — plain JS/HTML.

---

## Required Environment Variables (backend `.env`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | Flask session secret |
| `JWT_SECRET_KEY` | JWT signing key |
| `GROQ_API_KEY` | Tier-1 LLM (Llama 3.3 70B) |
| `GEMINI_API_KEY` | Tier-2 LLM (Gemini 1.5 Flash) |
| `HF_TOKEN` | Tier-3 LLM (HuggingFace Inference API) |
| `MODEL_PATH` | HuggingFace model ID or local path for RoBERTa (default: `venooma/roberta-truthlens`) |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `ENABLE_LIME` | Set `false` to skip LIME explanations on CPU-only hosts |

---

## Architecture

### Backend — `backend/app/`

```
routes/
  analyze.py      — all /api/analyze/* endpoints + SSE streaming
  auth.py         — JWT login/register
  history.py      — /api/history
  benchmark.py    — /api/benchmark/:id
services/
  analyzer.py     — model loading, per-sentence RoBERTa scoring, MiniLM NLI, LIME
  ensemble.py     — score calibration: blends RoBERTa + aux model + source + link signals
  scraper.py      — newspaper3k + BeautifulSoup href harvester
  llm.py          — 4-tier LLM fallback (Groq → Gemini → HuggingFace → template)
  source_credibility.py — MBFC domain DB (~120 domains), trust/bias/factual ratings
  link_scanner.py — extracts URLs from article text, maps to credibility tier
models/
  analysis.py     — SQLAlchemy Analysis model
```

### Scoring Pipeline (the critical path)

```
User input (text or URL)
  │
  ├─ URL → scraper.py (newspaper3k + BeautifulSoup href harvest)
  │        Appends "Cited links:\n..." footer for link scanner
  │
  ├─ analyzer.py
  │    ├─ Split into ≤15 sentences
  │    ├─ RoBERTa (venooma/roberta-truthlens) — per-sentence score 0–100
  │    │    ThreadPoolExecutor, parallel scoring
  │    ├─ MiniLM NLI (cross-encoder/nli-MiniLM2-L6-H768) — 4 dimension scores
  │    │    Runs ONCE on full article, much faster than per-sentence
  │    └─ LIME — word-level explanations on top-3 suspicious sentences only
  │
  ├─ ensemble.py calibrate_score()
  │    ├─ Primary score: 0.5×mean + 0.3×top3 + 0.2×NLI_credibility
  │    ├─ Aux score (hamzab/roberta-fake-news): runs async in background thread
  │    ├─ Blend: 60% primary + 40% aux (if aux available)
  │    ├─ Source modifier: MBFC domain lookup (±5–15 pts)
  │    └─ Link modifier: damped 0.4× of cited-URL credibility signal
  │
  └─ Final score 0–100 → Credible (<45) / Uncertain (45–61) / Suspicious (≥62)
```

### SSE Streaming

`/api/analyze/text/stream` and `/api/analyze/url/stream` are the primary endpoints used by the web frontend. They use Flask's `stream_with_context` with `mimetype="text/event-stream"`.

Event types in order:
1. `source` — domain credibility (URL inputs only, sent first)
2. `meta` — total sentence count
3. `sentence` — per-sentence score as it completes
4. `dimensions` — 4-axis scores (MiniLM result)
5. `complete` — final calibrated score + all sentence_results
6. `saved` — DB write confirmed, includes `analysis_id`

The frontend consumes this via `fetch + ReadableStream` (NOT `EventSource` — can't POST with EventSource). See `frontend/src/hooks/useStreamingAnalysis.js`.

### LLM Fallback Chain (`services/llm.py`)

All three public helpers (`explain_verdict`, `chat_about_article`, `rewrite_article`) try providers in order and **always succeed** — Tier 4 is a deterministic template that never fails.

**Important:** Always call `_strip_link_footer(article_text)` before passing text to any LLM or template — the scraper appends a `"\n\nCited links:\n..."` footer that must not appear in prompts or rewrites.

### Frontend — `frontend/src/`

- **Router**: React Router v7 — pages in `pages/`
- **Streaming**: `hooks/useStreamingAnalysis.js` — manages the SSE connection, sentence buffer, progress state
- **Styling**: Tailwind CSS + CSS variables in `index.css` (supports light/dark via `html.dark` class). Use `var(--bg)`, `var(--surface)`, `var(--text)`, etc. — never hardcode colours
- **Animation**: Framer Motion throughout — always use `ease: [0.22, 1, 0.36, 1]` for entrance transitions
- **Charts**: `recharts` for bar/line, custom SVG for `CredibilityGauge`, `TrustWaveform`, `ArticleDNA`
- **Theme colours**: `#6366f1` indigo (primary), `#10b981` green (credible), `#f59e0b` amber (uncertain), `#ef4444` red (suspicious)

Key pages: `Home.jsx` (input + streaming), `Results.jsx` (full analysis view), `Trending.jsx`, `History.jsx`, `ReportCard.jsx`.

Key UI components: `StreamingOverlay`, `AnnotatedArticle`, `ArticleDNA`, `MisinfoAutopsy`, `CredibleRewrite` (contains BeforeAfterSlider), `AIExplanation`, `LinkedSourcesCard`, `SourceBadge`.

### Chrome Extension — `extension/`

Plain JS/HTML — no build step. `popup.js` POSTs directly to the Railway backend URL (`DEFAULT_API_BASE`), bypassing the nginx reverse proxy at `truthlensai.me` which drops POST requests. If the API base changes, update `DEFAULT_API_BASE` in `popup.js`.

---

## Key Caching Behaviours

- **URL result cache**: `analyzer.py` keeps a 1-hour in-memory TTL cache keyed by URL hash. Cache hits still write a new DB row (so every user gets their history entry).
- **LLM caches**: `analyze.py` holds `_EXPLANATION_CACHE` and `_REWRITE_CACHE` dicts (max 200/100 entries). These are process-local — restart clears them.
- **Model loading**: All three models (RoBERTa, MiniLM, aux fake-news) are lazy-loaded on first request and held in module globals. Cold start on Railway takes ~30s.

---

## Deployment

- **Backend**: Railway — auto-deploys on push to `main`. Build uses `Dockerfile` in `backend/`.
- **Frontend**: Railway or Vercel — `vite build` output. Set `VITE_API_URL` to the Railway backend URL for the browser to call it directly.
- **DB**: Railway PostgreSQL. `db.create_all()` runs on every startup via `create_app()`.
- **Extension**: Sideloaded manually. After changing `popup.js`, reload the extension in `chrome://extensions`.

The nginx reverse proxy at `truthlensai.me` does **not** support POST on `/api/*` routes — always point the extension and any direct API callers to the Railway URL.

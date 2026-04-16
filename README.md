# TruthLens

**AI-powered misinformation detection** — sentence-level credibility scoring using a fine-tuned RoBERTa model.

Live at **[truthlensai.me](https://truthlensai.me)**

> Reva University · IEEE/Springer 2025 · 6th Semester Mini Project

---

## What it does

Paste any article or drop a URL. TruthLens scrapes the content, runs it through a fine-tuned RoBERTa model, and returns a credibility score broken down by sentence across 4 dimensions:

| Dimension | What it measures |
|---|---|
| Sensationalism | Exaggerated or clickbait language |
| Bias | Partisan framing and one-sided claims |
| Emotion | Manipulative emotional language |
| Fact Risk | Likelihood of false or unverifiable claims |

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Tailwind CSS, Framer Motion |
| Backend | Flask, PostgreSQL, JWT auth |
| ML Model | Fine-tuned RoBERTa (HuggingFace) |
| Infra | Docker Compose, Cloudflare Tunnel, Nginx |
| Extension | Chrome Extension (content script + popup) |

---

## Features

- **Sentence-level annotation** — each sentence highlighted by risk level
- **Trust Waveform** — visual timeline of credibility across the article
- **Credibility Gauge** — animated arc score with color-coded verdict
- **Radar Chart** — 4-axis breakdown (sensationalism, bias, emotion, fact risk)
- **Benchmark tab** — compare against ClaimBuster and Google Fact Check
- **Report Card** — shareable PDF-style analysis summary
- **Trending** — most-analyzed articles with aggregate scores
- **History** — analysis history for logged-in users + guest session support
- **Chrome Extension** — analyze any article in-browser without leaving the page
- **Apple-level UI** — floating pill nav, text mask reveals, magnetic buttons, spotlight cards, animated background

---

## Quick Start (Docker)

The fastest way — requires only [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
git clone https://github.com/ashiwns/truthlens.git
cd truthlens

# Create backend env
cat > backend/.env << 'EOF'
DATABASE_URL=postgresql://postgres:postgres@db:5432/truthlens
CORS_ORIGINS=http://localhost
MODEL_PATH=../model/checkpoints/roberta-truthlens
SECRET_KEY=change-me-in-production
EOF

# Launch everything (DB + backend + frontend)
docker-compose up --build
```

Open **http://localhost** — done.

> **Note:** The `model/checkpoints/roberta-truthlens` folder (~3.3 GB) must be present. It is not tracked by git due to size.

---

## Manual Setup

### Backend
```bash
cd backend
cp .env.example .env        # fill in values
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

### Model
```bash
cd model
pip install -r requirements.txt

# Inference test
python inference.py

# Fine-tune on LIAR dataset (place data in model/data/liar/)
python train.py
```

---

## Project Structure

```
truthlens/
├── backend/
│   ├── app/
│   │   ├── routes/         # analyze, auth, history, benchmark, stats, trending
│   │   ├── models/         # User, Analysis (SQLAlchemy)
│   │   └── services/       # scraper, analyzer, report
│   └── run.py
├── frontend/
│   └── src/
│       ├── pages/          # Home, Results, History, Login, Trending, About
│       │                   # Benchmark, ReportCard, NotFound
│       ├── components/
│       │   ├── charts/     # CredibilityGauge, RadarChart, TrustWaveform
│       │   └── ui/         # Navbar, AnnotatedArticle, ElegantShape, ...
│       └── services/       # api.js (axios)
├── extension/              # Chrome Extension
│   ├── manifest.json
│   ├── content.js          # in-page analysis overlay
│   └── popup.js
├── model/
│   ├── inference.py
│   ├── train.py
│   └── checkpoints/        # roberta-truthlens (~3.3 GB, not in git)
└── docker-compose.yml
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/analyze/text` | Optional | Analyze pasted text |
| POST | `/api/analyze/url` | Optional | Scrape and analyze URL |
| GET | `/api/analysis/:id` | Optional | Get analysis by ID |
| GET | `/api/history` | Required | User analysis history |
| GET | `/api/stats` | None | Global usage stats |
| GET | `/api/trending` | None | Trending analyzed articles |
| GET | `/api/benchmark/:id` | Optional | Benchmark comparison |
| POST | `/api/auth/register` | None | Register |
| POST | `/api/auth/login` | None | Login |

---

## Chrome Extension

The extension lets you analyze any article without leaving the page.

1. Open `chrome://extensions` → enable **Developer mode**
2. Click **Load unpacked** → select the `extension/` folder
3. Navigate to any news article → click the TruthLens icon

---

## Deployment

The production setup uses Docker Compose with a Cloudflare Tunnel for public HTTPS access:

```
Internet → Cloudflare Tunnel → Nginx (frontend:80) → React
                             → Flask (backend:5001) → PostgreSQL
```

```bash
# Production deploy
CLOUDFLARE_TUNNEL_TOKEN=<token> docker-compose up -d --build
```

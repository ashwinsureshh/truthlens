# TruthLens

Real-Time Misinformation Flagging System — 6th Semester Mini Project
Reva University | IEEE/Springer 2025

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Tailwind CSS, Recharts |
| Backend | Flask, PostgreSQL, JWT |
| ML Model | RoBERTa (HuggingFace), LIME |

## Quick Start

### 1. Backend
```bash
cd backend
cp .env.example .env        # edit values
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Model inference test (Week 1 sanity check)
```bash
cd model
pip install -r requirements.txt
python inference.py
```

### 4. Model training (Week 2)
```bash
# Download LIAR dataset → extract to model/data/liar/
cd model
python train.py
```

## Project Structure

```
truthlens/
├── backend/
│   ├── app/
│   │   ├── routes/       # analyze, auth, history, benchmark
│   │   ├── models/       # User, Analysis (SQLAlchemy)
│   │   └── services/     # scraper, analyzer (stub → real model Week 2)
│   └── run.py
├── frontend/
│   └── src/
│       ├── pages/        # Home, Results, History, Login
│       ├── components/   # Navbar, SentenceHighlights, Gauge, RadarChart
│       └── services/     # api.js (axios)
├── model/
│   ├── inference.py      # Week 1: sanity test
│   ├── train.py          # Week 2: fine-tune on LIAR
│   └── requirements.txt
└── docker-compose.yml
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/analyze/text | Optional | Analyze pasted text |
| POST | /api/analyze/url | Optional | Scrape and analyze URL |
| GET | /api/history | Required | Get past analyses |
| GET | /api/history/:id | Required | Get specific analysis |
| POST | /api/auth/register | None | Register |
| POST | /api/auth/login | None | Login |
| GET | /api/benchmark/:id | Optional | Benchmark comparison |

## 8-Week Roadmap

- [x] **Week 1** — Foundation: Flask skeleton, PostgreSQL, React scaffold, inference test
- [ ] **Week 2** — Fine-tune RoBERTa on LIAR dataset
- [ ] **Week 3** — LIME explainability integration
- [ ] **Week 4** — Frontend core (highlights, results page)
- [ ] **Week 5** — D3.js visualizations (gauge, radar, heatmap)
- [ ] **Week 6** — Auth & history dashboard
- [ ] **Week 7** — ClaimBuster + Google Fact Check benchmarking
- [ ] **Week 8** — IEEE paper draft, polish, deployment

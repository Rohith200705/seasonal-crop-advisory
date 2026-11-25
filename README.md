# 🌾 Seasonal Crop Advisory

A decision-support system for **profit-aware, climate-resilient crop planning** — built for the
*IT in Agriculture (U24CSP56)* project-driven course.

> Soil + weather + water + yield + market price → one ranked, explained crop choice, with a
> **Season Risk Index** for every pick.

## Stack

- **Next.js 16** (App Router, Turbopack, TypeScript)
- **Node.js** runtime (API route handlers)
- **MongoDB** via Mongoose — with automatic seeding and an **in-memory fallback** so the app runs
  even without a local Mongo instance
- **Recharts** for visualisations
- Tailwind CSS 4

## Features

| Area | What it does |
| --- | --- |
| **Advisory engine** | Scores 22 candidate crops by `expected yield × market price − input cost`, re-weighted by a Season Risk Index (rainfall anomaly 40% + heat extremes 25% + price volatility 35%), and emits a plain-language reason per crop |
| **Agro-climatic zones** | Classifies the plot into one of 5 K-Means-style zones from temperature, rainfall and soil pH |
| **Crop catalogue** | Soil/climate envelopes, water need, yield, cost and live price for all 22 crops |
| **Mandi price watch** | Deterministic Agmarknet-style 120-day series per commodity, with CV volatility and 4-month trend |
| **Dashboard** | Model benchmark chart (99.6% XGBoost), rainfall-by-crop EDA, query/zone/feedback counters |
| **Feedback loop** | Farmer ratings + comments stored in MongoDB, surfaced on the dashboard for retraining signal |
| **Multilingual UI** | English / हिन्दी / தமிழ் toggle for navigation, forms and crop names |
| **SMS summary** | One-click copy of a plain-text advisory for low-connectivity sharing |

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### With MongoDB (optional)

```bash
cp .env.example .env.local   # edit MONGODB_URI if needed
npm run dev
```

On first connect the collections (`crops`, `prices`, `advisorylogs`, `feedbacks`) are seeded
automatically. If no MongoDB is reachable, the app switches to an in-memory store with the same
seed data (shown as **Demo mode** in the UI).

## API

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/advisory` | Run the scoring engine, persist the query, return ranked crops |
| `GET` | `/api/crops` | Catalogue + price stats |
| `GET` | `/api/prices` | All series, or `?crop=slug` for one commodity |
| `GET/POST` | `/api/feedback` | Read / write the farmer feedback loop |
| `GET` | `/api/stats` | Dashboard aggregates + benchmark charts |

Example:

```bash
curl -X POST http://localhost:3000/api/advisory \
  -H "Content-Type: application/json" \
  -d '{"season":"kharif","areaHa":1,"soil":{"n":80,"p":45,"k":40,"ph":6.5},"climate":{"temperature":29,"humidity":78," rainfall":220}}'
```

## Project structure

```
src/
  app/                 pages + API route handlers
  components/          Nav, Footer, charts, feedback form
  lib/
    engine.ts          advisory scoring + reasons
    zones.ts           5 agro-climatic zones
    db.ts              Mongo connection, auto-seed, memory fallback
    models.ts          Mongoose schemas
    data/crops.ts      22-crop seed dataset
    data/prices.ts     deterministic mandi series + volatility
    i18n.ts / language.tsx   en / hi / ta strings + React context
```

## Data sources (per the project deck)

Kaggle Crop Recommendation (2,200 rows · 22 crops) · NASA POWER / IMD Agromet · data.gov.in ·
Agmarknet (DMI) · ISRIC SoilGrids / Soil Health Card.

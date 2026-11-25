import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About" };

const objectives = [
  "Integrate soil, weather, water, yield and market price into one clean dataset.",
  "Rank season-fit crops by expected yield and net profit — not yield alone.",
  "Score a Season Risk Index from rainfall anomaly, heat extremes and price volatility.",
  "Localise via agro-climatic clustering, with a reason for every pick.",
  "Deliver in local languages through a low-connectivity friendly interface and SMS summaries.",
  "Validate with ML metrics and improve through a farmer-feedback loop.",
];

const references = [
  'A. Ingle, "Crop Recommendation Dataset," Kaggle, 2020 — 2,200 samples, 22 crops.',
  '"Comparative Analysis of ML Approaches for Crop Recommendation in India," Atlantis Press, 2024.',
  '"Leveraging Environmental & Economic Factors for Optimal Crop Selection," arXiv:2505.21201, 2025.',
  "Economic Survey of India 2024-25, Ministry of Finance.",
  "Agriculture Census 2015-16, MoSPI — small & marginal holdings.",
  '"Climate Change and Crop Yield: Indian Context," Agro Research Journal, 2025.',
  '"India\'s wild price swings for tomatoes," Al Jazeera & TIME, 2023.',
  "NASA POWER; IMD Agromet; Agmarknet (DMI); ISRIC SoilGrids.",
  'Lundberg & Lee, "SHAP," NeurIPS 2017.',
  'Chen & Guestrin, "XGBoost," ACM SIGKDD 2016.',
];

const techniques = [
  ["Descriptive statistics", "Central tendency & spread for every soil and climate feature."],
  ["Correlation analysis", "Pearson matrix to surface relationships and redundancy."],
  ["Hypothesis testing", "One-way ANOVA: mean rainfall differs by crop (p < 0.001)."],
  ["Time-series decomposition", "Trend & seasonality in rainfall and mandi prices."],
  ["K-Means clustering", "k = 5 agro-climatic zones (silhouette ≈ 0.5) for local advice."],
  ["Feature importance + SHAP", "Every recommendation explainable, not a black box."],
];

const limitations = [
  "Near-perfect benchmark accuracy partly reflects a clean dataset; field data is messier.",
  "National-scale coverage — not every micro-region is represented.",
  "Weather and price forecasts carry real uncertainty.",
  "Live mandi APIs and a season of farmer feedback are needed to move past cold start.",
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <span className="pill bg-brand-100 text-brand-700">IT in Agriculture · U24CSP56</span>
      <h1 className="mt-3 text-3xl font-extrabold text-brand-900">About the project</h1>
      <p className="mt-2 text-ink/70">
        <b>Seasonal Crop Advisory</b> is a decision-support system for profit-aware,
        climate-resilient crop planning. Choosing which crop to sow is a farmer&apos;s biggest
        decision each season — today it is made almost blind. This project fuses open agri-data and
        machine learning into one clear, explained, season-fit crop choice.
      </p>

      <section className="mt-8">
        <h2 className="text-xl font-extrabold text-brand-800">Objectives we set out to build</h2>
        <ul className="mt-3 space-y-2">
          {objectives.map((o) => (
            <li key={o} className="flex gap-2 text-sm text-ink/70">
              <span className="text-brand-500">✓</span>
              {o}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-extrabold text-brand-800">Analysis techniques</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {techniques.map(([h, b]) => (
            <div key={h} className="card p-4">
              <p className="text-sm font-bold text-brand-700">{h}</p>
              <p className="mt-1 text-sm text-ink/65">{b}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-extrabold text-brand-800">Honest limitations</h2>
        <ul className="mt-3 space-y-2">
          {limitations.map((l) => (
            <li key={l} className="flex gap-2 text-sm text-ink/70">
              <span className="text-earth-500">!</span>
              {l}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 rounded-2xl bg-brand-900 p-6 text-white">
        <h2 className="text-xl font-extrabold">Presented by</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {["Prince R", "Rohith S", "Umaiyaswaran S"].map((n) => (
            <div key={n} className="rounded-xl bg-brand-800 p-4 text-center ring-1 ring-brand-700">
              <p className="font-bold">{n}</p>
              <p className="text-xs text-brand-300">B.Tech · Meenakshi Sundararajan Eng. College</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-brand-200">
          Project-Driven Course · October 2026 · Kodambakkam, Chennai — 600024
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-extrabold text-brand-800">References</h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-ink/70">
          {references.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ol>
      </section>

      <div className="mt-10 flex gap-3">
        <Link href="/advisory" className="btn-primary">
          Try the advisory →
        </Link>
        <Link href="/dashboard" className="btn-ghost">
          View dashboard
        </Link>
      </div>
    </div>
  );
}

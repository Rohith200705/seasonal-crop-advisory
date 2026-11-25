"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/language";
import { AccuracyChart, RainfallChart } from "@/components/charts/Charts";

type Stats = {
  modelAccuracy: { model: string; accuracy: number }[];
  rainfallByCrop: { crop: string; rainfall: number }[];
};

const objectives = [
  {
    icon: "🔗",
    title: "Integrate the data",
    body: "Fuse soil, weather, water, yield and market price into one clean dataset.",
  },
  {
    icon: "🌾",
    title: "Recommend the right crop",
    body: "Rank season-fit crops by expected yield and net profit — not yield alone.",
  },
  {
    icon: "⚠️",
    title: "Score the risk",
    body: "A Season Risk Index from rainfall anomaly, heat extremes and price volatility.",
  },
  {
    icon: "📍",
    title: "Localise & explain",
    body: "Agro-climatic clustering for local advice, with a reason for every pick.",
  },
  {
    icon: "🗣️",
    title: "Make it accessible",
    body: "Local languages, low-connectivity friendly, SMS-ready summaries.",
  },
  {
    icon: "🔁",
    title: "Validate & learn",
    body: "Prove it with ML metrics and improve via a farmer-feedback loop.",
  },
];

const pipeline = [
  ["Collect", "fuse 5+ open sources"],
  ["Preprocess", "clean → engineer → split"],
  ["Explore", "EDA + statistical tests"],
  ["Train", "Random Forest / XGBoost"],
  ["Score", "yield × price − cost"],
  ["Explain", "SHAP reason per crop"],
  ["Deliver", "multilingual app / SMS"],
  ["Learn", "feedback retrains model"],
];

const datasetSources = [
  ["Crop Recommendation — Kaggle", "N, P, K, temperature, humidity, pH, rainfall → crop · 2,200 rows · 22 crops"],
  ["NASA POWER / IMD Agromet", "historical + forecast temperature, humidity & rainfall"],
  ["data.gov.in", "district-wise crop production & yield statistics"],
  ["Agmarknet (DMI)", "daily mandi (market) prices per commodity"],
  ["ISRIC SoilGrids / Soil Health Card", "soil nutrients, texture & pH by region"],
];

const gaps = [
  ["Yield-only", "ignores price, cost and profit."],
  ["Climate-blind", "gives no risk warning."],
  ["Generic & English-only", "no local context."],
  ["Static", "never learns from this season."],
];

export default function HomePage() {
  const { t } = useLang();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) =>
        setStats({ modelAccuracy: d.modelAccuracy, rainfallByCrop: d.rainfallByCrop })
      )
      .catch(() => setStats(null));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-cream">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="pill bg-brand-100 text-brand-700">{t("hero_tagline")}</span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-brand-900 sm:text-5xl">
              {t("hero_title")}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink/70 sm:text-lg">
              {t("hero_sub")}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/advisory" className="btn-primary">
                {t("hero_cta")} →
              </Link>
              <Link href="/dashboard" className="btn-ghost">
                {t("hero_cta2")}
              </Link>
            </div>
            <p className="mt-6 text-xs font-medium uppercase tracking-wider text-brand-500">
              IT in Agriculture · U24CSP56 · Meenakshi Sundararajan Engineering College
            </p>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-brand-700">Live advisory preview</p>
              <span className="pill bg-earth-100 text-earth-700">Kharif · Tanjavur</span>
            </div>
            <ul className="mt-4 space-y-3">
              {[
                { n: "Rice", s: 100, p: "₹2,358/qtl", r: "₹1.42L profit/ha", c: "#4ade80", risk: "Low" },
                { n: "Maize", s: 78, p: "₹2,154/qtl", r: "₹52k profit/ha", c: "#facc15", risk: "Moderate" },
                { n: "Cotton", s: 61, p: "₹7,810/qtl", r: "₹41k profit/ha", c: "#94a3b8", risk: "Moderate" },
                { n: "Jute", s: 54, p: "₹2,706/qtl", r: "₹29k profit/ha", c: "#a3e635", risk: "High" },
              ].map((r, i) => (
                <li key={r.n} className="flex items-center gap-3 rounded-xl border border-brand-100 bg-brand-50/50 px-3 py-2.5">
                  <span className="w-5 text-center text-sm font-extrabold text-brand-400">
                    {i + 1}
                  </span>
                  <span className="h-8 w-1.5 rounded-full" style={{ background: r.c }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{r.n}</p>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-brand-100">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${r.s}%` }} />
                    </div>
                  </div>
                  <div className="text-right text-[11px] leading-tight text-ink/60">
                    <p className="font-semibold text-ink">{r.p}</p>
                    <p>{r.r}</p>
                    <p className={r.risk === "Low" ? "text-brand-600" : "text-earth-500"}>
                      risk {r.risk}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-ink/50">
              Advisory score = expected yield × market price − input cost, re-weighted by the Season
              Risk Index.
            </p>
          </div>
        </div>
      </section>

      {/* Context stats */}
      <section className="mx-auto -mt-2 max-w-6xl px-4 py-10">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["46%", t("stat_farmers")],
            ["85%", t("stat_small")],
            ["49%", t("stat_irrigated")],
          ].map(([big, small]) => (
            <div key={big} className="card p-5 text-center">
              <p className="text-4xl font-extrabold text-brand-600">{big}</p>
              <p className="mt-1 text-sm text-ink/60">{small}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-right text-[11px] text-ink/45">
          Source: Economic Survey 2024-25; Agriculture Census (MoSPI)
        </p>
      </section>

      {/* Problem */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-extrabold text-brand-900">{t("problem_title")}</h2>
            <p className="mt-3 text-ink/70">{t("problem_sub")}</p>
            <div className="card mt-5 border-earth-300/60 bg-earth-100/40 p-5">
              <p className="text-sm font-bold text-earth-700">Seen in real life — 2023</p>
              <ul className="mt-2 space-y-1.5 text-sm text-ink/75">
                <li>
                  <b>Tomato</b> dumped at ₹12–3/kg in May, then ₹1200–350/kg by July.
                </li>
                <li>
                  <b>Onion</b> — a grower&apos;s 512 kg sold for a net ₹12.49; farmers marched in
                  protest.
                </li>
              </ul>
              <p className="mt-3 text-[11px] text-ink/45">Source: Al Jazeera, TIME, BBC (2023)</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-brand-800">{t("gap_title")}</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {gaps.map(([h, b]) => (
                <div key={h} className="card p-4">
                  <p className="text-sm font-bold text-brand-700">{h}</p>
                  <p className="mt-1 text-sm text-ink/65">{b}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Objectives */}
      <section className="bg-brand-900 py-14 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-extrabold">{t("objectives_title")}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {objectives.map((o) => (
              <div key={o.title} className="rounded-2xl bg-brand-800/70 p-5 ring-1 ring-brand-700">
                <span className="text-2xl">{o.icon}</span>
                <p className="mt-2 font-bold">{o.title}</p>
                <p className="mt-1 text-sm text-brand-200">{o.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dataset */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-extrabold text-brand-900">The data we built on</h2>
        <p className="mt-1 text-ink/60">Sources fused by district &amp; season</p>
        <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <ul className="space-y-3">
            {datasetSources.map(([h, b]) => (
              <li key={h} className="card flex gap-3 p-4">
                <span className="mt-0.5 text-brand-500">▸</span>
                <div>
                  <p className="text-sm font-bold text-brand-800">{h}</p>
                  <p className="text-sm text-ink/65">{b}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="grid gap-3 self-start">
            {[
              ["2,200", "labelled soil–climate records"],
              ["22", "candidate crop classes"],
              ["7 → 15", "raw vs engineered features"],
            ].map(([b, s]) => (
              <div key={b} className="card p-5 text-center">
                <p className="text-3xl font-extrabold text-brand-600">{b}</p>
                <p className="mt-1 text-xs text-ink/60">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pipeline */}
      <section className="bg-white py-14 ring-1 ring-brand-100">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-extrabold text-brand-900">{t("pipeline_title")}</h2>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {pipeline.map(([h, b], i) => (
              <li key={h} className="card relative p-4">
                <span className="pill bg-brand-100 text-brand-700">{String(i + 1).padStart(2, "0")}</span>
                <p className="mt-2 font-bold text-brand-800">{h}</p>
                <p className="text-sm text-ink/60">{b}</p>
              </li>
            ))}
          </ol>
          <div className="mt-6 rounded-2xl bg-brand-50 p-5 text-center ring-1 ring-brand-100">
            <p className="text-sm font-semibold text-brand-800">
              Advisory score = expected yield × market price − input cost,
              <br className="hidden sm:block" /> re-weighted by the Season Risk Index
            </p>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-extrabold text-brand-900">{t("results_title")}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-4">
          {[
            ["99.6%", "best accuracy (XGBoost)"],
            ["0.99", "macro F1-score"],
            ["6", "ML models benchmarked"],
            ["k = 5", "agro-climatic zones"],
          ].map(([b, s]) => (
            <div key={b} className="card p-4 text-center">
              <p className="text-2xl font-extrabold text-brand-600">{b}</p>
              <p className="mt-1 text-xs text-ink/60">{s}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="card p-5">
            <p className="mb-3 text-sm font-bold text-brand-800">
              Crop-recommendation accuracy by model (%)
            </p>
            {stats ? (
              <AccuracyChart data={stats.modelAccuracy} />
            ) : (
              <p className="py-24 text-center text-sm text-ink/50">{t("loading")}</p>
            )}
            <p className="mt-2 text-[11px] text-ink/45">
              Source: Comparative study, Atlantis Press (2024), same 22-crop dataset
            </p>
          </div>
          <div className="card p-5">
            <p className="mb-3 text-sm font-bold text-brand-800">
              Average rainfall required, by crop (mm)
            </p>
            {stats ? (
              <RainfallChart data={stats.rainfallByCrop} />
            ) : (
              <p className="py-24 text-center text-sm text-ink/50">{t("loading")}</p>
            )}
            <p className="mt-2 text-[11px] text-ink/45">
              Source: Kaggle Crop Recommendation dataset (2,200 samples)
            </p>
          </div>
        </div>
        <div className="card mt-6 border-l-4 border-l-brand-500 p-5">
          <p className="text-sm text-ink/75">
            <b className="text-brand-800">Insight —</b> adding market price re-ranks the top crop in
            many districts vs a yield-only model — the profit layer, not accuracy, is the
            differentiator.
          </p>
        </div>
      </section>

      {/* Future scope */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="text-2xl font-extrabold text-brand-900">Where this goes next</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["👨‍🌾", "Farmer app", "Season advice in the farmer's own language and voice."],
            ["🏛️", "Govt extension", "Dashboards for agri-extension and policy planning."],
            ["🏦", "Agri-business", "Input supply, FPOs and crop-insurance risk pricing."],
            ["🛰️", "Precision farming", "Per-plot advice from satellite and IoT soil sensors."],
          ].map(([i, h, b]) => (
            <div key={h} className="card p-5">
              <span className="text-2xl">{i}</span>
              <p className="mt-2 font-bold text-brand-800">{h}</p>
              <p className="mt-1 text-sm text-ink/65">{b}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/advisory" className="btn-primary">
            {t("hero_cta")} →
          </Link>
          <Link href="/about" className="btn-ghost">
            {t("about_title")}
          </Link>
        </div>
      </section>
    </div>
  );
}

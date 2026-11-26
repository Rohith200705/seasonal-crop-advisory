"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/language";
import { AccuracyChart, RainfallChart } from "@/components/charts/Charts";
import { Reveal, Counter } from "@/components/Reveal";

const FieldScene = dynamic(() => import("@/components/hero/FieldScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <span className="animate-seed-spin text-3xl">🌱</span>
    </div>
  ),
});

type Stats = {
  modelAccuracy: { model: string; accuracy: number }[];
  rainfallByCrop: { crop: string; rainfall: number }[];
  bestModel?: string;
  bestAccuracy?: number;
  macroF1?: number;
  dataset?: { rows: number; classes: string[] };
  zonesMeta?: { k: number; silhouette: number };
};

const objectives = [
  {
    icon: "🧠",
    title: "Train, don't hardcode",
    body: "Random Forest fitted offline on 2,200 labelled soil–climate rows; JSON export inferred in the API.",
  },
  {
    icon: "🌾",
    title: "Rank by profit",
    body: "Expected yield × baseline price − input cost, not yield alone.",
  },
  {
    icon: "⚠️",
    title: "Score the risk",
    body: "Season Risk Index from climate distance, static market CV, and model uncertainty.",
  },
  {
    icon: "📍",
    title: "Localise & explain",
    body: "K-Means k=5 zones plus a reason per pick from class-mean distance.",
  },
  {
    icon: "🗣️",
    title: "Make it accessible",
    body: "Local languages and a low-connectivity friendly UI.",
  },
  {
    icon: "🔁",
    title: "Validate & learn",
    body: "Held-out metrics in metrics.json; farmer feedback stored for a future retrain loop.",
  },
];

const pipeline = [
  ["Collect", "Crop_recommendation.csv — 2,200 labelled rows"],
  ["Preprocess", "impute → IQR → engineer → scale → 80/20"],
  ["Explore", "EDA + K-Means k=5 zones on real features"],
  ["Train", "6 classifiers, seed 42, held-out metrics"],
  ["Score", "yield × baseline price − cost"],
  ["Explain", "class-mean distance + model probability"],
  ["Deliver", "Next.js API + multilingual UI"],
  ["Learn", "feedback stored in Mongo (retrain pending)"],
];

const datasetSources = [
  [
    "Crop Recommendation — Kaggle (in repo)",
    "N, P, K, temperature, humidity, pH, rainfall → 22 crops · 2,200 rows · scripts/train.py",
  ],
  [
    "Engineered features (13)",
    "NPK ratios, N/K share, rain per degree, humid-rain, |pH−7|",
  ],
  [
    "Exported artifacts",
    "model.json (200-tree RF) · scaler.json · metrics.json · zones.json",
  ],
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
        setStats({
          modelAccuracy: d.modelAccuracy,
          rainfallByCrop: d.rainfallByCrop,
          bestModel: d.bestModel,
          bestAccuracy: d.bestAccuracy,
          macroF1: d.macroF1,
          dataset: d.dataset,
          zonesMeta: d.zonesMeta,
        })
      )
      .catch(() => setStats(null));
  }, []);

  return (
    <div className="doc">
      {/* Hero — solid tone + dot pattern (no gradients) */}
      <section className="relative overflow-hidden bg-brand-50">
        <div className="pattern-dots pointer-events-none absolute inset-0 opacity-70" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="pill animate-rise bg-brand-100 text-brand-700">{t("hero_tagline")}</span>
            <h1
              data-tour="hero-title"
              className="animate-rise d100 mt-4 text-4xl font-extrabold leading-[1.15] tracking-tight text-brand-900 sm:text-5xl"
            >
              {t("hero_title")}
            </h1>
            <p className="animate-rise d200 mt-4 max-w-xl text-base leading-relaxed text-ink/70 sm:text-lg">
              {t("hero_sub")}
            </p>
            <div className="animate-rise d300 mt-7 flex flex-wrap gap-3">
              <Link href="/advisory" className="btn-primary">
                {t("hero_cta")} →
              </Link>
              <Link href="/dashboard" className="btn-ghost">
                {t("hero_cta2")}
              </Link>
            </div>
            <p className="animate-rise d400 mt-6 text-xs font-medium uppercase tracking-wider text-brand-500">
              IT in Agriculture · U24CSP56 · Meenakshi Sundararajan Engineering College
            </p>
          </div>

          {/* 3D globe scene — replaces the old mock preview */}
          <div
            className="card tilt animate-pop d200 relative h-[360px] overflow-hidden p-0 sm:h-[420px]"
            aria-label="Interactive 3D globe showing agro-climatic zones"
            data-tour="hero-globe"
          >
            <div className="pattern-grid pointer-events-none absolute inset-0" aria-hidden />
            <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
              <span className="pill bg-white/90 text-brand-700 shadow-sm">5 agro-climatic zones</span>
              <span className="pill bg-white/90 text-earth-700 shadow-sm">22 crops</span>
            </div>
            <p className="absolute bottom-3 left-0 right-0 z-10 text-center text-[11px] font-semibold uppercase tracking-wide text-ink/55">
              Drag to spin · live advisory engine
            </p>
            <div className="absolute inset-0">
              <FieldScene />
            </div>
          </div>
        </div>
      </section>

      {/* Context stats */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            [46, t("stat_farmers")],
            [85, t("stat_small")],
            [49, t("stat_irrigated")],
          ].map(([big, small], i) => (
            <Reveal key={String(big)} delay={i * 110}>
              <div className="card lift p-6 text-center">
                <p className="text-4xl font-extrabold text-brand-600">
                  <Counter to={big as number} suffix="%" />
                </p>
                <p className="mt-2 text-sm text-ink/60">{small as string}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="mt-3 text-right text-[11px] text-ink/45">
          Source: Economic Survey 2024-25; Agriculture Census (MoSPI)
        </p>
      </section>

      {/* Problem */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-2">
          <Reveal>
            <h2 className="doc-h2">{t("problem_title")}</h2>
            <p className="doc-p mt-3">{t("problem_sub")}</p>
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
          </Reveal>
          <Reveal delay={140}>
            <h3 className="text-lg font-bold text-brand-800">{t("gap_title")}</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {gaps.map(([h, b]) => (
                <div key={h} className="card lift p-4">
                  <p className="text-sm font-bold text-brand-700">{h}</p>
                  <p className="mt-1 text-sm text-ink/65">{b}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Objectives */}
      <section className="relative overflow-hidden bg-brand-900 py-16 text-white">
        <div className="pattern-dots pointer-events-none absolute inset-0 opacity-30" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-6">
          <Reveal>
            <h2 className="doc-h2-light">{t("objectives_title")}</h2>
          </Reveal>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {objectives.map((o, i) => (
              <Reveal key={o.title} delay={i * 80}>
                <div className="lift h-full rounded-2xl bg-brand-800 p-5 ring-1 ring-brand-700">
                  <span className="text-2xl">{o.icon}</span>
                  <p className="mt-2 font-bold">{o.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-brand-200">{o.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Dataset */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <Reveal>
          <h2 className="doc-h2">The data we built on</h2>
          <p className="doc-p mt-1">Sources fused by district &amp; season</p>
        </Reveal>
        <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <ul className="space-y-3">
            {datasetSources.map(([h, b], i) => (
              <Reveal key={h} as="li" delay={i * 70}>
                <div className="card flex gap-3 p-4 transition hover:border-brand-300 hover:shadow-[0_10px_24px_rgba(20,35,26,0.08)]">
                  <span className="mt-0.5 text-brand-500">▸</span>
                  <div>
                    <p className="text-sm font-bold text-brand-800">{h}</p>
                    <p className="text-sm text-ink/65">{b}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ul>
          <div className="grid gap-3 self-start">
            {[
              ["2,200", "labelled soil–climate records"],
              ["22", "candidate crop classes"],
              ["7 → 13", "raw vs engineered features"],
            ].map(([b, s], i) => (
              <Reveal key={b} delay={i * 100}>
                <div className="card p-5 text-center lift">
                  <p className="text-3xl font-extrabold text-brand-600">{b}</p>
                  <p className="mt-1 text-xs text-ink/60">{s}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pipeline */}
      <section className="relative overflow-hidden bg-white py-16 ring-1 ring-brand-100">
        <div className="pattern-grid pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-6">
          <Reveal>
            <h2 className="doc-h2">{t("pipeline_title")}</h2>
          </Reveal>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pipeline.map(([h, b], i) => (
              <Reveal key={h} delay={i * 70}>
                <li className="card h-full p-4">
                  <span className="pill bg-brand-100 text-brand-700">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-2 font-bold text-brand-800">{h}</p>
                  <p className="text-sm text-ink/60">{b}</p>
                </li>
              </Reveal>
            ))}
          </ol>
          <Reveal>
            <div className="mt-8 rounded-2xl bg-brand-50 p-6 text-center ring-1 ring-brand-100">
              <p className="text-sm font-semibold leading-relaxed text-brand-800">
                Advisory score = expected yield × market price − input cost,
                <br className="hidden sm:block" /> re-weighted by the Season Risk Index
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Results */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <Reveal>
          <h2 className="doc-h2">{t("results_title")}</h2>
        </Reveal>
        <div className="mt-6 grid gap-5 sm:grid-cols-4">
          {[
            [
              stats?.bestAccuracy != null ? `${stats.bestAccuracy}%` : "—",
              `best held-out accuracy (${stats?.bestModel ?? "…"})`,
            ],
            [stats?.macroF1 != null ? stats.macroF1.toFixed(3) : "—", "macro F1 (exported RF)"],
            [
              stats?.modelAccuracy ? String(stats.modelAccuracy.length) : "—",
              "ML models benchmarked",
            ],
            [
              stats?.zonesMeta ? `k = ${stats.zonesMeta.k}` : "—",
              "agro-climatic zones (K-Means)",
            ],
          ].map(([b, s], i) => (
            <Reveal key={s} delay={i * 90}>
              <div className="card p-5 text-center lift">
                <p className="text-2xl font-extrabold text-brand-600">{b}</p>
                <p className="mt-1 text-xs text-ink/60">{s}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="card h-full p-5">
              <p className="mb-3 text-sm font-bold text-brand-800">
                Held-out accuracy by model (%)
              </p>
              {stats ? (
                <AccuracyChart data={stats.modelAccuracy} />
              ) : (
                <p className="py-24 text-center text-sm text-ink/50">{t("loading")}</p>
              )}
              <p className="mt-2 text-[11px] text-ink/45">
                Measured on this repo&apos;s 20% test split via scripts/train.py — not a citation
                from a paper.
              </p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="card h-full p-5">
              <p className="mb-3 text-sm font-bold text-brand-800">
                Average rainfall by crop in the dataset (mm)
              </p>
              {stats ? (
                <RainfallChart data={stats.rainfallByCrop} />
              ) : (
                <p className="py-24 text-center text-sm text-ink/50">{t("loading")}</p>
              )}
              <p className="mt-2 text-[11px] text-ink/45">
                Computed from Crop_recommendation.csv (2,200 samples).
              </p>
            </div>
          </Reveal>
        </div>
        <Reveal>
          <div className="card mt-6 border-l-4 border-l-brand-500 p-5">
            <p className="text-sm leading-relaxed text-ink/75">
              <b className="text-brand-800">How a pick is scored —</b> model probability for the
              crop under your soil/climate, times expected yield × baseline price − cost,
              re-weighted by Season Risk Index (climate distance from the crop&apos;s learned
              profile + static market CV + model uncertainty).
            </p>
          </div>
        </Reveal>
      </section>

      {/* Future scope */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <Reveal>
          <h2 className="doc-h2">Where this goes next</h2>
        </Reveal>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["👨‍🌾", "Farmer app", "Season advice in the farmer's own language and voice."],
            ["🏛️", "Govt extension", "Dashboards for agri-extension and policy planning."],
            ["🏦", "Agri-business", "Input supply, FPOs and crop-insurance risk pricing."],
            ["🛰️", "Precision farming", "Per-plot advice from satellite and IoT soil sensors."],
          ].map(([i, h, b], idx) => (
            <Reveal key={h} delay={idx * 90}>
              <div className="card lift h-full p-5">
                <span className="text-2xl">{i}</span>
                <p className="mt-2 font-bold text-brand-800">{h}</p>
                <p className="mt-1 text-sm text-ink/65">{b}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
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

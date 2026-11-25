"use client";

import { useEffect, useState } from "react";
import { cropLabel, useLang } from "@/lib/language";
import { CROPS } from "@/lib/data/crops";
import { AccuracyChart, RainfallChart, ScoreBarChart } from "@/components/charts/Charts";

type Stats = {
  mode: "mongodb" | "memory";
  modelAccuracy: { model: string; accuracy: number }[];
  rainfallByCrop: { crop: string; rainfall: number }[];
  totals: { queries: number; feedback: number; avgRating: number; crops: number; zones: number; models: number };
  zoneCounts: { zone: string; count: number }[];
  topCrops: { slug: string; count: number }[];
  recent: { topCrop: string; score: number; zone: string; season: string; createdAt: string }[];
};

export default function DashboardPage() {
  const { t, lang } = useLang();
  const [stats, setStats] = useState<Stats | null>(null);
  const [feedback, setFeedback] = useState<
    { name: string; district: string; crop: string; rating: number; comment: string; createdAt: string }[]
  >([]);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats(null));
    fetch("/api/feedback")
      .then((r) => r.json())
      .then((d) => setFeedback(d.feedback ?? []))
      .catch(() => setFeedback([]));
  }, []);

  if (!stats) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <p className="card p-8 text-center text-sm text-ink/50">{t("loading")}</p>
      </div>
    );
  }

  const zoneColors = ["#f59e0b", "#d97706", "#65a30d", "#0891b2", "#7c3aed"];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-brand-900">{t("dash_title")}</h1>
          <p className="mt-1 text-ink/60">{t("dash_sub")}</p>
        </div>
        <span
          className={`pill ${stats.mode === "mongodb" ? "bg-brand-100 text-brand-700" : "bg-earth-100 text-earth-700"}`}
        >
          {stats.mode === "mongodb" ? `● ${t("db_mongodb")}` : `● ${t("db_memory")}`}
        </span>
      </div>

      <div data-tour="dash-stats" className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          [String(stats.totals.queries), "advisory queries logged"],
          [String(stats.totals.feedback), "farmer feedback entries"],
          [stats.totals.avgRating ? `${stats.totals.avgRating}★` : "—", "avg feedback rating"],
          [String(stats.totals.crops), "candidate crops"],
          [String(stats.totals.zones), "agro-climatic zones"],
          [String(stats.totals.models), "models benchmarked"],
        ].map(([b, s]) => (
          <div key={s} className="card p-4 text-center">
            <p className="text-2xl font-extrabold text-brand-600">{b}</p>
            <p className="mt-1 text-[11px] leading-tight text-ink/55">{s}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="card p-5">
          <p className="mb-3 text-sm font-bold text-brand-800">
            Crop-recommendation accuracy by model (%)
          </p>
          <AccuracyChart data={stats.modelAccuracy} />
          <p className="mt-2 text-[11px] text-ink/45">
            Atlantis Press (2024) comparative study on the same 22-crop dataset
          </p>
        </div>
        <div className="card p-5">
          <p className="mb-3 text-sm font-bold text-brand-800">
            Average rainfall required, by crop (mm)
          </p>
          <RainfallChart data={stats.rainfallByCrop} />
          <p className="mt-2 text-[11px] text-ink/45">
            Kaggle Crop Recommendation dataset — rainfall &amp; humidity are the strongest separators
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="card p-5">
          <p className="mb-3 text-sm font-bold text-brand-800">
            Advisory queries by agro-climatic zone
          </p>
          {stats.zoneCounts.length === 0 ? (
            <p className="py-16 text-center text-sm text-ink/50">
              No queries yet — run an advisory to populate this.
            </p>
          ) : (
            <ul className="space-y-3">
              {stats.zoneCounts.map((z, i) => {
                const total = stats.zoneCounts.reduce((a, b) => a + b.count, 0) || 1;
                return (
                  <li key={z.zone}>
                    <div className="mb-1 flex justify-between text-xs font-semibold">
                      <span>{z.zone}</span>
                      <span className="text-ink/50">
                        {z.count} ({Math.round((z.count / total) * 100)}%)
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-brand-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(z.count / total) * 100}%`,
                          background: zoneColors[i % zoneColors.length],
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <p className="mb-3 text-sm font-bold text-brand-800">Most-recommended crops (all queries)</p>
          {stats.topCrops.length === 0 ? (
            <p className="py-16 text-center text-sm text-ink/50">Run an advisory to see rankings.</p>
          ) : (
            <ScoreBarChart
              data={stats.topCrops.map((c) => {
                const crop = CROPS.find((x) => x.slug === c.slug);
                return {
                  name: crop ? cropLabel(lang, crop) : c.slug,
                  score: c.count,
                  color: crop?.color ?? "#38904c",
                };
              })}
            />
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="card p-5">
          <p className="mb-3 text-sm font-bold text-brand-800">Recent advisory queries</p>
          {stats.recent.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink/50">Nothing yet.</p>
          ) : (
            <ul className="divide-y divide-brand-100 text-sm">
              {stats.recent.map((r, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-2.5">
                  <div>
                    <p className="font-bold text-brand-800">
                      #{i + 1} · {cropLabel(lang, { name: r.topCrop })}
                    </p>
                    <p className="text-xs text-ink/55">
                      {r.zone} · {r.season}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-brand-600">{r.score}</p>
                    <p className="text-[11px] text-ink/45">
                      {new Date(r.createdAt).toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <p className="mb-3 text-sm font-bold text-brand-800">Farmer feedback loop</p>
          {feedback.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink/50">No feedback yet.</p>
          ) : (
            <ul className="space-y-3">
              {feedback.slice(0, 6).map((f, i) => (
                <li key={i} className="rounded-xl bg-brand-50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-brand-800">
                      {f.name} · {f.district}
                    </p>
                    <span className="text-sm font-extrabold text-earth-500">
                      {"★".repeat(f.rating)}
                      {"☆".repeat(5 - f.rating)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-ink/55">
                    grew {f.crop} · {new Date(f.createdAt).toLocaleDateString()}
                  </p>
                  {f.comment && <p className="mt-1 text-sm text-ink/70">“{f.comment}”</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

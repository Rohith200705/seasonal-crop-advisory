"use client";

import { useEffect, useMemo, useState } from "react";
import { cropLabel, useLang } from "@/lib/language";
import { PriceLineChart, VolatilityChart } from "@/components/charts/Charts";

type PriceRow = {
  slug: string;
  name: string;
  hindiName: string;
  tamilName: string;
  color: string;
  current: number;
  mean: number;
  min: number;
  max: number;
  volatility: number;
  trendPct: number;
  series: { date: string; price: number }[];
};

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export default function PricesPage() {
  const { t, lang } = useLang();
  const [rows, setRows] = useState<PriceRow[] | null>(null);
  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    fetch("/api/prices")
      .then((r) => r.json())
      .then((d) => {
        setRows(d.crops);
        const prefers = d.crops.find((c: PriceRow) => c.slug === "mango");
        setSelected(prefers ? "mango" : d.crops[0]?.slug ?? "");
      })
      .catch(() => setRows([]));
  }, []);

  const active = useMemo(() => rows?.find((r) => r.slug === selected) ?? null, [rows, selected]);
  const volSorted = useMemo(
    () => [...(rows ?? [])].sort((a, b) => b.volatility - a.volatility).slice(0, 12),
    [rows]
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-brand-900">{t("prices_title")}</h1>
      <p className="mt-1 text-ink/60">{t("prices_sub")}</p>

      {!rows && <p className="card mt-6 p-8 text-center text-sm text-ink/50">{t("loading")}</p>}

      {rows && (
        <>
          <div className="mt-5 flex flex-wrap gap-2">
            {rows.map((r) => (
              <button
                key={r.slug}
                type="button"
                onClick={() => setSelected(r.slug)}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                  selected === r.slug
                    ? "bg-brand-600 text-white"
                    : "border border-brand-200 bg-white text-brand-700 hover:bg-brand-50"
                }`}
              >
                {cropLabel(lang, r)}
              </button>
            ))}
          </div>

          {active && (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-4">
                <div className="card p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
                    Current mandi
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-brand-700">
                    {inr(active.current)}
                  </p>
                  <p className="text-xs text-ink/50">per quintal</p>
                </div>
                <div className="card p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
                    4-month range
                  </p>
                  <p className="mt-1 text-2xl font-extrabold">
                    {inr(active.min)}–{inr(active.max)}
                  </p>
                  <p className="text-xs text-ink/50">mean {inr(active.mean)}</p>
                </div>
                <div className="card p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Trend</p>
                  <p
                    className={`mt-1 text-2xl font-extrabold ${
                      active.trendPct >= 0 ? "text-brand-600" : "text-red-600"
                    }`}
                  >
                    {active.trendPct >= 0 ? "▲" : "▼"} {Math.abs(active.trendPct)}%
                  </p>
                  <p className="text-xs text-ink/50">over 120 days</p>
                </div>
                <div className="card p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
                    Volatility (CV)
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-earth-500">
                    {Math.round(active.volatility * 100)}%
                  </p>
                  <p className="text-xs text-ink/50">feeds Season Risk Index</p>
                </div>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-[2fr_1fr]">
                <div className="card p-5" data-tour="price-chart">
                  <p className="mb-3 text-sm font-bold text-brand-800">
                    Daily mandi price — {cropLabel(lang, active)}
                  </p>
                  <PriceLineChart data={active.series} color={active.color} name={cropLabel(lang, active)} />
                </div>
                <div className="card p-5">
                  <p className="mb-2 text-sm font-bold text-brand-800">How the engine reads this</p>
                  <ul className="space-y-2.5 text-sm text-ink/70">
                    <li className="rounded-lg bg-brand-50 p-3">
                      <b className="text-brand-700">Price level</b> sets revenue: yield × ₹/qtl in
                      the advisory score.
                    </li>
                    <li className="rounded-lg bg-brand-50 p-3">
                      <b className="text-brand-700">Trend</b> — a falling curve warns you to sell
                      early or skip the crop.
                    </li>
                    <li className="rounded-lg bg-earth-100 p-3">
                      <b className="text-earth-700">Volatility</b> contributes 35% of the Season
                      Risk Index alongside rainfall anomaly and heat extremes.
                    </li>
                  </ul>
                  <p className="mt-3 text-[11px] text-ink/45">
                    Simulated Agmarknet-style series (deterministic per commodity) — swap in the live
                    DMI API for production.
                  </p>
                </div>
              </div>

              <div className="card mt-5 p-5">
                <p className="mb-3 text-sm font-bold text-brand-800">
                  Price volatility by commodity — top 12 (σ/μ, last 120 days)
                </p>
                <VolatilityChart
                  data={volSorted.map((r) => ({
                    name: cropLabel(lang, r),
                    volatility: Math.round(r.volatility * 1000) / 1000,
                  }))}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

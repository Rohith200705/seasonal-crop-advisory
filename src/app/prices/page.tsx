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
  source: "live" | "baseline";
  asOf?: string;
  commodity?: string;
  state?: string;
  series: { date: string; price: number }[];
};

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export default function PricesPage() {
  const { t, lang } = useLang();
  const [rows, setRows] = useState<PriceRow[] | null>(null);
  const [meta, setMeta] = useState<{ liveCount: number; total: number; note?: string } | null>(
    null
  );
  const [selected, setSelected] = useState<string>("");
  const [detail, setDetail] = useState<{
    series: { date: string; price: number }[];
    source: string;
    meta?: { commodity?: string; state?: string; asOf?: string; note?: string };
  } | null>(null);

  useEffect(() => {
    fetch("/api/prices")
      .then((r) => r.json())
      .then((d) => {
        setRows(d.crops);
        setMeta({ liveCount: d.liveCount, total: d.total, note: d.note });
        const prefers = d.crops.find((c: PriceRow) => c.slug === "rice" && c.source === "live");
        const firstLive = d.crops.find((c: PriceRow) => c.source === "live");
        setSelected(
          (prefers ?? firstLive ?? d.crops.find((c: PriceRow) => c.slug === "mango") ?? d.crops[0])
            ?.slug ?? ""
        );
      })
      .catch(() => setRows([]));
  }, []);

  useEffect(() => {
    if (!selected) return;
    const clear = setTimeout(() => setDetail(null), 0);
    fetch(`/api/prices?crop=${encodeURIComponent(selected)}`)
      .then((r) => r.json())
      .then((d) =>
        setDetail({ series: d.series ?? [], source: d.source, meta: d.meta })
      )
      .catch(() => setDetail({ series: [], source: "baseline" }));
    return () => clearTimeout(clear);
  }, [selected]);

  const active = useMemo(() => rows?.find((r) => r.slug === selected) ?? null, [rows, selected]);
  const volSorted = useMemo(
    () => [...(rows ?? [])].sort((a, b) => b.volatility - a.volatility).slice(0, 12),
    [rows]
  );
  const liveRows = useMemo(() => (rows ?? []).filter((r) => r.source === "live"), [rows]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-brand-900">{t("prices_title")}</h1>
      <p className="mt-1 text-ink/60">{t("prices_sub")}</p>
      {meta && (
        <p className="mt-2 text-sm text-ink/55">
          <span className="pill bg-brand-100 text-brand-700">
            {meta.liveCount}/{meta.total} live
          </span>{" "}
          <span className="ml-1">{meta.note}</span>
        </p>
      )}

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
                    : r.source === "live"
                      ? "border border-brand-300 bg-brand-50 text-brand-800 hover:bg-brand-100"
                      : "border border-brand-200 bg-white text-brand-700 hover:bg-brand-50"
                }`}
              >
                {cropLabel(lang, r)}
                {r.source === "live" ? " ●" : ""}
              </button>
            ))}
          </div>

          {active && (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-4">
                <div className="card p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
                    {active.source === "live" ? "Live modal price" : "Baseline price"}
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-brand-700">
                    {inr(active.current)}
                  </p>
                  <p className="text-xs text-ink/50">
                    per quintal ·{" "}
                    {active.source === "live"
                      ? `live${active.asOf ? ` · ${active.asOf}` : ""}`
                      : "static reference"}
                  </p>
                </div>
                <div className="card p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
                    Range ({active.series.length || "—"} days)
                  </p>
                  <p className="mt-1 text-2xl font-extrabold">
                    {active.series.length
                      ? `${inr(active.min)}–${inr(active.max)}`
                      : "—"}
                  </p>
                  <p className="text-xs text-ink/50">mean {inr(active.mean)}</p>
                </div>
                <div className="card p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Trend</p>
                  <p
                    className={`mt-1 text-2xl font-extrabold ${
                      active.trendPct > 0
                        ? "text-brand-600"
                        : active.trendPct < 0
                          ? "text-red-600"
                          : "text-ink/40"
                    }`}
                  >
                    {active.trendPct === 0
                      ? "—"
                      : `${active.trendPct >= 0 ? "▲" : "▼"} ${Math.abs(active.trendPct)}%`}
                  </p>
                  <p className="text-xs text-ink/50">over series window</p>
                </div>
                <div className="card p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
                    Volatility (CV)
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-earth-500">
                    {Math.round(active.volatility * 100)}%
                  </p>
                  <p className="text-xs text-ink/50">
                    {active.source === "live" ? "from live series" : "static assumption"}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-[2fr_1fr]">
                <div className="card p-5" data-tour="price-chart">
                  <p className="mb-3 text-sm font-bold text-brand-800">
                    {active.source === "live"
                      ? `Live daily mandi modal — ${cropLabel(lang, active)}`
                      : `No live series — ${cropLabel(lang, active)}`}
                    {active.commodity ? (
                      <span className="ml-2 text-xs font-normal text-ink/50">
                        {active.commodity}
                        {active.state ? ` · ${active.state}` : ""}
                      </span>
                    ) : null}
                  </p>
                  {detail?.series?.length ? (
                    <PriceLineChart
                      data={detail.series}
                      color={active.color}
                      name={cropLabel(lang, active)}
                    />
                  ) : (
                    <p className="py-24 text-center text-sm text-ink/50">
                      {active.source === "live"
                        ? "Loading series…"
                        : "Live API has no row for this crop — baseline only."}
                    </p>
                  )}
                </div>
                <div className="card p-5">
                  <p className="mb-2 text-sm font-bold text-brand-800">How the engine reads this</p>
                  <ul className="space-y-2.5 text-sm text-ink/70">
                    <li className="rounded-lg bg-brand-50 p-3">
                      <b className="text-brand-700">Profit layer</b> — expected yield × ₹/qtl −
                      input cost, re-weighted by Season Risk Index.
                    </li>
                    <li className="rounded-lg bg-brand-50 p-3">
                      <b className="text-brand-700">Live when available</b> — advisory fetches
                      modal history from mandi-api.onrender.com (cached 15 min).
                    </li>
                    <li className="rounded-lg bg-earth-100 p-3">
                      <b className="text-earth-700">Baseline fallback</b> — crops the API
                      doesn&apos;t carry use the static profile price; never a fake series.
                    </li>
                  </ul>
                  <p className="mt-3 text-[11px] text-ink/45">
                    Source: mandi-api.onrender.com/v1 (Agmarknet-style history).
                    {liveRows.length > 0 && (
                      <>
                        {" "}
                        <b>{liveRows.length}</b> crops currently live.
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="card mt-5 p-5">
                <p className="mb-3 text-sm font-bold text-brand-800">
                  Market-risk (CV) by commodity — top 12
                </p>
                <VolatilityChart
                  data={volSorted.map((r) => ({
                    name: `${cropLabel(lang, r)}${r.source === "live" ? " ●" : ""}`,
                    volatility: Math.round(r.volatility * 1000) / 1000,
                  }))}
                />
                <p className="mt-2 text-[11px] text-ink/45">
                  ● = live series CV; others = static baseline assumption.
                </p>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

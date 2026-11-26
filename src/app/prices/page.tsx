"use client";

import { useEffect, useMemo, useState } from "react";
import { cropLabel, useLang } from "@/lib/language";
import { VolatilityChart } from "@/components/charts/Charts";

type PriceRow = {
  slug: string;
  name: string;
  hindiName: string;
  tamilName: string;
  color: string;
  current: number;
  volatility: number;
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
      <p className="mt-1 text-ink/60">
        Static baseline reference prices (₹/quintal) used in the profit layer — not live mandi
        quotes.
      </p>

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
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="card p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
                    Baseline price
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-brand-700">
                    {inr(active.current)}
                  </p>
                  <p className="text-xs text-ink/50">per quintal · static reference</p>
                </div>
                <div className="card p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
                    Market-risk assumption
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-earth-500">
                    {Math.round(active.volatility * 100)}%
                  </p>
                  <p className="text-xs text-ink/50">CV used in Season Risk Index</p>
                </div>
                <div className="card p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
                    Live series
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-ink/40">—</p>
                  <p className="text-xs text-ink/50">Agmarknet DMI not wired yet</p>
                </div>
              </div>

              <div className="mt-5 card p-5">
                <p className="mb-2 text-sm font-bold text-brand-800">How the engine reads price</p>
                <ul className="space-y-2.5 text-sm text-ink/70">
                  <li className="rounded-lg bg-brand-50 p-3">
                    <b className="text-brand-700">Profit layer</b> — expected yield × baseline
                    ₹/qtl − input cost, then re-weighted by Season Risk Index.
                  </li>
                  <li className="rounded-lg bg-brand-50 p-3">
                    <b className="text-brand-700">Volatility</b> — static per-crop CV assumption
                    contributes to market risk alongside climate distance and model uncertainty.
                  </li>
                  <li className="rounded-lg bg-earth-100 p-3">
                    <b className="text-earth-700">Not simulated</b> — there is no fake daily price
                    curve. Plug Agmarknet for live quotes.
                  </li>
                </ul>
              </div>

              <div className="card mt-5 p-5">
                <p className="mb-3 text-sm font-bold text-brand-800">
                  Market-risk assumption by commodity — top 12 (static CV)
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

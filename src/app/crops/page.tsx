"use client";

import { useEffect, useMemo, useState } from "react";
import { cropLabel, useLang } from "@/lib/language";
import type { Season } from "@/lib/types";

type CropItem = {
  slug: string;
  name: string;
  hindiName: string;
  tamilName: string;
  category: string;
  seasons: Season[];
  color: string;
  waterNeed: string;
  description: string;
  yieldPerHa: number;
  inputCostPerHa: number;
  rainfall: { min: number; max: number };
  temperature: { min: number; max: number };
  ph: { min: number; max: number };
  price: number;
  volatility: number;
  trendPct: number;
};

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export default function CropsPage() {
  const { t, lang } = useLang();
  const [crops, setCrops] = useState<CropItem[] | null>(null);
  const [q, setQ] = useState("");
  const [season, setSeason] = useState<Season | "all">("all");

  useEffect(() => {
    fetch("/api/crops")
      .then((r) => r.json())
      .then((d) => setCrops(d.crops))
      .catch(() => setCrops([]));
  }, []);

  const filtered = useMemo(() => {
    if (!crops) return [];
    const needle = q.trim().toLowerCase();
    return crops.filter((c) => {
      const matchesQ =
        !needle ||
        c.name.toLowerCase().includes(needle) ||
        c.hindiName.includes(q.trim()) ||
        c.tamilName.includes(q.trim()) ||
        c.category.toLowerCase().includes(needle);
      const matchesS = season === "all" || c.seasons.includes(season);
      return matchesQ && matchesS;
    });
  }, [crops, q, season]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-brand-900">{t("crops_title")}</h1>
      <p className="mt-1 text-ink/60">{t("crops_sub")}</p>

      <div className="mt-5 flex flex-wrap gap-3">
        <input
          className="input-field max-w-xs flex-1"
          placeholder="Search crop, category…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search crops"
        />
        <div className="flex gap-2">
          {(["all", "kharif", "rabi", "zaid"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSeason(s)}
              className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                season === s
                  ? "bg-brand-600 text-white"
                  : "border border-brand-200 bg-white text-brand-700"
              }`}
            >
              {s === "all" ? "All seasons" : t(`season_${s}`)}
            </button>
          ))}
        </div>
      </div>

      {!crops && (
        <p className="card mt-6 p-8 text-center text-sm text-ink/50">{t("loading")}</p>
      )}

      {crops && filtered.length === 0 && (
        <p className="card mt-6 p-8 text-center text-sm text-ink/50">No crops match that filter.</p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <article key={c.slug} className="card overflow-hidden">
            <div className="flex items-start gap-3 p-4" style={{ borderTop: `4px solid ${c.color}` }}>
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white"
                style={{ background: c.color }}
              >
                {c.name.slice(0, 2)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h2 className="font-extrabold text-brand-900">{cropLabel(lang, c)}</h2>
                  <span className="pill bg-brand-50 text-brand-600">{c.category}</span>
                </div>
                <p className="text-xs text-ink/50">
                  {lang === "en" ? `${c.hindiName} · ${c.tamilName}` : c.name}
                </p>
                <p className="mt-1.5 text-sm text-ink/65">{c.description}</p>
              </div>
            </div>

            <dl className="grid grid-cols-3 gap-px bg-brand-100 text-center text-xs">
              <div className="bg-white p-2.5">
                <dt className="text-ink/50">Price</dt>
                <dd className="font-bold text-brand-700">{inr(c.price)}/qtl</dd>
                <dd className={c.trendPct >= 0 ? "text-brand-500" : "text-red-500"}>
                  {c.trendPct >= 0 ? "▲" : "▼"} {Math.abs(c.trendPct)}%
                </dd>
              </div>
              <div className="bg-white p-2.5">
                <dt className="text-ink/50">Yield</dt>
                <dd className="font-bold">{c.yieldPerHa} qtl/ha</dd>
                <dd className="text-ink/45">{inr(c.inputCostPerHa)}/ha cost</dd>
              </div>
              <div className="bg-white p-2.5">
                <dt className="text-ink/50">Volatility</dt>
                <dd className="font-bold">{Math.round(c.volatility * 100)}%</dd>
                <dd className="text-ink/45">CV of price</dd>
              </div>
            </dl>

            <div className="flex flex-wrap items-center gap-1.5 border-t border-brand-100 p-3 text-[11px]">
              {c.seasons.map((s) => (
                <span key={s} className="pill bg-earth-100 text-earth-700">
                  {t(`season_${s}`)}
                </span>
              ))}
              <span className="pill bg-brand-50 text-brand-600">
                rain {c.rainfall.min}–{c.rainfall.max} mm
              </span>
              <span className="pill bg-brand-50 text-brand-600">
                {c.temperature.min}–{c.temperature.max}°C
              </span>
              <span className="pill bg-brand-50 text-brand-600">pH {c.ph.min}–{c.ph.max}</span>
              <span
                className={`pill ${
                  c.waterNeed === "high"
                    ? "bg-sky-100 text-sky-700"
                    : c.waterNeed === "medium"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-lime-100 text-lime-700"
                }`}
              >
                💧 {c.waterNeed}
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

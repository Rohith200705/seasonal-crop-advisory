"use client";

import { useState } from "react";
import { useLang, cropLabel } from "@/lib/language";
import { ScoreBarChart } from "@/components/charts/Charts";
import type { AdvisoryResult, Season } from "@/lib/types";
import FeedbackForm from "@/components/FeedbackForm";

type Mode = "mongodb" | "memory";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

const defaultForm = {
  season: "kharif" as Season,
  state: "Tamil Nadu",
  district: "Thanjavur",
  areaHa: 1,
  n: 80,
  p: 45,
  k: 40,
  ph: 6.5,
  temperature: 29,
  humidity: 78,
  rainfall: 220,
  priceOverride: "",
};

export default function AdvisoryPage() {
  const { t, lang } = useLang();
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<(AdvisoryResult & { mode: Mode }) | null>(null);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [fbDone, setFbDone] = useState(false);

  const set = (k: keyof typeof form, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/advisory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          season: form.season,
          state: form.state,
          district: form.district,
          areaHa: Number(form.areaHa),
          soil: { n: Number(form.n), p: Number(form.p), k: Number(form.k), ph: Number(form.ph) },
          climate: {
            temperature: Number(form.temperature),
            humidity: Number(form.humidity),
            rainfall: Number(form.rainfall),
          },
          priceOverride: form.priceOverride ? Number(form.priceOverride) : undefined,
        }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      setResult(data);
      setExpanded(data.recommendations?.[0]?.slug ?? null);
      setFbDone(false);
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function copySms() {
    if (!result) return;
    const top = result.recommendations.slice(0, 3);
    const lines = [
      `Seasonal Crop Advisory — ${form.district || "your district"}, ${form.season} ${new Date().getFullYear()}`,
      ...top.map(
        (r, i) =>
          `${i + 1}. ${cropLabel(lang, r)} — score ${r.score}, yield ${r.expectedYield} qtl/ha, ${inr(r.profit)}/ha, risk ${r.riskLabel} (${Math.round(r.risk.index * 100)}/100)`
      ),
      `Zone: ${result.zone}`,
    ];
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const topForChart = result
    ? result.recommendations.slice(0, 8).map((r) => ({
        name: cropLabel(lang, r),
        score: r.score,
        color: r.color,
      }))
    : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-brand-900">{t("form_title")}</h1>
          <p className="mt-1 text-ink/60">
            Soil + weather + mandi price → ranked crops with reasons and a Season Risk Index.
          </p>
        </div>
        {result && (
          <span
            className={`pill ${result.mode === "mongodb" ? "bg-brand-100 text-brand-700" : "bg-earth-100 text-earth-700"}`}
          >
            {result.mode === "mongodb" ? `● ${t("db_mongodb")}` : `● ${t("db_memory")}`}
          </span>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Form */}
        <form onSubmit={submit} className="card h-fit p-5 lg:sticky lg:top-20">
          <div>
            <span className="label-cap">{t("form_season")}</span>
            <div className="grid grid-cols-3 gap-2">
              {(["kharif", "rabi", "zaid"] as Season[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set("season", s)}
                  className={`rounded-lg px-2 py-2.5 text-xs font-bold transition ${
                    form.season === s
                      ? "bg-brand-600 text-white"
                      : "border border-brand-200 bg-white text-brand-700 hover:bg-brand-50"
                  }`}
                >
                  {t(`season_${s}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label className="label-cap" htmlFor="state">
                {t("form_state")}
              </label>
              <input
                id="state"
                className="input-field"
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
              />
            </div>
            <div>
              <label className="label-cap" htmlFor="district">
                {t("form_district")}
              </label>
              <input
                id="district"
                className="input-field"
                value={form.district}
                onChange={(e) => set("district", e.target.value)}
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="label-cap" htmlFor="area">
              {t("form_area")}
            </label>
            <input
              id="area"
              type="number"
              step="0.1"
              min="0.1"
              className="input-field"
              value={form.areaHa}
              onChange={(e) => set("areaHa", e.target.value)}
            />
          </div>

          <p className="mt-5 border-t border-brand-100 pt-4 text-xs font-bold uppercase tracking-wider text-brand-600">
            {t("form_soil")}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <label className="label-cap" htmlFor="n">
                {t("form_n")}
              </label>
              <input
                id="n"
                type="number"
                className="input-field"
                value={form.n}
                onChange={(e) => set("n", e.target.value)}
              />
            </div>
            <div>
              <label className="label-cap" htmlFor="p">
                {t("form_p")}
              </label>
              <input
                id="p"
                type="number"
                className="input-field"
                value={form.p}
                onChange={(e) => set("p", e.target.value)}
              />
            </div>
            <div>
              <label className="label-cap" htmlFor="k">
                {t("form_k")}
              </label>
              <input
                id="k"
                type="number"
                className="input-field"
                value={form.k}
                onChange={(e) => set("k", e.target.value)}
              />
            </div>
            <div>
              <label className="label-cap" htmlFor="ph">
                {t("form_ph")}
              </label>
              <input
                id="ph"
                type="number"
                step="0.1"
                className="input-field"
                value={form.ph}
                onChange={(e) => set("ph", e.target.value)}
              />
            </div>
          </div>

          <p className="mt-5 border-t border-brand-100 pt-4 text-xs font-bold uppercase tracking-wider text-brand-600">
            {t("form_climate")}
          </p>
          <div className="mt-2 grid grid-cols-3 gap-3">
            <div>
              <label className="label-cap" htmlFor="temp">
                {t("form_temp")}
              </label>
              <input
                id="temp"
                type="number"
                className="input-field"
                value={form.temperature}
                onChange={(e) => set("temperature", e.target.value)}
              />
            </div>
            <div>
              <label className="label-cap" htmlFor="hum">
                {t("form_humidity")}
              </label>
              <input
                id="hum"
                type="number"
                className="input-field"
                value={form.humidity}
                onChange={(e) => set("humidity", e.target.value)}
              />
            </div>
            <div>
              <label className="label-cap" htmlFor="rain">
                {t("form_rain")}
              </label>
              <input
                id="rain"
                type="number"
                className="input-field"
                value={form.rainfall}
                onChange={(e) => set("rainfall", e.target.value)}
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="label-cap" htmlFor="price">
              {t("form_price")}
            </label>
            <input
              id="price"
              type="number"
              placeholder="auto from mandi series"
              className="input-field"
              value={form.priceOverride}
              onChange={(e) => set("priceOverride", e.target.value)}
            />
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary mt-5 w-full">
            {loading ? t("form_loading") : t("form_submit")}
          </button>
          <button
            type="button"
            onClick={() => setForm(defaultForm)}
            className="btn-ghost mt-2 w-full"
          >
            {t("form_reset")}
          </button>
        </form>

        {/* Results */}
        <div id="results" className="space-y-5">
          {!result && !loading && (
            <div className="card flex min-h-72 flex-col items-center justify-center p-8 text-center">
              <span className="text-4xl">🌱</span>
              <p className="mt-3 font-bold text-brand-800">No advisory yet</p>
              <p className="mt-1 max-w-sm text-sm text-ink/60">
                Enter your soil test and this season&apos;s weather on the left — we&apos;ll rank 22
                candidate crops by profit, risk and fit.
              </p>
            </div>
          )}

          {loading && (
            <div className="card flex min-h-72 items-center justify-center p-8">
              <p className="animate-pulse text-sm font-semibold text-brand-600">
                {t("form_loading")}
              </p>
            </div>
          )}

          {result && !loading && (
            <>
              <div className="card border-l-4 border-l-brand-500 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-brand-500">
                      {t("res_zone")}
                    </p>
                    <p className="text-lg font-extrabold text-brand-900">{result.zone}</p>
                    <p className="mt-1 max-w-xl text-sm text-ink/60">{result.zoneDescription}</p>
                  </div>
                  <button type="button" onClick={copySms} className="btn-ghost text-sm">
                    {copied ? `✓ ${t("res_copied")}` : `📱 ${t("res_sms")}`}
                  </button>
                </div>
              </div>

              <div className="card p-5">
                <p className="mb-2 text-sm font-bold text-brand-800">
                  Advisory score — top {Math.min(8, result.recommendations.length)} crops
                </p>
                <ScoreBarChart data={topForChart} />
              </div>

              <div className="space-y-4">
                {result.recommendations.map((r, i) => {
                  const open = expanded === r.slug;
                  const riskColor =
                    r.riskLabel === "Low"
                      ? "bg-brand-100 text-brand-700"
                      : r.riskLabel === "Moderate"
                        ? "bg-earth-100 text-earth-700"
                        : "bg-red-100 text-red-700";
                  return (
                    <article key={r.slug} className="card overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setExpanded(open ? null : r.slug)}
                        className="flex w-full items-center gap-4 p-4 text-left"
                      >
                        <span
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white"
                          style={{ background: r.color }}
                        >
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-extrabold text-brand-900">
                              {cropLabel(lang, r)}
                            </p>
                            <span className="pill bg-brand-50 text-brand-600">{r.category}</span>
                            <span className={`pill ${riskColor}`}>
                              {t(
                                r.riskLabel === "Low"
                                  ? "res_low"
                                  : r.riskLabel === "Moderate"
                                    ? "res_mod"
                                    : "res_high"
                              )}{" "}
                              risk
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-brand-100">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${r.score}%`, background: r.color }}
                            />
                          </div>
                        </div>
                        <div className="hidden text-right text-xs leading-relaxed text-ink/60 sm:block">
                          <p className="text-sm font-extrabold text-ink">{t("res_score")}: {r.score}</p>
                          <p>
                            {t("res_yield")}: {r.expectedYield} qtl/ha
                          </p>
                          <p>
                            {t("res_profit")}: <b className="text-brand-700">{inr(r.profit)}/ha</b>
                          </p>
                          <p>
                            {t("res_price")}: {inr(r.price)}/qtl
                          </p>
                        </div>
                        <span className="text-brand-400">{open ? "▾" : "▸"}</span>
                      </button>

                      {open && (
                        <div className="border-t border-brand-100 bg-brand-50/40 p-4">
                          <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-xl bg-white p-3 ring-1 ring-brand-100">
                              <p className="text-[11px] font-bold uppercase tracking-wide text-ink/50">
                                {t("res_profit")} (whole plot)
                              </p>
                              <p className="text-lg font-extrabold text-brand-700">
                                {inr(r.totalProfit)}
                              </p>
                              <p className="text-[11px] text-ink/50">
                                {inr(r.revenue)} revenue − {inr(r.cost)} cost
                              </p>
                            </div>
                            <div className="rounded-xl bg-white p-3 ring-1 ring-brand-100">
                              <p className="text-[11px] font-bold uppercase tracking-wide text-ink/50">
                                {t("res_risk")}
                              </p>
                              <p className="text-lg font-extrabold text-ink">
                                {Math.round(r.risk.index * 100)}/100
                              </p>
                              <p className="text-[11px] text-ink/50">
                                rain {Math.round(r.risk.rainfallAnomaly * 100)} · heat{" "}
                                {Math.round(r.risk.heatExtreme * 100)} · price{" "}
                                {Math.round(r.risk.priceVolatility * 100)}
                              </p>
                            </div>
                            <div className="rounded-xl bg-white p-3 ring-1 ring-brand-100">
                              <p className="text-[11px] font-bold uppercase tracking-wide text-ink/50">
                                Fit
                              </p>
                              <p className="text-lg font-extrabold text-ink">
                                {Math.round(r.soilFit * 100)}% soil
                              </p>
                              <p className="text-[11px] text-ink/50">
                                {Math.round(r.climateFit * 100)}% climate
                              </p>
                            </div>
                          </div>
                          <p className="mt-3 text-xs font-bold uppercase tracking-wider text-brand-600">
                            {t("res_why")}
                          </p>
                          <ul className="mt-1.5 space-y-1.5">
                            {r.reasons.map((why) => (
                              <li key={why} className="flex gap-2 text-sm text-ink/70">
                                <span className="text-brand-500">•</span>
                                {why}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>

              <div className="card p-5">
                {fbDone ? (
                  <p className="text-sm font-semibold text-brand-700">{t("fb_thanks")}</p>
                ) : (
                  <FeedbackForm
                    defaultCrop={result.recommendations[0]?.slug ?? "rice"}
                    onSubmit={() => setFbDone(true)}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

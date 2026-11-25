"use client";

import { useState } from "react";
import { useLang } from "@/lib/language";
import { useToast } from "./Toast";

export default function FeedbackForm({
  defaultCrop = "rice",
  onSubmit,
}: {
  defaultCrop?: string;
  onSubmit?: () => void;
}) {
  const { t } = useLang();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [district, setDistrict] = useState("");
  const [crop, setCrop] = useState(defaultCrop);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, district, crop, rating, comment }),
      });
      if (!res.ok) throw new Error("Could not save feedback");
      toast("Feedback saved — thank you for helping retrain the model.", "success");
      onSubmit?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      setError(msg);
      toast(msg, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <p className="text-sm font-bold text-brand-800">{t("res_feedback")}</p>
      <p className="mb-3 text-xs text-ink/55">{t("fb_title")} — feeds the retraining loop.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label-cap" htmlFor="fb-name">
            {t("fb_name")}
          </label>
          <input
            id="fb-name"
            className="input-field"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="label-cap" htmlFor="fb-district">
            {t("fb_district")}
          </label>
          <input
            id="fb-district"
            className="input-field"
            required
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
          />
        </div>
        <div>
          <label className="label-cap" htmlFor="fb-crop">
            {t("fb_crop")}
          </label>
          <input
            id="fb-crop"
            className="input-field"
            required
            value={crop}
            onChange={(e) => setCrop(e.target.value)}
          />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-4">
        <div>
          <span className="label-cap">{t("fb_rating")}</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className={`rounded-lg px-3 py-1.5 text-sm font-bold transition ${
                  rating === n ? "bg-brand-600 text-white" : "border border-brand-200 bg-white"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="min-w-52 flex-1">
          <label className="label-cap" htmlFor="fb-comment">
            {t("fb_comment")}
          </label>
          <input
            id="fb-comment"
            className="input-field"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? "…" : t("fb_submit")}
        </button>
      </div>
      {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
    </form>
  );
}

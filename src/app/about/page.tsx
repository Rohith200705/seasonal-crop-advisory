import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About" };

const whatWorks = [
  [
    "Trained model, not a heuristic",
    "Random Forest (200 trees) trained offline on the 2,200-row Kaggle Crop Recommendation CSV; exported to JSON and inferred in TypeScript.",
  ],
  [
    "Real preprocessing",
    "Median impute → IQR clip → 13 engineered features (NPK ratios, rain/degree, humid-rain, |pH−7|) → StandardScaler → stratified 80/20 split.",
  ],
  [
    "Six-model benchmark",
    "Decision Tree, Random Forest, Extra Trees, Gradient Boost, AdaBoost and XGBoost evaluated on the same held-out split; metrics.json stores the actual scores.",
  ],
  [
    "Profit layer from the deck",
    "Advisory score = expected yield × baseline ₹/qtl − input cost, re-weighted by a Season Risk Index (climate distance + market CV + model uncertainty).",
  ],
  [
    "K-Means zones",
    "k = 5 clusters fit on temperature, humidity, pH, rainfall, N, P, K from the training set; nearest-centre classification assigns each advisory.",
  ],
  [
    "Explainable picks",
    "Per-crop reasons cite model probability, distance from the crop's learned class mean, and the economics used in scoring.",
  ],
];

const notBuilt = [
  "Live Agmarknet/DMI mandi prices — profit uses static baseline ₹/qtl from crop profiles.",
  "NASA POWER / IMD weather APIs — climate inputs come from the advisory form.",
  "SHAP TreeExplainer at request time — feature importance is permutation-based, computed once at train time.",
  "Automatic retraining from farmer feedback — feedback is stored in Mongo but does not yet re-fit the model.",
  "SMS delivery — UI only.",
];

const references = [
  'A. Ingle, "Crop Recommendation Dataset," Kaggle, 2020 — 2,200 samples, 22 crops.',
  'Chen & Guestrin, "XGBoost," ACM SIGKDD 2016.',
  'Lundberg & Lee, "SHAP," NeurIPS 2017.',
  'Pedregosa et al., "Scikit-learn: ML in Python," JMLR 2011.',
  "Economic Survey of India 2024-25, Ministry of Finance.",
  "Agriculture Census 2015-16, MoSPI — small & marginal holdings.",
];

const pipeline = [
  ["Collect", "Crop_recommendation.csv (2,200 × 8)"],
  ["Preprocess", "impute → IQR → engineer → scale → 80/20"],
  ["Explore", "describe, Pearson, rainfall var-ratio, K-Means"],
  ["Train", "6 sklearn/xgboost classifiers, seed 42"],
  ["Export", "RF trees → model.json + scaler + metrics"],
  ["Serve", "TS forest walk in /api/advisory"],
  ["Score", "yield × price − cost × risk re-weight"],
  ["Explain", "class-mean distance + probability reasons"],
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <span className="pill bg-brand-100 text-brand-700">IT in Agriculture · U24CSP56</span>
      <h1 className="mt-3 text-3xl font-extrabold text-brand-900">About the build</h1>
      <p className="mt-2 text-ink/70">
        <b>Seasonal Crop Advisory</b> runs a real supervised pipeline end-to-end: train offline in
        Python, ship the forest as JSON, infer in the Next.js API, then apply the PPT&apos;s profit
        and risk layer on top of model probabilities.
      </p>

      <section className="mt-8">
        <h2 className="text-xl font-extrabold text-brand-800">What is actually implemented</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {whatWorks.map(([h, b]) => (
            <div key={h} className="card p-4">
              <p className="text-sm font-bold text-brand-700">{h}</p>
              <p className="mt-1 text-sm text-ink/65">{b}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-extrabold text-brand-800">Training pipeline</h2>
        <ol className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {pipeline.map(([h, b], i) => (
            <li key={h} className="card p-4">
              <span className="pill bg-brand-100 text-brand-700">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="mt-2 text-sm font-bold text-brand-800">{h}</p>
              <p className="mt-1 text-xs text-ink/60">{b}</p>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-[11px] text-ink/45">
          Reproduce with <code className="rounded bg-brand-50 px-1">python scripts/train.py</code>{" "}
          → writes <code className="rounded bg-brand-50 px-1">src/lib/model/*.json</code>.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-extrabold text-brand-800">Not yet built (honest list)</h2>
        <ul className="mt-3 space-y-2">
          {notBuilt.map((l) => (
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

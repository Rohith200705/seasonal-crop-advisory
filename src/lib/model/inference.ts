import modelJson from "./model.json";
import scalerJson from "./scaler.json";
import metricsJson from "./metrics.json";

type Leaf = { leaf: true; p: number[] };
type Internal = { leaf: false; f: number; t: number; l: TreeNode; r: TreeNode };
type TreeNode = Leaf | Internal;

type ForestModel = {
  meta: {
    type: string;
    classes: string[];
    features: string[];
    n_trees: number;
    exported_as: string;
  };
  trees: TreeNode[];
};

type ScalerDoc = {
  features: string[];
  mean: number[];
  scale: number[];
  iqrBounds: Record<string, { lo: number; hi: number }>;
};

type Metrics = typeof metricsJson;

const model = modelJson as unknown as ForestModel;
const scaler = scalerJson as unknown as ScalerDoc;
const metrics = metricsJson as unknown as Metrics;

export const MODEL_META = {
  exportedModel: metrics.exportedModel,
  exportedAccuracy: metrics.exportedAccuracy,
  bestModel: metrics.bestModel,
  bestAccuracy: metrics.bestAccuracy,
  modelAccuracy: metrics.modelAccuracy,
  featureImportance: metrics.featureImportance,
  rainfallByCrop: metrics.rainfallByCrop,
  rainfallVarRatio: metrics.rainfallVarRatio,
  macroF1: metrics.macroF1,
  dataset: metrics.dataset,
  generatedAt: metrics.generatedAt,
  zones: metrics.zones,
  describe: metrics.describe,
  correlation: metrics.correlation,
  classMeans: metrics.classMeans,
};

function engineer(raw: Record<string, number>): number[] {
  const N = raw.N;
  const P = raw.P;
  const K = raw.K;
  const temperature = raw.temperature;
  const humidity = raw.humidity;
  const ph = raw.ph;
  const rainfall = raw.rainfall;
  const npk = N + P + K;
  return [
    N,
    P,
    K,
    temperature,
    humidity,
    ph,
    rainfall,
    N / (P + K + 1e-6),
    N / (npk + 1e-6),
    K / (npk + 1e-6),
    rainfall / (temperature + 1e-6),
    (humidity * rainfall) / 100.0,
    Math.abs(ph - 7.0),
  ];
}

function scale(features: number[]): number[] {
  const { mean, scale: sc, iqrBounds } = scaler;
  const featureNames = scaler.features;
  return features.map((v, i) => {
    const name = featureNames[i];
    const bounds = iqrBounds[name];
    let x = v;
    if (bounds) {
      x = Math.min(bounds.hi, Math.max(bounds.lo, x));
    }
    return (x - mean[i]) / (sc[i] || 1);
  });
}

/** Engineer + IQR-clip + StandardScaler → named scaled features (for class-mean distance). */
export function engineerScaled(raw: Record<string, number>): Record<string, number> {
  const features = engineer(raw);
  const scaled = scale(features);
  const out: Record<string, number> = {};
  scaler.features.forEach((name, i) => {
    out[name] = scaled[i];
  });
  return out;
}

function walk(node: TreeNode, x: number[]): number[] {
  let cur: TreeNode = node;
  while (!cur.leaf) {
    cur = x[cur.f] <= cur.t ? cur.l : cur.r;
  }
  return cur.p;
}

/** Predict class probabilities for one engineered+scaled row. */
export function predictProba(raw: Record<string, number>): {
  classes: string[];
  proba: number[];
} {
  const x = scale(engineer(raw));
  const nClasses = model.meta.classes.length;
  const acc = new Array<number>(nClasses).fill(0);
  for (const tree of model.trees) {
    const p = walk(tree, x);
    for (let i = 0; i < nClasses; i++) acc[i] += p[i];
  }
  const n = model.trees.length || 1;
  const proba = acc.map((v) => v / n);
  return { classes: model.meta.classes, proba };
}

/** Top-k crops with probabilities, sorted desc. */
export function predictTop(
  raw: Record<string, number>,
  k = 5
): { slug: string; prob: number }[] {
  const { classes, proba } = predictProba(raw);
  return classes
    .map((slug, i) => ({ slug, prob: proba[i] }))
    .sort((a, b) => b.prob - a.prob)
    .slice(0, k);
}

export function getMetrics(): Metrics {
  return metrics;
}

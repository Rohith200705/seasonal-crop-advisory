import type {
  AdvisoryInput,
  AdvisoryResult,
  Crop,
  Recommendation,
  RiskBreakdown,
  Season,
} from "./types";
import { CROPS } from "./data/crops";
import { MODEL_META, engineerScaled, predictProba } from "./model/inference";
import { classifyZone } from "./zones";

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
}

function riskLabel(index: number): "Low" | "Moderate" | "High" {
  if (index < 0.3) return "Low";
  if (index < 0.55) return "Moderate";
  return "High";
}

function eligibleCrops(season: Season): Crop[] {
  return CROPS.filter((c) => c.seasons.includes(season));
}

/** z-score distance of input from the crop's training-set class mean (scaled features). */
function classDistance(
  slug: string,
  scaled: Record<string, number>,
  features: string[]
): number {
  const means = (
    MODEL_META.classMeans as Record<string, Record<string, number> | undefined>
  )[slug];
  if (!means) return 1;
  const dists = features.map((f) => Math.abs((scaled[f] ?? 0) - (means[f] ?? 0)));
  return Math.min(1, mean(dists) / 2.5);
}

function scaleInput(input: AdvisoryInput): Record<string, number> {
  return engineerScaled({
    N: input.soil.n,
    P: input.soil.p,
    K: input.soil.k,
    temperature: input.climate.temperature,
    humidity: input.climate.humidity,
    ph: input.soil.ph,
    rainfall: input.climate.rainfall,
  });
}

function scoreCrop(
  crop: Crop,
  input: AdvisoryInput,
  areaHa: number,
  modelProb: number,
  scaled: Record<string, number>
) {
  const price =
    input.priceOverride && input.priceOverride > 0
      ? input.priceOverride
      : crop.pricePerQtl;

  // Expected yield scaled by model confidence (how well plot matches crop's training cluster)
  const confidence = Math.max(0.05, modelProb);
  const expectedYield = crop.yieldPerHa * (0.55 + 0.45 * confidence);

  const revenue = expectedYield * price;
  const cost = crop.inputCostPerHa;
  const profit = revenue - cost;
  const totalProfit = profit * areaHa;

  const features = MODEL_META.dataset.features_engineered;
  const dist = classDistance(crop.slug, scaled, features);

  // Season Risk Index: climate distance from crop's learned profile + market assumption
  // (crop.volatility is a static baseline assumption, not a synthetic price series)
  const rainfallAnomaly = Math.min(1, dist * 1.15);
  const heatExtreme = Math.min(1, dist * 0.7);
  const marketRisk = Math.min(1, crop.volatility / 0.35);
  const modelUncertainty = 1 - confidence;

  const risk: RiskBreakdown = {
    rainfallAnomaly: Math.round(rainfallAnomaly * 100) / 100,
    heatExtreme: Math.round(heatExtreme * 100) / 100,
    priceVolatility: Math.round(marketRisk * 100) / 100,
    index: 0,
  };
  risk.index =
    Math.round(
      (rainfallAnomaly * 0.3 +
        heatExtreme * 0.2 +
        marketRisk * 0.2 +
        modelUncertainty * 0.3) *
        100
    ) / 100;

  const reasons: string[] = [];

  reasons.push(
    `Trained Random Forest assigns ${crop.name} a ${(confidence * 100).toFixed(1)}% match for this soil and climate (held-out accuracy ${MODEL_META.exportedAccuracy}%).`
  );

  if (dist < 0.45) {
    reasons.push(
      `Plot conditions sit close to ${crop.name}'s learned profile in the 2,200-row training set.`
    );
  } else if (dist < 0.9) {
    reasons.push(
      `Moderate deviation from ${crop.name}'s typical N/P/K and climate envelope — still viable with management.`
    );
  } else {
    reasons.push(
      `Conditions differ substantially from ${crop.name}'s training cluster — treat as a stretch option.`
    );
  }

  const npkSum = input.soil.n + input.soil.p + input.soil.k;
  if (npkSum > 0) {
    const nShare = input.soil.n / npkSum;
    reasons.push(
      `N:P:K (${input.soil.n}:${input.soil.p}:${input.soil.k}) → N share ${Math.round(nShare * 100)}%, pH ${input.soil.ph}, rainfall ${input.climate.rainfall} mm.`
    );
  }

  reasons.push(
    `Baseline economics: ${Math.round(expectedYield)} qtl/ha × ₹${price}/qtl − ₹${cost.toLocaleString("en-IN")} inputs ≈ ₹${Math.round(profit).toLocaleString("en-IN")}/ha (static reference price, not a live mandi quote).`
  );

  if (risk.index >= 0.55) {
    reasons.push(
      `Season Risk Index ${Math.round(risk.index * 100)}/100 — driven mainly by distance from the learned profile and model uncertainty.`
    );
  } else {
    reasons.push(
      `Season Risk Index ${Math.round(risk.index * 100)}/100 — climate and model confidence look stable.`
    );
  }

  const gestation = crop.gestationYears ?? 1;
  if (gestation > 1) {
    reasons.push(
      `Long-term ${crop.name} orchard — profit is annualised over a ~${gestation}-year bearing wait.`
    );
  }

  const gestationPenalty = 1 + 0.5 * (gestation - 1);
  // PPT profit layer with sqrt damping: yield × price − cost (risk-reweighted),
  // fused with model probability so a 5% match cannot beat a 60% match on profit alone.
  const profitTerm = Math.sqrt(Math.max(profit, 0));
  const adjusted =
    (profitTerm * (1 - 0.65 * risk.index) * confidence) / gestationPenalty;

  return {
    crop,
    modelProb: confidence,
    expectedYield,
    price,
    revenue,
    cost,
    profit,
    totalProfit,
    risk,
    adjusted,
    reasons,
  };
}

export function runAdvisory(input: AdvisoryInput): AdvisoryResult {
  const areaHa = input.areaHa > 0 ? input.areaHa : 1;
  const raw = {
    N: input.soil.n,
    P: input.soil.p,
    K: input.soil.k,
    temperature: input.climate.temperature,
    humidity: input.climate.humidity,
    ph: input.soil.ph,
    rainfall: input.climate.rainfall,
  };
  const { classes, proba } = predictProba(raw);
  const probBySlug = new Map(classes.map((c, i) => [c, proba[i]]));
  const scaled = scaleInput(input);

  const seasonCrops = eligibleCrops(input.season);
  const scored = seasonCrops.map((c) =>
    scoreCrop(c, input, areaHa, probBySlug.get(c.slug) ?? 0, scaled)
  );

  // Step 1 (ML): season crops the forest supports.
  // Step 2 (PPT profit layer): rank by sqrt(yield×price−cost) × risk × model fit.
  const maxProb = Math.max(...scored.map((s) => s.modelProb), 0);
  const floor = Math.max(0.08, maxProb * 0.4);
  let kept = scored.filter((s) => s.modelProb >= floor);
  if (kept.length < 3) {
    const pad = scored
      .filter((s) => s.modelProb >= 0.04 && !kept.some((k) => k.crop.slug === s.crop.slug))
      .sort((a, b) => b.modelProb - a.modelProb);
    kept = [...kept, ...pad].slice(0, Math.min(5, scored.length));
  }

  const maxAdjusted = Math.max(...kept.map((s) => s.adjusted), 1);

  const recommendations: Recommendation[] = kept
    .map((s) => ({
      slug: s.crop.slug,
      name: s.crop.name,
      hindiName: s.crop.hindiName,
      tamilName: s.crop.tamilName,
      category: s.crop.category,
      color: s.crop.color,
      seasons: s.crop.seasons,
      score: Math.max(1, Math.round((s.adjusted / maxAdjusted) * 100)),
      expectedYield: Math.round(s.expectedYield * 10) / 10,
      price: s.price,
      revenue: Math.round(s.revenue),
      cost: Math.round(s.cost),
      profit: Math.round(s.profit),
      totalProfit: Math.round(s.totalProfit),
      soilFit: Math.round(s.modelProb * 100) / 100,
      climateFit: Math.round(s.modelProb * 100) / 100,
      risk: s.risk,
      riskLabel: riskLabel(s.risk.index),
      reasons: s.reasons,
    }))
    .sort((a, b) => b.score - a.score);

  const zone = classifyZone(input);

  return {
    zone: zone.name,
    zoneDescription: zone.description,
    recommendations,
    generatedAt: new Date().toISOString(),
  };
}

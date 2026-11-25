import type {
  AdvisoryInput,
  AdvisoryResult,
  Crop,
  Recommendation,
  RiskBreakdown,
  Season,
} from "./types";
import { CROPS } from "./data/crops";
import { currentPrice, priceStats } from "./data/prices";
import { classifyZone } from "./zones";

function rangeFit(value: number, r: { min: number; max: number; ideal: number }): number {
  if (value >= r.min && value <= r.max) {
    const span = r.max - r.min || 1;
    const dist = Math.abs(value - r.ideal) / span;
    return Math.max(0.7, 1 - dist * 0.6);
  }
  const span = r.max - r.min || 1;
  const dist = value < r.min ? r.min - value : value - r.max;
  return Math.max(0, 1 - dist / (span * 0.6));
}

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

function scoreCrop(crop: Crop, input: AdvisoryInput, areaHa: number) {
  const { soil, climate } = input;

  const fitN = rangeFit(soil.n, crop.n);
  const fitP = rangeFit(soil.p, crop.p);
  const fitK = rangeFit(soil.k, crop.k);
  const fitPh = rangeFit(soil.ph, crop.ph);
  const soilFit = mean([fitN, fitP, fitK, fitPh]);

  const fitT = rangeFit(climate.temperature, crop.temperature);
  const fitH = rangeFit(climate.humidity, crop.humidity);
  const fitR = rangeFit(climate.rainfall, crop.rainfall);
  const climateFit = mean([fitT, fitH, fitR]);

  const expectedYield = crop.yieldPerHa * (0.6 + 0.4 * soilFit) * (0.55 + 0.45 * climateFit);

  const stats = priceStats(crop);
  const price =
    input.priceOverride && input.priceOverride > 0 ? input.priceOverride : currentPrice(crop);

  const revenue = expectedYield * price;
  const cost = crop.inputCostPerHa;
  const profit = revenue - cost;
  const totalProfit = profit * areaHa;

  const rainfallAnomaly = 1 - fitR;
  const heatExtreme = 1 - fitT;
  const priceVolatility = Math.min(1, stats.volatility / 0.35);

  const risk: RiskBreakdown = {
    rainfallAnomaly: Math.round(rainfallAnomaly * 100) / 100,
    heatExtreme: Math.round(heatExtreme * 100) / 100,
    priceVolatility: Math.round(priceVolatility * 100) / 100,
    index: 0,
  };
  risk.index =
    Math.round((rainfallAnomaly * 0.4 + heatExtreme * 0.25 + priceVolatility * 0.35) * 100) / 100;

  const reasons: string[] = [];

  if (climateFit >= 0.8) {
    reasons.push(
      `Rainfall ${climate.rainfall} mm, ${climate.temperature}°C and ${climate.humidity}% humidity sit inside ${crop.name}'s ideal envelope.`
    );
  } else if (fitR < 0.5) {
    reasons.push(
      `Rainfall ${climate.rainfall} mm is far from ${crop.name}'s preferred ${crop.rainfall.min}–${crop.rainfall.max} mm — irrigation may be needed.`
    );
  } else if (fitT < 0.5) {
    reasons.push(
      `Temperature ${climate.temperature}°C is outside ${crop.name}'s comfortable ${crop.temperature.min}–${crop.temperature.max}°C band.`
    );
  } else {
    reasons.push(`Climate match is moderate (${Math.round(climateFit * 100)}%) for ${crop.name}.`);
  }

  const npkBalance = Math.min(fitN, Math.min(fitP, fitK));
  if (npkBalance >= 0.85) {
    reasons.push(
      `Soil N:P:K (${soil.n}:${soil.p}:${soil.k}) closely matches ${crop.name}'s nutrient demand (pH ${crop.ph.min}–${crop.ph.max}).`
    );
  } else if (fitPh < 0.6) {
    reasons.push(
      `Soil pH ${soil.ph} is marginal for ${crop.name} (needs ${crop.ph.min}–${crop.ph.max}).`
    );
  } else {
    const weak =
      fitN <= fitP && fitN <= fitK
        ? `nitrogen (${soil.n})`
        : fitP <= fitK
          ? `phosphorus (${soil.p})`
          : `potassium (${soil.k})`;
    reasons.push(`Soil ${weak} level is the weakest match for ${crop.name}'s demand.`);
  }

  if (stats.trendPct >= 3) {
    reasons.push(
      `Mandi price trending up — ₹${stats.current}/qtl, +${stats.trendPct}% over 4 months.`
    );
  } else if (stats.trendPct <= -3) {
    reasons.push(
      `Mandi price softening — ₹${stats.current}/qtl, ${stats.trendPct}% over 4 months; sell in the early window.`
    );
  } else {
    reasons.push(
      `Mandi price stable around ₹${stats.current}/qtl (4-month range ₹${stats.min}–${stats.max}).`
    );
  }

  if (risk.index >= 0.55) {
    const driver =
      rainfallAnomaly >= heatExtreme && rainfallAnomaly >= priceVolatility
        ? "rainfall deviation"
        : priceVolatility >= heatExtreme
          ? "price volatility"
          : "heat stress";
    reasons.push(`Elevated Season Risk Index (${Math.round(risk.index * 100)}/100) driven by ${driver}.`);
  } else {
    reasons.push(`Season Risk Index is ${Math.round(risk.index * 100)}/100 — low climate and market risk.`);
  }

  const gestation = crop.gestationYears ?? 1;
  if (gestation > 1) {
    reasons.push(
      `Long-term ${crop.name} orchard — profit is annualised over a ~${gestation}-year bearing wait.`
    );
  }

  const gestationPenalty = 1 + 0.5 * (gestation - 1);
  const fitMultiplier = (0.6 + 0.4 * soilFit) * (0.6 + 0.4 * climateFit);
  const adjusted = (profit * (1 - 0.65 * risk.index) * fitMultiplier) / gestationPenalty;

  return {
    crop,
    expectedYield,
    price,
    revenue,
    cost,
    profit,
    totalProfit,
    soilFit,
    climateFit,
    risk,
    adjusted,
    reasons,
  };
}

export function runAdvisory(input: AdvisoryInput): AdvisoryResult {
  const areaHa = input.areaHa > 0 ? input.areaHa : 1;
  const all = eligibleCrops(input.season).map((c) => scoreCrop(c, input, areaHa));

  // Agronomic gate: a crop must broadly fit this season's climate, however
  // profitable it looks. Fall back to the best-fitting crops if nothing passes.
  let kept = all.filter((s) => s.climateFit >= 0.6);
  if (kept.length < 3) {
    kept = [...all]
      .sort((a, b) => b.climateFit - a.climateFit)
      .slice(0, Math.min(6, all.length));
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
      soilFit: Math.round(s.soilFit * 100) / 100,
      climateFit: Math.round(s.climateFit * 100) / 100,
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

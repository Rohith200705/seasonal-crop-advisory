import type { Crop, MandiPoint } from "../types";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const SERIES_DAYS = 120;
const cache = new Map<string, MandiPoint[]>();

export function priceSeries(crop: Crop): MandiPoint[] {
  const cached = cache.get(crop.slug);
  if (cached) return cached;

  const rand = mulberry32(hashString(crop.slug));
  const points: MandiPoint[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const base = crop.pricePerQtl;
  const dailyVol = crop.volatility / Math.sqrt(20);
  const trend = (rand() - 0.5) * 0.0016;
  let price = base * (0.92 + rand() * 0.12);

  for (let i = SERIES_DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const seasonal = Math.sin((i / SERIES_DAYS) * Math.PI * 2 + rand() * 0.05) * crop.volatility * 0.35;
    const shock = rand() < 0.03 ? (rand() - 0.45) * crop.volatility * 1.8 : 0;
    const noise = (rand() - 0.5) * 2 * dailyVol;
    price = price * (1 + trend + noise) + base * shock * 0.1;
    const target = base * (1 + seasonal);
    price = price * 0.85 + target * 0.15;
    const clamped = Math.max(base * 0.45, Math.min(base * 1.9, price));
    points.push({
      date: d.toISOString().slice(0, 10),
      price: Math.round(clamped),
    });
  }

  cache.set(crop.slug, points);
  return points;
}

export function currentPrice(crop: Crop): number {
  const s = priceSeries(crop);
  return s[s.length - 1].price;
}

export function priceStats(crop: Crop) {
  const s = priceSeries(crop);
  const prices = s.map((p) => p.price);
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.reduce((a, b) => a + (b - mean) ** 2, 0) / prices.length;
  const std = Math.sqrt(variance);
  const cv = mean > 0 ? std / mean : 0;
  const first = prices[0];
  const last = prices[prices.length - 1];
  const trendPct = first > 0 ? ((last - first) / first) * 100 : 0;
  return {
    mean: Math.round(mean),
    min: Math.min(...prices),
    max: Math.max(...prices),
    current: last,
    volatility: cv,
    trendPct: Math.round(trendPct * 10) / 10,
    series: s,
  };
}

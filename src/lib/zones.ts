import type { AdvisoryInput } from "./types";
import { MODEL_META } from "./model/inference";

export type Zone = {
  id: string;
  name: string;
  hindiName: string;
  description: string;
  temperature: { min: number; max: number };
  rainfall: { min: number; max: number };
  ph: { min: number; max: number };
  color: string;
};

const HINDI: Record<string, string> = {
  "Humid High-Rain Zone": "अधिक वर्षा आर्द्र क्षेत्र",
  "Warm Sub-Humid Zone": "उष्ण उप-आर्द्र क्षेत्र",
  "Temperate Balanced Zone": "समशीतोष्ण संतुलित क्षेत्र",
  "Semi-Arid Warm Zone": "अर्ध-शुष्क उष्ण क्षेत्र",
  "Cool Drier Zone": "शीतल शुष्क क्षेत्र",
};

/** Zones from K-Means k=5 on the real 2,200-row training set (zones.json). */
export const ZONES: Zone[] = MODEL_META.zones.zones.map((z) => {
  const c = z.center;
  return {
    id: z.id,
    name: z.name,
    hindiName: HINDI[z.name] ?? z.name,
    description: z.description,
    temperature: { min: Math.round(c.temperature - 6), max: Math.round(c.temperature + 6) },
    rainfall: { min: Math.max(10, Math.round(c.rainfall * 0.55)), max: Math.round(c.rainfall * 1.45) },
    ph: { min: Math.round((c.ph - 0.8) * 10) / 10, max: Math.round((c.ph + 0.8) * 10) / 10 },
    color: z.color,
  };
});

/** Nearest K-Means centre on temperature / humidity / ph / rainfall (z-scored vs dataset stats). */
export function classifyZone(input: AdvisoryInput): Zone {
  const zones = MODEL_META.zones.zones;
  const desc = MODEL_META.describe;
  const t = input.climate.temperature;
  const h = input.climate.humidity;
  const ph = input.soil.ph;
  const r = input.climate.rainfall;

  const dims: ("temperature" | "humidity" | "ph" | "rainfall")[] = [
    "temperature",
    "humidity",
    "ph",
    "rainfall",
  ];
  const query = [t, h, ph, r];
  const means = dims.map((d) => desc[d]?.mean ?? 0);
  const stds = dims.map((d) => desc[d]?.std ?? 1);
  const qz = query.map((v, i) => (v - means[i]) / (stds[i] || 1));

  let bestIdx = 0;
  let bestDist = Infinity;
  for (let zi = 0; zi < zones.length; zi++) {
    const center = zones[zi].center;
    const cz = dims.map((d, i) => (center[d] - means[i]) / (stds[i] || 1));
    let dist = 0;
    for (let i = 0; i < 4; i++) dist += (qz[i] - cz[i]) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = zi;
    }
  }

  const z = ZONES[bestIdx] ?? ZONES[0];
  return z;
}

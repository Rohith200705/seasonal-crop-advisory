import type { AdvisoryInput } from "./types";

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

export const ZONES: Zone[] = [
  {
    id: "western-dry",
    name: "Western Dry Zone",
    hindiName: "पश्चिमी शुष्क क्षेत्र",
    description: "Hot arid tract of Rajasthan and rain-shadow Maharashtra — low rain, alkaline soils.",
    temperature: { min: 26, max: 42 },
    rainfall: { min: 20, max: 90 },
    ph: { min: 7.0, max: 8.6 },
    color: "#f59e0b",
  },
  {
    id: "central-plateau",
    name: "Semi-Arid Central Plateau",
    hindiName: "अर्ध-शुष्क मध्य पठार",
    description: "Deccan trap country — moderate heat, variable monsoon, slightly acidic to neutral soils.",
    temperature: { min: 20, max: 34 },
    rainfall: { min: 55, max: 130 },
    ph: { min: 5.8, max: 7.6 },
    color: "#d97706",
  },
  {
    id: "gangetic-plain",
    name: "Indo-Gangetic Plain",
    hindiName: "गंगा का मैदान",
    description: "Deep alluvial soils of the north — balanced rainfall, fertile pH, India's breadbasket.",
    temperature: { min: 14, max: 32 },
    rainfall: { min: 50, max: 140 },
    ph: { min: 6.0, max: 8.0 },
    color: "#65a30d",
  },
  {
    id: "humid-east-coast",
    name: "Humid Coastal & Eastern Zone",
    hindiName: "आर्द्र तटीय और पूर्वी क्षेत्र",
    description: "High-humidity belt of Odisha, Bengal, Konkan and the southern coast — heavy rain.",
    temperature: { min: 22, max: 36 },
    rainfall: { min: 100, max: 280 },
    ph: { min: 5.2, max: 7.2 },
    color: "#0891b2",
  },
  {
    id: "temperate-hills",
    name: "Temperate Hill & Highland",
    hindiName: "समशीतोष्ण पहाड़ी क्षेत्र",
    description: "Himalayan and NE hill belts — cooler temperatures, orchard-friendly soils.",
    temperature: { min: 5, max: 24 },
    rainfall: { min: 55, max: 160 },
    ph: { min: 5.2, max: 7.0 },
    color: "#7c3aed",
  },
];

function overlap(value: number, range: { min: number; max: number }, tolerance = 0.35): number {
  const span = range.max - range.min || 1;
  if (value >= range.min && value <= range.max) return 1;
  const dist = value < range.min ? range.min - value : value - range.max;
  return Math.max(0, 1 - dist / (span * tolerance));
}

function centerDist(value: number, range: { min: number; max: number }): number {
  const span = range.max - range.min || 1;
  const center = (range.min + range.max) / 2;
  return Math.min(1, Math.abs(value - center) / span);
}

export function classifyZone(input: AdvisoryInput): Zone {
  const t = input.climate.temperature;
  const r = input.climate.rainfall;
  const ph = input.soil.ph;

  let best = ZONES[0];
  let bestScore = -Infinity;

  for (const z of ZONES) {
    const fit =
      overlap(t, z.temperature) * 0.45 +
      overlap(r, z.rainfall) * 0.35 +
      overlap(ph, z.ph) * 0.2;
    // Prefer the zone whose typical conditions sit closest to the plot's inputs
    const centrePenalty =
      0.08 *
      (centerDist(t, z.temperature) * 0.45 +
        centerDist(r, z.rainfall) * 0.35 +
        centerDist(ph, z.ph) * 0.2);
    const score = fit - centrePenalty;
    if (score > bestScore) {
      bestScore = score;
      best = z;
    }
  }
  return best;
}

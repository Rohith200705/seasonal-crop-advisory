import { connection } from "next/server";
import { getFeedback, getLogs, getMode } from "@/lib/db";

export const MODEL_ACCURACY = [
  { model: "XGBoost", accuracy: 99.6 },
  { model: "AdaBoost", accuracy: 99.55 },
  { model: "Extra Trees", accuracy: 99.4 },
  { model: "Random Forest", accuracy: 99.32 },
  { model: "Decision Tree", accuracy: 98.64 },
  { model: "Gradient Boost", accuracy: 98.18 },
];

export const RAINFALL_BY_CROP = [
  { crop: "Rice", rainfall: 236 },
  { crop: "Jute", rainfall: 175 },
  { crop: "Coffee", rainfall: 158 },
  { crop: "Maize", rainfall: 84 },
  { crop: "Cotton", rainfall: 80 },
  { crop: "Chickpea", rainfall: 80 },
  { crop: "Lentil", rainfall: 46 },
];

export async function GET() {
  await connection();
  const [mode, logs, feedback] = await Promise.all([getMode(), getLogs(), getFeedback()]);

  const zoneCounts: Record<string, number> = {};
  const cropCounts: Record<string, number> = {};
  for (const l of logs) {
    zoneCounts[l.zone] = (zoneCounts[l.zone] ?? 0) + 1;
    if (l.topCrop) cropCounts[l.topCrop] = (cropCounts[l.topCrop] ?? 0) + 1;
  }

  const topCrops = Object.entries(cropCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([slug, count]) => ({ slug, count }));

  const avgRating =
    feedback.length > 0
      ? Math.round((feedback.reduce((a, f) => a + f.rating, 0) / feedback.length) * 10) / 10
      : 0;

  return Response.json({
    mode,
    modelAccuracy: MODEL_ACCURACY,
    rainfallByCrop: RAINFALL_BY_CROP,
    totals: {
      queries: logs.length,
      feedback: feedback.length,
      avgRating,
      crops: 22,
      zones: 5,
      models: 6,
    },
    zoneCounts: Object.entries(zoneCounts).map(([zone, count]) => ({ zone, count })),
    topCrops,
    recent: logs.slice(0, 8).map((l) => ({
      topCrop: l.topCrop,
      score: l.score,
      zone: l.zone,
      season: l.input.season,
      createdAt: l.createdAt,
    })),
  });
}

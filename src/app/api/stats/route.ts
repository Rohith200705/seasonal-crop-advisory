import { connection } from "next/server";
import { getFeedback, getLogs, getMode } from "@/lib/db";
import { MODEL_META } from "@/lib/model/inference";

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
    modelAccuracy: MODEL_META.modelAccuracy,
    rainfallByCrop: MODEL_META.rainfallByCrop.slice(0, 7),
    featureImportance: MODEL_META.featureImportance,
    exportedModel: MODEL_META.exportedModel,
    exportedAccuracy: MODEL_META.exportedAccuracy,
    bestModel: MODEL_META.bestModel,
    bestAccuracy: MODEL_META.bestAccuracy,
    macroF1: MODEL_META.macroF1,
    dataset: MODEL_META.dataset,
    zonesMeta: {
      k: MODEL_META.zones.k,
      silhouette: MODEL_META.zones.silhouette,
      zones: MODEL_META.zones.zones,
    },
    totals: {
      queries: logs.length,
      feedback: feedback.length,
      avgRating,
      crops: MODEL_META.dataset.classes.length,
      zones: MODEL_META.zones.k,
      models: MODEL_META.modelAccuracy.length,
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

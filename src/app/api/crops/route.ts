import { connection } from "next/server";
import { getCrops, getMode, getPriceStatsSnapshot } from "@/lib/db";
import { priceStats } from "@/lib/data/prices";

export async function GET() {
  await connection();
  const [mode, crops, agg] = await Promise.all([getMode(), getCrops(), getPriceStatsSnapshot()]);

  const bySlug = new Map((agg ?? []).map((s) => [s.slug, s]));

  const items = crops.map((c) => {
    const stats = priceStats(c);
    const a = bySlug.get(c.slug);
    return {
      slug: c.slug,
      name: c.name,
      hindiName: c.hindiName,
      tamilName: c.tamilName,
      category: c.category,
      seasons: c.seasons,
      color: c.color,
      waterNeed: c.waterNeed,
      description: c.description,
      yieldPerHa: c.yieldPerHa,
      inputCostPerHa: c.inputCostPerHa,
      rainfall: c.rainfall,
      temperature: c.temperature,
      ph: c.ph,
      price: a?.current ?? stats.current,
      priceMean: a?.mean ?? stats.mean,
      priceMin: a?.min ?? stats.min,
      priceMax: a?.max ?? stats.max,
      volatility: a?.volatility ?? stats.volatility,
      trendPct: a?.trendPct ?? stats.trendPct,
    };
  });

  return Response.json({ mode, crops: items });
}

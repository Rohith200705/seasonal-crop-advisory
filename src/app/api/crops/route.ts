import { connection } from "next/server";
import { getCrops, getMode } from "@/lib/db";
import { getMandiPricesWithTimeout } from "@/lib/mandi";

export async function GET() {
  await connection();
  const [mode, crops] = await Promise.all([getMode(), getCrops()]);

  const snaps = await getMandiPricesWithTimeout(
    crops.map((c) => ({ slug: c.slug, baseline: c.pricePerQtl })),
    20000,
    4
  );

  const items = crops.map((c) => {
    const snap = snaps[c.slug];
    const prices = snap?.series.map((p) => p.price) ?? [];
    const mean =
      prices.length > 0
        ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
        : c.pricePerQtl;
    const first = prices[0];
    const last = prices[prices.length - 1];
    const trendPct =
      first && first > 0 && last != null
        ? Math.round(((last - first) / first) * 1000) / 10
        : 0;

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
      price: snap?.price ?? c.pricePerQtl,
      priceMean: mean,
      priceMin: snap?.min ?? c.pricePerQtl,
      priceMax: snap?.max ?? c.pricePerQtl,
      priceSource: snap?.source ?? "baseline",
      priceAsOf: snap?.asOf,
      volatility: snap?.volatility ?? c.volatility,
      trendPct,
    };
  });

  const liveCount = items.filter((i) => i.priceSource === "live").length;

  return Response.json({
    mode,
    crops: items,
    liveCount,
    note: "Live mandi modal when available; otherwise static baseline.",
  });
}

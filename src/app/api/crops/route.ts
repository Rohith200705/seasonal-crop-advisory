import { connection } from "next/server";
import { getCrops, getMode } from "@/lib/db";

export async function GET() {
  await connection();
  const [mode, crops] = await Promise.all([getMode(), getCrops()]);

  const items = crops.map((c) => ({
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
    price: c.pricePerQtl,
    priceMean: c.pricePerQtl,
    priceMin: c.pricePerQtl,
    priceMax: c.pricePerQtl,
    volatility: c.volatility,
    trendPct: 0,
  }));

  return Response.json({ mode, crops: items, note: "Baseline reference prices." });
}

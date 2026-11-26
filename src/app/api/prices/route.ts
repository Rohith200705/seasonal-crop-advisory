import { CROPS } from "@/lib/data/crops";

/**
 * Static baseline reference prices from crop profiles.
 * No synthetic series — live Agmarknet/DMI integration is future work.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("crop");

  if (slug) {
    const crop = CROPS.find((c) => c.slug === slug);
    if (!crop) return Response.json({ error: "Unknown crop" }, { status: 404 });
    return Response.json({
      crop: {
        slug: crop.slug,
        name: crop.name,
        color: crop.color,
        base: crop.pricePerQtl,
      },
      stats: {
        mean: crop.pricePerQtl,
        min: crop.pricePerQtl,
        max: crop.pricePerQtl,
        current: crop.pricePerQtl,
        volatility: crop.volatility,
        trendPct: 0,
      },
      series: [],
      note: "Static baseline reference price — not a live mandi quote.",
    });
  }

  const all = CROPS.map((c) => ({
    slug: c.slug,
    name: c.name,
    hindiName: c.hindiName,
    tamilName: c.tamilName,
    color: c.color,
    current: c.pricePerQtl,
    mean: c.pricePerQtl,
    min: c.pricePerQtl,
    max: c.pricePerQtl,
    volatility: c.volatility,
    trendPct: 0,
    series: [] as { date: string; price: number }[],
  }));

  return Response.json({
    crops: all,
    note: "Static baseline reference prices — not live mandi data.",
  });
}

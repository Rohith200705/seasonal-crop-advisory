import { CROPS } from "@/lib/data/crops";
import { priceSeries, priceStats } from "@/lib/data/prices";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("crop");

  if (slug) {
    const crop = CROPS.find((c) => c.slug === slug);
    if (!crop) return Response.json({ error: "Unknown crop" }, { status: 404 });
    const stats = priceStats(crop);
    return Response.json({
      crop: { slug: crop.slug, name: crop.name, color: crop.color, base: crop.pricePerQtl },
      stats: {
        mean: stats.mean,
        min: stats.min,
        max: stats.max,
        current: stats.current,
        volatility: Math.round(stats.volatility * 1000) / 1000,
        trendPct: stats.trendPct,
      },
      series: stats.series,
    });
  }

  const all = CROPS.map((c) => {
    const s = priceStats(c);
    return {
      slug: c.slug,
      name: c.name,
      hindiName: c.hindiName,
      tamilName: c.tamilName,
      color: c.color,
      current: s.current,
      mean: s.mean,
      min: s.min,
      max: s.max,
      volatility: Math.round(s.volatility * 1000) / 1000,
      trendPct: s.trendPct,
      series: priceSeries(c).slice(-30),
    };
  });

  return Response.json({ crops: all });
}

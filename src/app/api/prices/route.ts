import { CROPS } from "@/lib/data/crops";
import { getMandiPrice, getMandiPricesWithTimeout } from "@/lib/mandi";

function trendPct(series: { price: number }[]): number {
  if (series.length < 2) return 0;
  const first = series[0].price;
  const last = series[series.length - 1].price;
  if (first <= 0) return 0;
  return Math.round(((last - first) / first) * 1000) / 10;
}

/**
 * Mandi prices from https://mandi-api.onrender.com/v1 (Agmarknet history).
 * Falls back to static baseline when the live API has no row for a crop.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("crop");

  if (slug) {
    const crop = CROPS.find((c) => c.slug === slug);
    if (!crop) return Response.json({ error: "Unknown crop" }, { status: 404 });

    const snap = await getMandiPrice(crop.slug, crop.pricePerQtl);
    const prices = snap.series.map((p) => p.price);
    const mean =
      prices.length > 0
        ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
        : crop.pricePerQtl;

    return Response.json({
      crop: {
        slug: crop.slug,
        name: crop.name,
        color: crop.color,
        base: crop.pricePerQtl,
      },
      source: snap.source,
      meta: {
        commodity: snap.commodity,
        state: snap.state,
        asOf: snap.asOf,
        note: snap.note,
      },
      stats: {
        mean,
        min: snap.min ?? crop.pricePerQtl,
        max: snap.max ?? crop.pricePerQtl,
        current: snap.price,
        volatility: snap.volatility ?? crop.volatility,
        trendPct: trendPct(snap.series),
      },
      series: snap.series,
    });
  }

  const snaps = await getMandiPricesWithTimeout(
    CROPS.map((c) => ({ slug: c.slug, baseline: c.pricePerQtl })),
    20000,
    4
  );

  const all = CROPS.map((c) => {
    const snap = snaps[c.slug];
    const prices = snap?.series.map((p) => p.price) ?? [];
    const mean =
      prices.length > 0
        ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
        : c.pricePerQtl;
    return {
      slug: c.slug,
      name: c.name,
      hindiName: c.hindiName,
      tamilName: c.tamilName,
      color: c.color,
      current: snap?.price ?? c.pricePerQtl,
      mean,
      min: snap?.min ?? c.pricePerQtl,
      max: snap?.max ?? c.pricePerQtl,
      volatility: snap?.volatility ?? c.volatility,
      trendPct: trendPct(snap?.series ?? []),
      source: snap?.source ?? "baseline",
      asOf: snap?.asOf,
      commodity: snap?.commodity,
      state: snap?.state,
      series: snap?.series ?? [],
    };
  });

  const liveCount = all.filter((r) => r.source === "live").length;

  return Response.json({
    crops: all,
    liveCount,
    total: all.length,
    note: "Live modal prices from mandi-api.onrender.com; baseline ₹/qtl when unavailable.",
  });
}

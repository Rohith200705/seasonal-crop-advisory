import type { Crop } from "../types";

/**
 * Static baseline reference prices (₹/qtl) and market-risk assumptions.
 * These are fixed economic assumptions used in the profit layer — NOT live
 * mandi quotes and NOT a synthetic time series.
 */
export type PriceBaseline = {
  slug: string;
  pricePerQtl: number;
  volatility: number;
};

export function priceBaseline(crop: Crop): PriceBaseline {
  return {
    slug: crop.slug,
    pricePerQtl: crop.pricePerQtl,
    volatility: crop.volatility,
  };
}

/** Baseline price only — engine may override via input.priceOverride. */
export function baselinePrice(crop: Crop): number {
  return crop.pricePerQtl;
}

import type { NextRequest } from "next/server";
import { runAdvisory } from "@/lib/engine";
import { getMode, saveLog } from "@/lib/db";
import type { AdvisoryInput, Season } from "@/lib/types";

const SEASONS: Season[] = ["kharif", "rabi", "zaid"];

function num(v: unknown, fallback: number): number {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : fallback;
}

export async function POST(request: NextRequest) {
  let body: Partial<AdvisoryInput>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const season = SEASONS.includes(body.season as Season)
    ? (body.season as Season)
    : "kharif";

  const input: AdvisoryInput = {
    season,
    state: typeof body.state === "string" ? body.state : undefined,
    district: typeof body.district === "string" ? body.district : undefined,
    areaHa: num(body.areaHa, 1),
    soil: {
      n: num(body.soil?.n, 60),
      p: num(body.soil?.p, 50),
      k: num(body.soil?.k, 50),
      ph: num(body.soil?.ph, 6.5),
    },
    climate: {
      temperature: num(body.climate?.temperature, 27),
      humidity: num(body.climate?.humidity, 65),
      rainfall: num(body.climate?.rainfall, 100),
    },
    priceOverride: body.priceOverride ? num(body.priceOverride, 0) : undefined,
  };

  if (
    input.soil.ph < 3 ||
    input.soil.ph > 10 ||
    input.climate.temperature < -10 ||
    input.climate.temperature > 55 ||
    input.climate.rainfall < 0 ||
    input.climate.humidity < 0 ||
    input.climate.humidity > 100
  ) {
    return Response.json({ error: "Values out of plausible range" }, { status: 422 });
  }

  const result = runAdvisory(input);
  const top = result.recommendations[0];

  try {
    await saveLog({
      input,
      topCrop: top?.slug ?? "",
      score: top?.score ?? 0,
      zone: result.zone,
    });
  } catch {
    /* logging must never break the advisory */
  }

  const mode = await getMode();
  return Response.json({ ...result, mode });
}

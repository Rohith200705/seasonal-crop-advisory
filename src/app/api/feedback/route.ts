import { connection } from "next/server";
import { getFeedback, getMode, saveFeedback } from "@/lib/db";

export async function GET() {
  await connection();
  const [mode, feedback] = await Promise.all([getMode(), getFeedback()]);
  return Response.json({ mode, feedback });
}

export async function POST(request: Request) {
  let body: {
    name?: string;
    district?: string;
    crop?: string;
    rating?: number;
    comment?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const district = (body.district ?? "").trim();
  const crop = (body.crop ?? "").trim();
  const rating = Number(body.rating);
  const comment = (body.comment ?? "").trim().slice(0, 1000);

  if (!name || !district || !crop || !Number.isFinite(rating) || rating < 1 || rating > 5) {
    return Response.json({ error: "name, district, crop and rating (1-5) are required" }, { status: 422 });
  }

  await saveFeedback({ name, district, crop, rating, comment });
  return Response.json({ ok: true });
}

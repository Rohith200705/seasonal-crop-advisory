/**
 * Live mandi client for https://mandi-api.onrender.com/v1
 * Agmarknet-style modal prices with caching and baseline fallback.
 * Never throws — callers always get a usable price.
 */

const BASE = (
  process.env.MANDI_API_BASE || "https://mandi-api.onrender.com/v1"
).replace(/\/$/, "");

const DEFAULT_STATE = process.env.MANDI_STATE || "Maharashtra";
const HISTORY_TTL_MS = 15 * 60 * 1000;
const MISS_TTL_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 10_000;

/** crop slug → commodity name candidates (first hit in a state wins). */
const COMMODITY_NAMES: Record<string, string[]> = {
  rice: ["Rice"],
  maize: ["Maize"],
  cotton: ["Cotton"],
  banana: ["Banana"],
  mango: ["Mango"],
  grapes: ["Grapes"],
  apple: ["Apple"],
  orange: ["Orange"],
  papaya: ["Papaya"],
  coconut: ["Coconut"],
  pomegranate: ["Pomegranate"],
  watermelon: ["Water Melon", "Watermelon"],
  jute: ["Jute"],
  coffee: ["Coffee"],
  chickpea: ["Chana", "Chickpea", "Gram"],
  lentil: ["Masoor", "Lentil", "Masur"],
  kidneybeans: ["Rajma", "Kidney Beans"],
  pigeonpeas: ["Arhar", "Tur", "Red Gram", "Pigeon Pea"],
  mothbeans: ["Moth", "Moth Beans"],
  mungbean: ["Moong", "Green Gram"],
  blackgram: ["Urad", "Black Gram"],
  muskmelon: ["Muskmelon", "Kharbooza", "Sweet Melon"],
};

/** Fallback states only used if DEFAULT_STATE has no rows (rate-limit friendly). */
const FALLBACK_STATES = ["Madhya Pradesh", "Uttar Pradesh", "Karnataka"];

export type MandiPoint = {
  date: string;
  price: number;
};

export type MandiSnapshot = {
  source: "live" | "baseline";
  slug: string;
  price: number;
  min?: number;
  max?: number;
  /** Coefficient of variation from live series, when available */
  volatility?: number;
  commodity?: string;
  state?: string;
  asOf?: string;
  series: MandiPoint[];
  note?: string;
};

type HistoryEntry = {
  arrival_date: string;
  avg_modal_price: number;
  avg_min_price: number;
  avg_max_price: number;
  data_points: number;
};

type CacheEntry =
  | { kind: "hit"; at: number; snapshot: MandiSnapshot }
  | { kind: "miss"; at: number };

type MandiGlobal = {
  __mandiCache?: Map<string, CacheEntry>;
  __mandiInflight?: Map<string, Promise<MandiSnapshot | null>>;
};

const g = globalThis as MandiGlobal;

function cache(): Map<string, CacheEntry> {
  if (!g.__mandiCache) g.__mandiCache = new Map();
  return g.__mandiCache;
}

function inflight(): Map<string, Promise<MandiSnapshot | null>> {
  if (!g.__mandiInflight) g.__mandiInflight = new Map();
  return g.__mandiInflight;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function fetchHistory(
  commodity: string,
  state: string
): Promise<HistoryEntry[] | null> {
  const url = `${BASE}/prices/history?state=${encodeURIComponent(state)}&commodity=${encodeURIComponent(commodity)}`;
  const body = await fetchJson<{ success?: boolean; data?: HistoryEntry[] }>(url);
  if (!body?.data?.length) return null;
  return body.data;
}

function cv(prices: number[]): number | undefined {
  if (prices.length < 8) return undefined;
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  if (mean <= 0) return undefined;
  const variance =
    prices.reduce((a, b) => a + (b - mean) ** 2, 0) / prices.length;
  return Math.round((Math.sqrt(variance) / mean) * 1000) / 1000;
}

function buildSnapshot(
  slug: string,
  commodity: string,
  state: string,
  rows: HistoryEntry[]
): MandiSnapshot {
  const series: MandiPoint[] = rows
    .map((r) => ({
      date: r.arrival_date,
      price: Math.round(r.avg_modal_price),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const prices = series.map((p) => p.price);
  const last = rows[rows.length - 1];
  return {
    source: "live",
    slug,
    price: prices[prices.length - 1],
    min: Math.min(...prices),
    max: Math.max(...prices),
    volatility: cv(prices),
    commodity,
    state,
    asOf: last.arrival_date,
    series: series.slice(-90),
  };
}

async function loadLive(slug: string): Promise<MandiSnapshot | null> {
  const names = COMMODITY_NAMES[slug];
  if (!names?.length) return null;

  // Pass 1: every name in the default state only (minimizes rate-limit pressure)
  for (const name of names) {
    const rows = await fetchHistory(name, DEFAULT_STATE);
    if (rows?.length) return buildSnapshot(slug, name, DEFAULT_STATE, rows);
  }

  // Pass 2: primary name across a couple of fallback states
  for (const state of FALLBACK_STATES) {
    const rows = await fetchHistory(names[0], state);
    if (rows?.length) return buildSnapshot(slug, names[0], state, rows);
  }
  return null;
}

/** Live modal ₹/qtl for a crop, or null. Cached; concurrent callers share one request. */
export async function fetchMandiSnapshot(slug: string): Promise<MandiSnapshot | null> {
  const c = cache();
  const cached = c.get(slug);
  const now = Date.now();
  if (cached?.kind === "hit" && now - cached.at < HISTORY_TTL_MS) {
    return cached.snapshot;
  }
  if (cached?.kind === "miss" && now - cached.at < MISS_TTL_MS) {
    return null;
  }

  const pending = inflight().get(slug);
  if (pending) return pending;

  const job = (async () => {
    try {
      const snap = await loadLive(slug);
      if (snap) {
        c.set(slug, { kind: "hit", at: Date.now(), snapshot: snap });
        return snap;
      }
      c.set(slug, { kind: "miss", at: Date.now() });
      return null;
    } finally {
      inflight().delete(slug);
    }
  })();

  inflight().set(slug, job);
  return job;
}

/** Snapshot with baseline fallback — always usable for the profit layer. */
export async function getMandiPrice(
  slug: string,
  baseline: number
): Promise<MandiSnapshot> {
  const live = await fetchMandiSnapshot(slug);
  if (live) return live;
  return {
    source: "baseline",
    slug,
    price: baseline,
    series: [],
    note: "No live mandi row for this crop — using static baseline reference price.",
  };
}

/** Batch with small concurrency to respect the API rate limit. */
export async function getMandiPrices(
  entries: { slug: string; baseline: number }[],
  concurrency = 3
): Promise<Record<string, MandiSnapshot>> {
  const out: Record<string, MandiSnapshot> = {};
  let i = 0;
  async function worker() {
    while (i < entries.length) {
      const idx = i++;
      const e = entries[idx];
      out[e.slug] = await getMandiPrice(e.slug, e.baseline);
    }
  }
  const n = Math.max(1, Math.min(concurrency, entries.length));
  await Promise.all(Array.from({ length: n }, () => worker()));
  return out;
}

/** Race a mandi batch against a deadline so the advisory never hangs. */
export async function getMandiPricesWithTimeout(
  entries: { slug: string; baseline: number }[],
  timeoutMs = 8000,
  concurrency = 3
): Promise<Record<string, MandiSnapshot>> {
  const fallback: Record<string, MandiSnapshot> = {};
  for (const e of entries) {
    fallback[e.slug] = {
      source: "baseline",
      slug: e.slug,
      price: e.baseline,
      series: [],
      note: "Mandi fetch timed out — baseline used.",
    };
  }
  try {
    return await Promise.race([
      getMandiPrices(entries, concurrency),
      new Promise<Record<string, MandiSnapshot>>((resolve) =>
        setTimeout(() => resolve(fallback), timeoutMs)
      ),
    ]);
  } catch {
    return fallback;
  }
}

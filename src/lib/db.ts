import mongoose from "mongoose";
import { CROPS } from "./data/crops";
import { AdvisoryLogModel, CropModel, FeedbackModel } from "./models";
import type { AdvisoryLogDoc, Crop, FeedbackDoc } from "./types";

export type StoreMode = "mongodb" | "memory";

type MemoryState = {
  crops: Crop[];
  logs: AdvisoryLogDoc[];
  feedback: FeedbackDoc[];
};

const g = globalThis as unknown as {
  __scaConn?: Promise<StoreMode>;
  __scaMode?: StoreMode;
  __scaMem?: MemoryState;
};

function memoryState(): MemoryState {
  if (!g.__scaMem) {
    g.__scaMem = {
      crops: [...CROPS],
      logs: [],
      feedback: [],
    };
  }
  return g.__scaMem;
}

async function seedMongo() {
  const cropCount = await CropModel.countDocuments();
  if (cropCount === 0) {
    await CropModel.insertMany(CROPS);
  }
  const feedbackCount = await FeedbackModel.countDocuments();
  if (feedbackCount === 0) {
    await FeedbackModel.insertMany([]);
  }
}

async function tryConnect(): Promise<StoreMode> {
  if (g.__scaMode) return g.__scaMode;
  const uri =
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL ||
    "mongodb://127.0.0.1:27017/seasonal-crop-advisory";
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 1500, connectTimeoutMS: 1500 });
    await seedMongo();
    g.__scaMode = "mongodb";
  } catch {
    try {
      await mongoose.disconnect();
    } catch {
      /* ignore */
    }
    g.__scaMode = "memory";
  }
  return g.__scaMode;
}

export async function getMode(): Promise<StoreMode> {
  if (!g.__scaConn) {
    g.__scaConn = tryConnect();
  }
  return g.__scaConn;
}

export async function getCrops(): Promise<Crop[]> {
  const mode = await getMode();
  if (mode === "mongodb") {
    const docs = await CropModel.find().lean();
    return docs as unknown as Crop[];
  }
  return memoryState().crops;
}

export async function saveLog(entry: {
  input: AdvisoryLogDoc["input"];
  topCrop: string;
  score: number;
  zone: string;
}): Promise<void> {
  const mode = await getMode();
  if (mode === "mongodb") {
    await AdvisoryLogModel.create(entry);
    return;
  }
  memoryState().logs.unshift({ ...entry, createdAt: new Date().toISOString() });
  if (memoryState().logs.length > 200) memoryState().logs.pop();
}

export async function getLogs(): Promise<AdvisoryLogDoc[]> {
  const mode = await getMode();
  if (mode === "mongodb") {
    const docs = await AdvisoryLogModel.find().sort({ createdAt: -1 }).limit(50).lean();
    return docs.map((d) => ({
      _id: String(d._id),
      input: d.input as AdvisoryLogDoc["input"],
      topCrop: d.topCrop ?? "",
      score: d.score ?? 0,
      zone: d.zone ?? "",
      createdAt: new Date(d.createdAt as string).toISOString(),
    }));
  }
  return memoryState().logs;
}

export async function saveFeedback(entry: {
  name: string;
  district: string;
  crop: string;
  rating: number;
  comment: string;
}): Promise<void> {
  const mode = await getMode();
  if (mode === "mongodb") {
    await FeedbackModel.create(entry);
    return;
  }
  memoryState().feedback.unshift({ ...entry, createdAt: new Date().toISOString() });
}

export async function getFeedback(): Promise<FeedbackDoc[]> {
  const mode = await getMode();
  if (mode === "mongodb") {
    const docs = await FeedbackModel.find().sort({ createdAt: -1 }).limit(30).lean();
    return docs.map((d) => ({
      _id: String(d._id),
      name: d.name,
      district: d.district,
      crop: d.crop,
      rating: d.rating,
      comment: d.comment ?? "",
      createdAt: new Date(d.createdAt as string).toISOString(),
    }));
  }
  return memoryState().feedback;
}

import mongoose from "mongoose";

const { Schema, models, model } = mongoose;

const RangeSchema = new Schema(
  { min: Number, max: Number, ideal: Number },
  { _id: false }
);

const CropSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: String,
    hindiName: String,
    tamilName: String,
    category: String,
    seasons: [String],
    n: RangeSchema,
    p: RangeSchema,
    k: RangeSchema,
    ph: RangeSchema,
    temperature: RangeSchema,
    humidity: RangeSchema,
    rainfall: RangeSchema,
    yieldPerHa: Number,
    pricePerQtl: Number,
    inputCostPerHa: Number,
    volatility: Number,
    waterNeed: String,
    color: String,
    description: String,
  },
  { timestamps: true }
);

const AdvisoryLogSchema = new Schema(
  {
    input: { type: Schema.Types.Mixed, required: true },
    topCrop: String,
    score: Number,
    zone: String,
  },
  { timestamps: true }
);

const FeedbackSchema = new Schema(
  {
    name: { type: String, required: true },
    district: { type: String, required: true },
    crop: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, maxlength: 1000 },
  },
  { timestamps: true }
);

export const CropModel = models.Crop || model("Crop", CropSchema);
export const AdvisoryLogModel = models.AdvisoryLog || model("AdvisoryLog", AdvisoryLogSchema);
export const FeedbackModel = models.Feedback || model("Feedback", FeedbackSchema);

export type Season = "kharif" | "rabi" | "zaid";

export type Range = {
  min: number;
  max: number;
  ideal: number;
};

export type Crop = {
  slug: string;
  name: string;
  hindiName: string;
  tamilName: string;
  category: string;
  seasons: Season[];
  n: Range;
  p: Range;
  k: Range;
  ph: Range;
  temperature: Range;
  humidity: Range;
  rainfall: Range;
  yieldPerHa: number;
  pricePerQtl: number;
  inputCostPerHa: number;
  gestationYears?: number;
  volatility: number;
  waterNeed: "low" | "medium" | "high";
  color: string;
  description: string;
};

export type MandiPoint = {
  date: string;
  price: number;
};

export type AdvisoryInput = {
  season: Season;
  state?: string;
  district?: string;
  areaHa: number;
  soil: { n: number; p: number; k: number; ph: number };
  climate: { temperature: number; humidity: number; rainfall: number };
  priceOverride?: number;
};

export type RiskBreakdown = {
  rainfallAnomaly: number;
  heatExtreme: number;
  priceVolatility: number;
  index: number;
};

export type Recommendation = {
  slug: string;
  name: string;
  hindiName: string;
  tamilName: string;
  category: string;
  color: string;
  seasons: Season[];
  score: number;
  expectedYield: number;
  price: number;
  revenue: number;
  cost: number;
  profit: number;
  totalProfit: number;
  soilFit: number;
  climateFit: number;
  risk: RiskBreakdown;
  riskLabel: "Low" | "Moderate" | "High";
  reasons: string[];
};

export type AdvisoryResult = {
  zone: string;
  zoneDescription: string;
  recommendations: Recommendation[];
  generatedAt: string;
};

export type FeedbackDoc = {
  _id?: string;
  name: string;
  district: string;
  crop: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type AdvisoryLogDoc = {
  _id?: string;
  input: AdvisoryInput;
  topCrop: string;
  score: number;
  zone: string;
  createdAt: string;
};

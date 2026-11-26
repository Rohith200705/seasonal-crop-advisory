"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const AXIS = { stroke: "#5b6f5f", fontSize: 11 };
const GRID = "#e7eee4";

export function AccuracyChart({ data }: { data: { model: string; accuracy: number }[] }) {
  const values = data.map((d) => d.accuracy);
  const min = values.length ? Math.min(...values) : 0;
  const domainMin = Math.max(0, Math.floor(min) - 2);
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="model" tick={AXIS} tickLine={false} axisLine={false} interval={0} angle={-18} textAnchor="end" height={54} />
        <YAxis domain={[domainMin, 100]} tick={AXIS} tickLine={false} axisLine={false} unit="%" />
        <Tooltip
          formatter={(v) => [`${v}%`, "Accuracy"]}
          contentStyle={{ borderRadius: 10, border: "1px solid #e9efe6", fontSize: 12 }}
        />
        <Bar dataKey="accuracy" fill="#38904c" radius={[6, 6, 0, 0]} maxBarSize={44} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RainfallChart({ data }: { data: { crop: string; rainfall: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="crop" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} unit="mm" />
        <Tooltip
          formatter={(v) => [`${v} mm`, "Avg rainfall"]}
          contentStyle={{ borderRadius: 10, border: "1px solid #e9efe6", fontSize: 12 }}
        />
        <Bar dataKey="rainfall" fill="#0891b2" radius={[6, 6, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PriceLineChart({
  data,
  color = "#2a733c",
  name = "Price",
  unit = "₹/qtl",
}: {
  data: { date: string; price: number }[];
  color?: string;
  name?: string;
  unit?: string;
}) {
  const slim = data.filter((_, i) => i % 3 === 0 || i === data.length - 1);
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={slim} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis
          dataKey="date"
          tick={AXIS}
          tickLine={false}
          axisLine={false}
          tickFormatter={(d: string) => d.slice(5)}
          minTickGap={28}
        />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
        <Tooltip
          formatter={(v) => [`₹${v}`, name]}
          labelFormatter={(l) => `Date ${l}`}
          contentStyle={{ borderRadius: 10, border: "1px solid #e9efe6", fontSize: 12 }}
        />
        <Line
          type="monotone"
          dataKey="price"
          stroke={color}
          strokeWidth={2.5}
          dot={false}
          name={`${name} (${unit})`}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ScoreBarChart({
  data,
}: {
  data: { name: string; score: number; color?: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 24, bottom: 4 }}>
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="name" tick={AXIS} tickLine={false} axisLine={false} width={92} />
        <Tooltip
          formatter={(v) => [`${v}`, "Score"]}
          contentStyle={{ borderRadius: 10, border: "1px solid #e9efe6", fontSize: 12 }}
        />
        <Bar dataKey="score" radius={[0, 6, 6, 0]} maxBarSize={22}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color ?? "#38904c"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function VolatilityChart({
  data,
}: {
  data: { name: string; volatility: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="name" tick={AXIS} tickLine={false} axisLine={false} interval={0} angle={-30} textAnchor="end" height={64} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}`} />
        <Tooltip
          formatter={(v) => [`${v}`, "CV (σ/μ)"]}
          contentStyle={{ borderRadius: 10, border: "1px solid #e9efe6", fontSize: 12 }}
        />
        <Bar dataKey="volatility" fill="#b08a4f" radius={[6, 6, 0, 0]} maxBarSize={34} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </BarChart>
    </ResponsiveContainer>
  );
}

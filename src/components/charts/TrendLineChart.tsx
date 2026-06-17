import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

interface DataPoint {
  month: string;
  emission: number;
  lastYearEmission?: number;
}

interface TrendLineChartProps {
  data: DataPoint[];
  height?: number;
  showLastYear?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-forest-100 rounded-xl p-4 shadow-card">
        <p className="font-medium text-slate-850 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value.toFixed(2)} 吨CO₂e
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function TrendLineChart({
  data,
  height = 300,
  showLastYear = true,
}: TrendLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorEmission" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#52b788" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#52b788" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorLastYear" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#d4a373" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#d4a373" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#daede3" vertical={false} />
        <XAxis
          dataKey="month"
          stroke="#85c0a3"
          tick={{ fill: "#1b4332", fontSize: 12 }}
          axisLine={{ stroke: "#b6dac7" }}
          tickLine={false}
        />
        <YAxis
          stroke="#85c0a3"
          tick={{ fill: "#1b4332", fontSize: 12 }}
          axisLine={{ stroke: "#b6dac7" }}
          tickLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: "16px" }}
          iconType="circle"
          formatter={(value) => <span className="text-sm text-slate-850">{value}</span>}
        />
        <Area
          type="monotone"
          dataKey="emission"
          name="本年度排放"
          stroke="#1b4332"
          strokeWidth={3}
          fill="url(#colorEmission)"
          dot={{ fill: "#1b4332", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: "#2d6a4f" }}
        />
        {showLastYear && (
          <Area
            type="monotone"
            dataKey="lastYearEmission"
            name="去年同期"
            stroke="#d4a373"
            strokeWidth={2}
            strokeDasharray="5 5"
            fill="url(#colorLastYear)"
            dot={{ fill: "#d4a373", strokeWidth: 2, r: 3 }}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}

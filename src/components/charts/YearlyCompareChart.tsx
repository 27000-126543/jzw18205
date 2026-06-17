import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  year: string;
  totalEmission: number;
  netEmission: number;
  offset: number;
}

interface YearlyCompareChartProps {
  data: DataPoint[];
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-forest-100 rounded-xl p-4 shadow-card">
        <p className="font-medium text-slate-850 mb-2">{label}年</p>
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

export default function YearlyCompareChart({ data, height = 320 }: YearlyCompareChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#daede3" vertical={false} />
        <XAxis
          dataKey="year"
          stroke="#85c0a3"
          tick={{ fill: "#1b4332", fontSize: 13, fontWeight: 500 }}
          axisLine={{ stroke: "#b6dac7" }}
          tickLine={false}
        />
        <YAxis
          stroke="#85c0a3"
          tick={{ fill: "#1b4332", fontSize: 12 }}
          axisLine={{ stroke: "#b6dac7" }}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f0f7f4" }} />
        <Legend
          wrapperStyle={{ paddingTop: "16px" }}
          iconType="circle"
          formatter={(value) => <span className="text-sm text-slate-850">{value}</span>}
        />
        <Bar
          dataKey="totalEmission"
          name="总排放量"
          fill="#1b4332"
          radius={[4, 4, 0, 0]}
          barSize={28}
        />
        <Bar
          dataKey="offset"
          name="减排抵消量"
          fill="#52b788"
          radius={[4, 4, 0, 0]}
          barSize={28}
        />
        <Bar
          dataKey="netEmission"
          name="净排放量"
          fill="#d4a373"
          radius={[4, 4, 0, 0]}
          barSize={28}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

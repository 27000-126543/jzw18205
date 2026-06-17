import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface DataPoint {
  name: string;
  value: number;
  percentage?: number;
}

interface DepartmentBarChartProps {
  data: DataPoint[];
  height?: number;
  horizontal?: boolean;
}

const COLORS = ["#1b4332", "#2d6a4f", "#52b788", "#85c0a3", "#40916c", "#95d5b2"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-forest-100 rounded-xl p-4 shadow-card">
        <p className="font-medium text-slate-850 mb-1">{label || payload[0].payload.name}</p>
        <p className="text-sm text-forest-600">
          {payload[0].value.toFixed(2)} 吨CO₂e
        </p>
        {payload[0].payload.percentage !== undefined && (
          <p className="text-sm text-amber-600">
            占比: {payload[0].payload.percentage.toFixed(1)}%
          </p>
        )}
      </div>
    );
  }
  return null;
};

export default function DepartmentBarChart({
  data,
  height = 300,
  horizontal = false,
}: DepartmentBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ top: 10, right: 10, left: horizontal ? 80 : 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#daede3" horizontal={!horizontal} vertical={horizontal} />
        <XAxis
          type={horizontal ? "number" : "category"}
          dataKey={horizontal ? undefined : "name"}
          stroke="#85c0a3"
          tick={{ fill: "#1b4332", fontSize: 11 }}
          axisLine={{ stroke: "#b6dac7" }}
          tickLine={false}
          angle={!horizontal && data.length > 5 ? -20 : 0}
          textAnchor={!horizontal && data.length > 5 ? "end" : "middle"}
          height={!horizontal && data.length > 5 ? 50 : undefined}
        />
        <YAxis
          type={horizontal ? "category" : "number"}
          dataKey={horizontal ? "name" : undefined}
          stroke="#85c0a3"
          tick={{ fill: "#1b4332", fontSize: 11 }}
          axisLine={{ stroke: "#b6dac7" }}
          tickLine={false}
          width={horizontal ? 80 : undefined}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f0f7f4" }} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

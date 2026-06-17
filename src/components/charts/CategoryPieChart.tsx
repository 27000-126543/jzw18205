import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  name: string;
  value: number;
  percentage?: number;
}

interface CategoryPieChartProps {
  data: DataPoint[];
  height?: number;
  title?: string;
}

const COLORS = ["#1b4332", "#2d6a4f", "#52b788", "#85c0a3", "#d4a373", "#e9bc87"];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-forest-100 rounded-xl p-4 shadow-card">
        <p className="font-medium text-slate-850 mb-1">{data.name}</p>
        <p className="text-sm text-forest-600">{data.value.toFixed(2)} 吨CO₂e</p>
        {data.percentage !== undefined && (
          <p className="text-sm text-amber-600">占比: {data.percentage.toFixed(1)}%</p>
        )}
      </div>
    );
  }
  return null;
};

const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function CategoryPieChart({ data, height = 300 }: CategoryPieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
          label={renderCustomLabel}
          labelLine={false}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          formatter={(value, entry: any) => (
            <span className="text-sm text-slate-850">
              {value}
              <span className="text-forest-500 ml-1">
                ({entry.payload.percentage?.toFixed(1)}%)
              </span>
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

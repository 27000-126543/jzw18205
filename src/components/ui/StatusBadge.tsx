import React from "react";

interface StatusBadgeProps {
  status: string;
  type?: "status" | "type" | "framework";
}

const statusColors: Record<string, string> = {
  planning: "bg-amber-100 text-amber-700 border-amber-200",
  in_progress: "bg-forest-100 text-forest-700 border-forest-200",
  completed: "bg-forest-600 text-white border-forest-600",
  draft: "bg-slate-100 text-slate-600 border-slate-200",
  finalized: "bg-forest-100 text-forest-700 border-forest-200",
  exported: "bg-forest-600 text-white border-forest-600",
};

const typeColors: Record<string, string> = {
  green_energy: "bg-forest-50 text-forest-700 border-forest-200",
  afforestation: "bg-emerald-50 text-emerald-700 border-emerald-200",
  carbon_credit: "bg-blue-50 text-blue-700 border-blue-200",
  energy_efficiency: "bg-amber-50 text-amber-700 border-amber-200",
  other: "bg-slate-100 text-slate-600 border-slate-200",
  quarterly: "bg-forest-50 text-forest-700 border-forest-200",
  annual: "bg-forest-600 text-white border-forest-600",
};

const frameworkColors: Record<string, string> = {
  gri: "bg-indigo-50 text-indigo-700 border-indigo-200",
  cdp: "bg-purple-50 text-purple-700 border-purple-200",
};

export default function StatusBadge({ status, type = "status" }: StatusBadgeProps) {
  let colors = statusColors[status];
  if (type === "type") colors = typeColors[status] || colors;
  if (type === "framework") colors = frameworkColors[status] || colors;

  const labels: Record<string, string> = {
    planning: "规划中",
    in_progress: "进行中",
    completed: "已完成",
    draft: "草稿",
    finalized: "已定稿",
    exported: "已导出",
    green_energy: "购买绿电",
    afforestation: "植树造林",
    carbon_credit: "碳汇购买",
    energy_efficiency: "节能改造",
    other: "其他",
    quarterly: "季度报告",
    annual: "年度报告",
    gri: "GRI",
    cdp: "CDP",
  };

  return (
    <span className={`badge border ${colors || "bg-slate-100 text-slate-600 border-slate-200"}`}>
      {labels[status] || status}
    </span>
  );
}

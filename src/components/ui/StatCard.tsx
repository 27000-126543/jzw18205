import React from "react";
import { ArrowDownRight, ArrowUpRight, LucideIcon } from "lucide-react";
import { formatTrend } from "@/utils/format";

interface StatCardProps {
  title: string;
  value: string;
  unit?: string;
  trend?: number;
  trendGood?: boolean;
  icon?: LucideIcon;
  gradient?: string;
  delay?: number;
}

export default function StatCard({
  title,
  value,
  unit,
  trend,
  trendGood,
  icon: Icon,
  gradient = "from-forest-600 to-forest-500",
  delay = 0,
}: StatCardProps) {
  const trendInfo = trend !== undefined ? formatTrend(trend) : null;
  const isGood = trendGood !== undefined ? trendGood : trendInfo?.isGood;

  return (
    <div
      className="card p-6 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms`, opacity: 0 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-forest-600 font-medium">{title}</p>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-display font-bold text-slate-850">{value}</span>
            {unit && <span className="text-sm text-forest-500 font-medium">{unit}</span>}
          </div>
          {trendInfo && (
            <div
              className={`mt-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                isGood ? "bg-forest-50 text-forest-700" : "bg-amber-50 text-amber-700"
              }`}
            >
              {isGood ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
              <span>{trendInfo.text}</span>
              <span className="opacity-70">同比</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}

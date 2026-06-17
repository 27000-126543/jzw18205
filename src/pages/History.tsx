import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, BarChart3, ArrowRight } from "lucide-react";
import { useCarbonStore } from "@/store";
import {
  filterRecordsByPeriod,
  calculateTotalEmission,
  calculateOffsetByPeriod,
  calculateNetEmission,
  calculateYoYChange,
} from "@/utils/calculator";
import { formatEmission, formatPercentage } from "@/utils/format";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import YearlyCompareChart from "@/components/charts/YearlyCompareChart";

export default function History() {
  const { emissionRecords, reductionMeasures, annualTargets } = useCarbonStore();
  const years = ["2023", "2024", "2025"];

  const yearlyData = useMemo(() => {
    return years.map((year) => {
      const records = filterRecordsByPeriod(emissionRecords, year);
      const total = calculateTotalEmission(records);
      const offset = calculateOffsetByPeriod(reductionMeasures, year);
      const net = calculateNetEmission(total, offset);
      return {
        year,
        totalEmission: Number(total.toFixed(2)),
        netEmission: Number(net.toFixed(2)),
        offset: Number(offset.toFixed(2)),
      };
    });
  }, [emissionRecords, reductionMeasures]);

  const multiYearTrend = useMemo(() => {
    const months = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
    return months.map((m, idx) => {
      const month = String(idx + 1);
      const result: any = { month: m };
      years.forEach((year) => {
        const records = filterRecordsByPeriod(emissionRecords, year, month);
        result[year] = Number(calculateTotalEmission(records).toFixed(2));
      });
      return result;
    });
  }, [emissionRecords]);

  const stats = useMemo(() => {
    const latest = yearlyData[yearlyData.length - 1];
    const previous = yearlyData[yearlyData.length - 2];
    const oldest = yearlyData[0];
    if (!latest || !previous || !oldest) {
      return {
        yoyChange: 0,
        totalReduction: 0,
        reductionRate: 0,
        avgReductionPerYear: 0,
        latestNet: 0,
        oldestNet: 0,
      };
    }
    const yoyChange = calculateYoYChange(latest.netEmission, previous.netEmission);
    const totalReduction = oldest.netEmission - latest.netEmission;
    const reductionRate = oldest.netEmission > 0 ? (totalReduction / oldest.netEmission * 100) : 0;
    const avgReductionPerYear = totalReduction / (years.length - 1);

    return {
      yoyChange,
      totalReduction: Number(totalReduction.toFixed(2)),
      reductionRate: Number(reductionRate.toFixed(1)),
      avgReductionPerYear: Number(avgReductionPerYear.toFixed(2)),
      latestNet: latest.netEmission,
      oldestNet: oldest.netEmission,
    };
  }, [yearlyData]);

  const yearOverYearData = useMemo(() => {
    const result: any[] = [];
    for (let i = 1; i < yearlyData.length; i++) {
      const current = yearlyData[i];
      const previous = yearlyData[i - 1];
      const change = calculateYoYChange(current.netEmission, previous.netEmission);
      result.push({
        year: `${previous.year}-${current.year}`,
        currentYear: current.year,
        currentEmission: current.netEmission,
        previousEmission: previous.netEmission,
        change,
      });
    }
    return result;
  }, [yearlyData]);

  const trendColor = stats.yoyChange <= 0 ? "from-forest-600 to-forest-400" : "from-amber-600 to-amber-400";
  const lineColors = ["#1b4332", "#d4a373", "#52b788"];

  return (
    <div>
      <PageHeader
        title="历史数据对比"
        subtitle="多年度排放趋势分析，支撑管理层决策与对外披露"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard
          title="累计减排量"
          value={formatEmission(stats.totalReduction)}
          unit="吨CO₂e"
          icon={TrendingDown}
          gradient="from-forest-700 to-forest-500"
          delay={50}
        />
        <StatCard
          title="年均减排"
          value={formatEmission(stats.avgReductionPerYear)}
          unit="吨CO₂e/年"
          icon={BarChart3}
          gradient="from-forest-600 to-forest-400"
          delay={100}
        />
        <StatCard
          title="减排总幅度"
          value={formatPercentage(stats.reductionRate)}
          trendGood={stats.reductionRate > 0}
          icon={stats.reductionRate > 0 ? TrendingDown : TrendingUp}
          gradient={trendColor}
          delay={150}
        />
        <StatCard
          title="同比变化"
          value={`${stats.yoyChange > 0 ? "+" : ""}${stats.yoyChange.toFixed(1)}%`}
          unit={stats.yoyChange <= 0 ? "减排成效" : "需关注"}
          trend={stats.yoyChange}
          trendGood={stats.yoyChange <= 0}
          icon={stats.yoyChange <= 0 ? TrendingDown : TrendingUp}
          gradient={stats.yoyChange <= 0 ? "from-forest-600 to-forest-400" : "from-amber-600 to-amber-400"}
          delay={200}
        />
      </div>

      <div className="card p-6 mb-6 animate-fade-in-up" style={{ opacity: 0 }}>
        <h3 className="font-display font-bold text-lg text-forest-800 mb-1">年度排放总览</h3>
        <p className="text-sm text-forest-500 mb-5">多年度总排放、净排放与抵消量对比</p>
        <YearlyCompareChart data={yearlyData} height={340} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div className="card p-6 lg:col-span-2 animate-fade-in-up" style={{ animationDelay: "50ms", opacity: 0 }}>
          <h3 className="font-display font-bold text-lg text-forest-800 mb-1">月度排放趋势对比</h3>
          <p className="text-sm text-forest-500 mb-5">各年度月度排放量对比</p>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={multiYearTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #daede3",
                    borderRadius: "12px",
                    padding: "12px",
                  }}
                  formatter={(value: number, name: string) => [`${formatEmission(value)} 吨`, `${name}年`]}
                />
                <Legend
                  wrapperStyle={{ paddingTop: "16px" }}
                  iconType="circle"
                  formatter={(value: string) => <span className="text-sm text-slate-850">{value}年</span>}
                />
                {years.map((year, idx) => (
                  <Line
                    key={year}
                    type="monotone"
                    dataKey={year}
                    name={year}
                    stroke={lineColors[idx % lineColors.length]}
                    strokeWidth={idx === years.length - 1 ? 3 : 2}
                    strokeDasharray={idx === years.length - 1 ? "0" : "5 5"}
                    dot={{ fill: lineColors[idx % lineColors.length], r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6 animate-fade-in-up" style={{ animationDelay: "100ms", opacity: 0 }}>
          <h3 className="font-display font-bold text-lg text-forest-800 mb-1">年度同比变化</h3>
          <p className="text-sm text-forest-500 mb-5">逐年减排成效</p>
          <div className="space-y-4">
            {yearOverYearData.map((d, idx) => {
              const isGood = d.change <= 0;
              return (
                <div key={d.year} className="p-4 rounded-xl bg-gradient-to-r from-forest-50 to-ivory-100 border border-forest-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-display font-bold text-forest-800">{d.year}</span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        isGood ? "bg-forest-100 text-forest-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {isGood ? <TrendingDown className="w-3 h-3 inline mr-1" /> : <TrendingUp className="w-3 h-3 inline mr-1" />}
                      {d.change > 0 ? "+" : ""}
                      {d.change.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-center">
                      <p className="text-forest-500 text-xs">{d.currentYear - 1}年</p>
                      <p className="font-bold text-slate-850">{formatEmission(d.previousEmission)}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-forest-400" />
                    <div className="text-center">
                      <p className="text-forest-500 text-xs">{d.currentYear}年</p>
                      <p className={`font-bold ${isGood ? "text-forest-600" : "text-amber-600"}`}>
                        {formatEmission(d.currentEmission)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card p-6 animate-fade-in-up" style={{ animationDelay: "150ms", opacity: 0 }}>
        <h3 className="font-display font-bold text-lg text-forest-800 mb-5">年度数据明细</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-forest-50/50 border-b border-forest-100">
                <th className="px-5 py-3.5 text-left text-sm font-semibold text-forest-700">年度</th>
                <th className="px-5 py-3.5 text-right text-sm font-semibold text-forest-700">总排放量</th>
                <th className="px-5 py-3.5 text-right text-sm font-semibold text-forest-700">抵消量</th>
                <th className="px-5 py-3.5 text-right text-sm font-semibold text-forest-700">净排放量</th>
                <th className="px-5 py-3.5 text-right text-sm font-semibold text-forest-700">同比变化</th>
                <th className="px-5 py-3.5 text-right text-sm font-semibold text-forest-700">减排目标</th>
                <th className="px-5 py-3.5 text-center text-sm font-semibold text-forest-700">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest-50">
              {yearlyData.map((d, idx) => {
                const target = annualTargets.find((t) => t.year === d.year && t.departmentId === "all");
                const yoy =
                  idx > 0 ? calculateYoYChange(d.netEmission, yearlyData[idx - 1].netEmission) : null;
                const isOnTrack = target ? d.netEmission <= target.targetEmissionTonCo2 : null;
                return (
                  <tr key={d.year} className="hover:bg-forest-50/30 transition-colors">
                    <td className="px-5 py-3.5 font-display font-bold text-lg text-forest-800">{d.year}年</td>
                    <td className="px-5 py-3.5 text-right text-slate-850">{formatEmission(d.totalEmission)} 吨</td>
                    <td className="px-5 py-3.5 text-right text-forest-600">{formatEmission(d.offset)} 吨</td>
                    <td className="px-5 py-3.5 text-right font-medium text-amber-600">{formatEmission(d.netEmission)} 吨</td>
                    <td className="px-5 py-3.5 text-right">
                      {yoy !== null ? (
                        <span
                          className={`font-bold ${
                            yoy <= 0 ? "text-forest-600" : "text-amber-600"
                          }`}
                        >
                          {yoy > 0 ? "+" : ""}
                          {yoy.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-forest-400">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right text-forest-700">
                      {target ? formatEmission(target.targetEmissionTonCo2) + " 吨" : "-"}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {isOnTrack !== null ? (
                        <span
                          className={`badge ${
                            isOnTrack
                              ? "bg-forest-100 text-forest-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {isOnTrack ? "达标" : "未达标"}
                        </span>
                      ) : (
                        <span className="text-forest-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

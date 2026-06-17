import React, { useMemo } from "react";
import { Zap, Target, Leaf, TrendingDown, Factory } from "lucide-react";
import { useCarbonStore } from "@/store";
import {
  calculateTotalEmission,
  calculateOffsetByPeriod,
  calculateNetEmission,
  filterRecordsByPeriod,
  calculateYoYChange,
  aggregateBySource,
  aggregateByCategory,
  calculateTargetCompletion,
} from "@/utils/calculator";
import { formatEmission } from "@/utils/format";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import ProgressRing from "@/components/ui/ProgressRing";
import TrendLineChart from "@/components/charts/TrendLineChart";
import CategoryPieChart from "@/components/charts/CategoryPieChart";
import DepartmentBarChart from "@/components/charts/DepartmentBarChart";

export default function Dashboard() {
  const {
    emissionRecords,
    reductionMeasures,
    annualTargets,
    departments,
    currentYear,
    setCurrentYear,
  } = useCarbonStore();

  const companyTarget = useMemo(
    () => annualTargets.find((t) => t.departmentId === "all" && t.year === currentYear),
    [annualTargets, currentYear]
  );

  const {
    totalEmission,
    totalOffset,
    netEmission,
    lastYearEmission,
    yoyChange,
    targetCompletion,
  } = useMemo(() => {
    const currentRecords = filterRecordsByPeriod(emissionRecords, currentYear);
    const lastYearRecords = filterRecordsByPeriod(
      emissionRecords,
      String(Number(currentYear) - 1)
    );
    const total = calculateTotalEmission(currentRecords);
    const offset = calculateOffsetByPeriod(reductionMeasures, currentYear);
    const net = calculateNetEmission(total, offset);
    const lastTotal = calculateTotalEmission(lastYearRecords);
    const yoy = calculateYoYChange(total, lastTotal);
    const completion = companyTarget ? calculateTargetCompletion(companyTarget, net) : 0;

    return {
      totalEmission: total,
      totalOffset: offset,
      netEmission: net,
      lastYearEmission: lastTotal,
      yoyChange: yoy,
      targetCompletion: completion,
    };
  }, [emissionRecords, reductionMeasures, currentYear, companyTarget]);

  const trendData = useMemo(() => {
    const months = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
    return months.map((m, idx) => {
      const month = String(idx + 1);
      const current = filterRecordsByPeriod(emissionRecords, currentYear, month);
      const last = filterRecordsByPeriod(emissionRecords, String(Number(currentYear) - 1), month);
      return {
        month: m,
        emission: Number(calculateTotalEmission(current).toFixed(2)),
        lastYearEmission: Number(calculateTotalEmission(last).toFixed(2)),
      };
    });
  }, [emissionRecords, currentYear]);

  const categoryData = useMemo(() => {
    const currentRecords = filterRecordsByPeriod(emissionRecords, currentYear);
    return aggregateByCategory(currentRecords).map((c) => ({ ...c, name: c.category }));
  }, [emissionRecords, currentYear]);

  const deptData = useMemo(() => {
    const currentRecords = filterRecordsByPeriod(emissionRecords, currentYear);
    const total = calculateTotalEmission(currentRecords);
    const deptMap = new Map<string, number>();
    currentRecords.forEach((r) => {
      deptMap.set(r.departmentId, (deptMap.get(r.departmentId) || 0) + r.emissionTonCo2);
    });
    return Array.from(deptMap.entries())
      .map(([deptId, value]) => {
        const dept = departments.find((d) => d.id === deptId);
        return {
          name: dept?.name || deptId,
          value: Number(value.toFixed(2)),
          percentage: total > 0 ? Number((value / total * 100).toFixed(1)) : 0,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [emissionRecords, departments, currentYear]);

  const topSource = useMemo(() => {
    const currentRecords = filterRecordsByPeriod(emissionRecords, currentYear);
    const sources = aggregateBySource(currentRecords);
    return sources[0];
  }, [emissionRecords, currentYear]);

  const baselineEmission = companyTarget?.baselineEmissionTonCo2;
  const targetEmission = companyTarget?.targetEmissionTonCo2;
  const hasTarget = !!companyTarget && !!targetEmission;
  const gapFromTarget = hasTarget ? netEmission - targetEmission! : null;
  const activeInProgress = reductionMeasures.filter((m) => m.status === "in_progress").length;
  const totalInProgressOffset = reductionMeasures
    .filter((m) => m.status !== "planning")
    .reduce((s, m) => s + m.offsetTonCo2, 0);

  return (
    <div>
      <PageHeader
        title="碳排放数据总览"
        subtitle={`${currentYear}年度企业碳排放实时监测与分析`}
        actions={
          <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-1.5 border border-forest-100">
            <select
              value={currentYear}
              onChange={(e) => setCurrentYear(e.target.value)}
              className="bg-transparent text-forest-700 font-medium focus:outline-none cursor-pointer"
            >
              {["2023", "2024", "2025", "2026"].map((y) => (
                <option key={y} value={y}>{y}年</option>
              ))}
            </select>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard
          title="年度总排放"
          value={formatEmission(totalEmission)}
          unit="吨CO₂e"
          trend={yoyChange}
          icon={Factory}
          gradient="from-forest-700 to-forest-500"
          delay={50}
        />
        <StatCard
          title="减排抵消量"
          value={formatEmission(totalOffset)}
          unit="吨CO₂e"
          icon={Leaf}
          gradient="from-forest-500 to-forest-400"
          delay={100}
        />
        <StatCard
          title="净排放量"
          value={formatEmission(netEmission)}
          unit="吨CO₂e"
          trend={yoyChange * 0.8}
          icon={Zap}
          gradient="from-amber-500 to-amber-400"
          delay={150}
        />
        <StatCard
          title="较去年同期"
          value={`${yoyChange > 0 ? "+" : ""}${yoyChange.toFixed(1)}%`}
          unit={yoyChange <= 0 ? "减排成效" : "需加强"}
          trendGood={yoyChange <= 0}
          icon={TrendingDown}
          gradient={yoyChange <= 0 ? "from-forest-600 to-forest-400" : "from-amber-600 to-amber-400"}
          delay={200}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div className="card p-6 animate-fade-in-up" style={{ animationDelay: "250ms", opacity: 0 }}>
          <h3 className="font-display font-bold text-lg text-forest-800 mb-4">减排目标进度</h3>
          {hasTarget ? (
            <div className="flex flex-col items-center py-4">
              <ProgressRing
                percentage={targetCompletion}
                label="目标完成度"
                subtitle={`${currentYear}年度`}
                size={180}
              />
              <div className="mt-6 w-full space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-forest-600">基准排放</span>
                  <span className="font-medium text-slate-850">{formatEmission(baselineEmission!)} 吨</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-forest-600">目标排放</span>
                  <span className="font-medium text-forest-700">{formatEmission(targetEmission!)} 吨</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-forest-600">当前净排放</span>
                  <span className="font-medium text-amber-600">{formatEmission(netEmission)} 吨</span>
                </div>
                <div className="flex justify-between text-sm border-t border-forest-100 pt-2 mt-2">
                  <span className="text-forest-500">距目标差距</span>
                  <span className={`font-bold ${gapFromTarget! <= 0 ? "text-forest-600" : "text-amber-600"}`}>
                    {gapFromTarget! <= 0
                      ? `已低于目标 ${formatEmission(Math.abs(gapFromTarget!))} 吨`
                      : `还需减排 ${formatEmission(gapFromTarget!)} 吨`}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Target className="w-12 h-12 text-forest-300 mb-3" />
              <p className="text-forest-500 text-sm mb-3">{currentYear}年度尚未设置减排目标</p>
              <button
                onClick={() => useCarbonStore.getState().setCurrentYear(currentYear)}
                className="text-sm text-forest-600 hover:text-forest-700 underline underline-offset-2"
              >
                前往目标管理设置
              </button>
            </div>
          )}
        </div>

        <div className="card p-6 animate-fade-in-up" style={{ animationDelay: "300ms", opacity: 0 }}>
          <h3 className="font-display font-bold text-lg text-forest-800 mb-4">排放结构分析</h3>
          <CategoryPieChart data={categoryData} height={260} />
        </div>

        <div className="card p-6 animate-fade-in-up" style={{ animationDelay: "350ms", opacity: 0 }}>
          <h3 className="font-display font-bold text-lg text-forest-800 mb-4">Top 5 排放部门</h3>
          <DepartmentBarChart data={deptData} height={260} horizontal />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-6 lg:col-span-2 animate-fade-in-up" style={{ animationDelay: "400ms", opacity: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg text-forest-800">月度排放趋势</h3>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-forest-700"></span>
                <span className="text-forest-600">本年度</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-amber-400" style={{ borderTop: "2px dashed #d4a373" }}></span>
                <span className="text-amber-600">去年同期</span>
              </span>
            </div>
          </div>
          <TrendLineChart data={trendData} height={300} />
        </div>

        <div className="card p-6 animate-fade-in-up" style={{ animationDelay: "450ms", opacity: 0 }}>
          <h3 className="font-display font-bold text-lg text-forest-800 mb-4">重点关注</h3>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-400/20 flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-amber-800">最大排放源</p>
                  <p className="text-sm text-amber-700 mt-0.5">
                    {topSource?.name || "电力"}：{formatEmission(topSource?.value || 0)} 吨CO₂e
                  </p>
                  <p className="text-xs text-amber-600 mt-1">建议优先制定专项减排方案</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-forest-50 to-forest-100/50 border border-forest-200">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-forest-400/20 flex items-center justify-center flex-shrink-0">
                  <Leaf className="w-5 h-5 text-forest-600" />
                </div>
                <div>
                  <p className="font-medium text-forest-800">进行中减排项目</p>
                  <p className="text-sm text-forest-700 mt-0.5">
                    {activeInProgress} 个项目正在执行
                  </p>
                  <p className="text-xs text-forest-600 mt-1">
                    预计可抵消 {formatEmission(totalInProgressOffset)} 吨
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-400/20 flex items-center justify-center flex-shrink-0">
                  <TrendingDown className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-blue-800">减排趋势</p>
                  <p className="text-sm text-blue-700 mt-0.5">
                    {yoyChange <= 0 ? "呈下降趋势，成效显著" : "呈上升趋势，需加大力度"}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {hasTarget
                      ? (gapFromTarget! <= 0
                          ? "已达成年度减排目标"
                          : `距年度目标还需减排 ${formatEmission(gapFromTarget!)} 吨`)
                      : `${currentYear}年度暂未设置目标`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useMemo, useState } from "react";
import { Filter, MapPin, Building2, Zap } from "lucide-react";
import { useCarbonStore } from "@/store";
import { emissionSources } from "@/data/factors";
import {
  filterRecordsByPeriod,
  calculateTotalEmission,
  aggregateBySource,
  aggregateByCategory,
} from "@/utils/calculator";
import { formatEmission } from "@/utils/format";
import PageHeader from "@/components/ui/PageHeader";
import CategoryPieChart from "@/components/charts/CategoryPieChart";
import DepartmentBarChart from "@/components/charts/DepartmentBarChart";
import TrendLineChart from "@/components/charts/TrendLineChart";

export default function Analysis() {
  const { emissionRecords, departments, regions, currentYear } = useCarbonStore();
  const [filterDept, setFilterDept] = useState("all");
  const [filterRegion, setFilterRegion] = useState("all");

  const filteredRecords = useMemo(() => {
    let records = filterRecordsByPeriod(emissionRecords, currentYear);
    if (filterDept !== "all") {
      records = records.filter((r) => r.departmentId === filterDept);
    }
    if (filterRegion !== "all") {
      records = records.filter((r) => r.regionId === filterRegion);
    }
    return records;
  }, [emissionRecords, currentYear, filterDept, filterRegion]);

  const categoryData = useMemo(() => aggregateByCategory(filteredRecords), [filteredRecords]);

  const sourceData = useMemo(() => aggregateBySource(filteredRecords).slice(0, 8), [filteredRecords]);

  const deptData = useMemo(() => {
    const total = calculateTotalEmission(filteredRecords);
    const deptMap = new Map<string, number>();
    filteredRecords.forEach((r) => {
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
      .sort((a, b) => b.value - a.value);
  }, [filteredRecords, departments]);

  const regionData = useMemo(() => {
    const total = calculateTotalEmission(filteredRecords);
    const regionMap = new Map<string, number>();
    filteredRecords.forEach((r) => {
      regionMap.set(r.regionId, (regionMap.get(r.regionId) || 0) + r.emissionTonCo2);
    });
    return Array.from(regionMap.entries())
      .map(([regionId, value]) => {
        const region = regions.find((r) => r.id === regionId);
        return {
          name: region?.name || regionId,
          value: Number(value.toFixed(2)),
          percentage: total > 0 ? Number((value / total * 100).toFixed(1)) : 0,
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [filteredRecords, regions]);

  const trendData = useMemo(() => {
    const months = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
    return months.map((m, idx) => {
      const month = String(idx + 1);
      const records = filteredRecords.filter((r) => r.periodMonth === month);
      return {
        month: m,
        emission: Number(calculateTotalEmission(records).toFixed(2)),
      };
    });
  }, [filteredRecords]);

  const totalEmission = calculateTotalEmission(filteredRecords);

  return (
    <div>
      <PageHeader
        title="排放结构分析"
        subtitle="多维度分析碳排放结构，识别重点减排领域"
        actions={
          <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-1.5 border border-forest-100">
            <select
              value={currentYear}
              onChange={(e) => useCarbonStore.getState().setCurrentYear(e.target.value)}
              className="bg-transparent text-forest-700 font-medium focus:outline-none cursor-pointer"
            >
              {["2023", "2024", "2025"].map((y) => (
                <option key={y} value={y}>{y}年</option>
              ))}
            </select>
          </div>
        }
      />

      <div className="card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-forest-600">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">筛选条件：</span>
          </div>
          <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="input-field max-w-[180px] py-2">
            <option value="all">全部部门</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)} className="input-field max-w-[180px] py-2">
            <option value="all">全部地区</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <div className="ml-auto text-sm text-forest-600">
            筛选结果：共 <span className="font-bold text-amber-600">{formatEmission(totalEmission)}</span> 吨CO₂e
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div className="card p-6 animate-fade-in-up" style={{ opacity: 0 }}>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-forest-600" />
            <h3 className="font-display font-bold text-lg text-forest-800">按排放类别分布</h3>
          </div>
          <CategoryPieChart data={categoryData.map((c) => ({ ...c, name: c.category }))} height={300} />
        </div>

        <div className="card p-6 animate-fade-in-up" style={{ animationDelay: "50ms", opacity: 0 }}>
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-forest-600" />
            <h3 className="font-display font-bold text-lg text-forest-800">按部门分布</h3>
          </div>
          <DepartmentBarChart data={deptData} height={300} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div className="card p-6 animate-fade-in-up" style={{ animationDelay: "100ms", opacity: 0 }}>
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-forest-600" />
            <h3 className="font-display font-bold text-lg text-forest-800">按地区分布</h3>
          </div>
          <div className="space-y-3">
            {regionData.map((r, idx) => {
              const colors = [
                "from-forest-700 to-forest-500",
                "from-forest-600 to-forest-400",
                "from-forest-500 to-forest-300",
                "from-amber-500 to-amber-300",
              ];
              return (
                <div key={r.name} className="group">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-slate-850">{r.name}</span>
                    <span className="text-forest-600">
                      {formatEmission(r.value)} 吨 <span className="text-forest-400">({r.percentage}%)</span>
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-forest-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${colors[idx % colors.length]} transition-all duration-1000`}
                      style={{ width: `${r.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-6 animate-fade-in-up" style={{ animationDelay: "150ms", opacity: 0 }}>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-forest-600" />
            <h3 className="font-display font-bold text-lg text-forest-800">Top 排放源明细</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-forest-100">
                  <th className="text-left py-2.5 text-sm font-semibold text-forest-700">排放源</th>
                  <th className="text-right py-2.5 text-sm font-semibold text-forest-700">排放量</th>
                  <th className="text-right py-2.5 text-sm font-semibold text-forest-700">占比</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest-50">
                {sourceData.map((s) => {
                  const total = sourceData.reduce((sum, x) => sum + x.value, 0);
                  const pct = total > 0 ? (s.value / total * 100).toFixed(1) : 0;
                  return (
                    <tr key={s.name} className="hover:bg-forest-50/30">
                      <td className="py-2.5 text-sm text-slate-850 font-medium">{s.name}</td>
                      <td className="py-2.5 text-sm text-right text-amber-600 font-medium">{formatEmission(s.value)} 吨</td>
                      <td className="py-2.5 text-sm text-right text-forest-600">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card p-6 animate-fade-in-up" style={{ animationDelay: "200ms", opacity: 0 }}>
        <h3 className="font-display font-bold text-lg text-forest-800 mb-4">月度排放趋势（筛选范围）</h3>
        <TrendLineChart data={trendData} height={300} showLastYear={false} />
      </div>
    </div>
  );
}

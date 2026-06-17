import React, { useState, useMemo } from "react";
import { Target, Edit3, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { useCarbonStore } from "@/store";
import {
  filterRecordsByPeriod,
  calculateTotalEmission,
  calculateTotalOffset,
  calculateNetEmission,
  calculateTargetCompletion,
} from "@/utils/calculator";
import { formatEmission } from "@/utils/format";
import PageHeader from "@/components/ui/PageHeader";
import ProgressRing from "@/components/ui/ProgressRing";

export default function Targets() {
  const {
    annualTargets,
    emissionRecords,
    reductionMeasures,
    departments,
    currentYear,
    updateAnnualTarget,
  } = useCarbonStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState("");

  const companyTarget = useMemo(
    () => annualTargets.find((t) => t.departmentId === "all" && t.year === currentYear),
    [annualTargets, currentYear]
  );

  const deptTargets = useMemo(
    () => annualTargets.filter((t) => t.departmentId !== "all" && t.year === currentYear),
    [annualTargets, currentYear]
  );

  const getDeptProgress = (deptId: string, target: typeof annualTargets[0]) => {
    const records = filterRecordsByPeriod(emissionRecords, currentYear).filter(
      (r) => r.departmentId === deptId
    );
    const total = calculateTotalEmission(records);
    const offset = calculateTotalOffset(
      reductionMeasures.filter((m) => m.departmentId === deptId)
    );
    const net = calculateNetEmission(total, offset);
    const completion = calculateTargetCompletion(target, net);
    return { actual: net, completion };
  };

  const companyProgress = useMemo(() => {
    if (!companyTarget) return { actual: 0, completion: 65 };
    const records = filterRecordsByPeriod(emissionRecords, currentYear);
    const total = calculateTotalEmission(records);
    const offset = calculateTotalOffset(reductionMeasures);
    const net = calculateNetEmission(total, offset);
    return { actual: net, completion: calculateTargetCompletion(companyTarget, net) };
  }, [companyTarget, emissionRecords, reductionMeasures, currentYear]);

  const handleStartEdit = (id: string, currentValue: number) => {
    setEditingId(id);
    setEditTarget(currentValue.toString());
  };

  const handleSave = (id: string) => {
    updateAnnualTarget(id, { targetEmissionTonCo2: Number(editTarget) });
    setEditingId(null);
  };

  const getStatusInfo = (completion: number) => {
    if (completion >= 80) {
      return { label: "进展良好", color: "text-forest-600", bg: "bg-forest-50", icon: CheckCircle2, border: "border-forest-200" };
    } else if (completion >= 50) {
      return { label: "需要关注", color: "text-amber-600", bg: "bg-amber-50", icon: Clock, border: "border-amber-200" };
    }
    return { label: "预警", color: "text-red-600", bg: "bg-red-50", icon: AlertTriangle, border: "border-red-200" };
  };

  return (
    <div>
      <PageHeader
        title="减排目标管理"
        subtitle={`${currentYear}年度企业及各部门减排目标设置与进度追踪`}
        actions={
          <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-1.5 border border-forest-100">
            <select
              value={currentYear}
              onChange={(e) => useCarbonStore.getState().setCurrentYear(e.target.value)}
              className="bg-transparent text-forest-700 font-medium focus:outline-none cursor-pointer"
            >
              {["2023", "2024", "2025", "2026"].map((y) => (
                <option key={y} value={y}>{y}年</option>
              ))}
            </select>
          </div>
        }
      />

      {companyTarget && (
        <div className="card p-8 mb-6 animate-fade-in-up" style={{ opacity: 0 }}>
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <ProgressRing
              percentage={companyProgress.completion}
              size={200}
              strokeWidth={18}
              label="企业整体目标"
              subtitle={`${currentYear}年度`}
            />
            <div className="flex-1 w-full">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="font-display font-bold text-2xl text-forest-800">
                  {currentYear}年度企业减排总目标
                </h3>
                <span className={`badge border ${getStatusInfo(companyProgress.completion).bg} ${getStatusInfo(companyProgress.completion).color} ${getStatusInfo(companyProgress.completion).border}`}>
                  {(() => {
                    const StatusIcon = getStatusInfo(companyProgress.completion).icon;
                    return <StatusIcon className="w-3.5 h-3.5 inline mr-1" />;
                  })()}
                  {getStatusInfo(companyProgress.completion).label}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-forest-50/50">
                  <p className="text-sm text-forest-600 mb-1">基准排放量</p>
                  <p className="text-xl font-display font-bold text-slate-850">
                    {formatEmission(companyTarget.baselineEmissionTonCo2)}
                    <span className="text-sm font-normal text-forest-500 ml-1">吨</span>
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-amber-50/50">
                  <p className="text-sm text-amber-600 mb-1">目标排放量</p>
                  {editingId === companyTarget.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={editTarget}
                        onChange={(e) => setEditTarget(e.target.value)}
                        className="w-28 px-2 py-1 rounded border border-amber-300 text-sm"
                      />
                      <button onClick={() => handleSave(companyTarget.id)} className="text-forest-600 hover:text-forest-700 text-sm font-medium">保存</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-display font-bold text-amber-700">
                        {formatEmission(companyTarget.targetEmissionTonCo2)}
                        <span className="text-sm font-normal text-amber-500 ml-1">吨</span>
                      </p>
                      <button onClick={() => handleStartEdit(companyTarget.id, companyTarget.targetEmissionTonCo2)} className="p-1 rounded text-forest-500 hover:bg-forest-100">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="p-4 rounded-xl bg-blue-50/50">
                  <p className="text-sm text-blue-600 mb-1">当前净排放</p>
                  <p className="text-xl font-display font-bold text-blue-700">
                    {formatEmission(companyProgress.actual)}
                    <span className="text-sm font-normal text-blue-500 ml-1">吨</span>
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-forest-600 text-white">
                  <p className="text-sm text-forest-100 mb-1">需减排量</p>
                  <p className="text-xl font-display font-bold">
                    {formatEmission(Math.max(0, companyTarget.baselineEmissionTonCo2 - companyTarget.targetEmissionTonCo2))}
                    <span className="text-sm font-normal text-forest-200 ml-1">吨</span>
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-forest-600 mb-1">
                  <span>减排进度</span>
                  <span className="font-medium">{companyProgress.completion.toFixed(1)}%</span>
                </div>
                <div className="h-4 rounded-full bg-forest-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-forest-400 to-forest-600 rounded-full transition-all duration-1000"
                    style={{ width: `${companyProgress.completion}%` }}
                  />
                </div>
                <p className="text-xs text-forest-500 mt-1">
                  目标减排 {formatEmission(companyTarget.baselineEmissionTonCo2 - companyTarget.targetEmissionTonCo2)} 吨，
                  已完成约 {formatEmission(companyTarget.baselineEmissionTonCo2 - companyProgress.actual)} 吨
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <h3 className="font-display font-bold text-xl text-forest-800 mb-4">各部门分解目标</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {deptTargets.map((target, idx) => {
          const dept = departments.find((d) => d.id === target.departmentId);
          const progress = getDeptProgress(target.departmentId, target);
          const status = getStatusInfo(progress.completion);
          const StatusIcon = status.icon;

          return (
            <div
              key={target.id}
              className="card p-5 animate-fade-in-up"
              style={{ animationDelay: `${idx * 80}ms`, opacity: 0 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-display font-bold text-lg text-forest-800">
                    {dept?.name || target.departmentId}
                  </h4>
                  <p className="text-sm text-forest-500">负责人：{dept?.manager || "-"}</p>
                </div>
                <span className={`badge border ${status.bg} ${status.color} ${status.border}`}>
                  <StatusIcon className="w-3.5 h-3.5 inline mr-1" />
                  {status.label}
                </span>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <ProgressRing percentage={progress.completion} size={80} strokeWidth={10} />
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-forest-600">目标</span>
                    {editingId === target.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={editTarget}
                          onChange={(e) => setEditTarget(e.target.value)}
                          className="w-20 px-2 py-0.5 rounded border border-forest-200 text-xs"
                        />
                        <button onClick={() => handleSave(target.id)} className="text-forest-600 text-xs">保存</button>
                      </div>
                    ) : (
                      <span className="font-medium text-amber-600 flex items-center gap-1">
                        {formatEmission(target.targetEmissionTonCo2)} 吨
                        <button onClick={() => handleStartEdit(target.id, target.targetEmissionTonCo2)} className="p-0.5 rounded hover:bg-forest-100">
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-forest-600">实际</span>
                    <span className="font-medium text-blue-600">{formatEmission(progress.actual)} 吨</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-forest-600">基准</span>
                    <span className="font-medium text-slate-850">{formatEmission(target.baselineEmissionTonCo2)} 吨</span>
                  </div>
                </div>
              </div>

              <div className="h-2.5 rounded-full bg-forest-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    progress.completion >= 80
                      ? "bg-gradient-to-r from-forest-400 to-forest-600"
                      : progress.completion >= 50
                      ? "bg-gradient-to-r from-amber-400 to-amber-600"
                      : "bg-gradient-to-r from-red-400 to-red-500"
                  }`}
                  style={{ width: `${Math.min(100, progress.completion)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

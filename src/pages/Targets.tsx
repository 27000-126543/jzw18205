import React, { useState, useMemo } from "react";
import { Target, Edit3, AlertTriangle, CheckCircle2, Clock, Plus, X, Check, AlertCircle } from "lucide-react";
import { useCarbonStore } from "@/store";
import {
  filterRecordsByPeriod,
  calculateTotalEmission,
  calculateOffsetByPeriod,
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
    addAnnualTarget,
    updateAnnualTarget,
  } = useCarbonStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState("");
  const [showNewTargetModal, setShowNewTargetModal] = useState(false);
  const [newTargetForm, setNewTargetForm] = useState({
    baselineEmission: "",
    targetEmission: "",
    deptTargets: {} as Record<string, { baseline: string; target: string }>,
  });
  const [newTargetErrors, setNewTargetErrors] = useState<Record<string, string>>({});

  const companyTarget = useMemo(
    () => annualTargets.find((t) => t.departmentId === "all" && t.year === currentYear),
    [annualTargets, currentYear]
  );

  const deptTargets = useMemo(
    () => annualTargets.filter((t) => t.departmentId !== "all" && t.year === currentYear),
    [annualTargets, currentYear]
  );

  const existingDeptIds = useMemo(
    () => new Set(deptTargets.map((t) => t.departmentId)),
    [deptTargets]
  );

  const departmentsWithoutTarget = useMemo(
    () => departments.filter((d) => !existingDeptIds.has(d.id)),
    [departments, existingDeptIds]
  );

  const getDeptProgress = (deptId: string, target: typeof annualTargets[0]) => {
    const records = filterRecordsByPeriod(emissionRecords, currentYear).filter(
      (r) => r.departmentId === deptId
    );
    const total = calculateTotalEmission(records);
    const offset = calculateOffsetByPeriod(
      reductionMeasures.filter((m) => m.departmentId === deptId),
      currentYear
    );
    const net = calculateNetEmission(total, offset);
    const completion = calculateTargetCompletion(target, net);
    return { actual: net, completion };
  };

  const companyProgress = useMemo(() => {
    if (!companyTarget) return { actual: 0, completion: 0 };
    const records = filterRecordsByPeriod(emissionRecords, currentYear);
    const total = calculateTotalEmission(records);
    const offset = calculateOffsetByPeriod(reductionMeasures, currentYear);
    const net = calculateNetEmission(total, offset);
    return { actual: net, completion: calculateTargetCompletion(companyTarget, net) };
  }, [companyTarget, emissionRecords, reductionMeasures, currentYear]);

  const handleStartEdit = (id: string, currentValue: number) => {
    setEditingId(id);
    setEditTarget(currentValue.toString());
  };

  const handleSave = (id: string) => {
    const val = Number(editTarget);
    if (isNaN(val) || val <= 0) {
      alert("目标排放量必须为大于0的数字");
      return;
    }
    updateAnnualTarget(id, { targetEmissionTonCo2: val });
    setEditingId(null);
  };

  const handleOpenNewTarget = () => {
    setNewTargetForm({
      baselineEmission: "",
      targetEmission: "",
      deptTargets: {},
    });
    setNewTargetErrors({});
    setShowNewTargetModal(true);
  };

  const validateNewTarget = (): boolean => {
    const errors: Record<string, string> = {};
    const base = Number(newTargetForm.baselineEmission);
    const target = Number(newTargetForm.targetEmission);
    if (!newTargetForm.baselineEmission || newTargetForm.baselineEmission.trim() === "") {
      errors.baselineEmission = "请输入基准排放量";
    } else if (isNaN(base) || base <= 0) {
      errors.baselineEmission = "基准排放量必须为大于0的数字";
    }
    if (!newTargetForm.targetEmission || newTargetForm.targetEmission.trim() === "") {
      errors.targetEmission = "请输入目标排放量";
    } else if (isNaN(target) || target <= 0) {
      errors.targetEmission = "目标排放量必须为大于0的数字";
    }
    if (!errors.baselineEmission && !errors.targetEmission && target >= base) {
      errors.targetEmission = "目标排放量应低于基准排放量";
    }
    Object.entries(newTargetForm.deptTargets).forEach(([deptId, dt]) => {
      const b = Number(dt.baseline);
      const t = Number(dt.target);
      if (dt.baseline && (isNaN(b) || b <= 0)) {
        errors[`dept_baseline_${deptId}`] = "基准排放量必须为大于0的数字";
      }
      if (dt.target && (isNaN(t) || t <= 0)) {
        errors[`dept_target_${deptId}`] = "目标排放量必须为大于0的数字";
      }
      if (dt.baseline && dt.target && !isNaN(b) && !isNaN(t) && t >= b) {
        errors[`dept_target_${deptId}`] = "目标排放量应低于基准排放量";
      }
    });
    setNewTargetErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveNewTarget = () => {
    if (!validateNewTarget()) return;

    addAnnualTarget({
      departmentId: "all",
      year: currentYear,
      baselineEmissionTonCo2: Number(newTargetForm.baselineEmission),
      targetEmissionTonCo2: Number(newTargetForm.targetEmission),
    });

    Object.entries(newTargetForm.deptTargets).forEach(([deptId, dt]) => {
      if (dt.baseline && dt.target) {
        addAnnualTarget({
          departmentId: deptId,
          year: currentYear,
          baselineEmissionTonCo2: Number(dt.baseline),
          targetEmissionTonCo2: Number(dt.target),
        });
      }
    });

    setShowNewTargetModal(false);
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
          <div className="flex items-center gap-3">
            {!companyTarget && (
              <button onClick={handleOpenNewTarget} className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" />
                新增年度目标
              </button>
            )}
            <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-1.5 border border-forest-100">
              <select
                value={currentYear}
                onChange={(e) => useCarbonStore.getState().setCurrentYear(e.target.value)}
                className="bg-transparent text-forest-700 font-medium focus:outline-none cursor-pointer"
              >
                {["2023", "2024", "2025", "2026", "2027"].map((y) => (
                  <option key={y} value={y}>{y}年</option>
                ))}
              </select>
            </div>
          </div>
        }
      />

      {!companyTarget && (
        <div className="card p-8 mb-6 animate-fade-in-up text-center" style={{ opacity: 0 }}>
          <div className="w-16 h-16 rounded-2xl bg-forest-50 flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-forest-400" />
          </div>
          <h3 className="font-display font-bold text-xl text-forest-800 mb-2">
            {currentYear}年度尚未设置减排目标
          </h3>
          <p className="text-forest-500 mb-5">
            请为{currentYear}年度设定基准排放量和目标排放量，系统将据此追踪减排进度
          </p>
          <button onClick={handleOpenNewTarget} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            新增{currentYear}年度目标
          </button>
        </div>
      )}

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

      {showNewTargetModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in-up">
            <div className="p-6 border-b border-forest-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-display font-bold text-xl text-forest-800">
                新增{currentYear}年度减排目标
              </h3>
              <button onClick={() => setShowNewTargetModal(false)} className="p-2 rounded-lg hover:bg-forest-50 text-forest-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="p-5 rounded-xl bg-forest-50/50 border border-forest-100">
                <h4 className="font-display font-bold text-lg text-forest-800 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-forest-600" />
                  企业整体目标
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">基准排放量（吨CO₂e） <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newTargetForm.baselineEmission}
                      onChange={(e) => setNewTargetForm({ ...newTargetForm, baselineEmission: e.target.value })}
                      placeholder="例如：3500"
                      className={`input-field ${newTargetErrors.baselineEmission ? "border-red-400" : ""}`}
                    />
                    {newTargetErrors.baselineEmission && (
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{newTargetErrors.baselineEmission}</p>
                    )}
                  </div>
                  <div>
                    <label className="label">目标排放量（吨CO₂e） <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newTargetForm.targetEmission}
                      onChange={(e) => setNewTargetForm({ ...newTargetForm, targetEmission: e.target.value })}
                      placeholder="例如：2800"
                      className={`input-field ${newTargetErrors.targetEmission ? "border-red-400" : ""}`}
                    />
                    {newTargetErrors.targetEmission && (
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{newTargetErrors.targetEmission}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-display font-bold text-lg text-forest-800 mb-3">部门分解目标（可选）</h4>
                <p className="text-sm text-forest-500 mb-4">
                  为各部门设定基准和目标排放量，未设定的部门将不生成部门目标
                </p>
                <div className="space-y-3">
                  {departmentsWithoutTarget.map((dept) => {
                    const dt = newTargetForm.deptTargets[dept.id] || { baseline: "", target: "" };
                    return (
                      <div key={dept.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                        <span className="font-medium text-slate-850 w-28 flex-shrink-0">{dept.name}</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={dt.baseline}
                          onChange={(e) => setNewTargetForm({
                            ...newTargetForm,
                            deptTargets: {
                              ...newTargetForm.deptTargets,
                              [dept.id]: { ...dt, baseline: e.target.value },
                            },
                          })}
                          placeholder="基准排放"
                          className={`input-field flex-1 text-sm ${newTargetErrors[`dept_baseline_${dept.id}`] ? "border-red-400" : ""}`}
                        />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={dt.target}
                          onChange={(e) => setNewTargetForm({
                            ...newTargetForm,
                            deptTargets: {
                              ...newTargetForm.deptTargets,
                              [dept.id]: { ...dt, target: e.target.value },
                            },
                          })}
                          placeholder="目标排放"
                          className={`input-field flex-1 text-sm ${newTargetErrors[`dept_target_${dept.id}`] ? "border-red-400" : ""}`}
                        />
                        {newTargetErrors[`dept_target_${dept.id}`] && (
                          <span className="text-xs text-red-500 flex-shrink-0">{newTargetErrors[`dept_target_${dept.id}`]}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-forest-100 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowNewTargetModal(false)} className="btn-secondary">
                取消
              </button>
              <button onClick={handleSaveNewTarget} className="btn-primary flex items-center gap-2">
                <Check className="w-4 h-4" />
                保存目标
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

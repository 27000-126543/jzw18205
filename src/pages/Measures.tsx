import React, { useState, useMemo } from "react";
import { Plus, Download, Pencil, Trash2, X, Check, Leaf, Zap, TreePine, Coins, Wrench } from "lucide-react";
import { useCarbonStore } from "@/store";
import { calculateTotalOffset } from "@/utils/calculator";
import { formatDate, formatEmission, formatCurrency } from "@/utils/format";
import { exportReductionMeasuresToExcel } from "@/utils/export";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import StatCard from "@/components/ui/StatCard";
import type { ReductionMeasure, ReductionType } from "@/types";

const reductionTypeConfig: Record<ReductionType, { label: string; icon: any; color: string }> = {
  green_energy: { label: "购买绿电", icon: Zap, color: "from-yellow-400 to-yellow-600" },
  afforestation: { label: "植树造林", icon: TreePine, color: "from-emerald-400 to-emerald-600" },
  carbon_credit: { label: "碳汇购买", icon: Coins, color: "from-blue-400 to-blue-600" },
  energy_efficiency: { label: "节能改造", icon: Wrench, color: "from-amber-400 to-amber-600" },
  other: { label: "其他措施", icon: Leaf, color: "from-slate-400 to-slate-600" },
};

export default function Measures() {
  const { reductionMeasures, departments, addReductionMeasure, updateReductionMeasure, deleteReductionMeasure } = useCarbonStore();
  const [showModal, setShowModal] = useState(false);
  const [editingMeasure, setEditingMeasure] = useState<ReductionMeasure | null>(null);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [formData, setFormData] = useState<{
    name: string;
    type: ReductionType;
    departmentId: string;
    offsetTonCo2: string;
    startDate: string;
    endDate: string;
    status: "planning" | "in_progress" | "completed";
    description: string;
    cost: string;
  }>({
    name: "",
    type: "green_energy",
    departmentId: "",
    offsetTonCo2: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    status: "planning",
    description: "",
    cost: "",
  });

  const totalOffset = useMemo(() => calculateTotalOffset(reductionMeasures), [reductionMeasures]);
  const plannedOffset = useMemo(
    () => calculateTotalOffset(reductionMeasures.filter((m) => m.status === "planning")),
    [reductionMeasures]
  );
  const completedOffset = useMemo(
    () => calculateTotalOffset(reductionMeasures.filter((m) => m.status === "completed")),
    [reductionMeasures]
  );
  const totalCost = useMemo(
    () => reductionMeasures.reduce((sum, m) => sum + (m.cost || 0), 0),
    [reductionMeasures]
  );

  const filteredMeasures = useMemo(() => {
    return [...reductionMeasures]
      .filter((m) => {
        if (filterType !== "all" && m.type !== filterType) return false;
        if (filterStatus !== "all" && m.status !== filterStatus) return false;
        return true;
      })
      .sort((a, b) => b.offsetTonCo2 - a.offsetTonCo2);
  }, [reductionMeasures, filterType, filterStatus]);

  const handleOpenModal = (measure?: ReductionMeasure) => {
    if (measure) {
      setEditingMeasure(measure);
      setFormData({
        name: measure.name,
        type: measure.type,
        departmentId: measure.departmentId,
        offsetTonCo2: measure.offsetTonCo2.toString(),
        startDate: measure.startDate,
        endDate: measure.endDate,
        status: measure.status,
        description: measure.description || "",
        cost: measure.cost?.toString() || "",
      });
    } else {
      setEditingMeasure(null);
      setFormData({
        name: "",
        type: "green_energy",
        departmentId: "",
        offsetTonCo2: "",
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date().toISOString().slice(0, 10),
        status: "planning",
        description: "",
        cost: "",
      });
    }
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.offsetTonCo2 || !formData.departmentId) return;

    if (editingMeasure) {
      updateReductionMeasure(editingMeasure.id, {
        ...formData,
        offsetTonCo2: Number(formData.offsetTonCo2),
        cost: formData.cost ? Number(formData.cost) : undefined,
      });
    } else {
      addReductionMeasure({
        ...formData,
        offsetTonCo2: Number(formData.offsetTonCo2),
        cost: formData.cost ? Number(formData.cost) : undefined,
      });
    }
    setShowModal(false);
  };

  return (
    <div>
      <PageHeader
        title="减排措施管理"
        subtitle="管理企业减排项目，追踪抵消量，计算净排放"
        actions={
          <>
            <button onClick={() => exportReductionMeasuresToExcel(reductionMeasures, departments)} className="btn-secondary flex items-center gap-2">
              <Download className="w-4 h-4" />
              导出数据
            </button>
            <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              新增措施
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard
          title="已实现抵消"
          value={formatEmission(completedOffset)}
          unit="吨CO₂e"
          icon={Leaf}
          gradient="from-forest-600 to-forest-400"
          delay={50}
        />
        <StatCard
          title="进行中抵消"
          value={formatEmission(totalOffset - completedOffset - plannedOffset)}
          unit="吨CO₂e"
          icon={Wrench}
          gradient="from-amber-500 to-amber-400"
          delay={100}
        />
        <StatCard
          title="规划中抵消"
          value={formatEmission(plannedOffset)}
          unit="吨CO₂e"
          icon={Zap}
          gradient="from-blue-500 to-blue-400"
          delay={150}
        />
        <StatCard
          title="总投入成本"
          value={formatCurrency(totalCost / 10000)}
          unit="万元"
          icon={Coins}
          gradient="from-forest-700 to-forest-500"
          delay={200}
        />
      </div>

      <div className="card p-4 mb-5">
        <div className="flex flex-wrap items-center gap-4">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="input-field max-w-[160px] py-2">
            <option value="all">全部类型</option>
            {Object.entries(reductionTypeConfig).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field max-w-[160px] py-2">
            <option value="all">全部状态</option>
            <option value="planning">规划中</option>
            <option value="in_progress">进行中</option>
            <option value="completed">已完成</option>
          </select>
          <div className="ml-auto text-sm text-forest-600">
            共 <span className="font-bold text-forest-700">{filteredMeasures.length}</span> 个减排项目
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMeasures.map((measure, idx) => {
          const dept = departments.find((d) => d.id === measure.departmentId);
          const typeConfig = reductionTypeConfig[measure.type] || reductionTypeConfig.other;
          const TypeIcon = typeConfig.icon;
          return (
            <div
              key={measure.id}
              className="card p-5 animate-fade-in-up"
              style={{ animationDelay: `${idx * 50}ms`, opacity: 0 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${typeConfig.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                    <TypeIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-display font-bold text-base text-forest-800 truncate">{measure.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={measure.type} type="type" />
                      <StatusBadge status={measure.status} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenModal(measure)}
                    className="p-1.5 rounded-lg text-forest-600 hover:bg-forest-50 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteReductionMeasure(measure.id)}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-forest-600">抵消排放量</span>
                  <span className="font-bold text-forest-700">{formatEmission(measure.offsetTonCo2)} 吨CO₂e</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-forest-600">负责部门</span>
                  <span className="text-sm text-slate-850 font-medium">{dept?.name || "-"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-forest-600">执行周期</span>
                  <span className="text-sm text-slate-850">{formatDate(measure.startDate)} ~ {formatDate(measure.endDate)}</span>
                </div>
                {measure.cost && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-forest-600">投入成本</span>
                    <span className="text-sm text-amber-600 font-medium">{formatCurrency(measure.cost)}</span>
                  </div>
                )}
              </div>

              {measure.description && (
                <p className="text-xs text-forest-600 bg-forest-50/50 rounded-lg p-3 line-clamp-3">
                  {measure.description}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-fade-in-up">
            <div className="p-6 border-b border-forest-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-display font-bold text-xl text-forest-800">
                {editingMeasure ? "编辑减排措施" : "新增减排措施"}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-forest-50 text-forest-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="label">项目名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入项目名称"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">措施类型</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as ReductionType })}
                    className="input-field"
                  >
                    {Object.entries(reductionTypeConfig).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">项目状态</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="input-field"
                  >
                    <option value="planning">规划中</option>
                    <option value="in_progress">进行中</option>
                    <option value="completed">已完成</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">负责部门</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="input-field"
                  >
                    <option value="">请选择部门</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">抵消量（吨CO₂e）</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.offsetTonCo2}
                    onChange={(e) => setFormData({ ...formData, offsetTonCo2: e.target.value })}
                    placeholder="请输入预计抵消量"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">开始日期</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">结束日期</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="label">投入成本（元，可选）</label>
                <input
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="请输入项目投入成本"
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">项目描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="请输入项目描述信息"
                  rows={3}
                  className="input-field resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-forest-100 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowModal(false)} className="btn-secondary">
                取消
              </button>
              <button onClick={handleSubmit} className="btn-primary flex items-center gap-2">
                <Check className="w-4 h-4" />
                {editingMeasure ? "保存修改" : "确认新增"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

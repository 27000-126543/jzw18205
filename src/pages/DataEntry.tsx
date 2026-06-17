import React, { useState, useMemo } from "react";
import { Plus, Download, Search, Pencil, Trash2, X, Check } from "lucide-react";
import { useCarbonStore } from "@/store";
import { emissionSources, emissionCategories } from "@/data/factors";
import { calculateEmission } from "@/utils/calculator";
import { formatDate, formatEmissionFull } from "@/utils/format";
import { downloadTemplate, exportEmissionRecordsToExcel } from "@/utils/export";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import type { EmissionRecord } from "@/types";

export default function DataEntry() {
  const { emissionRecords, departments, addEmissionRecord, updateEmissionRecord, deleteEmissionRecord } = useCarbonStore();
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EmissionRecord | null>(null);
  const [searchText, setSearchText] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const [formData, setFormData] = useState({
    departmentId: "",
    sourceId: "",
    quantity: "",
    periodYear: new Date().getFullYear().toString(),
    periodMonth: (new Date().getMonth() + 1).toString(),
    recordDate: new Date().toISOString().slice(0, 10),
    remark: "",
  });

  const sourceCategoryMap = useMemo(() => {
    const map = new Map<string, string>();
    emissionSources.forEach((s) => map.set(s.id, s.category));
    return map;
  }, []);

  const filteredRecords = useMemo(() => {
    return [...emissionRecords]
      .filter((r) => {
        if (filterDept !== "all" && r.departmentId !== filterDept) return false;
        if (filterCategory !== "all" && sourceCategoryMap.get(r.sourceId) !== filterCategory) return false;
        if (searchText) {
          const dept = departments.find((d) => d.id === r.departmentId)?.name || "";
          const source = emissionSources.find((s) => s.id === r.sourceId)?.name || "";
          if (!dept.includes(searchText) && !source.includes(searchText) && !r.remark?.includes(searchText)) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => b.recordDate.localeCompare(a.recordDate))
      .slice(0, 50);
  }, [emissionRecords, departments, filterDept, filterCategory, searchText, sourceCategoryMap]);

  const handleOpenModal = (record?: EmissionRecord) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        departmentId: record.departmentId,
        sourceId: record.sourceId,
        quantity: record.quantity.toString(),
        periodYear: record.periodYear,
        periodMonth: record.periodMonth,
        recordDate: record.recordDate,
        remark: record.remark || "",
      });
    } else {
      setEditingRecord(null);
      setFormData({
        departmentId: "",
        sourceId: "",
        quantity: "",
        periodYear: new Date().getFullYear().toString(),
        periodMonth: (new Date().getMonth() + 1).toString(),
        recordDate: new Date().toISOString().slice(0, 10),
        remark: "",
      });
    }
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!formData.departmentId || !formData.sourceId || !formData.quantity) return;

    const regionId = departments.find((d) => d.id === formData.departmentId)?.regionId || "bj";

    if (editingRecord) {
      updateEmissionRecord(editingRecord.id, {
        ...formData,
        quantity: Number(formData.quantity),
        regionId,
      });
    } else {
      addEmissionRecord({
        ...formData,
        quantity: Number(formData.quantity),
        regionId,
      });
    }
    setShowModal(false);
  };

  const selectedSource = emissionSources.find((s) => s.id === formData.sourceId);
  const estimatedEmission = formData.quantity && selectedSource
    ? calculateEmission(formData.sourceId, Number(formData.quantity))
    : 0;

  return (
    <div>
      <PageHeader
        title="碳排放数据录入"
        subtitle="管理各部门排放数据，支持批量导入与实时换算"
        actions={
          <>
            <button onClick={downloadTemplate} className="btn-secondary flex items-center gap-2">
              <Download className="w-4 h-4" />
              下载模板
            </button>
            <button onClick={() => exportEmissionRecordsToExcel(emissionRecords, departments)} className="btn-secondary flex items-center gap-2">
              <Download className="w-4 h-4" />
              导出数据
            </button>
            <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              新增记录
            </button>
          </>
        }
      />

      <div className="card p-4 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-400" />
            <input
              type="text"
              placeholder="搜索部门、排放源..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="input-field">
            <option value="all">全部部门</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="input-field">
            <option value="all">全部类别</option>
            {emissionCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div className="text-sm text-forest-600 flex items-center justify-end">
            共 {filteredRecords.length} 条记录
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-forest-50/50 border-b border-forest-100">
                <th className="px-5 py-3.5 text-left text-sm font-semibold text-forest-700">日期</th>
                <th className="px-5 py-3.5 text-left text-sm font-semibold text-forest-700">部门</th>
                <th className="px-5 py-3.5 text-left text-sm font-semibold text-forest-700">排放源类别</th>
                <th className="px-5 py-3.5 text-left text-sm font-semibold text-forest-700">排放源</th>
                <th className="px-5 py-3.5 text-right text-sm font-semibold text-forest-700">活动数据</th>
                <th className="px-5 py-3.5 text-right text-sm font-semibold text-forest-700">碳排放量</th>
                <th className="px-5 py-3.5 text-left text-sm font-semibold text-forest-700">备注</th>
                <th className="px-5 py-3.5 text-center text-sm font-semibold text-forest-700">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest-50">
              {filteredRecords.map((record) => {
                const dept = departments.find((d) => d.id === record.departmentId);
                const source = emissionSources.find((s) => s.id === record.sourceId);
                const category = emissionCategories.find((c) => c.id === source?.category);
                return (
                  <tr key={record.id} className="hover:bg-forest-50/30 transition-colors">
                    <td className="px-5 py-3.5 text-sm text-slate-850">{formatDate(record.recordDate)}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-850 font-medium">{dept?.name || record.departmentId}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={source?.category || "other"} type="type" />
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-850">{source?.name || record.sourceId}</td>
                    <td className="px-5 py-3.5 text-sm text-right text-slate-850">
                      {record.quantity.toLocaleString()} {source?.unit}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-right font-medium text-amber-600">
                      {formatEmissionFull(record.emissionTonCo2)} 吨
                    </td>
                    <td className="px-5 py-3.5 text-sm text-forest-600 max-w-[150px] truncate">{record.remark || "-"}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenModal(record)}
                          className="p-1.5 rounded-lg text-forest-600 hover:bg-forest-100 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteEmissionRecord(record.id)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in-up">
            <div className="p-6 border-b border-forest-100 flex items-center justify-between">
              <h3 className="font-display font-bold text-xl text-forest-800">
                {editingRecord ? "编辑排放记录" : "新增排放记录"}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-forest-50 text-forest-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">所属部门</label>
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
                  <label className="label">排放源</label>
                  <select
                    value={formData.sourceId}
                    onChange={(e) => setFormData({ ...formData, sourceId: e.target.value })}
                    className="input-field"
                  >
                    <option value="">请选择排放源</option>
                    {emissionSources.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">活动数据 {selectedSource && `(${selectedSource.unit})`}</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="请输入活动数据量"
                  className="input-field"
                />
                {estimatedEmission > 0 && (
                  <p className="mt-2 text-sm text-amber-600">
                    ≈ 预计排放 {formatEmissionFull(estimatedEmission)} 吨CO₂e
                    （因子：{selectedSource?.factorKgCo2PerUnit} kgCO₂e/{selectedSource?.unit}）
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">年份</label>
                  <select
                    value={formData.periodYear}
                    onChange={(e) => setFormData({ ...formData, periodYear: e.target.value })}
                    className="input-field"
                  >
                    {["2023", "2024", "2025", "2026"].map((y) => (
                      <option key={y} value={y}>{y}年</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">月份</label>
                  <select
                    value={formData.periodMonth}
                    onChange={(e) => setFormData({ ...formData, periodMonth: e.target.value })}
                    className="input-field"
                  >
                    {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((m) => (
                      <option key={m} value={m}>{m}月</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">记录日期</label>
                  <input
                    type="date"
                    value={formData.recordDate}
                    onChange={(e) => setFormData({ ...formData, recordDate: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="label">备注</label>
                <textarea
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  placeholder="可选：补充说明信息"
                  rows={2}
                  className="input-field resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-forest-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="btn-secondary">
                取消
              </button>
              <button onClick={handleSubmit} className="btn-primary flex items-center gap-2">
                <Check className="w-4 h-4" />
                {editingRecord ? "保存修改" : "确认新增"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

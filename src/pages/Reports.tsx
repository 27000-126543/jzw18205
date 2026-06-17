import React, { useMemo, useState } from "react";
import { Plus, Download, FileText, Calendar, Eye, FileSpreadsheet, Trash2, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useCarbonStore } from "@/store";
import {
  filterRecordsByPeriod,
  calculateTotalEmission,
  calculateTotalOffset,
  calculateNetEmission,
  calculateYoYChange,
  aggregateBySource,
  calculateTargetCompletion,
} from "@/utils/calculator";
import { formatEmission, formatDate, getQuarterLabel } from "@/utils/format";
import { exportReport as exportReportExcel } from "@/utils/export";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import CategoryPieChart from "@/components/charts/CategoryPieChart";
import type { EsgReport, ReportFramework, ReportSummary } from "@/types";
import { aggregateByCategory } from "@/utils/calculator";

export default function Reports() {
  const {
    reports,
    emissionRecords,
    reductionMeasures,
    departments,
    annualTargets,
    addReport,
    updateReport,
    deleteReport,
    currentYear,
  } = useCarbonStore();

  const [showPreview, setShowPreview] = useState<EsgReport | null>(null);

  const generateReportSummary = (report: EsgReport): ReportSummary => {
    const yearRecords = report.quarter
      ? emissionRecords.filter(
          (r) =>
            r.periodYear === report.year &&
            Math.ceil(Number(r.periodMonth) / 3) === report.quarter
        )
      : filterRecordsByPeriod(emissionRecords, report.year);

    const lastYearRecords = report.quarter
      ? emissionRecords.filter(
          (r) =>
            r.periodYear === String(Number(report.year) - 1) &&
            Math.ceil(Number(r.periodMonth) / 3) === report.quarter
        )
      : filterRecordsByPeriod(emissionRecords, String(Number(report.year) - 1));

    const total = calculateTotalEmission(yearRecords);
    const lastTotal = calculateTotalEmission(lastYearRecords);
    const offset = calculateTotalOffset(reductionMeasures);
    const net = calculateNetEmission(total, offset);
    const yoy = calculateYoYChange(total, lastTotal);

    const companyTarget = annualTargets.find((t) => t.departmentId === "all" && t.year === report.year);
    const completion = companyTarget ? calculateTargetCompletion(companyTarget, net) : 0;

    const sources = aggregateBySource(yearRecords).slice(0, 5);

    const totalEmissionAll = total;
    const topDepts = departments
      .map((d) => {
        const deptRecords = yearRecords.filter((r) => r.departmentId === d.id);
        return {
          name: d.name,
          value: Number(calculateTotalEmission(deptRecords).toFixed(2)),
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      totalEmission: total,
      netEmission: net,
      totalOffset: offset,
      targetCompletion: completion,
      yoyChange: yoy,
      topEmissionSources: sources,
      topEmissionDepartments: topDepts,
    };
  };

  const handleGenerateReport = (type: "quarterly" | "annual") => {
    const today = new Date();
    const year = today.getFullYear().toString();
    const quarter = Math.ceil((today.getMonth() + 1) / 3);

    const newReport: Omit<EsgReport, "id"> = {
      reportType: type,
      title:
        type === "quarterly"
          ? `${year}年第${quarter}季度ESG摘要`
          : `${year}年度ESG报告`,
      period: type === "quarterly" ? `${year}-Q${quarter}` : year,
      year,
      quarter: type === "quarterly" ? quarter : undefined,
      status: "draft",
      generatedAt: today.toISOString().slice(0, 10),
    };
    addReport(newReport);
  };

  const handleExport = (report: EsgReport, framework: ReportFramework) => {
    const summary = generateReportSummary(report);
    exportReportExcel(report, summary, framework);
    updateReport(report.id, { status: "exported", framework });
  };

  const handleFinalize = (reportId: string) => {
    updateReport(reportId, { status: "finalized" });
  };

  const sortedReports = useMemo(
    () => [...reports].sort((a, b) => b.generatedAt.localeCompare(a.generatedAt)),
    [reports]
  );

  const previewSummary = showPreview ? generateReportSummary(showPreview) : null;
  const previewCategoryData = showPreview
    ? aggregateByCategory(
        showPreview.quarter
          ? emissionRecords.filter(
              (r) =>
                r.periodYear === showPreview.year &&
                Math.ceil(Number(r.periodMonth) / 3) === showPreview.quarter
            )
          : filterRecordsByPeriod(emissionRecords, showPreview.year)
      )
    : [];

  return (
    <div>
      <PageHeader
        title="ESG报告中心"
        subtitle="自动生成ESG报告，支持GRI/CDP标准框架导出"
        actions={
          <>
            <button onClick={() => handleGenerateReport("quarterly")} className="btn-secondary flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              生成季度摘要
            </button>
            <button onClick={() => handleGenerateReport("annual")} className="btn-primary flex items-center gap-2">
              <FileText className="w-4 h-4" />
              生成年度报告
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sortedReports.map((report, idx) => {
          const summary = generateReportSummary(report);
          return (
            <div
              key={report.id}
              className="card p-5 animate-fade-in-up"
              style={{ animationDelay: `${idx * 60}ms`, opacity: 0 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 ${
                      report.reportType === "annual"
                        ? "bg-gradient-to-br from-forest-700 to-forest-500"
                        : "bg-gradient-to-br from-forest-500 to-forest-400"
                    }`}
                  >
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-display font-bold text-base text-forest-800 leading-tight">{report.title}</h4>
                    <div className="flex items-center gap-2 mt-1.5">
                      <StatusBadge status={report.reportType} type="type" />
                      <StatusBadge status={report.status} />
                      {report.framework && <StatusBadge status={report.framework} type="framework" />}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteReport(report.id)}
                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 p-3 rounded-xl bg-forest-50/50">
                <div>
                  <p className="text-xs text-forest-500">总排放</p>
                  <p className="font-bold text-forest-700">{formatEmission(summary.totalEmission)} 吨</p>
                </div>
                <div>
                  <p className="text-xs text-forest-500">净排放</p>
                  <p className="font-bold text-amber-600">{formatEmission(summary.netEmission)} 吨</p>
                </div>
                <div>
                  <p className="text-xs text-forest-500">目标完成</p>
                  <p className="font-bold text-forest-700">{summary.targetCompletion.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-forest-500">同比变化</p>
                  <p className={`font-bold ${summary.yoyChange <= 0 ? "text-forest-600" : "text-amber-600"}`}>
                    {summary.yoyChange > 0 ? "+" : ""}
                    {summary.yoyChange.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-forest-500 mb-4">
                <span>生成于 {formatDate(report.generatedAt)}</span>
                {report.reportType === "quarterly" && report.quarter && (
                  <span>{getQuarterLabel(report.quarter)}</span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowPreview(report)}
                  className="flex-1 btn-secondary py-2 text-sm flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  预览
                </button>
                {report.status === "draft" && (
                  <button
                    onClick={() => handleFinalize(report.id)}
                    className="flex-1 btn-outline py-2 text-sm flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    定稿
                  </button>
                )}
                <button
                  onClick={() => handleExport(report, "gri")}
                  className="btn-primary py-2 px-3 text-sm flex items-center justify-center gap-1.5"
                  title="导出GRI格式"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  GRI
                </button>
                <button
                  onClick={() => handleExport(report, "cdp")}
                  className="btn-primary py-2 px-3 text-sm flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600"
                  title="导出CDP格式"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  CDP
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showPreview && previewSummary && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fade-in-up">
            <div className="p-6 border-b border-forest-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-display font-bold text-2xl text-forest-800">{showPreview.title}</h3>
                <div className="flex items-center gap-3 mt-1.5">
                  <StatusBadge status={showPreview.reportType} type="type" />
                  <StatusBadge status={showPreview.status} />
                  <span className="text-sm text-forest-500">生成于 {formatDate(showPreview.generatedAt)}</span>
                </div>
              </div>
              <button onClick={() => setShowPreview(null)} className="p-2 rounded-lg hover:bg-forest-50 text-forest-500">
                <AlertCircle className="w-5 h-5" style={{ display: "none" }} />
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-forest-700 to-forest-500 text-white">
                  <p className="text-sm opacity-80">总排放量</p>
                  <p className="text-2xl font-display font-bold mt-1">{formatEmission(previewSummary.totalEmission)}</p>
                  <p className="text-xs opacity-70 mt-1">吨CO₂e</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-forest-500 to-forest-400 text-white">
                  <p className="text-sm opacity-80">抵消量</p>
                  <p className="text-2xl font-display font-bold mt-1">{formatEmission(previewSummary.totalOffset)}</p>
                  <p className="text-xs opacity-70 mt-1">吨CO₂e</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500 to-amber-400 text-white">
                  <p className="text-sm opacity-80">净排放量</p>
                  <p className="text-2xl font-display font-bold mt-1">{formatEmission(previewSummary.netEmission)}</p>
                  <p className="text-xs opacity-70 mt-1">吨CO₂e</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-400 text-white">
                  <p className="text-sm opacity-80">目标完成率</p>
                  <p className="text-2xl font-display font-bold mt-1">{previewSummary.targetCompletion.toFixed(1)}%</p>
                  <p className="text-xs opacity-70 mt-1">
                    同比 {previewSummary.yoyChange > 0 ? "+" : ""}
                    {previewSummary.yoyChange.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="p-5 rounded-xl bg-forest-50/50 border border-forest-100">
                  <h4 className="font-display font-bold text-forest-800 mb-4">排放结构</h4>
                  <CategoryPieChart
                    data={previewCategoryData.map((c) => ({ ...c, name: c.category }))}
                    height={220}
                  />
                </div>

                <div className="p-5 rounded-xl bg-forest-50/50 border border-forest-100">
                  <h4 className="font-display font-bold text-forest-800 mb-4">Top 5 排放源</h4>
                  <div className="space-y-2.5">
                    {previewSummary.topEmissionSources.map((s, i) => {
                      const total = previewSummary.topEmissionSources.reduce((sum, x) => sum + x.value, 0);
                      const pct = total > 0 ? (s.value / total * 100) : 0;
                      return (
                        <div key={s.name} className="flex items-center gap-3">
                          <span className="w-5 h-5 rounded-full bg-forest-600 text-white text-xs flex items-center justify-center font-bold">
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium text-slate-850 truncate">{s.name}</span>
                              <span className="text-forest-600 flex-shrink-0 ml-2">{formatEmission(s.value)} 吨</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-forest-100 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-forest-500 to-forest-400 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-forest-50/50 border border-forest-100">
                <h4 className="font-display font-bold text-forest-800 mb-4">Top 5 排放部门</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {previewSummary.topEmissionDepartments.map((d, i) => {
                    const total = previewSummary.topEmissionDepartments.reduce((sum, x) => sum + x.value, 0);
                    const pct = total > 0 ? (d.value / total * 100) : 0;
                    return (
                      <div key={d.name} className="flex items-center justify-between p-3 rounded-lg bg-white">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-forest-600 text-white text-sm flex items-center justify-center font-bold">
                            {i + 1}
                          </span>
                          <span className="font-medium text-slate-850">{d.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-forest-700">{formatEmission(d.value)} 吨</p>
                          <p className="text-xs text-forest-500">{pct.toFixed(1)}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-forest-100 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowPreview(null)} className="btn-secondary">
                关闭
              </button>
              <button onClick={() => handleExport(showPreview, "gri")} className="btn-primary flex items-center gap-2">
                <Download className="w-4 h-4" />
                导出 GRI 格式
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

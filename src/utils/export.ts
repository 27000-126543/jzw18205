import * as XLSX from "xlsx";
import type {
  EmissionRecord,
  ReductionMeasure,
  EsgReport,
  ReportSummary,
  ReportFramework,
} from "@/types";
import { emissionSources, emissionCategories } from "@/data/factors";
import { calculateEmission } from "./calculator";
import { formatDate } from "./format";

export interface ImportRow {
  部门?: string;
  排放源?: string;
  排放源名称?: string;
  活动数据?: number | string;
  数量?: number | string;
  年份?: string | number;
  所属年份?: string | number;
  月份?: string | number;
  所属月份?: string | number;
  日期?: string;
  记录日期?: string;
  备注?: string;
  [key: string]: any;
}

export interface ImportResult {
  success: Omit<EmissionRecord, "id" | "emissionTonCo2">[];
  errors: { row: number; message: string }[];
  count: number;
}

export function importEmissionRecordsFromExcel(
  file: File,
  departments: { id: string; name: string; regionId?: string }[]
): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<ImportRow>(ws);

        const deptNameToId = new Map(departments.map((d) => [d.name.trim(), d.id]));
        const sourceNameToId = new Map(emissionSources.map((s) => [s.name.trim(), s.id]));
        const sourceUnitToId = new Map(
          emissionSources.map((s) => [`${s.name}(${s.unit})`.trim(), s.id])
        );

        const success: Omit<EmissionRecord, "id" | "emissionTonCo2">[] = [];
        const errors: { row: number; message: string }[] = [];

        rows.forEach((row, idx) => {
          const rowNum = idx + 2;
          try {
            const deptName = (row["部门"] || "").toString().trim();
            const sourceName = (row["排放源"] || row["排放源名称"] || "").toString().trim();
            let quantityRaw = row["活动数据"] ?? row["数量"] ?? "";
            const year = (row["年份"] || row["所属年份"] || new Date().getFullYear()).toString();
            const month = (row["月份"] || row["所属月份"] || new Date().getMonth() + 1).toString();
            const recordDate = (row["日期"] || row["记录日期"] || new Date().toISOString().slice(0, 10)).toString().trim();
            const remark = row["备注"]?.toString().trim() || "";

            const departmentId = deptNameToId.get(deptName);
            if (!departmentId) {
              errors.push({ row: rowNum, message: `部门"${deptName}"不存在，请先在系统中创建` });
              return;
            }

            let sourceId = sourceNameToId.get(sourceName) || sourceUnitToId.get(sourceName);
            if (!sourceId) {
              const found = emissionSources.find((s) => sourceName.includes(s.name) || s.name.includes(sourceName));
              sourceId = found?.id;
            }
            if (!sourceId) {
              errors.push({ row: rowNum, message: `排放源"${sourceName}"不匹配，请参考模板中的排放源名称` });
              return;
            }

            const quantity = typeof quantityRaw === "number" ? quantityRaw : Number(String(quantityRaw).replace(/[,，]/g, ""));
            if (!quantity || quantity <= 0 || isNaN(quantity)) {
              errors.push({ row: rowNum, message: `活动数据"${quantityRaw}"无效，必须为大于0的数字` });
              return;
            }

            const yearNum = Number(year);
            const monthNum = Number(month);
            if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
              errors.push({ row: rowNum, message: `年份"${year}"无效，请输入合理的四位数年份` });
              return;
            }
            if (isNaN(monthNum) || monthNum < 1 || monthNum > 12 || !Number.isInteger(monthNum)) {
              errors.push({ row: rowNum, message: `月份"${month}"无效，必须为1-12的整数` });
              return;
            }

            let finalRecordDate = recordDate;
            if (finalRecordDate && /^\d{4}-\d{1,2}-\d{1,2}$/.test(finalRecordDate)) {
              const dateParts = finalRecordDate.split("-");
              const dYear = Number(dateParts[0]);
              const dMonth = Number(dateParts[1]);
              const dDay = Number(dateParts[2]);
              const daysInMonth = new Date(dYear, dMonth, 0).getDate();
              if (dDay < 1 || dDay > daysInMonth) {
                errors.push({ row: rowNum, message: `日期"${finalRecordDate}"无效，${dYear}年${dMonth}月没有${dDay}日` });
                return;
              }
              if (dYear !== yearNum) {
                errors.push({ row: rowNum, message: `日期所属年份(${dYear})与"年份"列(${yearNum})不一致` });
                return;
              }
              if (dMonth !== monthNum) {
                errors.push({ row: rowNum, message: `日期所属月份(${dMonth}月)与"月份"列(${monthNum}月)不一致` });
                return;
              }
            } else if (finalRecordDate) {
              errors.push({ row: rowNum, message: `日期格式"${finalRecordDate}"无效，请使用YYYY-MM-DD格式` });
              return;
            }

            const regionId = departments.find((d) => d.id === departmentId)?.regionId || "bj";

            success.push({
              departmentId,
              regionId,
              sourceId,
              quantity,
              periodYear: year,
              periodMonth: month,
              recordDate: finalRecordDate || `${year}-${String(month).padStart(2, "0")}-01`,
              remark,
            });
          } catch (err: any) {
            errors.push({ row: rowNum, message: err.message || "解析失败" });
          }
        });

        resolve({ success, errors, count: success.length });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("读取文件失败"));
    reader.readAsArrayBuffer(file);
  });
}

const griDisclosures = [
  { disclosure: "GRI 302-1", description: "组织范围内的能源消耗" },
  { disclosure: "GRI 302-2", description: "组织范围内的能源强度" },
  { disclosure: "GRI 302-3", description: "节能措施与节能效果" },
  { disclosure: "GRI 302-4", description: "可再生能源使用" },
  { disclosure: "GRI 302-5", description: "减少能源消耗的要求" },
  { disclosure: "GRI 305-1", description: "组织范围内的直接（范畴1）温室气体排放" },
  { disclosure: "GRI 305-2", description: "组织范围内的能源间接（范畴2）温室气体排放" },
  { disclosure: "GRI 305-3", description: "其他间接（范畴3）温室气体排放" },
  { disclosure: "GRI 305-4", description: "温室气体排放强度" },
  { disclosure: "GRI 305-5", description: "温室气体减排措施及效果" },
  { disclosure: "GRI 306-1", description: "废弃物产生与处理方式" },
  { disclosure: "GRI 306-2", description: "废弃物相关影响" },
];

const cdpQuestions = [
  { question: "CC0.1 / C0.1 请介绍您的组织" },
  { question: "CC0.2 请说明您的报告边界" },
  { question: "C1.1 请描述您的公司范围内的排放数据覆盖情况" },
  { question: "C2.1 请披露您的组织的范畴1和范畴2温室气体排放" },
  { question: "C4.1 请描述您的温室气体减排目标" },
  { question: "C4.2 请描述实现目标的具体措施" },
  { question: "C6.1 请描述气候相关风险与机遇" },
  { question: "C6.3 请描述气候风险对业务的财务影响" },
];

export function exportEmissionRecordsToExcel(records: EmissionRecord[], departments: any[]): void {
  const deptMap = new Map(departments.map((d) => [d.id, d.name]));
  const sourceMap = new Map(emissionSources.map((s) => [s.id, `${s.name}(${s.unit})`]));

  const data = records.map((r) => ({
    日期: r.recordDate,
    所属年份: r.periodYear,
    所属月份: r.periodMonth,
    部门: deptMap.get(r.departmentId) || r.departmentId,
    排放源: sourceMap.get(r.sourceId) || r.sourceId,
    活动数据: r.quantity,
    碳排放量: r.emissionTonCo2.toFixed(4),
    备注: r.remark || "",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [
    { wch: 15 },
    { wch: 10 },
    { wch: 10 },
    { wch: 15 },
    { wch: 20 },
    { wch: 12 },
    { wch: 15 },
    { wch: 25 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "排放数据");
  XLSX.writeFile(wb, `碳排放数据_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportReductionMeasuresToExcel(measures: ReductionMeasure[], departments: any[]): void {
  const deptMap = new Map(departments.map((d) => [d.id, d.name]));
  const typeMap: Record<string, string> = {
    green_energy: "购买绿电",
    afforestation: "植树造林",
    carbon_credit: "碳汇购买",
    energy_efficiency: "节能改造",
    other: "其他措施",
  };
  const statusMap: Record<string, string> = {
    planning: "规划中",
    in_progress: "进行中",
    completed: "已完成",
  };

  const data = measures.map((m) => ({
    项目名称: m.name,
    类型: typeMap[m.type],
    负责部门: deptMap.get(m.departmentId) || m.departmentId,
    抵消量_吨CO2e: m.offsetTonCo2,
    开始日期: formatDate(m.startDate),
    结束日期: formatDate(m.endDate),
    状态: statusMap[m.status],
    投入成本: m.cost ? `${m.cost.toLocaleString()}元` : "",
    描述: m.description || "",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [
    { wch: 25 },
    { wch: 12 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 10 },
    { wch: 15 },
    { wch: 40 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "减排措施");
  XLSX.writeFile(wb, `减排措施_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportReport(report: EsgReport, summary: ReportSummary, framework: ReportFramework): void {
  const wb = XLSX.utils.book_new();

  const summaryData = [
    { 指标: "报告期", 数值: report.period },
    { 指标: "总排放量", 数值: `${summary.totalEmission.toFixed(2)} 吨CO₂e` },
    { 指标: "减排抵消量", 数值: `${summary.totalOffset.toFixed(2)} 吨CO₂e` },
    { 指标: "净排放量", 数值: `${summary.netEmission.toFixed(2)} 吨CO₂e` },
    { 指标: "目标完成率", 数值: `${summary.targetCompletion.toFixed(1)}%` },
    { 指标: "同比变化", 数值: `${summary.yoyChange > 0 ? "+" : ""}${summary.yoyChange.toFixed(1)}%` },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  wsSummary["!cols"] = [{ wch: 20 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "报告摘要");

  const sourceData = summary.topEmissionSources.map((s) => ({
    主要排放源: s.name,
    排放量: `${s.value.toFixed(2)} 吨CO₂e`,
  }));
  const wsSources = XLSX.utils.json_to_sheet(sourceData);
  wsSources["!cols"] = [{ wch: 25 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsSources, "主要排放源");

  if (framework === "gri") {
    const griData = griDisclosures.map((d, idx) => ({
      GRI披露项: d.disclosure,
      说明: d.description,
      数值: idx < 5 ? `${summary.totalEmission.toFixed(2)}` : "",
      单位: idx < 5 ? "吨CO₂e" : "",
    }));
    const wsGRI = XLSX.utils.json_to_sheet(griData);
    wsGRI["!cols"] = [{ wch: 18 }, { wch: 50 }, { wch: 20 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsGRI, "GRI标准披露");
  } else {
    const cdpData = cdpQuestions.map((q, idx) => ({
      CDP问题: q.question,
      回复:
        idx === 2
          ? `组织${report.year}年度温室气体排放总量为${summary.totalEmission.toFixed(2)}吨CO₂e，较去年${summary.yoyChange > 0 ? "增加" : "减少"}${Math.abs(summary.yoyChange).toFixed(1)}%`
          : "详见报告正文",
    }));
    const wsCDP = XLSX.utils.json_to_sheet(cdpData);
    wsCDP["!cols"] = [{ wch: 50 }, { wch: 70 }];
    XLSX.utils.book_append_sheet(wb, wsCDP, "CDP问卷回复");
  }

  XLSX.writeFile(wb, `${report.title}_${framework.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function downloadTemplate(): void {
  const dataRows = [
    {
      部门: "技术研发部",
      排放源: "电力",
      活动数据: 15000,
      年份: new Date().getFullYear(),
      月份: 1,
      日期: `${new Date().getFullYear()}-01-15`,
      备注: "1月办公用电",
    },
    {
      部门: "市场营销部",
      排放源: "航空-国内",
      活动数据: 3500,
      年份: new Date().getFullYear(),
      月份: 1,
      日期: `${new Date().getFullYear()}-01-20`,
      备注: "出差飞行里程",
    },
  ];
  const templateWs = XLSX.utils.json_to_sheet(dataRows);
  templateWs["!cols"] = [
    { wch: 15 },
    { wch: 18 },
    { wch: 12 },
    { wch: 8 },
    { wch: 8 },
    { wch: 14 },
    { wch: 25 },
  ];

  const categoryNames: Record<string, string> = {
    energy: "能源消耗",
    transport: "差旅交通",
    materials: "办公耗材",
    waste: "废弃物处理",
  };
  const refData = emissionSources.map((s) => ({
    排放源类别: categoryNames[s.category] || "",
    排放源名称: s.name,
    单位: s.unit,
    碳排放因子_kgCO2e: s.factorKgCo2PerUnit,
  }));
  const refWs = XLSX.utils.json_to_sheet(refData);
  refWs["!cols"] = [{ wch: 15 }, { wch: 20 }, { wch: 10 }, { wch: 18 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, templateWs, "数据录入模板");
  XLSX.utils.book_append_sheet(wb, refWs, "排放源参考");
  XLSX.writeFile(wb, "碳排放数据录入模板.xlsx");
}

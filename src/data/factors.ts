import type { EmissionSource, EmissionCategory } from "@/types";

export const emissionCategories: { id: EmissionCategory; name: string; icon: string }[] = [
  { id: "energy", name: "能源消耗", icon: "Zap" },
  { id: "transport", name: "差旅交通", icon: "Plane" },
  { id: "materials", name: "办公耗材", icon: "FileText" },
  { id: "waste", name: "废弃物处理", icon: "Trash2" },
];

export const emissionSources: EmissionSource[] = [
  { id: "elec", name: "电力", category: "energy", factorKgCo2PerUnit: 0.581, unit: "kWh" },
  { id: "gas", name: "天然气", category: "energy", factorKgCo2PerUnit: 2.1622, unit: "m³" },
  { id: "gasoline", name: "汽油", category: "energy", factorKgCo2PerUnit: 2.29, unit: "L" },
  { id: "diesel", name: "柴油", category: "energy", factorKgCo2PerUnit: 2.63, unit: "L" },
  { id: "flight_dom", name: "航空-国内", category: "transport", factorKgCo2PerUnit: 0.255, unit: "km" },
  { id: "flight_intl", name: "航空-国际", category: "transport", factorKgCo2PerUnit: 0.186, unit: "km" },
  { id: "rail", name: "铁路", category: "transport", factorKgCo2PerUnit: 0.041, unit: "km" },
  { id: "road", name: "公路-客车", category: "transport", factorKgCo2PerUnit: 0.089, unit: "km" },
  { id: "paper_a4", name: "纸张-A4", category: "materials", factorKgCo2PerUnit: 3.3, unit: "包" },
  { id: "ink_cartridge", name: "墨盒", category: "materials", factorKgCo2PerUnit: 0.5, unit: "个" },
  { id: "waste_general", name: "一般垃圾", category: "waste", factorKgCo2PerUnit: 0.42, unit: "kg" },
  { id: "waste_recycle", name: "可回收物", category: "waste", factorKgCo2PerUnit: 0.1, unit: "kg" },
];

export const reductionTypeLabels: Record<string, string> = {
  green_energy: "购买绿电",
  afforestation: "植树造林",
  carbon_credit: "碳汇购买",
  energy_efficiency: "节能改造",
  other: "其他措施",
};

export const measureStatusLabels: Record<string, string> = {
  planning: "规划中",
  in_progress: "进行中",
  completed: "已完成",
};

export const reportTypeLabels: Record<string, string> = {
  quarterly: "季度摘要",
  annual: "年度报告",
};

export const reportStatusLabels: Record<string, string> = {
  draft: "草稿",
  finalized: "已定稿",
  exported: "已导出",
};

export const frameworkLabels: Record<string, string> = {
  gri: "GRI 标准",
  cdp: "CDP 问卷",
};

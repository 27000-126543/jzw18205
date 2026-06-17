export interface Department {
  id: string;
  name: string;
  manager: string;
  regionId: string;
}

export interface Region {
  id: string;
  name: string;
  province: string;
}

export interface EmissionSource {
  id: string;
  name: string;
  category: EmissionCategory;
  factorKgCo2PerUnit: number;
  unit: string;
}

export type EmissionCategory =
  | "energy"
  | "transport"
  | "materials"
  | "waste";

export interface EmissionRecord {
  id: string;
  departmentId: string;
  regionId: string;
  sourceId: string;
  quantity: number;
  emissionTonCo2: number;
  periodYear: string;
  periodMonth: string;
  recordDate: string;
  remark?: string;
}

export type ReductionType = "green_energy" | "afforestation" | "carbon_credit" | "energy_efficiency" | "other";

export interface ReductionMeasure {
  id: string;
  name: string;
  type: ReductionType;
  departmentId: string;
  offsetTonCo2: number;
  startDate: string;
  endDate: string;
  status: "planning" | "in_progress" | "completed";
  description?: string;
  cost?: number;
}

export interface AnnualTarget {
  id: string;
  departmentId: string;
  year: string;
  targetEmissionTonCo2: number;
  baselineEmissionTonCo2: number;
}

export type ReportType = "quarterly" | "annual";
export type ReportFramework = "gri" | "cdp";
export type ReportStatus = "draft" | "finalized" | "exported";

export interface EsgReport {
  id: string;
  reportType: ReportType;
  title: string;
  period: string;
  year: string;
  quarter?: number;
  status: ReportStatus;
  generatedAt: string;
  framework?: ReportFramework;
  summary?: ReportSummary;
}

export interface ReportSummary {
  totalEmission: number;
  netEmission: number;
  totalOffset: number;
  targetCompletion: number;
  yoyChange: number;
  topEmissionSources: { name: string; value: number }[];
  topEmissionDepartments: { name: string; value: number }[];
}

export interface MonthlyTrend {
  month: string;
  emission: number;
  lastYearEmission: number;
}

export interface CategoryBreakdown {
  category: string;
  value: number;
  percentage: number;
}

export interface DepartmentEmission {
  departmentId: string;
  departmentName: string;
  emission: number;
  percentage: number;
}

export interface YearlyComparison {
  year: string;
  totalEmission: number;
  netEmission: number;
  offset: number;
}

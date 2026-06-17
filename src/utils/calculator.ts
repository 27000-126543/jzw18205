import type { EmissionRecord, ReductionMeasure, AnnualTarget } from "@/types";
import { emissionSources } from "@/data/factors";

export function calculateEmission(sourceId: string, quantity: number): number {
  const source = emissionSources.find((s) => s.id === sourceId);
  if (!source) return 0;
  return Number((quantity * source.factorKgCo2PerUnit / 1000).toFixed(4));
}

export function calculateTotalEmission(records: EmissionRecord[]): number {
  return Number(records.reduce((sum, r) => sum + r.emissionTonCo2, 0).toFixed(2));
}

export function calculateTotalOffset(measures: ReductionMeasure[]): number {
  return Number(
    measures
      .filter((m) => m.status !== "planning")
      .reduce((sum, m) => sum + m.offsetTonCo2, 0)
      .toFixed(2)
  );
}

export function calculateNetEmission(
  totalEmission: number,
  totalOffset: number
): number {
  return Number(Math.max(0, totalEmission - totalOffset).toFixed(2));
}

export function calculateTargetCompletion(
  target: AnnualTarget,
  actualEmission: number
): number {
  const reductionNeeded = target.baselineEmissionTonCo2 - target.targetEmissionTonCo2;
  const actualReduction = target.baselineEmissionTonCo2 - actualEmission;
  if (reductionNeeded <= 0) return 100;
  return Number(Math.min(100, Math.max(0, (actualReduction / reductionNeeded) * 100)).toFixed(1));
}

export function calculateYoYChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

export function calculateEmissionIntensity(emission: number, revenue: number): number {
  if (revenue === 0) return 0;
  return Number((emission / revenue * 1000000).toFixed(2));
}

export function filterRecordsByPeriod(
  records: EmissionRecord[],
  year: string,
  month?: string
): EmissionRecord[] {
  return records.filter((r) => {
    if (r.periodYear !== year) return false;
    if (month && r.periodMonth !== month) return false;
    return true;
  });
}

export function filterRecordsByDepartment(
  records: EmissionRecord[],
  departmentId: string
): EmissionRecord[] {
  if (departmentId === "all") return records;
  return records.filter((r) => r.departmentId === departmentId);
}

export function aggregateBySource(
  records: EmissionRecord[]
): { sourceId: string; name: string; value: number }[] {
  const map = new Map<string, number>();
  records.forEach((r) => {
    const source = emissionSources.find((s) => s.id === r.sourceId);
    const name = source?.name || r.sourceId;
    map.set(name, (map.get(name) || 0) + r.emissionTonCo2);
  });
  return Array.from(map.entries())
    .map(([name, value]) => ({ sourceId: "", name, value: Number(value.toFixed(2)) }))
    .sort((a, b) => b.value - a.value);
}

export function aggregateByCategory(
  records: EmissionRecord[]
): { category: string; value: number; percentage: number }[] {
  const categoryMap = new Map<string, number>();
  let total = 0;

  records.forEach((r) => {
    const source = emissionSources.find((s) => s.id === r.sourceId);
    const category = source?.category || "other";
    const categoryNames: Record<string, string> = {
      energy: "能源消耗",
      transport: "差旅交通",
      materials: "办公耗材",
      waste: "废弃物处理",
      other: "其他",
    };
    const name = categoryNames[category] || category;
    categoryMap.set(name, (categoryMap.get(name) || 0) + r.emissionTonCo2);
    total += r.emissionTonCo2;
  });

  return Array.from(categoryMap.entries())
    .map(([category, value]) => ({
      category,
      value: Number(value.toFixed(2)),
      percentage: total > 0 ? Number((value / total * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

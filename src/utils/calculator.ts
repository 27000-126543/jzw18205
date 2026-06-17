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

export function filterMeasuresByPeriod(
  measures: ReductionMeasure[],
  year: string,
  quarter?: number
): ReductionMeasure[] {
  return measures.filter((m) => {
    if (m.status === "planning") return false;
    const startYear = m.startDate.slice(0, 4);
    const endYear = m.endDate.slice(0, 4);
    if (startYear > year || endYear < year) return false;
    if (quarter) {
      const startMonth = Number(m.startDate.slice(5, 7));
      const endMonth = Number(m.endDate.slice(5, 7));
      const startQ = Math.ceil(startMonth / 3) || 1;
      const endQ = Math.ceil(endMonth / 3) || 4;
      if (startYear === year && endYear === year) {
        return quarter >= startQ && quarter <= endQ;
      }
      if (startYear === year) return quarter >= startQ;
      if (endYear === year) return quarter <= endQ;
    }
    return true;
  });
}

export function calculateOffsetByPeriod(
  measures: ReductionMeasure[],
  year: string,
  quarter?: number
): number {
  const filtered = filterMeasuresByPeriod(measures, year, quarter);
  if (!quarter) {
    return calculateTotalOffset(filtered);
  }

  const quarterMonths: Record<number, [number, number]> = {
    1: [1, 3],
    2: [4, 6],
    3: [7, 9],
    4: [10, 12],
  };
  const [qStartMonth, qEndMonth] = quarterMonths[quarter] || [1, 3];
  const qStart = new Date(`${year}-${String(qStartMonth).padStart(2, "0")}-01`);
  const qEnd = new Date(`${year}-${String(qEndMonth).padStart(2, "0")}-${new Date(Number(year), qEndMonth, 0).getDate()}`);

  const qTotalDays = (qEnd.getTime() - qStart.getTime()) / (86400000) + 1;

  let offset = 0;
  for (const m of filtered) {
    const mStart = new Date(m.startDate);
    const mEnd = new Date(m.endDate);
    const overlapStart = mStart < qStart ? qStart : mStart;
    const overlapEnd = mEnd > qEnd ? qEnd : mEnd;
    if (overlapStart > overlapEnd) continue;
    const overlapDays = (overlapEnd.getTime() - overlapStart.getTime()) / 86400000 + 1;
    const mTotalDays = (mEnd.getTime() - mStart.getTime()) / 86400000 + 1;
    const ratio = mTotalDays > 0 ? overlapDays / mTotalDays : 1;
    offset += m.offsetTonCo2 * ratio;
  }

  return Number(offset.toFixed(2));
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

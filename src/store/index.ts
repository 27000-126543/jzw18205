import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Department,
  Region,
  EmissionRecord,
  ReductionMeasure,
  AnnualTarget,
  EsgReport,
  ReportFramework,
} from "@/types";
import {
  mockDepartments,
  mockRegions,
  mockEmissionRecords,
  mockReductionMeasures,
  mockAnnualTargets,
  mockReports,
} from "@/data/mock";
import { generateId } from "@/utils/format";
import { calculateEmission } from "@/utils/calculator";

interface CarbonStore {
  departments: Department[];
  regions: Region[];
  emissionRecords: EmissionRecord[];
  reductionMeasures: ReductionMeasure[];
  annualTargets: AnnualTarget[];
  reports: EsgReport[];
  currentYear: string;
  addEmissionRecord: (record: Omit<EmissionRecord, "id" | "emissionTonCo2">) => void;
  updateEmissionRecord: (id: string, record: Partial<EmissionRecord>) => void;
  deleteEmissionRecord: (id: string) => void;
  addReductionMeasure: (measure: Omit<ReductionMeasure, "id">) => void;
  updateReductionMeasure: (id: string, measure: Partial<ReductionMeasure>) => void;
  deleteReductionMeasure: (id: string) => void;
  addAnnualTarget: (target: Omit<AnnualTarget, "id">) => void;
  updateAnnualTarget: (id: string, target: Partial<AnnualTarget>) => void;
  addReport: (report: Omit<EsgReport, "id">) => void;
  updateReport: (id: string, report: Partial<EsgReport>) => void;
  deleteReport: (id: string) => void;
  setCurrentYear: (year: string) => void;
  exportReport: (reportId: string, framework: ReportFramework) => void;
  resetData: () => void;
}

export const useCarbonStore = create<CarbonStore>()(
  persist(
    (set, get) => ({
      departments: mockDepartments,
      regions: mockRegions,
      emissionRecords: mockEmissionRecords,
      reductionMeasures: mockReductionMeasures,
      annualTargets: mockAnnualTargets,
      reports: mockReports,
      currentYear: "2025",

      addEmissionRecord: (record) =>
        set((state) => {
          const emission = calculateEmission(record.sourceId, record.quantity);
          const newRecord: EmissionRecord = {
        ...record,
        id: generateId(),
        emissionTonCo2: emission,
      };
          return { emissionRecords: [...state.emissionRecords, newRecord] };
        }),

      updateEmissionRecord: (id, record) =>
        set((state) => ({
          emissionRecords: state.emissionRecords.map((r) =>
            r.id === id
              ? {
                  ...r,
                  ...record,
                  emissionTonCo2:
                    record.sourceId && record.quantity
                      ? calculateEmission(record.sourceId, record.quantity)
                      : r.emissionTonCo2,
                }
              : r
          ),
        })),

      deleteEmissionRecord: (id) =>
        set((state) => ({
          emissionRecords: state.emissionRecords.filter((r) => r.id !== id),
        })),

      addReductionMeasure: (measure) =>
        set((state) => ({
          reductionMeasures: [...state.reductionMeasures, { ...measure, id: generateId() }],
        })),

      updateReductionMeasure: (id, measure) =>
        set((state) => ({
          reductionMeasures: state.reductionMeasures.map((m) =>
            m.id === id ? { ...m, ...measure } : m
          ),
        })),

      deleteReductionMeasure: (id) =>
        set((state) => ({
          reductionMeasures: state.reductionMeasures.filter((m) => m.id !== id),
        })),

      addAnnualTarget: (target) =>
        set((state) => ({
          annualTargets: [...state.annualTargets, { ...target, id: generateId() }],
        })),

      updateAnnualTarget: (id, target) =>
        set((state) => ({
          annualTargets: state.annualTargets.map((t) =>
            t.id === id ? { ...t, ...target } : t
          ),
        })),

      addReport: (report) =>
        set((state) => ({
          reports: [...state.reports, { ...report, id: generateId() }],
        })),

      updateReport: (id, report) =>
        set((state) => ({
          reports: state.reports.map((r) =>
            r.id === id ? { ...r, ...report } : r
          ),
        })),

      deleteReport: (id) =>
        set((state) => ({
          reports: state.reports.filter((r) => r.id !== id),
        })),

      setCurrentYear: (year) => set({ currentYear: year }),

      exportReport: () => {},

      resetData: () =>
        set({
          emissionRecords: mockEmissionRecords,
          reductionMeasures: mockReductionMeasures,
          annualTargets: mockAnnualTargets,
          reports: mockReports,
        }),
    }),
    {
      name: "carbon-tracker-storage",
      partialize: (state) => ({
        emissionRecords: state.emissionRecords,
        reductionMeasures: state.reductionMeasures,
        annualTargets: state.annualTargets,
        reports: state.reports,
      }),
    }
  )
);

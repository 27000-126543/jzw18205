import type {
  Department,
  Region,
  EmissionRecord,
  ReductionMeasure,
  AnnualTarget,
  EsgReport,
} from "@/types";

export const mockRegions: Region[] = [
  { id: "bj", name: "北京总部", province: "北京市" },
  { id: "sh", name: "上海分公司", province: "上海市" },
  { id: "gz", name: "广州分公司", province: "广东省" },
  { id: "cd", name: "成都分公司", province: "四川省" },
];

export const mockDepartments: Department[] = [
  { id: "tech", name: "技术研发部", manager: "张伟", regionId: "bj" },
  { id: "market", name: "市场营销部", manager: "李娜", regionId: "bj" },
  { id: "hr", name: "人力资源部", manager: "王芳", regionId: "bj" },
  { id: "finance", name: "财务部", manager: "刘强", regionId: "bj" },
  { id: "ops", name: "运营部", manager: "陈静", regionId: "sh" },
  { id: "sales", name: "销售部", manager: "赵磊", regionId: "gz" },
];

const generateEmissionRecords = (): EmissionRecord[] => {
  const records: EmissionRecord[] = [];
  const sources = ["elec", "gas", "gasoline", "diesel", "flight_dom", "rail", "paper_a4", "waste_general"];
  const departments = ["tech", "market", "hr", "finance", "ops", "sales"];
  const sourceFactors: Record<string, number> = {
    elec: 0.581,
    gas: 2.1622,
    gasoline: 2.29,
    diesel: 2.63,
    flight_dom: 0.255,
    rail: 0.041,
    paper_a4: 3.3,
    waste_general: 0.42,
  };

  for (let year = 2023; year <= 2025; year++) {
    for (let month = 1; month <= (year === 2025 ? 6 : 12); month++) {
      departments.forEach((dept) => {
        const numRecords = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < numRecords; i++) {
          const sourceId = sources[Math.floor(Math.random() * sources.length)];
          const factor = sourceFactors[sourceId] || 1;
          let quantity: number;
          switch (sourceId) {
            case "elec":
              quantity = Math.floor(Math.random() * 8000) + 2000;
              break;
            case "gas":
              quantity = Math.floor(Math.random() * 500) + 100;
              break;
            case "gasoline":
            case "diesel":
              quantity = Math.floor(Math.random() * 300) + 50;
              break;
            case "flight_dom":
              quantity = Math.floor(Math.random() * 5000) + 500;
              break;
            case "rail":
              quantity = Math.floor(Math.random() * 2000) + 200;
              break;
            case "paper_a4":
              quantity = Math.floor(Math.random() * 50) + 10;
              break;
            default:
              quantity = Math.floor(Math.random() * 200) + 20;
          }
          const emission = Number(((quantity * factor) / 1000).toFixed(4));
          records.push({
            id: `${year}-${month}-${dept}-${i}-${Math.random().toString(36).substring(2, 7)}`,
            departmentId: dept,
            regionId: mockDepartments.find((d) => d.id === dept)?.regionId || "bj",
            sourceId,
            quantity,
            emissionTonCo2: emission,
            periodYear: String(year),
            periodMonth: String(month),
            recordDate: `${year}-${String(month).padStart(2, "0")}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}`,
          });
        }
      });
    }
  }
  return records;
};

export const mockEmissionRecords: EmissionRecord[] = generateEmissionRecords();

export const mockReductionMeasures: ReductionMeasure[] = [
  {
    id: "m1",
    name: "太阳能光伏电站采购",
    type: "green_energy",
    departmentId: "tech",
    offsetTonCo2: 120,
    startDate: "2025-01-01",
    endDate: "2025-12-31",
    status: "in_progress",
    description: "屋顶光伏电站建设，年发电量约30万kWh",
    cost: 800000,
  },
  {
    id: "m2",
    name: "内蒙古造林项目",
    type: "afforestation",
    departmentId: "hr",
    offsetTonCo2: 80,
    startDate: "2025-03-15",
    endDate: "2025-06-30",
    status: "completed",
    description: "参与内蒙古防护林种植10000棵",
    cost: 150000,
  },
  {
    id: "m3",
    name: "CCER碳汇购买",
    type: "carbon_credit",
    departmentId: "finance",
    offsetTonCo2: 200,
    startDate: "2025-02-01",
    endDate: "2025-12-31",
    status: "in_progress",
    description: "购买国家核证自愿减排量",
    cost: 1200000,
  },
  {
    id: "m4",
    name: "LED照明改造",
    type: "energy_efficiency",
    departmentId: "ops",
    offsetTonCo2: 45.5,
    startDate: "2025-04-01",
    endDate: "2025-05-30",
    status: "completed",
    description: "办公区全部更换LED灯具，节电约30%",
    cost: 85000,
  },
  {
    id: "m5",
    name: "空调系统升级",
    type: "energy_efficiency",
    departmentId: "tech",
    offsetTonCo2: 60,
    startDate: "2025-06-01",
    endDate: "2025-08-31",
    status: "planning",
    description: "更换高效中央空调系统",
    cost: 500000,
  },
];

export const mockAnnualTargets: AnnualTarget[] = [
  {
    id: "t1",
    departmentId: "all",
    year: "2025",
    targetEmissionTonCo2: 2800,
    baselineEmissionTonCo2: 3500,
  },
  {
    id: "t2",
    departmentId: "tech",
    year: "2025",
    targetEmissionTonCo2: 700,
    baselineEmissionTonCo2: 900,
  },
  {
    id: "t3",
    departmentId: "market",
    year: "2025",
    targetEmissionTonCo2: 500,
    baselineEmissionTonCo2: 620,
  },
  {
    id: "t4",
    departmentId: "ops",
    year: "2025",
    targetEmissionTonCo2: 450,
    baselineEmissionTonCo2: 560,
  },
  {
    id: "t5",
    departmentId: "sales",
    year: "2025",
    targetEmissionTonCo2: 600,
    baselineEmissionTonCo2: 750,
  },
  {
    id: "t6",
    departmentId: "hr",
    year: "2025",
    targetEmissionTonCo2: 250,
    baselineEmissionTonCo2: 310,
  },
  {
    id: "t7",
    departmentId: "finance",
    year: "2025",
    targetEmissionTonCo2: 300,
    baselineEmissionTonCo2: 360,
  },
];

export const mockReports: EsgReport[] = [
  {
    id: "r1",
    reportType: "quarterly",
    title: "2025年第一季度ESG摘要",
    period: "2025-Q1",
    year: "2025",
    quarter: 1,
    status: "finalized",
    generatedAt: "2025-04-10",
    framework: "gri",
  },
  {
    id: "r2",
    reportType: "quarterly",
    title: "2025年第二季度ESG摘要",
    period: "2025-Q2",
    year: "2025",
    quarter: 2,
    status: "draft",
    generatedAt: "2025-07-08",
  },
  {
    id: "r3",
    reportType: "annual",
    title: "2024年度ESG报告",
    period: "2024",
    year: "2024",
    status: "exported",
    generatedAt: "2025-03-15",
    framework: "gri",
  },
  {
    id: "r4",
    reportType: "annual",
    title: "2023年度ESG报告",
    period: "2023",
    year: "2023",
    status: "exported",
    generatedAt: "2024-03-20",
    framework: "cdp",
  },
];

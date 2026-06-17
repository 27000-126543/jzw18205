import { format, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";

export function formatEmission(value: number): string {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(2)} 万`;
  }
  return `${value.toFixed(2)}`;
}

export function formatEmissionFull(value: number): string {
  return `${value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "yyyy年MM月dd日", { locale: zhCN });
  } catch {
    return dateStr;
  }
}

export function formatMonth(year: string, month: string): string {
  return `${year}年${month.padStart(2, "0")}月`;
}

export function formatCurrency(value: number): string {
  return `¥${value.toLocaleString("zh-CN")}`;
}

export function formatTrend(value: number): { text: string; isPositive: boolean; isGood: boolean } {
  const text = value > 0 ? `+${value.toFixed(1)}%` : `${value.toFixed(1)}%`;
  const isPositive = value > 0;
  const isGood = value <= 0;
  return { text, isPositive, isGood };
}

export function getMonthLabel(monthIndex: number): string {
  const labels = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
  return labels[monthIndex] || "";
}

export function getQuarterLabel(quarter: number): string {
  const labels = ["第一季度", "第二季度", "第三季度", "第四季度"];
  return labels[quarter - 1] || "";
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

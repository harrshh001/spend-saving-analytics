import { SpendRecord } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export function toNumber(val: Decimal | number): number {
  return typeof val === 'number' ? val : Number(val.toString());
}

export function computeSavings(budget: Decimal | number, actualSpend: Decimal | number) {
  const b = toNumber(budget);
  const a = toNumber(actualSpend);
  const savings = b - a;
  const savingsPercent = b > 0 ? (savings / b) * 100 : 0;
  return { savings, savingsPercent };
}

export function enrichRecord(record: SpendRecord) {
  const { savings, savingsPercent } = computeSavings(record.budget, record.actualSpend);
  return {
    ...record,
    budget: toNumber(record.budget),
    actualSpend: toNumber(record.actualSpend),
    savings,
    savingsPercent: Math.round(savingsPercent * 100) / 100,
  };
}

export interface SummaryResult {
  totalBudget: number;
  totalActualSpend: number;
  totalSavings: number;
  savingsPercent: number;
  totalRecords: number;
  overBudgetCount: number;
  avgSpend: number;
  byCategory: { category: string; totalSpend: number; totalBudget: number; savings: number }[];
  byBusinessUnit: { businessUnit: string; totalSpend: number; totalBudget: number }[];
  byMonth: { month: string; totalBudget: number; totalActualSpend: number; cumulativeSpend?: number }[];
  byStatus: { status: string; count: number }[];
  byLocation: { location: string; totalSpend: number; count: number; avgSpend: number }[];
  byDepartment: { department: string; totalBudget: number; totalActualSpend: number }[];
}

export function computeSummary(records: SpendRecord[]): SummaryResult {
  const totalBudget = records.reduce((sum, r) => sum + toNumber(r.budget), 0);
  const totalActualSpend = records.reduce((sum, r) => sum + toNumber(r.actualSpend), 0);
  const totalSavings = totalBudget - totalActualSpend;
  const savingsPercent = totalBudget > 0 ? (totalSavings / totalBudget) * 100 : 0;
  const totalRecords = records.length;
  const overBudgetCount = records.filter((r) => r.status === 'Over Budget').length;
  const avgSpend = totalRecords > 0 ? totalActualSpend / totalRecords : 0;

  // By category
  const catMap = new Map<string, { totalSpend: number; totalBudget: number }>();
  for (const r of records) {
    const prev = catMap.get(r.category) || { totalSpend: 0, totalBudget: 0 };
    catMap.set(r.category, {
      totalSpend: prev.totalSpend + toNumber(r.actualSpend),
      totalBudget: prev.totalBudget + toNumber(r.budget),
    });
  }
  const byCategory = Array.from(catMap.entries())
    .map(([category, v]) => ({ category, totalSpend: v.totalSpend, totalBudget: v.totalBudget, savings: v.totalBudget - v.totalSpend }))
    .sort((a, b) => b.totalSpend - a.totalSpend);

  // By business unit
  const buMap = new Map<string, { totalSpend: number; totalBudget: number }>();
  for (const r of records) {
    const prev = buMap.get(r.businessUnit) || { totalSpend: 0, totalBudget: 0 };
    buMap.set(r.businessUnit, {
      totalSpend: prev.totalSpend + toNumber(r.actualSpend),
      totalBudget: prev.totalBudget + toNumber(r.budget),
    });
  }
  const byBusinessUnit = Array.from(buMap.entries())
    .map(([businessUnit, v]) => ({ businessUnit, totalSpend: v.totalSpend, totalBudget: v.totalBudget }))
    .sort((a, b) => b.totalSpend - a.totalSpend);

  // By month
  const monthMap = new Map<string, { totalBudget: number; totalActualSpend: number }>();
  for (const r of records) {
    const d = new Date(r.date);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const prev = monthMap.get(month) || { totalBudget: 0, totalActualSpend: 0 };
    monthMap.set(month, {
      totalBudget: prev.totalBudget + toNumber(r.budget),
      totalActualSpend: prev.totalActualSpend + toNumber(r.actualSpend),
    });
  }
  const sortedMonths = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, ...v }));

  // Cumulative spend
  let cumulative = 0;
  const byMonth = sortedMonths.map((m) => {
    cumulative += m.totalActualSpend;
    return { ...m, cumulativeSpend: cumulative };
  });

  // By status
  const statusMap = new Map<string, number>();
  for (const r of records) {
    statusMap.set(r.status, (statusMap.get(r.status) || 0) + 1);
  }
  const byStatus = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }));

  // By location
  const locMap = new Map<string, { totalSpend: number; count: number }>();
  for (const r of records) {
    const prev = locMap.get(r.location) || { totalSpend: 0, count: 0 };
    locMap.set(r.location, {
      totalSpend: prev.totalSpend + toNumber(r.actualSpend),
      count: prev.count + 1,
    });
  }
  const byLocation = Array.from(locMap.entries())
    .map(([location, v]) => ({ location, totalSpend: v.totalSpend, count: v.count, avgSpend: v.count > 0 ? v.totalSpend / v.count : 0 }))
    .sort((a, b) => b.totalSpend - a.totalSpend);

  // By department
  const deptMap = new Map<string, { totalBudget: number; totalActualSpend: number }>();
  for (const r of records) {
    const prev = deptMap.get(r.department) || { totalBudget: 0, totalActualSpend: 0 };
    deptMap.set(r.department, {
      totalBudget: prev.totalBudget + toNumber(r.budget),
      totalActualSpend: prev.totalActualSpend + toNumber(r.actualSpend),
    });
  }
  const byDepartment = Array.from(deptMap.entries())
    .map(([department, v]) => ({ department, ...v }))
    .sort((a, b) => b.totalActualSpend - a.totalActualSpend);

  return {
    totalBudget,
    totalActualSpend,
    totalSavings,
    savingsPercent: Math.round(savingsPercent * 100) / 100,
    totalRecords,
    overBudgetCount,
    avgSpend,
    byCategory,
    byBusinessUnit,
    byMonth,
    byStatus,
    byLocation,
    byDepartment,
  };
}

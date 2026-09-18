export interface User {
  id: string;
  email: string;
  name: string;
}

export interface SpendRecord {
  id: number;
  date: string;
  department: string;
  category: string;
  vendor: string;
  location: string;
  businessUnit: string;
  budget: number;
  actualSpend: number;
  savings: number;
  savingsPercent: number;
  status: string;
  priority: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

export interface SpendRecordInput {
  date: string;
  department: string;
  category: string;
  vendor: string;
  location: string;
  businessUnit: string;
  budget: number;
  actualSpend: number;
  status: string;
  priority: string;
  paymentMethod: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CategoryStat {
  category: string;
  totalSpend: number;
  totalBudget: number;
  savings: number;
}

export interface BusinessUnitStat {
  businessUnit: string;
  totalSpend: number;
  totalBudget: number;
}

export interface MonthStat {
  month: string;
  totalBudget: number;
  totalActualSpend: number;
  cumulativeSpend: number;
}

export interface StatusStat {
  status: string;
  count: number;
}

export interface LocationStat {
  location: string;
  totalSpend: number;
  count: number;
  avgSpend: number;
}

export interface DepartmentStat {
  department: string;
  totalBudget: number;
  totalActualSpend: number;
}

export interface SpendSummary {
  totalBudget: number;
  totalActualSpend: number;
  totalSavings: number;
  savingsPercent: number;
  totalRecords: number;
  overBudgetCount: number;
  avgSpend: number;
  byCategory: CategoryStat[];
  byBusinessUnit: BusinessUnitStat[];
  byMonth: MonthStat[];
  byStatus: StatusStat[];
  byLocation: LocationStat[];
  byDepartment: DepartmentStat[];
}

export interface FilterOptions {
  businessUnit: string[];
  category: string[];
  vendor: string[];
  location: string[];
  status: string[];
  department: string[];
  priority: string[];
  paymentMethod: string[];
}

export interface SpendFilters {
  dateFrom?: string;
  dateTo?: string;
  businessUnit?: string[];
  category?: string[];
  vendor?: string[];
  location?: string[];
  status?: string[];
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

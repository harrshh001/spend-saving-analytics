import api from './axios';
import {
  SpendRecord,
  SpendRecordInput,
  PaginatedResponse,
  SpendSummary,
  FilterOptions,
  SpendFilters,
} from '../types';

function buildParams(filters: SpendFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.dateFrom) params.dateFrom = filters.dateFrom;
  if (filters.dateTo) params.dateTo = filters.dateTo;
  if (filters.search) params.search = filters.search;
  if (filters.sortBy) params.sortBy = filters.sortBy;
  if (filters.sortDir) params.sortDir = filters.sortDir;
  if (filters.page) params.page = String(filters.page);
  if (filters.pageSize) params.pageSize = String(filters.pageSize);
  // Multi-select: join with comma
  if (filters.businessUnit?.length) params.businessUnit = filters.businessUnit.join(',');
  if (filters.category?.length) params.category = filters.category.join(',');
  if (filters.vendor?.length) params.vendor = filters.vendor.join(',');
  if (filters.location?.length) params.location = filters.location.join(',');
  if (filters.status?.length) params.status = filters.status.join(',');
  return params;
}

export const spendApi = {
  getRecords: async (filters: SpendFilters = {}): Promise<PaginatedResponse<SpendRecord>> => {
    const res = await api.get<PaginatedResponse<SpendRecord>>('/spend', { params: buildParams(filters) });
    return res.data;
  },

  getSummary: async (filters: SpendFilters = {}): Promise<SpendSummary> => {
    const res = await api.get<SpendSummary>('/spend/summary', { params: buildParams(filters) });
    return res.data;
  },

  getFilterOptions: async (): Promise<FilterOptions> => {
    const res = await api.get<FilterOptions>('/spend/filter-options');
    return res.data;
  },

  getRecord: async (id: number): Promise<SpendRecord> => {
    const res = await api.get<SpendRecord>(`/spend/${id}`);
    return res.data;
  },

  createRecord: async (data: SpendRecordInput): Promise<SpendRecord> => {
    const res = await api.post<SpendRecord>('/spend', data);
    return res.data;
  },

  updateRecord: async (id: number, data: Partial<SpendRecordInput>): Promise<SpendRecord> => {
    const res = await api.patch<SpendRecord>(`/spend/${id}`, data);
    return res.data;
  },

  deleteRecord: async (id: number): Promise<void> => {
    await api.delete(`/spend/${id}`);
  },
};

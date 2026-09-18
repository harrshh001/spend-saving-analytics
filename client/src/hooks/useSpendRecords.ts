import { useQuery } from '@tanstack/react-query';
import { spendApi } from '../api/spend';
import { useFilters } from '../context/FilterContext';
import { PaginatedResponse, SpendRecord } from '../types';

export function useSpendRecords() {
  const { filters } = useFilters();

  return useQuery<PaginatedResponse<SpendRecord>>({
    queryKey: ['spend-records', filters],
    queryFn: () => spendApi.getRecords(filters),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

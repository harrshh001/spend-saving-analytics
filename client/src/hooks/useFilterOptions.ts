import { useQuery } from '@tanstack/react-query';
import { spendApi } from '../api/spend';
import { FilterOptions } from '../types';

export function useFilterOptions() {
  return useQuery<FilterOptions>({
    queryKey: ['filter-options'],
    queryFn: spendApi.getFilterOptions,
    staleTime: 5 * 60_000, // 5 minutes
  });
}

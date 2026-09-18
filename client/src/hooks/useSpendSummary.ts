import { useQuery } from '@tanstack/react-query';
import { spendApi } from '../api/spend';
import { useFilters } from '../context/FilterContext';
import { SpendSummary } from '../types';

export function useSpendSummary() {
  const { filters } = useFilters();

  return useQuery<SpendSummary>({
    queryKey: ['spend-summary', filters],
    queryFn: () => spendApi.getSummary(filters),
    staleTime: 30_000,
  });
}

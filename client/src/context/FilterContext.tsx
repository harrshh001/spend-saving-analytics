import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { SpendFilters } from '../types';

interface FilterContextType {
  filters: SpendFilters;
  setFilters: (filters: SpendFilters) => void;
  updateFilter: <K extends keyof SpendFilters>(key: K, value: SpendFilters[K]) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
}

const defaultFilters: SpendFilters = {
  dateFrom: '',
  dateTo: '',
  businessUnit: [],
  category: [],
  vendor: [],
  location: [],
  status: [],
  search: '',
  sortBy: 'date',
  sortDir: 'desc',
  page: 1,
  pageSize: 20,
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<SpendFilters>(defaultFilters);

  const setFilters = useCallback((newFilters: SpendFilters) => {
    setFiltersState({ ...newFilters, page: 1 });
  }, []);

  const updateFilter = useCallback(<K extends keyof SpendFilters>(key: K, value: SpendFilters[K]) => {
    setFiltersState((prev) => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
  }, []);

  const hasActiveFilters =
    !!filters.dateFrom ||
    !!filters.dateTo ||
    (filters.businessUnit?.length ?? 0) > 0 ||
    (filters.category?.length ?? 0) > 0 ||
    (filters.vendor?.length ?? 0) > 0 ||
    (filters.location?.length ?? 0) > 0 ||
    (filters.status?.length ?? 0) > 0 ||
    !!filters.search;

  return (
    <FilterContext.Provider value={{ filters, setFilters, updateFilter, resetFilters, hasActiveFilters }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within FilterProvider');
  return ctx;
}

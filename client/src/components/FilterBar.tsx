import React, { useState, useRef, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar, X, ChevronDown, RotateCcw, Filter } from 'lucide-react';
import { useFilters } from '../context/FilterContext';
import { useFilterOptions } from '../hooks/useFilterOptions';
import { format, parseISO } from 'date-fns';

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (val: string[]) => void;
}

function MultiSelect({ label, options, selected, onChange }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggle = (val: string) => {
    if (selected.includes(val)) onChange(selected.filter((s) => s !== val));
    else onChange([...selected, val]);
  };

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className={`relative ${open ? 'z-30' : ''}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-dark-800 border border-dark-600 hover:border-primary-500/50 rounded-lg px-3 py-2 text-sm text-dark-200 transition-colors min-w-[140px] w-full"
        style={{ fontSize: '0.875rem' }}
      >
        <span className="flex-1 text-left truncate">
          {selected.length === 0 ? label : selected.length === 1 ? selected[0] : `${label} (${selected.length})`}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-dark-500 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 bg-dark-800 border border-dark-600 rounded-xl shadow-2xl py-1 min-w-[180px] max-h-56 overflow-y-auto animate-fade-in">
          {options.map((opt) => (
            <label key={opt} className="flex items-center gap-2.5 px-3 py-2 hover:bg-dark-700/60 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
                className="w-3.5 h-3.5 rounded border-dark-500 accent-primary-500"
              />
              <span className="text-sm text-dark-200 truncate">{opt}</span>
            </label>
          ))}
          {options.length === 0 && (
            <p className="px-3 py-2 text-sm text-dark-500">No options</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function FilterBar() {
  const { filters, updateFilter, resetFilters, hasActiveFilters } = useFilters();
  const { data: options } = useFilterOptions();

  const dateFrom = filters.dateFrom ? parseISO(filters.dateFrom) : null;
  const dateTo = filters.dateTo ? parseISO(filters.dateTo) : null;

  return (
    <div className="glass-card p-4 relative z-20">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-primary-400" />
        <span className="text-sm font-semibold text-dark-200">Filters</span>
        {hasActiveFilters && (
          <span className="badge badge-info ml-1">Active</span>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {/* Date Range */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-500 pointer-events-none z-10" />
            <DatePicker
              selected={dateFrom}
              onChange={(d: any) => updateFilter('dateFrom', d ? format(d, 'yyyy-MM-dd') : '')}
              placeholderText="From date"
              dateFormat="dd MMM yyyy"
              className="input-field pl-8 text-sm w-36"
              maxDate={dateTo || undefined}
              isClearable
            />
          </div>
          <span className="text-dark-500 text-sm">–</span>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-500 pointer-events-none z-10" />
            <DatePicker
              selected={dateTo}
              onChange={(d: any) => updateFilter('dateTo', d ? format(d, 'yyyy-MM-dd') : '')}
              placeholderText="To date"
              dateFormat="dd MMM yyyy"
              className="input-field pl-8 text-sm w-36"
              minDate={dateFrom || undefined}
              isClearable
            />
          </div>
        </div>

        {/* Multi-selects */}
        <MultiSelect
          label="Business Unit"
          options={options?.businessUnit || []}
          selected={filters.businessUnit || []}
          onChange={(v) => updateFilter('businessUnit', v)}
        />
        <MultiSelect
          label="Category"
          options={options?.category || []}
          selected={filters.category || []}
          onChange={(v) => updateFilter('category', v)}
        />
        <MultiSelect
          label="Vendor"
          options={options?.vendor || []}
          selected={filters.vendor || []}
          onChange={(v) => updateFilter('vendor', v)}
        />
        <MultiSelect
          label="Location"
          options={options?.location || []}
          selected={filters.location || []}
          onChange={(v) => updateFilter('location', v)}
        />
        <MultiSelect
          label="Status"
          options={options?.status || []}
          selected={filters.status || []}
          onChange={(v) => updateFilter('status', v)}
        />

        {/* Reset */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-dark-400 hover:text-red-400 hover:bg-red-500/10 border border-dark-600 hover:border-red-500/30 transition-all"
            id="reset-filters-btn"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

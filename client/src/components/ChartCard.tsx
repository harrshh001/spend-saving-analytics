import React, { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  loading?: boolean;
  className?: string;
}

export default function ChartCard({ title, subtitle, children, loading = false, className = '' }: ChartCardProps) {
  return (
    <div className={`glass-card p-5 flex flex-col gap-4 ${className}`}>
      <div>
        <h3 className="text-sm font-semibold text-dark-200">{title}</h3>
        {subtitle && <p className="text-xs text-dark-500 mt-0.5">{subtitle}</p>}
      </div>
      {loading ? (
        <div className="flex flex-col gap-3 flex-1">
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton flex-1 min-h-[200px]" />
        </div>
      ) : (
        children
      )}
    </div>
  );
}

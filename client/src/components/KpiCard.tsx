import React, { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  accentColor?: string;
  loading?: boolean;
}

export default function KpiCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendLabel,
  accentColor = 'primary',
  loading = false,
}: KpiCardProps) {
  if (loading) {
    return (
      <div className="glass-card p-5 flex flex-col gap-3">
        <div className="skeleton h-4 w-24" />
        <div className="skeleton h-8 w-36" />
        <div className="skeleton h-3 w-20" />
      </div>
    );
  }

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend === 'up' ? 'text-emerald-400' :
    trend === 'down' ? 'text-red-400' :
    'text-dark-500';

  return (
    <div className="glass-card-hover p-5 flex flex-col gap-3 animate-fade-in">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-dark-400">{title}</p>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: `rgba(99, 102, 241, 0.15)`,
            border: `1px solid rgba(99, 102, 241, 0.2)`,
          }}
        >
          <span className="text-primary-400">{icon}</span>
        </div>
      </div>

      <div>
        <p className="text-2xl font-bold text-dark-100 tracking-tight">{value}</p>
        {subtitle && <p className="text-xs text-dark-500 mt-0.5">{subtitle}</p>}
      </div>

      {trendLabel && (
        <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
          <TrendIcon className="w-3.5 h-3.5" />
          <span>{trendLabel}</span>
        </div>
      )}
    </div>
  );
}

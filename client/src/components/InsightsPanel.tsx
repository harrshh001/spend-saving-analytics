import React from 'react';
import { Lightbulb, TrendingUp, AlertTriangle, MapPin, Building2, Star } from 'lucide-react';
import { SpendSummary } from '../types';

function fmt(n: number) {
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

interface InsightsPanelProps {
  summary: SpendSummary | undefined;
  loading?: boolean;
}

export default function InsightsPanel({ summary, loading }: InsightsPanelProps) {
  if (loading) {
    return (
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-dark-200">AI Insights</h3>
        </div>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!summary || summary.totalRecords === 0) {
    return (
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-dark-200">AI Insights</h3>
        </div>
        <p className="text-dark-500 text-sm">No data available for the selected filters.</p>
      </div>
    );
  }

  const {
    totalRecords,
    overBudgetCount,
    savingsPercent,
    totalSavings,
    totalActualSpend,
    byBusinessUnit,
    byCategory,
    byLocation,
  } = summary;

  const overBudgetPct = totalRecords > 0 ? ((overBudgetCount / totalRecords) * 100).toFixed(1) : '0';

  // Best/worst savings category
  const withSavings = byCategory.filter((c) => c.totalBudget > 0);
  const bestSavingsCat = withSavings.length > 0
    ? withSavings.reduce((a, b) => (b.savings / b.totalBudget > a.savings / a.totalBudget ? b : a))
    : null;
  const worstSavingsCat = withSavings.length > 0
    ? withSavings.reduce((a, b) => (b.savings / b.totalBudget < a.savings / a.totalBudget ? b : a))
    : null;

  // Top vendor by spend
  const topBU = byBusinessUnit[0];

  // Top location by avg spend
  const topLocation = summary.byLocation[0];

  // Largest category share
  const topCat = byCategory[0];
  const topCatShare = totalActualSpend > 0 && topCat
    ? ((topCat.totalSpend / totalActualSpend) * 100).toFixed(1)
    : '0';

  const insights = [
    {
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      color: overBudgetCount > 0 ? 'text-red-400' : 'text-emerald-400',
      bg: overBudgetCount > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20',
      text: `${overBudgetCount} of ${totalRecords} records (${overBudgetPct}%) are over budget in this period.`,
    },
    {
      icon: <Building2 className="w-3.5 h-3.5" />,
      color: 'text-primary-400',
      bg: 'bg-primary-500/10 border-primary-500/20',
      text: topBU
        ? `${topBU.businessUnit} has the highest total spend at ${fmt(topBU.totalSpend)}.`
        : 'No business unit data available.',
    },
    {
      icon: <Star className="w-3.5 h-3.5" />,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      text: bestSavingsCat && worstSavingsCat
        ? `${bestSavingsCat.category} has the best savings rate at ${((bestSavingsCat.savings / bestSavingsCat.totalBudget) * 100).toFixed(1)}%; ${worstSavingsCat.category} has the worst at ${((worstSavingsCat.savings / worstSavingsCat.totalBudget) * 100).toFixed(1)}%.`
        : 'Insufficient data to compare category savings.',
    },
    {
      icon: <TrendingUp className="w-3.5 h-3.5" />,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10 border-violet-500/20',
      text: topCat
        ? `${topCat.category} is the largest spend category, accounting for ${topCatShare}% of total spend.`
        : 'No category data available.',
    },
    {
      icon: <MapPin className="w-3.5 h-3.5" />,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/20',
      text: topLocation
        ? `${topLocation.location} has the highest average spend per record (${fmt(topLocation.avgSpend)}).`
        : 'No location data available.',
    },
    {
      icon: <Lightbulb className="w-3.5 h-3.5" />,
      color: savingsPercent >= 0 ? 'text-emerald-400' : 'text-red-400',
      bg: savingsPercent >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20',
      text: `Overall savings margin across ${totalRecords} records is ${savingsPercent.toFixed(1)}% (${fmt(Math.abs(totalSavings))} ${totalSavings >= 0 ? 'saved' : 'over budget'}).`,
    },
  ];

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-dark-200">Auto-generated Insights</h3>
        <span className="badge badge-warning ml-1">{insights.length}</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {insights.map((insight, i) => (
          <div
            key={i}
            className={`flex items-start gap-2.5 rounded-lg px-3 py-2.5 border animate-fade-in ${insight.bg}`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <span className={`mt-0.5 flex-shrink-0 ${insight.color}`}>{insight.icon}</span>
            <p className="text-sm text-dark-200 leading-relaxed">{insight.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

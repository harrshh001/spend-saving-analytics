import React from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
import {
  DollarSign, TrendingDown, TrendingUp, AlertTriangle,
  BarChart2, Activity, Target, ArrowDownRight
} from 'lucide-react';
import FilterBar from '../components/FilterBar';
import KpiCard from '../components/KpiCard';
import ChartCard from '../components/ChartCard';
import InsightsPanel from '../components/InsightsPanel';
import { useSpendSummary } from '../hooks/useSpendSummary';

function fmt(n: number) {
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

function fmtShort(n: number) {
  if (n >= 10_00_000) return '₹' + (n / 10_00_000).toFixed(1) + 'L';
  if (n >= 1000) return '₹' + (n / 1000).toFixed(0) + 'K';
  return '₹' + n.toFixed(0);
}

const CHART_COLORS = [
  '#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
];

const CHART_STROKE = 'rgba(51, 65, 85, 0.5)';
const TOOLTIP_STYLE = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '0.5rem',
  color: '#f1f5f9',
  fontSize: '0.8125rem',
};

function fmtMonth(m: string) {
  const [y, mo] = m.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(mo) - 1]} '${y.slice(2)}`;
}

interface KpiItem {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
}

export default function DashboardPage() {
  const { data: summary, isLoading } = useSpendSummary();

  const kpis: KpiItem[] = [
    {
      title: 'Total Budget',
      value: summary ? fmt(summary.totalBudget) : '—',
      subtitle: `${summary?.totalRecords ?? 0} records`,
      icon: <Target className="w-4.5 h-4.5" style={{ width: '1.125rem', height: '1.125rem' }} />,
    },
    {
      title: 'Total Actual Spend',
      value: summary ? fmt(summary.totalActualSpend) : '—',
      subtitle: summary ? `${summary.savingsPercent >= 0 ? 'Under' : 'Over'} budget` : '',
      icon: <DollarSign className="w-4.5 h-4.5" style={{ width: '1.125rem', height: '1.125rem' }} />,
    },
    {
      title: 'Total Savings',
      value: summary ? fmt(summary.totalSavings) : '—',
      subtitle: summary ? `${Math.abs(summary.savingsPercent).toFixed(1)}% ${summary.totalSavings >= 0 ? 'saved' : 'over'}` : '',
      icon: <TrendingDown className="w-4.5 h-4.5" style={{ width: '1.125rem', height: '1.125rem' }} />,
      trend: summary ? (summary.totalSavings >= 0 ? 'up' : 'down') : undefined,
      trendLabel: summary ? (summary.totalSavings >= 0 ? 'Positive savings' : 'Over budget') : undefined,
    },
    {
      title: 'Savings %',
      value: summary ? `${summary.savingsPercent.toFixed(1)}%` : '—',
      subtitle: 'Budget utilization efficiency',
      icon: <TrendingUp className="w-4.5 h-4.5" style={{ width: '1.125rem', height: '1.125rem' }} />,
      trend: summary ? (summary.savingsPercent >= 0 ? 'up' : 'down') : undefined,
    },
    {
      title: 'Over-Budget Records',
      value: summary ? String(summary.overBudgetCount) : '—',
      subtitle: summary ? `${summary.totalRecords > 0 ? ((summary.overBudgetCount / summary.totalRecords) * 100).toFixed(0) : 0}% of total` : '',
      icon: <AlertTriangle className="w-4.5 h-4.5" style={{ width: '1.125rem', height: '1.125rem' }} />,
      trend: summary ? (summary.overBudgetCount === 0 ? 'up' : 'down') : undefined,
      trendLabel: summary ? (summary.overBudgetCount === 0 ? 'All on budget' : `${summary.overBudgetCount} exceeded`) : undefined,
    },
    {
      title: 'Avg Spend / Record',
      value: summary ? fmt(summary.avgSpend) : '—',
      subtitle: 'Across all records',
      icon: <BarChart2 className="w-4.5 h-4.5" style={{ width: '1.125rem', height: '1.125rem' }} />,
    },
  ];

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-dark-100">Spend & Savings Dashboard</h1>
        <p className="text-dark-500 text-sm mt-0.5">Real-time organizational spend analytics</p>
      </div>

      {/* Filters */}
      <FilterBar />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, i) => (
          <KpiCard key={i} {...kpi} loading={isLoading} />
        ))}
      </div>

      {/* Charts Row 1: Line + Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Line chart: Budget vs Actual by month */}
        <ChartCard
          title="Budget vs Actual Spend — Monthly Trend"
          subtitle="Line chart comparing budget to actual spend over time"
          loading={isLoading}
        >
          {summary && summary.byMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={summary.byMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_STROKE} />
                <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tickFormatter={fmtShort} tick={{ fill: '#64748b', fontSize: 11 }} width={55} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v: number) => fmt(v)}
                  labelFormatter={fmtMonth}
                />
                <Legend wrapperStyle={{ fontSize: '0.75rem', color: '#94a3b8' }} />
                <Line type="monotone" dataKey="totalBudget" name="Budget" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} />
                <Line type="monotone" dataKey="totalActualSpend" name="Actual Spend" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        {/* Bar chart: Spend by Business Unit */}
        <ChartCard
          title="Spend by Business Unit"
          subtitle="Bar chart of total actual spend per business unit"
          loading={isLoading}
        >
          {summary && summary.byBusinessUnit.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={summary.byBusinessUnit} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_STROKE} horizontal={false} />
                <XAxis type="number" tickFormatter={fmtShort} tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis type="category" dataKey="businessUnit" tick={{ fill: '#94a3b8', fontSize: 11 }} width={90} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => fmt(v)} />
                <Bar dataKey="totalSpend" name="Actual Spend" radius={[0, 4, 4, 0]}>
                  {summary.byBusinessUnit.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>
      </div>

      {/* Charts Row 2: Pie + Stacked Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie/Donut: Spend by Category */}
        <ChartCard
          title="Spend Share by Category"
          subtitle="Donut chart of actual spend proportion per category"
          loading={isLoading}
        >
          {summary && summary.byCategory.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={220}>
                <PieChart>
                  <Pie
                    data={summary.byCategory}
                    dataKey="totalSpend"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {summary.byCategory.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 flex flex-col gap-1.5 text-xs overflow-y-auto max-h-[200px]">
                {summary.byCategory.slice(0, 8).map((cat, i) => (
                  <div key={cat.category} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-dark-400 truncate flex-1">{cat.category}</span>
                    <span className="text-dark-300 font-medium">{fmtShort(cat.totalSpend)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        {/* Stacked Bar: Budget vs Actual by Department */}
        <ChartCard
          title="Budget vs Actual by Department"
          subtitle="Stacked bar comparing budget allocation vs actual spend"
          loading={isLoading}
        >
          {summary && summary.byDepartment && summary.byDepartment.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={summary.byDepartment}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_STROKE} />
                <XAxis dataKey="department" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tickFormatter={fmtShort} tick={{ fill: '#64748b', fontSize: 11 }} width={55} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => fmt(v)} />
                <Legend wrapperStyle={{ fontSize: '0.75rem', color: '#94a3b8' }} />
                <Bar dataKey="totalBudget" name="Budget" fill="#6366f1" radius={[2, 2, 0, 0]} opacity={0.7} />
                <Bar dataKey="totalActualSpend" name="Actual Spend" fill="#10b981" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>
      </div>

      {/* Area chart: Cumulative spend */}
      <ChartCard
        title="Cumulative Actual Spend Over Time"
        subtitle="Area chart showing running total of spend across the selected date range"
        loading={isLoading}
      >
        {summary && summary.byMonth.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={summary.byMonth}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_STROKE} />
              <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tickFormatter={fmtShort} tick={{ fill: '#64748b', fontSize: 11 }} width={65} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => fmt(v)} labelFormatter={fmtMonth} />
              <Area
                type="monotone"
                dataKey="cumulativeSpend"
                name="Cumulative Spend"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#areaGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </ChartCard>

      {/* Insights */}
      <InsightsPanel summary={summary} loading={isLoading} />
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex flex-col items-center justify-center h-40 gap-2">
      <Activity className="w-8 h-8 text-dark-600" />
      <p className="text-dark-500 text-sm">No data matches your filters</p>
    </div>
  );
}

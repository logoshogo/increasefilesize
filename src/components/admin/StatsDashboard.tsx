'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DashboardStats, RangeKey } from '@/lib/stats';

const RANGES: { key: RangeKey; label: string }[] = [
  { key: '24h', label: 'Last 24 hours' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
];

const FORMAT_COLOURS: Record<string, string> = {
  jpg: '#1d61f0',
  png: '#0f9d76',
  pdf: '#d9762b',
  any: '#7c6bd1',
  unknown: '#94a3b8',
};

const REFRESH_MS = 30_000;

export function StatsDashboard({ initial }: { initial: DashboardStats }) {
  const [range, setRange] = useState<RangeKey>(initial.range);
  const [stats, setStats] = useState<DashboardStats>(initial);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (key: RangeKey) => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/admin/stats?range=${key}`, { cache: 'no-store' });
      if (res.ok) setStats((await res.json()) as DashboardStats);
    } catch {
      // Keep showing the last good numbers rather than blanking the dashboard.
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Poll for the live figures.
  useEffect(() => {
    const id = setInterval(() => void load(range), REFRESH_MS);
    return () => clearInterval(id);
  }, [load, range]);

  const onRange = (key: RangeKey) => {
    setRange(key);
    void load(key);
  };

  const hourly = range === '24h';
  const series = stats.series.map((point) => ({
    ...point,
    label: new Date(point.bucket).toLocaleString('en-GB', hourly
      ? { hour: '2-digit', minute: '2-digit' }
      : { day: 'numeric', month: 'short' }),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Live figures refresh every 30 seconds · updated{' '}
            {new Date(stats.generatedAt).toLocaleTimeString('en-GB')}
            {refreshing && ' · refreshing…'}
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {RANGES.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => onRange(option.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                range === option.key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Active right now"
          value={stats.live.activeNow}
          hint="Unique visitors in the last 5 minutes"
          accent
        />
        <StatTile label="Visitors today" value={stats.live.visitorsToday} hint="Unique, since midnight" />
        <StatTile label="Page views today" value={stats.live.pageviewsToday} />
        <StatTile label="Downloads today" value={stats.live.downloadsToday} hint="Files completed" />
      </div>

      {/* Traffic chart */}
      <Panel title="Traffic and tool usage" subtitle={hourly ? 'By hour' : 'By day'}>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="pageviews"
                name="Page views"
                stroke="#1d61f0"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="downloads"
                name="Downloads"
                stroke="#0f9d76"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Funnel */}
        <Panel title="Conversion funnel" subtitle="Share of page views reaching each step">
          <ul className="space-y-3">
            {stats.funnel.map((step) => (
              <li key={step.step}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium text-slate-700">{step.step}</span>
                  <span className="tabular-nums text-slate-500">
                    {step.count.toLocaleString()} · {step.rate}%
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-brand-600"
                    style={{ width: `${Math.min(100, step.rate)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        {/* By format */}
        <Panel title="Downloads by format" subtitle="Completed files in this range">
          {stats.byFormat.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byFormat} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="format" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Downloads" radius={[6, 6, 0, 0]}>
                    {stats.byFormat.map((row) => (
                      <Cell key={row.format} fill={FORMAT_COLOURS[row.format] ?? '#1d61f0'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        {/* Target sizes */}
        <Panel title="Most requested target sizes" subtitle="From processing starts">
          {stats.byTargetSize.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byTargetSize} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Uses" fill="#1d61f0" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        {/* Top pages */}
        <Panel title="Top pages" subtitle="By page views in this range">
          {stats.topPages.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {stats.topPages.map((page) => (
                <li key={page.path} className="flex items-center justify-between gap-4 py-2">
                  <a
                    href={page.path}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-slate-700 hover:text-brand-700"
                  >
                    {page.path}
                  </a>
                  <span className="shrink-0 tabular-nums text-slate-500">
                    {page.count.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Mode split + totals */}
      <Panel title="This range at a glance">
        <dl className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <MiniStat label="Page views" value={stats.totals.pageviews} />
          <MiniStat label="Unique visitors" value={stats.totals.uniqueVisitors} />
          <MiniStat label="Files chosen" value={stats.totals.fileSelected} />
          <MiniStat label="Runs started" value={stats.totals.processStarted} />
          <MiniStat label="Downloads" value={stats.totals.downloads} />
          <MiniStat label="Errors" value={stats.totals.errors} />
        </dl>
        {stats.byMode.length > 0 && (
          <p className="mt-4 text-sm text-slate-500">
            Mode split:{' '}
            {stats.byMode
              .map((m) => `${m.mode === 'pad' ? 'padding' : 'resolution increase'} ${m.count}`)
              .join(' · ')}
          </p>
        )}
      </Panel>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="mb-4">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}

function StatTile({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: number;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${
        accent ? 'border-brand-200 bg-brand-50' : 'border-slate-200 bg-white'
      }`}
    >
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">{value.toLocaleString()}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-xl font-semibold tabular-nums text-slate-900">
        {value.toLocaleString()}
      </dd>
    </div>
  );
}

function EmptyState() {
  return (
    <p className="py-10 text-center text-sm text-slate-400">
      Nothing recorded in this range yet.
    </p>
  );
}

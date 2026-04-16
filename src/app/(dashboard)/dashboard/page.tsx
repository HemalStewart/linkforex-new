'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  ArrowRightLeft,
  Building2,
  Globe2,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react';
import { ENDPOINTS } from '@/lib/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type RangeKey = '7d' | '30d' | '90d';
type DashboardTransfer = Record<string, any>;
type DashboardCustomer = Record<string, any>;
type DashboardBranch = Record<string, any>;

type RecentActivity = DashboardTransfer & {
  customerName: string;
  customerInitials: string;
};

type SummaryCard = {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const RANGE_DAYS: Record<RangeKey, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const chartPlaceholder = (
  <div className="h-full w-full animate-pulse rounded-xl bg-muted/40" />
);

const getNumeric = (value: unknown) => {
  const parsed = parseFloat(String(value ?? 0));
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value: number) =>
  `£${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatCompactCurrency = (value: number) => {
  if (value >= 1000000) return `£${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `£${(value / 1000).toFixed(1)}K`;
  return formatCurrency(value);
};

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

const startOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const sameDayKey = (date: Date) => date.toISOString().split('T')[0];

const buildDateSeries = (days: number) => {
  const today = startOfDay(new Date());
  return Array.from({ length: days }, (_, index) => {
    const current = new Date(today);
    current.setDate(today.getDate() - (days - index - 1));
    return current;
  });
};

const getStatusLabel = (status?: string | null) =>
  String(status || 'unknown')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getTransferMeta = (transfer: DashboardTransfer) => {
  if (transfer.transfer_meta && typeof transfer.transfer_meta === 'object') {
    return transfer.transfer_meta;
  }

  if (typeof transfer.meta_json === 'string' && transfer.meta_json.trim()) {
    try {
      return JSON.parse(transfer.meta_json);
    } catch {
      return {};
    }
  }

  return {};
};

type ChartPalette = {
  primary: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  destructive: string;
  mutedForeground: string;
  foreground: string;
  background: string;
  border: string;
  grid: string;
};

const fallbackChartPalette: ChartPalette = {
  primary: '#14b8a6',
  chart2: '#22c55e',
  chart3: '#f59e0b',
  chart4: '#3b82f6',
  chart5: '#8b5cf6',
  destructive: '#ef4444',
  mutedForeground: '#94a3b8',
  foreground: '#e2e8f0',
  background: '#0f172a',
  border: '#334155',
  grid: 'rgba(148, 163, 184, 0.18)',
};

const CSS_COLOR_PATTERN =
  /^(#|rgb\(|rgba\(|hsl\(|hsla\(|oklch\(|oklab\(|lab\(|lch\(|color\()/i;

const resolveCssColor = (styles: CSSStyleDeclaration, variableName: string, fallback: string) => {
  const value = styles.getPropertyValue(variableName).trim();
  if (!value) return fallback;
  if (CSS_COLOR_PATTERN.test(value)) return value;
  return `hsl(${value})`;
};

const readChartPalette = (): ChartPalette => {
  if (typeof window === 'undefined') return fallbackChartPalette;

  const styles = window.getComputedStyle(document.documentElement);
  const borderColor = resolveCssColor(styles, '--border', fallbackChartPalette.border);

  return {
    primary: resolveCssColor(styles, '--primary', fallbackChartPalette.primary),
    chart2: resolveCssColor(styles, '--chart-2', fallbackChartPalette.chart2),
    chart3: resolveCssColor(styles, '--chart-3', fallbackChartPalette.chart3),
    chart4: resolveCssColor(styles, '--chart-4', fallbackChartPalette.chart4),
    chart5: resolveCssColor(styles, '--chart-5', fallbackChartPalette.chart5),
    destructive: resolveCssColor(styles, '--destructive', fallbackChartPalette.destructive),
    mutedForeground: resolveCssColor(styles, '--muted-foreground', fallbackChartPalette.mutedForeground),
    foreground: resolveCssColor(styles, '--foreground', fallbackChartPalette.foreground),
    background: resolveCssColor(styles, '--background', fallbackChartPalette.background),
    border: borderColor,
    grid: styles.getPropertyValue('--border').trim()
      ? `color-mix(in srgb, ${borderColor} 45%, transparent)`
      : fallbackChartPalette.grid,
  };
};

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<RangeKey>('30d');
  const [transfers, setTransfers] = useState<DashboardTransfer[]>([]);
  const [customers, setCustomers] = useState<DashboardCustomer[]>([]);
  const [branches, setBranches] = useState<DashboardBranch[]>([]);
  const [chartPalette, setChartPalette] = useState<ChartPalette>(fallbackChartPalette);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updatePalette = () => setChartPalette(readChartPalette());
    updatePalette();

    const observer = new MutationObserver(updatePalette);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    void fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [transfersRes, customersRes, branchesRes] = await Promise.all([
        fetch(`${ENDPOINTS.TRANSFERS.LIST}?_t=${Date.now()}`),
        fetch(`${ENDPOINTS.REMITTERS.LIST}?_t=${Date.now()}`),
        fetch(`${ENDPOINTS.BRANCHES.LIST}?status=active&_t=${Date.now()}`),
      ]);

      const transfersData = transfersRes.ok ? await transfersRes.json() : [];
      const customersData = customersRes.ok ? await customersRes.json() : [];
      const branchesData = branchesRes.ok ? await branchesRes.json() : [];

      setTransfers(Array.isArray(transfersData) ? transfersData : []);
      setCustomers(Array.isArray(customersData) ? customersData : []);
      setBranches(Array.isArray(branchesData) ? branchesData : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const rangeDays = RANGE_DAYS[selectedRange];
  const rangeDates = useMemo(() => buildDateSeries(rangeDays), [rangeDays]);
  const rangeStart = useMemo(() => {
    const first = rangeDates[0];
    return first ? startOfDay(first) : startOfDay(new Date());
  }, [rangeDates]);

  const previousRangeStart = useMemo(() => {
    const prior = new Date(rangeStart);
    prior.setDate(prior.getDate() - rangeDays);
    return startOfDay(prior);
  }, [rangeDays, rangeStart]);

  const filteredTransfers = useMemo(
    () =>
      transfers.filter((transfer) => {
        const createdAt = parseDate(transfer.created_at || transfer.createdAt);
        return createdAt ? createdAt >= rangeStart : false;
      }),
    [rangeStart, transfers],
  );

  const previousTransfers = useMemo(
    () =>
      transfers.filter((transfer) => {
        const createdAt = parseDate(transfer.created_at || transfer.createdAt);
        return createdAt ? createdAt >= previousRangeStart && createdAt < rangeStart : false;
      }),
    [previousRangeStart, rangeStart, transfers],
  );

  const filteredCustomers = useMemo(
    () =>
      customers.filter((customer) => {
        const createdAt = parseDate(customer.created_at || customer.createdAt);
        return createdAt ? createdAt >= rangeStart : false;
      }),
    [customers, rangeStart],
  );

  const previousCustomers = useMemo(
    () =>
      customers.filter((customer) => {
        const createdAt = parseDate(customer.created_at || customer.createdAt);
        return createdAt ? createdAt >= previousRangeStart && createdAt < rangeStart : false;
      }),
    [customers, previousRangeStart, rangeStart],
  );

  const approvedStatuses = ['completed', 'approved'];
  const queueStatuses = ['pending', 'in_review', 'processing'];

  const completedTransfers = useMemo(
    () =>
      filteredTransfers.filter((transfer) =>
        approvedStatuses.includes(String(transfer.status || '').toLowerCase()),
      ),
    [filteredTransfers],
  );

  const pendingTransfers = useMemo(
    () =>
      filteredTransfers.filter((transfer) =>
        queueStatuses.includes(String(transfer.status || '').toLowerCase()),
      ),
    [filteredTransfers],
  );

  const totalVolume = useMemo(
    () =>
      completedTransfers.reduce(
        (sum, transfer) =>
          sum + getNumeric(transfer.source_amount || transfer.amount),
        0,
      ),
    [completedTransfers],
  );

  const activeUsers = customers.filter(
    (customer) => String(customer.status || '').toLowerCase() === 'active',
  ).length;
  const pendingKYC = customers.filter(
    (customer) => String(customer.kyc_status || '').toLowerCase() === 'pending',
  ).length;

  const summaryCards: SummaryCard[] = [
    {
      title: 'Transfers',
      value: loading ? '...' : filteredTransfers.length.toLocaleString(),
      description: 'Created in selected range',
      icon: ArrowRightLeft,
    },
    {
      title: 'Transfer Volume',
      value: loading ? '...' : formatCompactCurrency(totalVolume),
      description: 'Approved and completed volume',
      icon: Wallet,
    },
    {
      title: 'Pending Transfers',
      value: loading ? '...' : pendingTransfers.length.toLocaleString(),
      description: 'Pending, in review, or processing',
      icon: Activity,
    },
    {
      title: 'Active Users',
      value: loading ? '...' : activeUsers.toLocaleString(),
      description: 'Current active remitter accounts',
      icon: Users,
    },
    {
      title: 'Pending KYC',
      value: loading ? '...' : pendingKYC.toLocaleString(),
      description: 'Profiles awaiting review',
      icon: ShieldCheck,
    },
    {
      title: 'New Customers',
      value: loading ? '...' : filteredCustomers.length.toLocaleString(),
      description: 'Registered in selected range',
      icon: Globe2,
    },
  ];

  const timelineData = useMemo(
    () =>
      rangeDates.map((date) => {
        const key = sameDayKey(date);
        const dayTransfers = filteredTransfers.filter((transfer) => {
          const createdAt = parseDate(transfer.created_at || transfer.createdAt);
          return createdAt ? sameDayKey(createdAt) === key : false;
        });
        const dayCustomers = filteredCustomers.filter((customer) => {
          const createdAt = parseDate(customer.created_at || customer.createdAt);
          return createdAt ? sameDayKey(createdAt) === key : false;
        });
        const approved = dayTransfers.filter((transfer) =>
          approvedStatuses.includes(String(transfer.status || '').toLowerCase()),
        );
        const queued = dayTransfers.filter((transfer) =>
          queueStatuses.includes(String(transfer.status || '').toLowerCase()),
        );
        return {
          name: date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          }),
          transfers: dayTransfers.length,
          customers: dayCustomers.length,
          approvedCount: approved.length,
          queuedCount: queued.length,
          volume: approved.reduce(
            (sum, transfer) =>
              sum + getNumeric(transfer.source_amount || transfer.amount),
            0,
          ),
        };
      }),
    [filteredCustomers, filteredTransfers, rangeDates],
  );

  const branchLookup = useMemo(() => {
    const lookup = new Map<string, string>();

    branches.forEach((branch) => {
      const code = String(branch.code || branch.transaction_prefix || '').trim();
      const name = String(branch.name || '').trim();
      if (code && name && !lookup.has(code)) {
        lookup.set(code, name);
      }
    });

    return lookup;
  }, [branches]);

  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredTransfers.forEach((transfer) => {
      const status = String(transfer.status || 'unknown').toLowerCase();
      counts[status] = (counts[status] || 0) + 1;
    });

    const statusColors: Record<string, string> = {
      completed: chartPalette.primary,
      approved: chartPalette.chart2,
      pending: chartPalette.chart3,
      in_review: chartPalette.chart4,
      processing: chartPalette.chart5,
      rejected: chartPalette.destructive,
      cancelled: chartPalette.mutedForeground,
      unknown: chartPalette.mutedForeground,
    };

    return Object.entries(counts)
      .map(([status, value]) => ({
        name: getStatusLabel(status),
        value,
        color: statusColors[status] || chartPalette.mutedForeground,
      }))
      .sort((a, b) => b.value - a.value);
  }, [chartPalette, filteredTransfers]);

  const branchBreakdown = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredTransfers.forEach((transfer) => {
      const meta = getTransferMeta(transfer);
      const branchCode = String(transfer.branch_id || transfer.branch_code || '').trim();
      const branchName = String(
        meta.branch_name ||
          branchLookup.get(branchCode) ||
          transfer.branch_name ||
          transfer.branch ||
          transfer.to_branch ||
          branchCode ||
          'Unassigned',
      );
      totals[branchName] =
        (totals[branchName] || 0) +
        getNumeric(transfer.source_amount || transfer.amount);
    });

    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [branchLookup, filteredTransfers]);

  const payoutCurrencyBreakdown = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredTransfers.forEach((transfer) => {
      const meta = getTransferMeta(transfer);
      const code = String(
        meta.payout_currency ||
          transfer.payout_currency ||
          transfer.currency ||
          '',
      )
        .trim()
        .toUpperCase();
      if (!code) return;
      totals[code] =
        (totals[code] || 0) + getNumeric(transfer.dest_amount || transfer.fc_amount);
    });

    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [filteredTransfers]);

  const kycBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    customers.forEach((customer) => {
      const status = String(customer.kyc_status || customer.status || 'unknown').toLowerCase();
      counts[status] = (counts[status] || 0) + 1;
    });

    const kycColors = [
      chartPalette.primary,
      chartPalette.chart2,
      chartPalette.chart3,
      chartPalette.destructive,
      chartPalette.mutedForeground,
    ];

    return Object.entries(counts)
      .map(([name, value], index) => ({
        name: getStatusLabel(name),
        value,
        color: kycColors[index % kycColors.length],
        share: customers.length > 0 ? (value / customers.length) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [chartPalette, customers]);

  const chartTooltipStyle = useMemo(
    () => ({
      backgroundColor: chartPalette.background,
      borderColor: chartPalette.border,
      color: chartPalette.foreground,
      borderRadius: '12px',
    }),
    [chartPalette.background, chartPalette.border, chartPalette.foreground],
  );

  const weekdayBreakdown = useMemo(() => {
    const weekdays = WEEKDAY_LABELS.map((label) => ({
      name: label,
      transfers: 0,
      volume: 0,
    }));

    filteredTransfers.forEach((transfer) => {
      const createdAt = parseDate(transfer.created_at || transfer.createdAt);
      if (!createdAt) return;
      const index = createdAt.getDay();
      weekdays[index].transfers += 1;
      weekdays[index].volume += getNumeric(
        transfer.source_amount || transfer.amount,
      );
    });

    return weekdays;
  }, [filteredTransfers]);

  const geographyBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    customers.forEach((customer) => {
      const name = String(
        customer.country ||
          customer.country_name ||
          customer.nationality ||
          'Unknown',
      );
      counts[name] = (counts[name] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [customers]);

  const recentActivity = useMemo<RecentActivity[]>(() => {
    return [...filteredTransfers]
      .sort((left, right) => {
        const leftDate = parseDate(left.created_at)?.getTime() || 0;
        const rightDate = parseDate(right.created_at)?.getTime() || 0;
        return rightDate - leftDate;
      })
      .slice(0, 8)
      .map((transfer) => {
        const customer = customers.find(
          (candidate) => String(candidate.id) === String(transfer.remitter_id),
        );
        const customerName = customer?.name || transfer.remitter_name || 'Unknown';
        return {
          ...transfer,
          customerName,
          customerInitials:
            customerName
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((part: string) => part[0])
              .join('') || 'U',
        };
      });
  }, [customers, filteredTransfers]);

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Operational summary, live performance trends, queue health, and customer distribution.
          </p>
        </div>
        <Tabs
          value={selectedRange}
          onValueChange={(value) => setSelectedRange(value as RangeKey)}
          className="w-full xl:w-auto"
        >
          <TabsList className="grid h-11 w-full grid-cols-3 rounded-2xl border border-border/60 bg-muted/40 p-1 xl:w-[320px]">
            <TabsTrigger value="7d" className="cursor-pointer rounded-xl text-xs font-medium">
              Last 7 Days
            </TabsTrigger>
            <TabsTrigger value="30d" className="cursor-pointer rounded-xl text-xs font-medium">
              Last 30 Days
            </TabsTrigger>
            <TabsTrigger value="90d" className="cursor-pointer rounded-xl text-xs font-medium">
              Last 90 Days
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="overflow-hidden border-border/60">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                </div>
                <div className="rounded-full border border-border/60 bg-muted/30 p-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Flow Overview</CardTitle>
            <CardDescription>
              Transfer count, approved volume, and new customers over the selected range.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[340px] min-h-[340px]">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={timelineData}>
                    <defs>
                      <linearGradient id="dashboard-flow-volume" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartPalette.primary} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={chartPalette.primary} stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={chartPalette.grid} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: chartPalette.mutedForeground }} tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis
                      yAxisId="left"
                      tick={{ fill: chartPalette.mutedForeground }}
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      stroke={chartPalette.mutedForeground}
                      allowDecimals={false}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fill: chartPalette.mutedForeground }}
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      stroke={chartPalette.mutedForeground}
                      tickFormatter={(value) => formatCompactCurrency(Number(value || 0))}
                    />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      itemStyle={{ color: chartPalette.foreground }}
                      labelStyle={{ color: chartPalette.foreground }}
                      formatter={(value, name) => {
                        if (name === 'Volume') return formatCurrency(Number(value || 0));
                        return Number(value || 0).toLocaleString();
                      }}
                    />
                    <Legend wrapperStyle={{ color: chartPalette.foreground }} />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="volume"
                      name="Volume"
                      fill="url(#dashboard-flow-volume)"
                      stroke={chartPalette.primary}
                      strokeWidth={2}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="transfers"
                      name="Transfers"
                      fill={chartPalette.chart2}
                      radius={[4, 4, 0, 0]}
                      barSize={16}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="customers"
                      name="New Customers"
                      stroke={chartPalette.chart3}
                      strokeWidth={2.25}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                chartPlaceholder
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest transactions in the current time window.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {recentActivity.map((activity, index) => (
                <div key={`${activity.id}-${index}`} className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {activity.customerInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{activity.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {getStatusLabel(activity.status)} •{' '}
                      {formatCurrency(getNumeric(activity.source_amount || activity.amount))}
                    </p>
                  </div>
                  <Badge
                    variant={
                      approvedStatuses.includes(String(activity.status || '').toLowerCase())
                        ? 'default'
                        : 'secondary'
                    }
                    className="h-5 text-[10px]"
                  >
                    {getStatusLabel(activity.status)}
                  </Badge>
                </div>
              ))}
              {recentActivity.length === 0 && !loading && (
                <div className="py-10 text-center text-muted-foreground">
                  No recent activity in this range.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Status Breakdown</CardTitle>
            <CardDescription>Transfer status distribution in the selected range.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-[300px] min-h-[300px] w-full">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`status-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      itemStyle={{ color: chartPalette.foreground }}
                      labelStyle={{ color: chartPalette.foreground }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                chartPlaceholder
              )}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{filteredTransfers.length}</span>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  Transfers
                </span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {statusChartData.map((status) => (
                <div key={status.name} className="flex items-center gap-2 text-xs">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                  <span className="text-muted-foreground">{status.name}</span>
                  <span className="font-medium">{status.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Pipeline Trend</CardTitle>
            <CardDescription>
              Approved versus queued transfers across the selected range.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] min-h-[300px]">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timelineData}>
                    <CartesianGrid stroke={chartPalette.grid} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: chartPalette.mutedForeground }} tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tick={{ fill: chartPalette.mutedForeground }} tickLine={false} axisLine={false} fontSize={12} stroke={chartPalette.mutedForeground} allowDecimals={false} />
                    <Tooltip contentStyle={chartTooltipStyle} itemStyle={{ color: chartPalette.foreground }} labelStyle={{ color: chartPalette.foreground }} />
                    <Legend wrapperStyle={{ color: chartPalette.foreground }} />
                    <Bar
                      dataKey="approvedCount"
                      name="Approved"
                      stackId="pipeline"
                      fill={chartPalette.chart2}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="queuedCount"
                      name="Queued"
                      stackId="pipeline"
                      fill={chartPalette.chart3}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                chartPlaceholder
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Branch Breakdown
            </CardTitle>
            <CardDescription>Top branches by transfer value.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[290px] min-h-[290px]">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={branchBreakdown}
                    layout="vertical"
                    margin={{ left: 12, right: 12 }}
                  >
                    <CartesianGrid stroke={chartPalette.grid} strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={130}
                      tick={{ fill: chartPalette.mutedForeground }}
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      stroke={chartPalette.mutedForeground}
                    />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      itemStyle={{ color: chartPalette.foreground }}
                      labelStyle={{ color: chartPalette.foreground }}
                      formatter={(value) => formatCurrency(Number(value || 0))}
                    />
                    <Bar
                      dataKey="value"
                      fill={chartPalette.primary}
                      radius={[0, 5, 5, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                chartPlaceholder
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-muted-foreground" />
              Payout Mix
            </CardTitle>
            <CardDescription>Top payout currencies by destination amount.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[290px] min-h-[290px]">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={payoutCurrencyBreakdown}>
                    <CartesianGrid stroke={chartPalette.grid} strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: chartPalette.mutedForeground }}
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                    />
                    <YAxis tick={{ fill: chartPalette.mutedForeground }} tickLine={false} axisLine={false} fontSize={12} stroke={chartPalette.mutedForeground} />
                    <Tooltip contentStyle={chartTooltipStyle} itemStyle={{ color: chartPalette.foreground }} labelStyle={{ color: chartPalette.foreground }} />
                    <Bar
                      dataKey="value"
                      fill={chartPalette.chart3}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                chartPlaceholder
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Customer Geography
            </CardTitle>
            <CardDescription>Top countries represented in the customer base.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {geographyBreakdown.map((item) => (
              <div key={item.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate text-muted-foreground">{item.name}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
                <Progress
                  value={
                    customers.length > 0
                      ? (item.value / customers.length) * 100
                      : 0
                  }
                  className="h-2"
                />
              </div>
            ))}
            {geographyBreakdown.length === 0 && !loading && (
              <div className="py-10 text-center text-muted-foreground">
                No geography data available.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Weekday Activity</CardTitle>
            <CardDescription>Transfer count by weekday in the active window.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] min-h-[260px]">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekdayBreakdown}>
                    <CartesianGrid stroke={chartPalette.grid} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: chartPalette.mutedForeground }} tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tick={{ fill: chartPalette.mutedForeground }} tickLine={false} axisLine={false} fontSize={12} stroke={chartPalette.mutedForeground} allowDecimals={false} />
                    <Tooltip contentStyle={chartTooltipStyle} itemStyle={{ color: chartPalette.foreground }} labelStyle={{ color: chartPalette.foreground }} />
                    <Bar
                      dataKey="transfers"
                      fill={chartPalette.chart4}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                chartPlaceholder
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>KYC Pipeline</CardTitle>
            <CardDescription>
              Distribution of customer verification states across the full customer base.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[320px_1fr]">
            <div className="relative h-[260px] min-h-[260px] w-full">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={kycBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={86}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {kycBreakdown.map((entry, index) => (
                        <Cell key={`kyc-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      itemStyle={{ color: chartPalette.foreground }}
                      labelStyle={{ color: chartPalette.foreground }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                chartPlaceholder
              )}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{customers.length}</span>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  Customers
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {kycBreakdown.map((item) => (
                <div
                  key={item.name}
                  className="rounded-xl border border-border/60 bg-muted/20 p-3"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold">{item.value}</span>
                  </div>
                  <Progress value={item.share} className="h-2" />
                  <div className="mt-2 text-xs text-muted-foreground">
                    {item.share.toFixed(1)}% of total customers
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

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
  ArrowDownRight,
  ArrowRightLeft,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Coins,
  Globe2,
  ShieldCheck,
  TrendingUp,
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

type RecentActivity = DashboardTransfer & {
  customerName: string;
  customerInitials: string;
};

type SummaryCard = {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  trendLabel: string;
  trendUp: boolean;
};

const RANGE_DAYS: Record<RangeKey, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

const STATUS_COLORS: Record<string, string> = {
  completed: 'hsl(var(--primary))',
  approved: 'hsl(var(--chart-2))',
  pending: 'hsl(var(--chart-3))',
  in_review: 'hsl(var(--chart-4))',
  processing: 'hsl(var(--chart-5, 210 90% 60%))',
  rejected: 'hsl(var(--destructive))',
  cancelled: 'hsl(var(--muted-foreground))',
  unknown: 'hsl(var(--muted-foreground))',
};

const KYC_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--destructive))',
  'hsl(var(--muted-foreground))',
];

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

const getTrendMeta = (current: number, previous: number, goodWhenLower = false) => {
  if (previous === 0 && current === 0) {
    return { trendLabel: 'No change', trendUp: true };
  }
  if (previous === 0) {
    return { trendLabel: 'New activity', trendUp: !goodWhenLower };
  }
  const percent = ((current - previous) / previous) * 100;
  const positive = goodWhenLower ? percent <= 0 : percent >= 0;
  return {
    trendLabel: `${percent >= 0 ? '+' : ''}${percent.toFixed(1)}% vs previous`,
    trendUp: positive,
  };
};

const DASHBOARD_BRANCHES = [
  'London - Link Forex Ltd',
  'Birmingham - Premier Link',
  'Manchester - City Exchange',
  'Glasgow - North Hub',
  'Leeds - Central Point',
];

const DASHBOARD_CURRENCIES = ['PKR', 'USD', 'EUR', 'AED', 'LKR', 'INR'];
const DASHBOARD_CUSTOMER_COUNTRIES = ['United Kingdom', 'Pakistan', 'Sri Lanka', 'India', 'UAE'];
const DASHBOARD_NAMES = [
  'Amina Khan',
  'Rizwan Ali',
  'Maya Perera',
  'Daniel Silva',
  'Sajid Hussain',
  'Nimal Fernando',
  'Fatima Noor',
  'Priya Iyer',
  'Imran Malik',
  'Heshani De Silva',
];

const createDashboardMockCustomers = (
  existingCustomers: DashboardCustomer[],
  dates: Date[],
): DashboardCustomer[] => {
  if (existingCustomers.length >= 18) return [];

  const baseId = 900000;
  const needed = Math.max(12, 18 - existingCustomers.length);
  return Array.from({ length: needed }, (_, index) => {
    const date = dates[index % dates.length] || new Date();
    const createdAt = new Date(date);
    createdAt.setHours(9 + (index % 8), (index * 7) % 60, 0, 0);
    return {
      id: `mock-customer-${baseId + index}`,
      name: DASHBOARD_NAMES[index % DASHBOARD_NAMES.length],
      status: index % 5 === 0 ? 'inactive' : 'active',
      kyc_status: ['approved', 'pending', 'in_review'][index % 3],
      country: DASHBOARD_CUSTOMER_COUNTRIES[index % DASHBOARD_CUSTOMER_COUNTRIES.length],
      created_at: createdAt.toISOString(),
      __mock: true,
    };
  });
};

const createDashboardMockTransfers = (
  existingTransfers: DashboardTransfer[],
  displayCustomers: DashboardCustomer[],
  dates: Date[],
): DashboardTransfer[] => {
  if (existingTransfers.length >= 32) return [];

  const baseId = 700000;
  const needed = Math.max(18, 32 - existingTransfers.length);
  return Array.from({ length: needed }, (_, index) => {
    const customer = displayCustomers[index % displayCustomers.length];
    const date = dates[index % dates.length] || new Date();
    const createdAt = new Date(date);
    createdAt.setHours(10 + (index % 9), (index * 11) % 60, 0, 0);
    const sourceAmount = 180 + ((index * 37) % 920);
    const rate = 320 + ((index * 9) % 62);
    const statuses = ['completed', 'approved', 'pending', 'processing', 'in_review', 'rejected'];
    const status = statuses[index % statuses.length];
    const branch = DASHBOARD_BRANCHES[index % DASHBOARD_BRANCHES.length];
    const payoutCurrency = DASHBOARD_CURRENCIES[index % DASHBOARD_CURRENCIES.length];

    return {
      id: `mock-transfer-${baseId + index}`,
      remitter_id: customer?.id ?? `mock-customer-fallback-${index}`,
      remitter_name: customer?.name ?? DASHBOARD_NAMES[index % DASHBOARD_NAMES.length],
      source_amount: sourceAmount.toFixed(2),
      dest_amount: (sourceAmount * rate).toFixed(2),
      amount: sourceAmount.toFixed(2),
      rate: rate.toFixed(2),
      payout_currency: payoutCurrency,
      currency: payoutCurrency,
      status,
      branch_name: branch,
      branch: branch,
      created_at: createdAt.toISOString(),
      __mock: true,
    };
  });
};

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<RangeKey>('30d');
  const [transfers, setTransfers] = useState<DashboardTransfer[]>([]);
  const [customers, setCustomers] = useState<DashboardCustomer[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    void fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [transfersRes, customersRes] = await Promise.all([
        fetch(`${ENDPOINTS.TRANSFERS.LIST}?_t=${Date.now()}`),
        fetch(`${ENDPOINTS.REMITTERS.LIST}?_t=${Date.now()}`),
      ]);

      const transfersData = transfersRes.ok ? await transfersRes.json() : [];
      const customersData = customersRes.ok ? await customersRes.json() : [];

      setTransfers(Array.isArray(transfersData) ? transfersData : []);
      setCustomers(Array.isArray(customersData) ? customersData : []);
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

  const displayCustomers = useMemo(() => {
    const mockCustomers = createDashboardMockCustomers(customers, rangeDates);
    return [...customers, ...mockCustomers];
  }, [customers, rangeDates]);

  const displayTransfers = useMemo(() => {
    const mockTransfers = createDashboardMockTransfers(
      transfers,
      displayCustomers,
      rangeDates,
    );
    return [...transfers, ...mockTransfers];
  }, [displayCustomers, rangeDates, transfers]);

  const filteredTransfers = useMemo(
    () =>
      displayTransfers.filter((transfer) => {
        const createdAt = parseDate(transfer.created_at || transfer.createdAt);
        return createdAt ? createdAt >= rangeStart : false;
      }),
    [displayTransfers, rangeStart],
  );

  const previousTransfers = useMemo(
    () =>
      displayTransfers.filter((transfer) => {
        const createdAt = parseDate(transfer.created_at || transfer.createdAt);
        return createdAt ? createdAt >= previousRangeStart && createdAt < rangeStart : false;
      }),
    [displayTransfers, previousRangeStart, rangeStart],
  );

  const filteredCustomers = useMemo(
    () =>
      displayCustomers.filter((customer) => {
        const createdAt = parseDate(customer.created_at || customer.createdAt);
        return createdAt ? createdAt >= rangeStart : false;
      }),
    [displayCustomers, rangeStart],
  );

  const previousCustomers = useMemo(
    () =>
      displayCustomers.filter((customer) => {
        const createdAt = parseDate(customer.created_at || customer.createdAt);
        return createdAt ? createdAt >= previousRangeStart && createdAt < rangeStart : false;
      }),
    [displayCustomers, previousRangeStart, rangeStart],
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

  const previousCompletedTransfers = useMemo(
    () =>
      previousTransfers.filter((transfer) =>
        approvedStatuses.includes(String(transfer.status || '').toLowerCase()),
      ),
    [previousTransfers],
  );

  const pendingTransfers = useMemo(
    () =>
      filteredTransfers.filter((transfer) =>
        queueStatuses.includes(String(transfer.status || '').toLowerCase()),
      ),
    [filteredTransfers],
  );

  const previousPendingTransfers = useMemo(
    () =>
      previousTransfers.filter((transfer) =>
        queueStatuses.includes(String(transfer.status || '').toLowerCase()),
      ),
    [previousTransfers],
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

  const previousVolume = useMemo(
    () =>
      previousCompletedTransfers.reduce(
        (sum, transfer) =>
          sum + getNumeric(transfer.source_amount || transfer.amount),
        0,
      ),
    [previousCompletedTransfers],
  );

  const averageTransfer =
    completedTransfers.length > 0 ? totalVolume / completedTransfers.length : 0;
  const previousAverageTransfer =
    previousCompletedTransfers.length > 0
      ? previousVolume / previousCompletedTransfers.length
      : 0;

  const approvalRate =
    filteredTransfers.length > 0
      ? (completedTransfers.length / filteredTransfers.length) * 100
      : 0;
  const previousApprovalRate =
    previousTransfers.length > 0
      ? (previousCompletedTransfers.length / previousTransfers.length) * 100
      : 0;

  const activeUsers = displayCustomers.filter(
    (customer) => String(customer.status || '').toLowerCase() === 'active',
  ).length;
  const pendingKYC = displayCustomers.filter(
    (customer) => String(customer.kyc_status || '').toLowerCase() === 'pending',
  ).length;
  const rejectedTransfers = filteredTransfers.filter((transfer) =>
    ['rejected', 'cancelled'].includes(String(transfer.status || '').toLowerCase()),
  ).length;

  const summaryCards: SummaryCard[] = [
    {
      title: 'Transfers',
      value: loading ? '...' : filteredTransfers.length.toLocaleString(),
      description: 'Created in selected range',
      icon: ArrowRightLeft,
      ...getTrendMeta(filteredTransfers.length, previousTransfers.length),
    },
    {
      title: 'Transfer Volume',
      value: loading ? '...' : formatCompactCurrency(totalVolume),
      description: 'Approved and completed volume',
      icon: Wallet,
      ...getTrendMeta(totalVolume, previousVolume),
    },
    {
      title: 'Average Ticket',
      value: loading ? '...' : formatCurrency(averageTransfer),
      description: 'Average approved transfer size',
      icon: Coins,
      ...getTrendMeta(averageTransfer, previousAverageTransfer),
    },
    {
      title: 'Approval Rate',
      value: loading ? '...' : `${approvalRate.toFixed(1)}%`,
      description: 'Approved vs total transfers',
      icon: BadgeCheck,
      ...getTrendMeta(approvalRate, previousApprovalRate),
    },
    {
      title: 'Pending Transfers',
      value: loading ? '...' : pendingTransfers.length.toLocaleString(),
      description: 'Pending, in review, or processing',
      icon: Activity,
      ...getTrendMeta(
        pendingTransfers.length,
        previousPendingTransfers.length,
        true,
      ),
    },
    {
      title: 'Active Users',
      value: loading ? '...' : activeUsers.toLocaleString(),
      description: 'Current active remitter accounts',
      icon: Users,
      ...getTrendMeta(filteredCustomers.length, previousCustomers.length),
    },
    {
      title: 'Pending KYC',
      value: loading ? '...' : pendingKYC.toLocaleString(),
      description: 'Profiles awaiting review',
      icon: ShieldCheck,
      ...getTrendMeta(pendingKYC, pendingKYC, true),
    },
    {
      title: 'New Customers',
      value: loading ? '...' : filteredCustomers.length.toLocaleString(),
      description: 'Registered in selected range',
      icon: Globe2,
      ...getTrendMeta(filteredCustomers.length, previousCustomers.length),
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

  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredTransfers.forEach((transfer) => {
      const status = String(transfer.status || 'unknown').toLowerCase();
      counts[status] = (counts[status] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([status, value]) => ({
        name: getStatusLabel(status),
        value,
        color: STATUS_COLORS[status] || 'hsl(var(--muted-foreground))',
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransfers]);

  const branchBreakdown = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredTransfers.forEach((transfer) => {
      const branchName = String(
        transfer.branch_name ||
          transfer.branch ||
          transfer.to_branch ||
          transfer.branch_code ||
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
  }, [filteredTransfers]);

  const payoutCurrencyBreakdown = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredTransfers.forEach((transfer) => {
      const code = String(
        transfer.payout_currency || transfer.currency || 'N/A',
      ).toUpperCase();
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
    displayCustomers.forEach((customer) => {
      const status = String(customer.kyc_status || customer.status || 'unknown').toLowerCase();
      counts[status] = (counts[status] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value], index) => ({
        name: getStatusLabel(name),
        value,
        color: KYC_COLORS[index % KYC_COLORS.length],
        share: displayCustomers.length > 0 ? (value / displayCustomers.length) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [displayCustomers]);

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
    displayCustomers.forEach((customer) => {
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
  }, [displayCustomers]);

  const recentActivity = useMemo<RecentActivity[]>(() => {
    return [...filteredTransfers]
      .sort((left, right) => {
        const leftDate = parseDate(left.created_at)?.getTime() || 0;
        const rightDate = parseDate(right.created_at)?.getTime() || 0;
        return rightDate - leftDate;
      })
      .slice(0, 8)
      .map((transfer) => {
        const customer = displayCustomers.find(
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
  }, [displayCustomers, filteredTransfers]);

  const strongestBranch = branchBreakdown[0];
  const strongestCurrency = payoutCurrencyBreakdown[0];
  const queueRatio =
    filteredTransfers.length > 0
      ? (pendingTransfers.length / filteredTransfers.length) * 100
      : 0;

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

      <div className="grid gap-4 xl:grid-cols-[1.8fr_1fr]">
        <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-card via-card to-primary/10">
          <CardHeader className="border-b border-border/60 bg-background/20 backdrop-blur-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle className="text-xl">Executive Snapshot</CardTitle>
                <CardDescription>
                  {loading
                    ? 'Loading dashboard summary...'
                    : `${filteredTransfers.length.toLocaleString()} transfers generated ${formatCurrency(totalVolume)} in the selected period.`}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
                  Queue {queueRatio.toFixed(1)}%
                </Badge>
                <Badge variant="outline">
                  Rejected {rejectedTransfers.toLocaleString()}
                </Badge>
                <Badge variant="outline">
                  Customers {displayCustomers.length.toLocaleString()}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 p-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Throughput
              </div>
              <div className="text-3xl font-semibold tracking-tight">
                {loading ? '...' : formatCompactCurrency(totalVolume)}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Best branch: {strongestBranch?.name || 'N/A'}
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Activity className="h-4 w-4" />
                Queue Health
              </div>
              <div className="text-3xl font-semibold tracking-tight">
                {loading ? '...' : pendingTransfers.length.toLocaleString()}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Active queue volume vs completed flow.
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Globe2 className="h-4 w-4" />
                Demand Leader
              </div>
              <div className="text-3xl font-semibold tracking-tight">
                {loading ? '...' : strongestCurrency?.name || 'N/A'}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Highest payout destination by amount.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operations Pulse</CardTitle>
            <CardDescription>Quick checks for approvals, queue load, and KYC backlog.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Approval rate</span>
                <span className="font-medium">{approvalRate.toFixed(1)}%</span>
              </div>
              <Progress value={approvalRate} className="h-2.5" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Queue load</span>
                <span className="font-medium">{queueRatio.toFixed(1)}%</span>
              </div>
              <Progress value={queueRatio} className="h-2.5" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">KYC backlog</span>
                <span className="font-medium">
                  {displayCustomers.length > 0
                    ? ((pendingKYC / displayCustomers.length) * 100).toFixed(1)
                    : '0.0'}%
                </span>
              </div>
              <Progress
                value={
                  displayCustomers.length > 0
                    ? (pendingKYC / displayCustomers.length) * 100
                    : 0
                }
                className="h-2.5"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border bg-muted/30 p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Avg ticket
                </div>
                <div className="mt-1 text-lg font-semibold">{formatCurrency(averageTransfer)}</div>
              </div>
              <div className="rounded-xl border bg-muted/30 p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Rejected
                </div>
                <div className="mt-1 text-lg font-semibold">{rejectedTransfers.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          const TrendIcon = card.trendUp ? ArrowUpRight : ArrowDownRight;
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
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold">{card.value}</div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">{card.description}</p>
                  <Badge
                    variant="outline"
                    className={`gap-1 text-[10px] ${
                      card.trendUp
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    <TrendIcon className="h-3 w-3" />
                    {card.trendLabel}
                  </Badge>
                </div>
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
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis
                      yAxisId="left"
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      allowDecimals={false}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      tickFormatter={(value) => formatCompactCurrency(Number(value || 0))}
                    />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === 'Volume') return formatCurrency(Number(value || 0));
                        return Number(value || 0).toLocaleString();
                      }}
                    />
                    <Legend />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="volume"
                      name="Volume"
                      fill="url(#dashboard-flow-volume)"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="transfers"
                      name="Transfers"
                      fill="hsl(var(--chart-2))"
                      radius={[4, 4, 0, 0]}
                      barSize={16}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="customers"
                      name="New Customers"
                      stroke="hsl(var(--chart-3))"
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
                    <Tooltip />
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
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="approvedCount"
                      name="Approved"
                      stackId="pipeline"
                      fill="hsl(var(--chart-2))"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="queuedCount"
                      name="Queued"
                      stackId="pipeline"
                      fill="hsl(var(--chart-3))"
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

      <div className="grid gap-4 xl:grid-cols-4">
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
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={130}
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                    />
                    <Tooltip formatter={(value) => formatCurrency(Number(value || 0))} />
                    <Bar
                      dataKey="value"
                      fill="hsl(var(--primary))"
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

        <Card>
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
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                    />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip />
                    <Bar
                      dataKey="value"
                      fill="hsl(var(--chart-3))"
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

        <Card>
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
                    displayCustomers.length > 0
                      ? (item.value / displayCustomers.length) * 100
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
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                    <Tooltip />
                    <Bar
                      dataKey="transfers"
                      fill="hsl(var(--chart-4))"
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
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                chartPlaceholder
              )}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{displayCustomers.length}</span>
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

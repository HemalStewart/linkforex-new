'use client';

import React, { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { 
    ArrowRightLeft, 
    Users, 
    ShieldCheck, 
    Coins,
    TrendingUp,
    TrendingDown,
    Activity,
    Clock
} from 'lucide-react';
import { ENDPOINTS } from '@/lib/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalTransfers: 0,
        activeUsers: 0,
        pendingKYC: 0,
        totalRevenue: 0
    });
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [volumeData, setVolumeData] = useState<any[]>([]);
    const [statusChartData, setStatusChartData] = useState<any[]>([]);
    const [revenueData, setRevenueData] = useState<any[]>([]);

    useEffect(() => {
        void fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [transfersRes, customersRes] = await Promise.all([
                fetch(`${ENDPOINTS.TRANSFERS.LIST}?_t=${Date.now()}`),
                fetch(`${ENDPOINTS.REMITTERS.LIST}?_t=${Date.now()}`)
            ]);

            const transfers = transfersRes.ok ? await transfersRes.json() : [];
            const customers = customersRes.ok ? await customersRes.json() : [];

            // Calculate stats
            const completedTransfers = Array.isArray(transfers) ? transfers.filter((t: any) => t.status === 'completed') : [];
            const totalRevenue = completedTransfers.reduce((sum: number, t: any) => sum + parseFloat(t.source_amount || 0), 0);
            const pendingKYC = Array.isArray(customers) ? customers.filter((c: any) => c.kyc_status === 'pending').length : 0;

            setStats({
                totalTransfers: transfers.length || 0,
                activeUsers: Array.isArray(customers) ? customers.filter((c: any) => c.status === 'active').length : 0,
                pendingKYC: pendingKYC,
                totalRevenue: totalRevenue
            });

            // Status Breakdown
            const statusCounts: Record<string, number> = {};
            if (Array.isArray(transfers)) {
                transfers.forEach((t: any) => {
                    const s = t.status || 'unknown';
                    statusCounts[s] = (statusCounts[s] || 0) + 1;
                });
            }

            const statusColors: Record<string, string> = {
                completed: 'hsl(var(--primary))',
                in_transit: 'hsl(var(--chart-2))',
                pending: 'hsl(var(--chart-3))',
                in_review: 'hsl(var(--chart-4))',
                rejected: 'hsl(var(--destructive))',
                cancelled: 'hsl(var(--muted-foreground))'
            };

            setStatusChartData(Object.keys(statusCounts).map(status => ({
                name: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
                value: statusCounts[status],
                color: statusColors[status] || 'hsl(var(--muted))'
            })));

            // Volume Data (last 7 days)
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                return d;
            });

            setVolumeData(last7Days.map(date => {
                const dayName = days[date.getDay()];
                const dateStr = date.toISOString().split('T')[0];
                const dayTransfers = Array.isArray(transfers) ? transfers.filter((t: any) => t.created_at && t.created_at.startsWith(dateStr)) : [];
                return { name: dayName, value: dayTransfers.length };
            }));

            // Revenue Data top 5 branches
            const branchRevenue: Record<string, number> = {};
            if (Array.isArray(transfers)) {
                transfers.forEach((t: any) => {
                    const customer = Array.isArray(customers) ? customers.find((c: any) => c.id === t.remitter_id) : null;
                    const branch = customer?.branch || 'HQ';
                    branchRevenue[branch] = (branchRevenue[branch] || 0) + parseFloat(t.source_amount || 0);
                });
            }

            setRevenueData(Object.keys(branchRevenue).map(branch => ({
                name: branch.replace('Link Forex Ltd', '').replace('-', '').trim() || branch,
                value: branchRevenue[branch]
            })).sort((a, b) => b.value - a.value).slice(0, 5));

            // Recent activity
            if (Array.isArray(transfers)) {
                const recent = [...transfers].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 5)
                    .map((t: any) => {
                        const customer = Array.isArray(customers) ? customers.find((c: any) => c.id === t.remitter_id) : null;
                        return {
                            ...t,
                            customerName: customer?.name || 'Unknown',
                            customerInitials: customer?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'
                        };
                    });
                setRecentActivity(recent);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div className="flex items-center space-x-2">
                    <Select defaultValue="7d">
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7d">Last 7 Days</SelectItem>
                            <SelectItem value="30d">Last 30 Days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Transfers</CardTitle>
                        <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? '...' : stats.totalTransfers.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            <span className="text-emerald-500 font-medium">+12.5%</span> from last month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? '...' : stats.activeUsers.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            <span className="text-emerald-500 font-medium">+5.2%</span> from last month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending KYC</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? '...' : stats.pendingKYC}</div>
                        <p className="text-xs text-muted-foreground">
                            Requires immediate review
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <Coins className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loading ? '...' : `£${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            <span className="text-emerald-500 font-medium">+18.3%</span> from last month
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Overview</CardTitle>
                        <CardDescription>Transaction volume for the last 7 days.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={volumeData}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                                    />
                                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest transactions across all modules.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {recentActivity.map((activity, i) => (
                                <div key={i} className="flex items-center">
                                    <Avatar className="h-9 w-9">
                                        <AvatarFallback className="bg-primary/10 text-primary">{activity.customerInitials}</AvatarFallback>
                                    </Avatar>
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none">{activity.customerName}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {activity.status === 'completed' ? 'Completed' : 'Pending'} • £{parseFloat(activity.source_amount || 0).toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="ml-auto">
                                        <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'} className="text-[10px] h-5">
                                            {activity.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                            {recentActivity.length === 0 && !loading && (
                                <div className="text-center py-10 text-muted-foreground">No recent activity</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Status Breakdown</CardTitle>
                        <CardDescription>Current transfer statuses distribution.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {statusChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-2xl font-bold">{stats.totalTransfers}</span>
                                <span className="text-xs text-muted-foreground uppercase">Total</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-4">
                            {statusChartData.map((s, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                                    <span className="text-muted-foreground">{s.name}:</span>
                                    <span className="font-medium">{s.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Top Branches</CardTitle>
                        <CardDescription>Revenue generated by top 5 branches.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `£${val}`} />
                                    <Tooltip cursor={{fill: 'hsl(var(--muted))', opacity: 0.4}} />
                                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

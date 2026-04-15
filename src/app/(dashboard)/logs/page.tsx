'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { 
    Activity, 
    AlertCircle, 
    Clock3, 
    Download, 
    FilterX, 
    RefreshCw, 
    Search, 
    ShieldAlert, 
    UserCheck,
    ChevronLeft,
    ChevronRight,
    Terminal,
    Info
} from 'lucide-react';
import { ENDPOINTS } from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { toast } from "sonner"

// Types
type LogRow = {
    id: number;
    logId: number;
    username: string;
    transfersImpact: number;
    transfersApproveImpact: number;
    logCountry: string;
    ip: string;
    signInTs: string;
    signOffTs: string | null;
    signOffNote: string;
    riskLabel: string;
    rawStatus: string;
};

type SessionLog = LogRow & {
    status: 'Active' | 'Closed';
    forcedSignOff: boolean;
    risk: 'Low' | 'Medium' | 'High';
    riskScore: number;
    riskReasons: string[];
    activityScore: number;
    sessionSeconds: number;
    sessionPeriod: string;
    signInEpoch: number;
    signOffEpoch: number;
};

// Helpers
const toEpoch = (value?: string | null): number => {
    if (!value) return 0;
    const normalized = value.includes('T') ? value : value.replace(' ', 'T');
    const epoch = new Date(normalized).getTime();
    return Number.isNaN(epoch) ? 0 : epoch;
};

const formatDuration = (seconds: number): string => {
    if (!seconds) return '-';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
};

export default function LogsPage() {
    const [logs, setLogs] = useState<LogRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateRangeFilter, setDateRangeFilter] = useState('30d');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(ENDPOINTS.LOGS.LIST);
            if (res.ok) {
                const data = await res.json();
                const normalized = (Array.isArray(data) ? data : []).map((log: any) => ({
                    id: Number(log.id ?? 0),
                    logId: Number(log.id ?? 0),
                    username: log.username || log.user_name || log.user || log.email || '-',
                    transfersImpact: Number(log.transfers_impact ?? 0),
                    transfersApproveImpact: Number(log.transfers_approve_impact ?? 0),
                    logCountry: log.log_country || log.country || '-',
                    ip: log.log_ip || log.ip || '-',
                    signInTs: log.sign_in || log.signin || log.created_at || '',
                    signOffTs: log.sign_off || log.signoff || null,
                    signOffNote: log.sign_off_note || log.note || '-',
                    riskLabel: log.risk || log.risk_level || 'low',
                    rawStatus: String(log.status || 'closed').toLowerCase()
                }));
                setLogs(normalized);
            }
        } catch (error) {
            toast.error("Failed to load logs");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchLogs();
    }, [fetchLogs]);

    const processedLogs = useMemo<SessionLog[]>(() => {
        return logs.map(row => {
            const signInEpoch = toEpoch(row.signInTs);
            const signOffEpoch = toEpoch(row.signOffTs);
            const sessionSeconds = (signInEpoch && signOffEpoch && signOffEpoch > signInEpoch) 
                ? Math.floor((signOffEpoch - signInEpoch) / 1000) 
                : 0;
            
            const isForced = ['auto', 'expired', 'timeout', 'session'].some(term => row.signOffNote.toLowerCase().includes(term));
            const status = (row.rawStatus === 'active' || !row.signOffTs) ? 'Active' : 'Closed';
            const activityScore = row.transfersImpact + (row.transfersApproveImpact * 2);

            let riskScore = 0;
            const reasons: string[] = [];
            if (isForced) { riskScore += 50; reasons.push('Forced sign-off'); }
            if (activityScore > 20) { riskScore += 30; reasons.push('High activity'); }
            
            const risk: SessionLog['risk'] = riskScore >= 70 ? 'High' : riskScore >= 35 ? 'Medium' : 'Low';

            return {
                ...row,
                status,
                forcedSignOff: isForced,
                risk,
                riskScore,
                riskReasons: reasons,
                activityScore,
                sessionSeconds,
                sessionPeriod: formatDuration(sessionSeconds),
                signInEpoch,
                signOffEpoch
            };
        });
    }, [logs]);

    const filteredLogs = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return processedLogs.filter(row => {
            if (statusFilter !== 'all' && row.status.toLowerCase() !== statusFilter) return false;
            if (!query) return true;
            return (
                row.username.toLowerCase().includes(query) ||
                row.ip.toLowerCase().includes(query) ||
                row.logCountry.toLowerCase().includes(query)
            );
        });
    }, [processedLogs, searchQuery, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
    const startIndex = (page - 1) * pageSize;
    const pagedLogs = filteredLogs.slice(startIndex, startIndex + pageSize);

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Security Logs</h1>
                    <p className="text-muted-foreground">Monitor user sessions, IP addresses and system activities.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
                        <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                    </Button>
                    <Button size="sm">
                        <Download className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                        <Terminal className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{processedLogs.length}</div>
                        <p className="text-xs text-muted-foreground">Logged in last 30 days</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                        <Activity className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{processedLogs.filter(l => l.status === 'Active').length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">High Risk</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{processedLogs.filter(l => l.risk === 'High').length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                        <Clock3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">14m 20s</div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by user, IP or country..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                    />
                </div>
                <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Sessions</SelectItem>
                        <SelectItem value="active">Active Only</SelectItem>
                        <SelectItem value="closed">Closed Only</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-md border bg-card overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">ID</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Risk</TableHead>
                            <TableHead>Sign In / Out</TableHead>
                            <TableHead>Location / IP</TableHead>
                            <TableHead>Activity</TableHead>
                            <TableHead>Duration</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={8} className="h-24 text-center">Loading logs...</TableCell></TableRow>
                        ) : pagedLogs.length === 0 ? (
                            <TableRow><TableCell colSpan={8} className="h-24 text-center">No logs found.</TableCell></TableRow>
                        ) : (
                            pagedLogs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="text-xs text-muted-foreground">#{log.logId}</TableCell>
                                    <TableCell className="font-medium">{log.username}</TableCell>
                                    <TableCell>
                                        <Badge variant={log.status === 'Active' ? 'default' : 'secondary'} className="text-[10px] uppercase">
                                            {log.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={log.risk === 'High' ? 'destructive' : log.risk === 'Medium' ? 'outline' : 'secondary'} className="text-[10px] uppercase">
                                            {log.risk}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs">
                                        <div className="flex flex-col">
                                            <span>{log.signInTs ? new Date(log.signInTs).toLocaleString() : '-'}</span>
                                            <span className="text-muted-foreground italic flex items-center gap-1">
                                                {log.signOffTs ? <Info size={10} /> : null}
                                                {log.signOffTs ? new Date(log.signOffTs).toLocaleString() : 'In Progress'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs">
                                        <div className="flex flex-col">
                                            <span>{log.logCountry}</span>
                                            <code className="text-muted-foreground">{log.ip}</code>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <div className="text-[10px] text-muted-foreground uppercase">Updates: {log.transfersImpact}</div>
                                            <div className="text-[10px] text-muted-foreground uppercase">Approvals: {log.transfersApproveImpact}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs font-mono">{log.sessionPeriod}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredLogs.length)} of {filteredLogs.length}</p>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}><ChevronLeft size={16} /></Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === totalPages}><ChevronRight size={16} /></Button>
                </div>
            </div>
        </div>
    );
}

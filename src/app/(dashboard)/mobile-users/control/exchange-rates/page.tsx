'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { 
    RefreshCw, 
    Search, 
    Globe,
    TrendingUp,
    Building2,
    Calendar
} from 'lucide-react';
import { ENDPOINTS } from '@/lib/api';
import type { MobileExchangeRate } from '@/lib/mobileControl';
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
import { toast } from "sonner"

export default function MobileExchangeRatesPage() {
    const [rows, setRows] = useState<MobileExchangeRate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(ENDPOINTS.MOBILE_ADMIN.EXCHANGE_RATES);
            const data = res.ok ? await res.json() : [];
            const filtered = (Array.isArray(data) ? data : []).filter(
                (row: MobileExchangeRate) => String(row.payout_enabled || '').trim().toLowerCase() !== 'no'
            );
            setRows(filtered);
        } catch (error) {
            toast.error("Failed to load digital rates");
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchData();
    }, []);

    const filteredRows = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return rows;
        return rows.filter((row) =>
            [
                row.code,
                row.currency_code,
                row.name,
                row.currency_name,
                row.rate,
                row.source_branch_name,
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query))
        );
    }, [rows, searchQuery]);

    const sortedRows = useMemo(() => {
        return [...filteredRows].sort((a, b) => {
            const aCode = String(a.code || a.currency_code || '').toUpperCase();
            const bCode = String(b.code || b.currency_code || '').toUpperCase();
            if (aCode !== bCode) return aCode.localeCompare(bCode);
            const aUpdated = a.updated_at ? new Date(a.updated_at).getTime() : 0;
            const bUpdated = b.updated_at ? new Date(b.updated_at).getTime() : 0;
            return bUpdated - aUpdated;
        });
    }, [filteredRows]);

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Customer Digital Rates</h1>
                    <p className="text-muted-foreground">Mobile-specific exchange rates backed by branch operations.</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                    <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                </Button>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search currency, branch, or rate..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border bg-card overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Currency</TableHead>
                            <TableHead>Digital Rate</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Source Branch</TableHead>
                            <TableHead>Last Updated</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">Loading rates...</TableCell></TableRow>
                        ) : sortedRows.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">No digital rates found.</TableCell></TableRow>
                        ) : (
                            sortedRows.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-sm">{row.currency_code} {row.currency_symbol || row.symbol}</span>
                                            <span className="text-[10px] text-muted-foreground">{row.currency_name || row.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 font-mono text-emerald-600 font-bold">
                                            <TrendingUp size={14} />
                                            {Number(row.rate || 0).toFixed(4)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={row.status === 'active' ? 'default' : 'secondary'} className="uppercase text-[9px]">
                                            {row.status || 'Active'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 text-xs">
                                            <Building2 size={12} className="text-muted-foreground" />
                                            <span>{row.source_branch_name} ({row.source_branch_code})</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                            <Calendar size={10} />
                                            {row.updated_at ? new Date(row.updated_at).toLocaleString() : '-'}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1 italic">
                Note: Digital rates are derived from branch-level rates and cannot be edited directly here.
            </p>
        </div>
    );
}

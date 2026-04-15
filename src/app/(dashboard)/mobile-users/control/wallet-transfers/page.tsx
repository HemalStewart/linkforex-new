'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Save, Search, Wallet, ArrowRight, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { ENDPOINTS } from '@/lib/api';
import type { WalletTransfer } from '@/lib/mobileControl';
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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

const STATUS_OPTIONS = [
    { value: 'all', label: 'All Statuses' },
    { value: 'awaiting_funds', label: 'Awaiting Funds' },
    { value: 'funds_received', label: 'Funds Received' },
    { value: 'processing', label: 'Processing' },
    { value: 'completed', label: 'Completed' },
    { value: 'rejected', label: 'Rejected' },
];

export default function WalletTransfersPage() {
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<number | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [search, setSearch] = useState('');
    const [rows, setRows] = useState<WalletTransfer[]>([]);
    const [notes, setNotes] = useState<Record<number, string>>({});
    const [draftStatuses, setDraftStatuses] = useState<Record<number, string>>({});

    const loadTransfers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.set('status', statusFilter);
            if (search.trim()) params.set('search', search.trim());

            const res = await fetch(`${ENDPOINTS.MOBILE_ADMIN.TRANSFERS}?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                const list = Array.isArray(data) ? data : [];
                setRows(list);
                setNotes(Object.fromEntries(list.map((row: WalletTransfer) => [row.id, row.wallet_status_note || ''])));
                setDraftStatuses(Object.fromEntries(list.map((row: WalletTransfer) => [row.id, row.status || 'awaiting_funds'])));
            }
        } catch (error) {
            toast.error("Failed to load wallet transfers");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadTransfers();
    }, [statusFilter]);

    const filtered = useMemo(() => {
        const needle = search.trim().toLowerCase();
        if (!needle) return rows;
        return rows.filter((row) =>
            [row.code, row.remitter_name, row.remitter_email, row.beneficiary_name, row.wallet_tx_hash, row.payment_reference]
                .some((value) => String(value || '').toLowerCase().includes(needle))
        );
    }, [rows, search]);

    const saveRow = async (row: WalletTransfer) => {
        setSavingId(row.id);
        try {
            const res = await fetch(ENDPOINTS.MOBILE_ADMIN.TRANSFER_DETAIL(row.id), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: draftStatuses[row.id] || row.status,
                    wallet_status_note: notes[row.id] || '',
                    wallet_tx_hash: row.wallet_tx_hash || '',
                }),
            });
            if (res.ok) {
                const updated = await res.json();
                setRows((prev) => prev.map((item) => (item.id === row.id ? updated : item)));
                toast.success("Transfer status updated");
            } else {
                toast.error("Failed to update transfer");
            }
        } catch (error) {
            toast.error("Network error");
        } finally {
            setSavingId(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed': return <Badge className="bg-emerald-500 hover:bg-emerald-600">Completed</Badge>;
            case 'processing': return <Badge className="bg-blue-500 hover:bg-blue-600">Processing</Badge>;
            case 'funds_received': return <Badge className="bg-sky-500 hover:bg-sky-600">Funds Received</Badge>;
            case 'awaiting_funds': return <Badge variant="outline" className="text-amber-600 border-amber-600">Awaiting Funds</Badge>;
            case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Wallet Funding Queue</h1>
                    <p className="text-muted-foreground">Review and settle manual wallet-to-crypto transfers.</p>
                </div>
                <Button variant="outline" size="icon" onClick={loadTransfers} disabled={loading} aria-label="Refresh wallet transfers" title="Refresh wallet transfers">
                    <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Settlements</CardTitle>
                        <Wallet className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{rows.filter(r => r.status === 'awaiting_funds').length}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search reference, email or tx hash..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        {STATUS_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-md border bg-card overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Transfer</TableHead>
                            <TableHead>Sender & Recipient</TableHead>
                            <TableHead>Amounts</TableHead>
                            <TableHead>Wallet Proof</TableHead>
                            <TableHead>Status & Note</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={6} className="h-24 text-center">Loading queue...</TableCell></TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="h-24 text-center">No transfers found.</TableCell></TableRow>
                        ) : (
                            filtered.map((row) => (
                                <TableRow key={row.id} className="align-top">
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <span className="font-mono font-bold text-xs">{row.code}</span>
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <Clock size={10} /> {row.created_at ? new Date(row.created_at).toLocaleString() : '-'}
                                            </span>
                                            <Badge variant="outline" className="text-[9px] w-fit italic">{row.payment_mode || 'trust_wallet'}</Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-2">
                                            <div>
                                                <div className="font-semibold text-xs">{row.remitter_name}</div>
                                                <div className="text-[10px] text-muted-foreground">{row.remitter_email}</div>
                                            </div>
                                            <div className="border-t pt-1 border-dashed">
                                                <div className="font-semibold text-xs text-blue-600">{row.beneficiary_name}</div>
                                                <div className="text-[10px] text-muted-foreground">{row.beneficiary_bank_name}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col font-mono">
                                            <span className="text-xs font-bold">{row.source_amount.toFixed(2)} {row.source_currency}</span>
                                            <ArrowRight size={10} className="my-0.5 text-muted-foreground" />
                                            <span className="text-xs font-bold text-emerald-600">{row.dest_amount.toFixed(2)} {row.payout_currency}</span>
                                            <span className="text-[9px] text-muted-foreground mt-1">Rate: {row.rate.toFixed(4)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[150px]">
                                        <div className="flex flex-col gap-1">
                                            <div className="text-[10px] font-bold">Ref: {row.payment_reference || '-'}</div>
                                            <div className="text-[9px] break-all text-muted-foreground bg-muted p-1 rounded">
                                                {row.wallet_tx_hash || 'No hash supplied'}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="min-w-[200px]">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                {getStatusBadge(row.status)}
                                                <Select 
                                                    value={draftStatuses[row.id] || row.status} 
                                                    onValueChange={(val) => setDraftStatuses(prev => ({ ...prev, [row.id]: val }))}
                                                >
                                                    <SelectTrigger className="h-7 text-[10px] w-[130px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {STATUS_OPTIONS.filter(o => o.value !== 'all').map(o => (
                                                            <SelectItem key={o.value} value={o.value} className="text-[10px]">{o.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Textarea 
                                                value={notes[row.id] || ''} 
                                                onChange={(e) => setNotes(prev => ({ ...prev, [row.id]: e.target.value }))}
                                                placeholder="Settlement note..."
                                                className="min-h-[50px] text-[10px] resize-none"
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button 
                                            size="sm" 
                                            className="h-8 w-8 p-0" 
                                            disabled={savingId === row.id}
                                            onClick={() => saveRow(row)}
                                        >
                                            <Save size={14} className={savingId === row.id ? 'animate-pulse' : ''} />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

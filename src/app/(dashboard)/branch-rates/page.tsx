'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ENDPOINTS } from '@/lib/api';
import { getStoredUser } from '@/lib/authStorage';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw,
  PlusCircle,
  Search,
  Tag,
  ArrowRightLeft,
  GitBranch,
  Save,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function BranchRatesPage() {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [rows, setRows] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({
        branchId: '',
        currencyCode: '',
        cashRate: '',
        branchRate: '',
        digitalRate: '',
        applyToAll: false
    });

    const isSenderBranch = (branch: any) => {
        const senderFlag = String(
            branch.sender_enabled ?? branch.is_sender_branch ?? branch.sender_branch ?? ''
        ).toLowerCase();
        const transactionType = String(
            branch.default_transaction_type ?? branch.branch_default_transaction_type ?? ''
        ).toLowerCase();

        return (
            branch.is_sender_branch === true ||
            senderFlag === 'yes' ||
            senderFlag === '1' ||
            transactionType === 'sender' ||
            transactionType === 'both'
        );
    };

    const senderBranches = useMemo(
        () => branches.filter(isSenderBranch),
        [branches]
    );

    const selectedBranch = useMemo(
        () => senderBranches.find((branch) => String(branch.id) === form.branchId) || null,
        [senderBranches, form.branchId]
    );

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ratesRes, branchesRes, countriesRes] = await Promise.all([
                fetch(ENDPOINTS.BRANCH_CURRENCY_RATES.LIST),
                fetch(`${ENDPOINTS.BRANCHES.LIST}?status=active`),
                fetch(`${ENDPOINTS.COUNTRIES.LIST}?status=active&payout_currency=yes&sort=name&dir=asc`),
            ]);

            const ratesData = ratesRes.ok ? await ratesRes.json() : [];
            const branchData = branchesRes.ok ? await branchesRes.json() : [];
            const countryData = countriesRes.ok ? await countriesRes.json() : [];

            setRows(Array.isArray(ratesData) ? ratesData : []);
            setBranches(Array.isArray(branchData) ? branchData : []);
            
            const uniqueCurs = new Map();
            (Array.isArray(countryData) ? countryData : []).forEach(c => {
                const code = String(c.currency_code || '').trim().toUpperCase();
                if (code && !uniqueCurs.has(code)) {
                    uniqueCurs.set(code, { code, name: c.currency_name || code, symbol: c.currency_symbol || '' });
                }
            });
            setCurrencies(Array.from(uniqueCurs.values()));
        } catch (error) {
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchData();
    }, []);

    const filteredRows = useMemo(() => {
        const query = search.trim().toLowerCase();
        let rs = rows;
        if (activeFilter !== 'all') {
            rs = rs.filter(r => (r.active === 'yes' ? 'yes' : 'no') === activeFilter);
        }
        if (query) {
            rs = rs.filter(r => 
                (r.branch_name || '').toLowerCase().includes(query) ||
                (r.currency_code || '').toLowerCase().includes(query)
            );
        }
        return rs;
    }, [rows, search, activeFilter]);

    const totalRows = filteredRows.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
    const startIndex = (page - 1) * pageSize;
    const pagedRows = filteredRows.slice(startIndex, startIndex + pageSize);

    useEffect(() => {
        if (!modalOpen || !selectedBranch || !form.currencyCode) return;

        const branchCode = String(selectedBranch.code || selectedBranch.transaction_prefix || selectedBranch.id);
        const matchingRows = rows.filter((row) => {
            const rowCode = String(row.branch_code || '').trim();
            const rowCurrency = String(row.currency_code || '').trim().toUpperCase();
            return rowCode === branchCode && rowCurrency === form.currencyCode;
        });

        const sortByLatest = (a: any, b: any) =>
            new Date(b.updated_at || b.created_at || 0).getTime() -
            new Date(a.updated_at || a.created_at || 0).getTime();

        const activeRow = matchingRows
            .filter((row) => String(row.active || '').toLowerCase() === 'yes')
            .sort(sortByLatest)[0];

        const fallbackRow = [...matchingRows].sort(sortByLatest)[0];
        const rateRow = activeRow || fallbackRow;

        if (!rateRow) {
            setForm((prev) => ({
                ...prev,
                cashRate: '',
                branchRate: '',
                digitalRate: '',
            }));
            return;
        }

        setForm((prev) => ({
            ...prev,
            cashRate: Number(rateRow.customer_rate || 0).toFixed(2),
            branchRate: Number(rateRow.branch_rate || 0).toFixed(2),
            digitalRate: Number(rateRow.digital_rate || 0).toFixed(2),
        }));
    }, [modalOpen, selectedBranch, form.currencyCode, rows]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.branchId || !form.currencyCode || !form.cashRate) {
            toast.warning("Missing required fields");
            return;
        }

        setSubmitting(true);
        try {
            const user = getStoredUser<any>();
            const userName = user?.username || user?.name || 'Admin';
            
            const selectedCur = currencies.find(c => c.code === form.currencyCode);

            const targetBranches = form.applyToAll ? senderBranches : [selectedBranch];
            
            for (const b of targetBranches) {
                const bCode = String(b.code || b.transaction_prefix || b.id);
                const payload = {
                    branch_code: bCode,
                    branch_name: b.name,
                    currency_code: selectedCur.code,
                    currency_name: selectedCur.name,
                    currency_symbol: selectedCur.symbol,
                    active: 'yes',
                    customer_rate: Number(form.cashRate),
                    branch_rate: Number(form.branchRate || 0),
                    digital_rate: Number(form.digitalRate || 0),
                    entered_user: userName,
                    modified_user: userName,
                };

                await fetch(ENDPOINTS.BRANCH_CURRENCY_RATES.LIST, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                // Note: Logic to inactivate old rows should be on backend, 
                // but if not, we'd need to fetch and PUT here. 
                // Keeping it simple for migration as per previous code's intent.
            }

            toast.success("Rates saved successfully");
            setModalOpen(false);
            void fetchData();
        } catch {
            toast.error("Failed to save branch rates");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Branch Rates</h1>
                    <p className="text-muted-foreground">Manage cash, branch, and digital rates per branch.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={fetchData} disabled={loading} aria-label="Refresh branch rates" title="Refresh branch rates">
                        <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                    </Button>
                    <Button onClick={() => setModalOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Rate
                    </Button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search branch or currency..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-48">
                    <Select value={activeFilter} onValueChange={setActiveFilter}>
                        <SelectTrigger><SelectValue placeholder="All Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="yes">Active Only</SelectItem>
                            <SelectItem value="no">Inactive Only</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="rounded-md border bg-card overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>Branch</TableHead>
                            <TableHead>Currency</TableHead>
                            <TableHead>Cash Rate</TableHead>
                            <TableHead>Branch Rate</TableHead>
                            <TableHead>Digital Rate</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Modified Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={8} className="h-24 text-center">Loading...</TableCell></TableRow>
                        ) : pagedRows.length === 0 ? (
                            <TableRow><TableCell colSpan={8} className="h-24 text-center">No rates found.</TableCell></TableRow>
                        ) : (
                            pagedRows.map((row, idx) => (
                                <TableRow key={row.id}>
                                    <TableCell className="text-muted-foreground">{startIndex + idx + 1}</TableCell>
                                    <TableCell>
                                        <div className="font-semibold">{row.branch_name}</div>
                                        <div className="text-xs text-muted-foreground">{row.branch_code}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Badge variant="outline">{row.currency_code} {row.currency_symbol}</Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono">{Number(row.customer_rate || 0).toFixed(2)}</TableCell>
                                    <TableCell className="font-mono text-muted-foreground">{Number(row.branch_rate || 0).toFixed(2)}</TableCell>
                                    <TableCell className="font-mono text-primary font-medium">{Number(row.digital_rate || 0).toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Badge variant={row.active === 'yes' ? 'default' : 'secondary'}>
                                            {row.active === 'yes' ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                        {row.updated_at ? new Date(row.updated_at).toLocaleString() : '-'}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Showing {startIndex + 1} to {Math.min(startIndex + pageSize, totalRows)} of {totalRows}</p>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}><ChevronLeft size={16} /></Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === totalPages}><ChevronRight size={16} /></Button>
                </div>
            </div>

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Add Branch Rate</DialogTitle>
                        <DialogDescription>Set cash, branch, and digital rates for a specific branch or all branches.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Branch</Label>
                                <Select value={form.branchId} onValueChange={v => setForm({...form, branchId: v})}>
                                    <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                                    <SelectContent>
                                        {senderBranches.map(b => (
                                            <SelectItem key={`branch-${b.id}`} value={String(b.id)}>
                                                {b.code ? `${b.name} (${b.code})` : b.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Currency</Label>
                                <Select value={form.currencyCode} onValueChange={v => setForm({...form, currencyCode: v})}>
                                    <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
                                    <SelectContent>
                                        {currencies.map(c => <SelectItem key={`currency-${c.code}`} value={c.code}>{c.code} - {c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Cash Rate</Label>
                                <Input type="number" step="0.01" value={form.cashRate} onChange={e => setForm({...form, cashRate: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>Branch Rate</Label>
                                <Input type="number" step="0.01" value={form.branchRate} onChange={e => setForm({...form, branchRate: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>Digital Rate</Label>
                                <Input type="number" step="0.01" value={form.digitalRate} onChange={e => setForm({...form, digitalRate: e.target.value})} />
                            </div>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label>Apply to all sender branches</Label>
                                <div className="text-xs text-muted-foreground">Updates rate for all active sender branches.</div>
                            </div>
                            <Switch checked={form.applyToAll} onCheckedChange={c => setForm({...form, applyToAll: c})} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Rate'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

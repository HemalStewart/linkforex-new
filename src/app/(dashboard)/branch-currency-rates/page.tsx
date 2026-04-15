'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { 
    Search, 
    PlusCircle, 
    RefreshCcw, 
    Landmark, 
    Coins, 
    BadgePoundSterling,
    ArrowUpDown,
    MoreHorizontal,
    ChevronRight,
    ArrowLeft
} from 'lucide-react';
import { ENDPOINTS } from '@/lib/api';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Pagination } from "@/components/ui/pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

export default function BranchCurrencyRatesPage() {
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [branchFilter, setBranchFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(ENDPOINTS.BRANCH_CURRENCY_RATES.LIST);
            if (res.ok) {
                setRows(await res.json());
            }
        } catch (error) {
            toast.error("Failed to load cash rates");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchData();
    }, []);

    const branchOptions = useMemo(() => {
        const unique = new Map<string, { code: string; name: string }>();
        rows.forEach((row) => {
            const code = String(row.branch_code || '').trim();
            if (!code || unique.has(code)) return;
            unique.set(code, { code, name: row.branch_name || code });
        });
        return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [rows]);

    const filteredRows = useMemo(() => {
        return rows.filter(row => {
            const matchesSearch = !searchQuery || JSON.stringify(row).toLowerCase().includes(searchQuery.toLowerCase());
            const matchesBranch = branchFilter === 'all' || row.branch_code === branchFilter;
            return matchesSearch && matchesBranch;
        });
    }, [rows, searchQuery, branchFilter]);

    const paginatedRows = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredRows.slice(start, start + rowsPerPage);
    }, [filteredRows, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(filteredRows.length / rowsPerPage);

    if (loading) return <div className="p-12 text-center animate-pulse">Loading rates table...</div>;

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Customer Cash Rates</h1>
                    <p className="text-muted-foreground">Manage real-time currency rates for branch cash operations.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => void fetchData()} aria-label="Refresh branch currency rates" title="Refresh branch currency rates">
                        <RefreshCcw size={14} />
                    </Button>
                    <Button size="sm" asChild>
                        <Link href="/branch-currency-rates/create">
                            <PlusCircle size={14} className="mr-2" /> Add Rate
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search rates..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Select value={branchFilter} onValueChange={setBranchFilter}>
                        <SelectTrigger className="w-full md:w-[250px]">
                            <SelectValue placeholder="All Branches" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Branches</SelectItem>
                            {branchOptions.map(b => (
                                <SelectItem key={`branch-filter-${b.code}`} value={b.code}>{b.name} ({b.code})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">No.</TableHead>
                                <TableHead>Branch</TableHead>
                                <TableHead>Currency</TableHead>
                                <TableHead>Rate For £</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Updated</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedRows.map((row, index) => (
                                <TableRow key={row.id || index} className="hover:bg-muted/50 transition-colors">
                                    <TableCell className="text-muted-foreground font-medium">{index + 1}</TableCell>
                                    <TableCell>
                                        <div className="font-bold text-sm">{row.branch_name}</div>
                                        <div className="text-[10px] text-muted-foreground font-mono tracking-tighter uppercase">{row.branch_code}</div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-bold flex items-center gap-1.5"><Coins size={12} className="text-primary" /> {row.currency_code} </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-black text-primary">
                                            {Number(row.customer_rate || 0).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={row.active === 'yes' ? 'default' : 'secondary'} className="text-[10px] h-5">
                                            {row.active === 'yes' ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {row.updated_at ? new Date(row.updated_at).toLocaleString() : '-'}
                                        <div className="text-[9px] uppercase tracking-widest">{row.modified_user || row.entered_user}</div>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => toast.info("History view coming soon")}>View History</DropdownMenuItem>
                                                <DropdownMenuItem disabled={row.active === 'no'} className="text-destructive">Deactivate</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredRows.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">No cash rates found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                
                <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    rowsPerPage={rowsPerPage}
                    onPageChange={setCurrentPage}
                    onRowsPerPageChange={(rows) => {
                        setRowsPerPage(rows);
                        setCurrentPage(1);
                    }}
                />
            </div>
        </div>
    );
}

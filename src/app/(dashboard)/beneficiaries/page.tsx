'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ENDPOINTS } from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminTableFilters } from "@/components/admin/table-filters";
import { AdminTableFooter } from "@/components/admin/table-footer";
import {
  Users,
  RefreshCw,
  Building2,
  Calendar,
  User as UserIcon,
} from 'lucide-react';
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function BeneficiariesPage() {
    const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortKey, setSortKey] = useState('created_at');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    useEffect(() => {
        void fetchBeneficiaries();
    }, []);

    const fetchBeneficiaries = async () => {
        setLoading(true);
        try {
            const res = await fetch(ENDPOINTS.BENEFICIARIES.LIST);
            if (res.ok) {
                const data = await res.json();
                setBeneficiaries(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Failed to fetch beneficiaries', error);
            toast.error("Failed to fetch beneficiaries");
        } finally {
            setLoading(false);
        }
    };

    const filteredBeneficiaries = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return beneficiaries.filter(b =>
            (b.name || '').toLowerCase().includes(query) ||
            (b.bank_name || '').toLowerCase().includes(query) ||
            (b.account_number || '').includes(query) ||
            (b.customer_id || '').includes(query)
        );
    }, [beneficiaries, searchQuery]);

    const sortedBeneficiaries = useMemo(() => {
        const data = [...filteredBeneficiaries];
        data.sort((a, b) => {
            const aVal = a[sortKey] ?? '';
            const bVal = b[sortKey] ?? '';
            if (sortDir === 'asc') return String(aVal).localeCompare(String(bVal));
            return String(bVal).localeCompare(String(aVal));
        });
        return data;
    }, [filteredBeneficiaries, sortKey, sortDir]);

    const totalRows = sortedBeneficiaries.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
    const currentPage = Math.min(page, totalPages);
    const startIndex = totalRows === 0 ? 0 : (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, totalRows);
    const pagedBeneficiaries = sortedBeneficiaries.slice(startIndex, endIndex);

    useEffect(() => {
        setPage(1);
    }, [searchQuery, rowsPerPage]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const toggleSort = (key: string) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('asc'); }
    };

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Beneficiaries</h1>
                    <p className="text-muted-foreground">Manage global beneficiary accounts and bank details.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="icon" onClick={fetchBeneficiaries} disabled={loading} aria-label="Refresh beneficiaries" title="Refresh beneficiaries">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            <AdminTableFilters
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search by name, bank, account number..."
                title="Search"
                description="Filter beneficiaries by name, bank, account number, or customer ID."
            />

            <div className="rounded-md border bg-card">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">#</TableHead>
                                <TableHead className="cursor-pointer" onClick={() => toggleSort('name')}>
                                    Beneficiary {sortKey === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                                </TableHead>
                                <TableHead>Bank Details</TableHead>
                                <TableHead>Customer ID</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="cursor-pointer" onClick={() => toggleSort('created_at')}>
                                    Added {sortKey === 'created_at' && (sortDir === 'asc' ? '↑' : '↓')}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">Loading...</TableCell>
                                </TableRow>
                            ) : pagedBeneficiaries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">No beneficiaries found.</TableCell>
                                </TableRow>
                            ) : (
                                pagedBeneficiaries.map((b, idx) => {
                                    const statusValue = (b.status ?? '').toString().toLowerCase();
                                    const isVerified = statusValue === 'active' || statusValue === 'verified';
                                    return (
                                        <TableRow key={b.id}>
                                            <TableCell className="text-muted-foreground">{startIndex + idx + 1}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                            {(b.name || '?').charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="font-medium">{b.name}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1 text-sm font-medium">
                                                        <Building2 className="h-3 w-3 text-muted-foreground" />
                                                        {b.bank_name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground font-mono">
                                                        {b.account_number}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">{b.customer_id}</TableCell>
                                            <TableCell className="text-sm">
                                                {[b.country, b.city].filter(Boolean).join(', ') || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={isVerified ? 'default' : 'secondary'}>
                                                    {isVerified ? 'Verified' : statusValue || 'Pending'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                                    {b.created_at ? new Date(b.created_at).toLocaleDateString() : '-'}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <AdminTableFooter
                currentPage={currentPage}
                totalPages={totalPages}
                totalRows={totalRows}
                rowsPerPage={rowsPerPage}
                startIndex={startIndex}
                endIndex={endIndex}
                onPageChange={setPage}
                onRowsPerPageChange={setRowsPerPage}
            />
        </div>
    );
}

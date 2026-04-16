'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminTableFilters } from "@/components/admin/table-filters";
import { AdminTableFooter } from "@/components/admin/table-footer";
import {
  PlusCircle,
  Trash2,
  Eye,
  RefreshCw,
  Phone,
  ArrowRightLeft,
  Edit2,
} from 'lucide-react';
import { toast } from "sonner";

export default function BranchesPage() {
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(50);

    const [deleteId, setDeleteId] = useState<number | null>(null);

    useEffect(() => {
        void fetchBranches();
    }, []);

    const fetchBranches = async () => {
        setLoading(true);
        try {
            const res = await fetch(ENDPOINTS.BRANCHES.LIST);
            if (res.ok) {
                const data = await res.json();
                setBranches(data || []);
            }
        } catch (error) {
            toast.error("Failed to load branches");
        } finally {
            setLoading(false);
        }
    };

    const filteredBranches = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return branches.filter(b => 
            (b.name || b.branch_name || '').toLowerCase().includes(query) ||
            (b.transaction_prefix || b.code || '').toLowerCase().includes(query)
        );
    }, [branches, searchQuery]);

    const totalRows = filteredBranches.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
    const startIndex = (page - 1) * rowsPerPage;
    const pagedBranches = filteredBranches.slice(startIndex, startIndex + rowsPerPage);

    useEffect(() => {
        setPage(1);
    }, [searchQuery, rowsPerPage]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await fetch(ENDPOINTS.BRANCHES.DETAIL(deleteId), { method: 'DELETE' });
            if (res.ok) {
                toast.success("Branch deleted");
                setDeleteId(null);
                void fetchBranches();
            } else {
                toast.error("Failed to delete branch");
            }
        } catch {
            toast.error("Error deleting branch");
        }
    };

    const formatCurrency = (value: any) => {
        const amount = Number(value || 0);
        return `£${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Branches</h1>
                    <p className="text-muted-foreground">Manage branch details and transfer limits.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={fetchBranches} disabled={loading} aria-label="Refresh branches" title="Refresh branches">
                        <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                    </Button>
                    <Button asChild>
                        <Link href="/branches/create"><PlusCircle className="mr-2 h-4 w-4" /> Add Branch</Link>
                    </Button>
                </div>
            </div>

            <AdminTableFilters
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search branches..."
                title="Search"
                description="Filter branches by name or transaction prefix."
            />

            <div className="rounded-md border bg-card overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>Branch Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Prefix</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Day Limit</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={7} className="h-24 text-center">Loading...</TableCell></TableRow>
                        ) : pagedBranches.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="h-24 text-center">No branches found.</TableCell></TableRow>
                        ) : (
                            pagedBranches.map((branch, idx) => (
                                <TableRow key={branch.id}>
                                    <TableCell className="text-muted-foreground">{startIndex + idx + 1}</TableCell>
                                    <TableCell className="font-medium">{branch.name || branch.branch_name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="gap-1">
                                            <ArrowRightLeft className="h-3 w-3" />
                                            {branch.default_transaction_type || branch.branch_default_transaction_type || '-'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <code className="text-xs bg-muted px-1 rounded">{branch.transaction_prefix || branch.code || '-'}</code>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {branch.telephone_1 || branch.phone ? (
                                            <span className="flex items-center gap-1"><Phone size={12} className="text-muted-foreground" /> {branch.telephone_1 || branch.phone}</span>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell className="text-sm font-medium">{formatCurrency(branch.day_transfer_limit)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" asChild><Link href={`/branches/${branch.id}?mode=view`}><Eye size={16} /></Link></Button>
                                            <Button variant="ghost" size="icon" asChild><Link href={`/branches/${branch.id}`}><Edit2 size={16} /></Link></Button>
                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(Number(branch.id))}><Trash2 size={16} /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <AdminTableFooter
                currentPage={page}
                totalPages={totalPages}
                totalRows={totalRows}
                rowsPerPage={rowsPerPage}
                startIndex={startIndex}
                endIndex={startIndex + rowsPerPage}
                onPageChange={setPage}
                onRowsPerPageChange={setRowsPerPage}
            />

            <Dialog open={deleteId !== null} onOpenChange={o => !o && setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Branch</DialogTitle>
                        <DialogDescription>Are you sure? This cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

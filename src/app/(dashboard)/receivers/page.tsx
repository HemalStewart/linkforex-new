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
  Plus,
  Trash2,
  Edit2,
  Building2,
  CreditCard,
  Calendar,
  User,
} from 'lucide-react';
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function ReceiversPage() {
    const [receivers, setReceivers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(50);

    const [deleteId, setDeleteId] = useState<number | null>(null);

    useEffect(() => {
        void fetchReceivers();
    }, []);

    const fetchReceivers = async () => {
        setLoading(true);
        try {
            const res = await fetch(ENDPOINTS.BENEFICIARIES.LIST);
            if (res.ok) {
                const data = await res.json();
                setReceivers(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            toast.error("Failed to load receivers");
        } finally {
            setLoading(false);
        }
    };

    const filteredReceivers = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return receivers.filter(r => 
            (r.name || '').toLowerCase().includes(query) ||
            (r.bank_name || '').toLowerCase().includes(query) ||
            (r.account_number || '').toLowerCase().includes(query)
        );
    }, [receivers, searchQuery]);

    const totalRows = filteredReceivers.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
    const startIndex = (page - 1) * rowsPerPage;
    const pagedReceivers = filteredReceivers.slice(startIndex, startIndex + rowsPerPage);

    useEffect(() => {
        setPage(1);
    }, [searchQuery, rowsPerPage]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await fetch(ENDPOINTS.BENEFICIARIES.DETAIL(deleteId), { method: 'DELETE' });
            if (res.ok) {
                toast.success("Receiver deleted");
                setDeleteId(null);
                void fetchReceivers();
            } else {
                toast.error("Failed to delete receiver");
            }
        } catch {
            toast.error("An error occurred");
        }
    };

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Receivers</h1>
                    <p className="text-muted-foreground">Manage all transfer beneficiaries and bank details.</p>
                </div>
                <Button asChild>
                    <Link href="/receivers/create"><Plus className="mr-2 h-4 w-4" /> Add Receiver</Link>
                </Button>
            </div>

            <AdminTableFilters
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search by receiver name, bank or account..."
                title="Search"
                description="Filter receivers by name, bank, or account number."
            />

            <div className="rounded-md border bg-card overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>Receiver Name</TableHead>
                            <TableHead>Bank Details</TableHead>
                            <TableHead>Date Added</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">Loading...</TableCell></TableRow>
                        ) : pagedReceivers.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">No receivers found.</TableCell></TableRow>
                        ) : (
                            pagedReceivers.map((row, idx) => (
                                <TableRow key={row.id}>
                                    <TableCell className="text-muted-foreground text-xs">{startIndex + idx + 1}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                                                    {row.name ? row.name.charAt(0) : 'R'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-semibold text-sm">{row.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1 text-xs font-medium">
                                                <Building2 size={12} className="text-muted-foreground" /> {row.bank_name || '-'}
                                            </div>
                                            <code className="text-[10px] bg-muted px-1 py-0.5 rounded w-fit flex items-center gap-1">
                                                <CreditCard size={10} /> {row.account_number || '-'}
                                            </code>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Calendar size={12} /> {row.created_at ? new Date(row.created_at).toLocaleDateString() : '-'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" asChild><Link href={`/receivers/${row.id}`}><Edit2 size={16} /></Link></Button>
                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(Number(row.id))}><Trash2 size={16} /></Button>
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
                        <DialogTitle>Delete Receiver</DialogTitle>
                        <DialogDescription>Are you sure you want to delete this receiver bank account? This cannot be undone.</DialogDescription>
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

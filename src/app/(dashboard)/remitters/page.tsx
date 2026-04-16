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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserPlus,
  Eye,
  Trash2,
  ShieldCheck,
  Building2,
  Phone,
  Calendar,
  Tag,
} from 'lucide-react';
import { toast } from "sonner";

export default function RemittersPage() {
    const [remitters, setRemitters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sourceFilter, setSourceFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(50);

    const [deleteId, setDeleteId] = useState<number | null>(null);

    useEffect(() => {
        void fetchRemitters();
    }, [statusFilter, sourceFilter]);

    const fetchRemitters = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.append('status', statusFilter);
            if (sourceFilter !== 'all') params.append('registration_source', sourceFilter);
            
            const res = await fetch(`${ENDPOINTS.REMITTERS.LIST}?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setRemitters(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            toast.error("Failed to load remitters");
        } finally {
            setLoading(false);
        }
    };

    const filteredRemitters = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return remitters.filter(r => 
            (r.name || r.sender_name || '').toLowerCase().includes(query) ||
            (r.email || '').toLowerCase().includes(query) ||
            (r.phone || r.telephone || '').toLowerCase().includes(query) ||
            (r.sender_id || '').toLowerCase().includes(query)
        );
    }, [remitters, searchQuery]);

    const totalRows = filteredRemitters.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
    const startIndex = (page - 1) * rowsPerPage;
    const pagedRemitters = filteredRemitters.slice(startIndex, startIndex + rowsPerPage);

    useEffect(() => {
        setPage(1);
    }, [searchQuery, statusFilter, sourceFilter, rowsPerPage]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await fetch(ENDPOINTS.REMITTERS.DETAIL(deleteId), { method: 'DELETE' });
            if (res.ok) {
                toast.success("Remitter deleted");
                setDeleteId(null);
                void fetchRemitters();
            } else {
                const err = await res.json();
                toast.error(err.message || "Failed to delete remitter");
            }
        } catch {
            toast.error("An error occurred");
        }
    };

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Remitters</h1>
                    <p className="text-muted-foreground">Manage customer profiles and KYC status.</p>
                </div>
                <Button asChild>
                    <Link href="/remitters/create"><UserPlus className="mr-2 h-4 w-4" /> Add Remitter</Link>
                </Button>
            </div>

            <AdminTableFilters
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search by name, ID, email or phone..."
                title="Search"
                description="Filter remitters by profile details, status, and source."
            >
                <div className="flex gap-2 w-full md:w-auto">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={sourceFilter} onValueChange={setSourceFilter}>
                        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Source" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Sources</SelectItem>
                            <SelectItem value="branch">Branch</SelectItem>
                            <SelectItem value="mobile_app">Mobile App</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </AdminTableFilters>

            <div className="rounded-md border bg-card overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>Remitter Info</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>ID / KYC</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={7} className="h-24 text-center">Loading...</TableCell></TableRow>
                        ) : pagedRemitters.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="h-24 text-center">No remitters found.</TableCell></TableRow>
                        ) : (
                            pagedRemitters.map((row, idx) => (
                                <TableRow key={row.id}>
                                    <TableCell className="text-muted-foreground text-xs">{startIndex + idx + 1}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-sm">{row.name || row.sender_name}</span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Tag className="h-3 w-3" /> {row.sender_id || '-'}
                                            </span>
                                            {row.branch && (
                                                <span className="text-[10px] bg-primary/5 text-primary w-fit px-1 rounded mt-0.5 border border-primary/10">
                                                    {row.branch}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Phone size={12} /> {row.phone || row.telephone || '-'}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                                                {row.email || '-'}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <Badge variant={row.verification_state === 'verified' ? 'default' : 'outline'} className="text-[10px] h-4">
                                                {row.verification_state || 'not_started'}
                                            </Badge>
                                            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <ShieldCheck size={10} className={row.id_expired ? 'text-destructive' : 'text-emerald-500'} />
                                                {row.id_number || row.id_no || '-'}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={(row.status || '').toLowerCase() === 'active' ? 'default' : 'secondary'}>
                                            {(row.status || 'inactive').charAt(0).toUpperCase() + (row.status || 'inactive').slice(1)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {row.created_at ? new Date(row.created_at).toLocaleDateString() : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" asChild><Link href={`/remitters/${row.id}`}><Eye size={16} /></Link></Button>
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
                        <DialogTitle>Delete Remitter</DialogTitle>
                        <DialogDescription>Are you sure you want to delete this customer? This will remove all associated data and cannot be undone.</DialogDescription>
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

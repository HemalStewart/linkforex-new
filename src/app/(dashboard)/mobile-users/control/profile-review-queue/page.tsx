'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search, ShieldCheck, ShieldX, UserCheck, UserX } from 'lucide-react';
import { ENDPOINTS } from '@/lib/api';
import type { QueueUser } from '@/lib/mobileControl';
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
import { AdminTableFilters } from "@/components/admin/table-filters"
import { AdminTableFooter } from "@/components/admin/table-footer"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

export default function MobileProfileReviewQueuePage() {
    const [loading, setLoading] = useState(true);
    const [queue, setQueue] = useState<QueueUser[]>([]);
    const [queueStatus, setQueueStatus] = useState<string>('pending');
    const [queueSearch, setQueueSearch] = useState('');
    const [submitting, setSubmitting] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    const loadQueue = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams();
            query.set('status', queueStatus);
            if (queueSearch.trim()) query.set('search', queueSearch.trim());
            const res = await fetch(`${ENDPOINTS.MOBILE_ADMIN.REVIEW_QUEUE}?${query.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setQueue(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            toast.error("Failed to load review queue");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const t = setTimeout(() => {
            void loadQueue();
        }, 300);
        return () => clearTimeout(t);
    }, [queueStatus, queueSearch]);

    const totalRows = queue.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
    const currentPage = Math.min(page, totalPages);
    const startIndex = totalRows === 0 ? 0 : (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const pagedQueue = useMemo(
        () => queue.slice(startIndex, endIndex),
        [queue, startIndex, endIndex]
    );

    useEffect(() => {
        setPage(1);
    }, [queueStatus, queueSearch, rowsPerPage]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const performAction = async (user: QueueUser, action: 'sync' | 'approve' | 'reject') => {
        setSubmitting(user.id);
        try {
            let res;
            if (action === 'sync') {
                res = await fetch(ENDPOINTS.MOBILE_AUTH.SYNC_LIVENESS, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: user.email }),
                });
            } else if (action === 'approve') {
                res = await fetch(ENDPOINTS.MOBILE_ADMIN.REVIEW_APPROVE(user.id), { method: 'POST' });
            } else {
                const reason = window.prompt('Reject reason:', 'Rejected by admin review.');
                if (reason === null) return;
                res = await fetch(ENDPOINTS.MOBILE_ADMIN.REVIEW_REJECT(user.id), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason }),
                });
            }

            if (res?.ok) {
                toast.success(`User ${action}ed successfully`);
                void loadQueue();
            } else {
                const data = await res?.json().catch(() => ({}));
                toast.error(data?.message || `Failed to ${action} user`);
            }
        } catch (error) {
            toast.error("Network error");
        } finally {
            setSubmitting(null);
        }
    };

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Profile Review Queue</h1>
                    <p className="text-muted-foreground">Review and verify pending mobile profiles.</p>
                </div>
                <Button variant="outline" size="icon" onClick={loadQueue} disabled={loading} aria-label="Refresh profile review queue" title="Refresh profile review queue">
                    <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                </Button>
            </div>

            <AdminTableFilters
                searchValue={queueSearch}
                onSearchChange={setQueueSearch}
                searchPlaceholder="Search by name, email, or ID..."
                title="Search"
                description="Filter the mobile profile review queue by user details and status."
            >
                <Select value={queueStatus} onValueChange={setQueueStatus}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="all">All Statuses</SelectItem>
                    </SelectContent>
                </Select>
            </AdminTableFilters>

            <div className="rounded-md border bg-card overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>KYC/Status</TableHead>
                            <TableHead>Liveness</TableHead>
                            <TableHead>Sanction</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">Loading queue...</TableCell></TableRow>
                        ) : pagedQueue.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">No profiles found.</TableCell></TableRow>
                        ) : (
                            pagedQueue.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-sm">{user.name}</span>
                                            <span className="text-[10px] text-muted-foreground">{user.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <Badge variant="outline" className="text-[9px] uppercase w-fit">{user.kyc_status}</Badge>
                                            <Badge variant="secondary" className="text-[9px] uppercase w-fit">{user.status}</Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold uppercase">{user.veriff_status || 'N/A'}</span>
                                            <span className="text-[10px] text-muted-foreground italic">{user.veriff_decision || '-'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge 
                                            variant={user.sanction_status === 'verified' ? 'default' : 'destructive'} 
                                            className="text-[9px] uppercase"
                                        >
                                            {user.sanction_status || 'Pending'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                className="h-7 text-[10px]"
                                                disabled={submitting === user.id}
                                                onClick={() => performAction(user, 'sync')}
                                            >
                                                Sync
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700"
                                                disabled={submitting === user.id}
                                                onClick={() => performAction(user, 'approve')}
                                            >
                                                Approve
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="destructive" 
                                                className="h-7 text-[10px]"
                                                disabled={submitting === user.id}
                                                onClick={() => performAction(user, 'reject')}
                                            >
                                                Reject
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
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

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { 
    CheckCircle2, 
    XCircle, 
    RefreshCcw, 
    AlertTriangle,
    ShieldAlert,
    Clock,
    User,
    MapPin,
    ArrowRight
} from 'lucide-react';
import { ENDPOINTS } from '@/lib/api';
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { toast } from "sonner"

export default function BranchAccessPage() {
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState<number | null>(null);

    const fetchRows = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${ENDPOINTS.BRANCH_ACCESS_REQUESTS.LIST}?status=pending`);
            if (res.ok) {
                setRows(await res.json());
            }
        } catch (error) {
            toast.error("Failed to load access requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchRows();
    }, []);

    const performReview = async (id: number, action: 'approve' | 'reject') => {
        setSubmitting(id);
        try {
            const endpoint = action === 'approve' 
                ? ENDPOINTS.BRANCH_ACCESS_REQUESTS.APPROVE(id) 
                : ENDPOINTS.BRANCH_ACCESS_REQUESTS.REJECT(id);
            
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ note: `Reviewed via modern portal` })
            });

            if (res.ok) {
                toast.success(`Request ${action}d successfully`);
                await fetchRows();
            } else {
                toast.error(`Could not ${action} request`);
            }
        } catch (error) {
            toast.error("Network error");
        } finally {
            setSubmitting(null);
        }
    };

    if (loading) return <div className="p-12 text-center animate-pulse">Loading access flags...</div>;

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Branch Access Queue</h1>
                    <p className="text-muted-foreground">Approve senders requesting access to use a different branch.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => void fetchRows()}>
                    <RefreshCcw size={14} className="mr-2" /> Refresh
                </Button>
            </div>

            <Card className="border-amber-200 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/20">
                <CardHeader className="py-4">
                    <CardTitle className="text-sm flex items-center gap-2 text-amber-800 dark:text-amber-400">
                        <ShieldAlert size={16} /> Security Audit
                    </CardTitle>
                    <CardDescription className="text-xs text-amber-700/80 dark:text-amber-500/80">
                        Cross-branch access allows remitter data to be shared. Verify identities before approving.
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Remitter / ID</TableHead>
                            <TableHead>Movement</TableHead>
                            <TableHead>Requested By</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead className="text-right">Decisions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell>
                                    <div className="font-bold flex items-center gap-2">
                                        <User size={14} className="text-muted-foreground" />
                                        {row.sender_name || 'Anonymous'}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground font-mono">{row.sender_id || '-'}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-xs">
                                        <Badge variant="outline" className="h-5 text-[9px] font-bold">{row.origin_branch_code}</Badge>
                                        <ArrowRight size={12} className="text-muted-foreground" />
                                        <Badge variant="default" className="h-5 text-[9px] font-bold">{row.requested_branch_code}</Badge>
                                    </div>
                                    <div className="mt-1 text-[10px] text-muted-foreground italic flex items-center gap-1">
                                        <MapPin size={8} /> {row.requested_branch_name || 'Target Branch'}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-xs font-medium">{row.requested_by_username || '-'}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock size={12} /> {row.created_at ? new Date(row.created_at).toLocaleDateString() : '-'}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            className="h-8 text-destructive hover:bg-destructive/10"
                                            disabled={submitting === row.id}
                                            onClick={() => performReview(row.id, 'reject')}
                                        >
                                            <XCircle size={14} className="mr-1" /> Reject
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            className="h-8 bg-emerald-600 hover:bg-emerald-700"
                                            disabled={submitting === row.id}
                                            onClick={() => performReview(row.id, 'approve')}
                                        >
                                            <CheckCircle2 size={14} className="mr-1" /> Approve
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {rows.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                                    All clear. No pending branch access requests.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

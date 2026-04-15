'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
    ArrowLeft, 
    Download, 
    History, 
    Search, 
    RotateCcw,
    FileText,
    User,
    Users,
    Landmark,
    Coins,
    Calendar,
    BadgePoundSterling,
    Clock,
    Shield,
    Info,
    CheckCircle2,
    XCircle,
    Copy,
    ExternalLink
} from 'lucide-react';
import { ENDPOINTS, UPLOADS_BASE_URL } from '@/lib/api';
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"

export default function TransferDetailsPage() {
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [transfer, setTransfer] = useState<any>(null);
    const [remitter, setRemitter] = useState<any>(null);
    const [beneficiary, setBeneficiary] = useState<any>(null);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(ENDPOINTS.TRANSFERS.DETAIL(id));
            if (res.ok) {
                const data = await res.json();
                setTransfer(data);

                // Derived entities
                if (data.remitter_id) {
                    const rRes = await fetch(ENDPOINTS.REMITTERS.DETAIL(data.remitter_id));
                    if (rRes.ok) setRemitter(await rRes.json());
                }
                if (data.beneficiary_id) {
                    const bRes = await fetch(ENDPOINTS.BENEFICIARIES.DETAIL(data.beneficiary_id));
                    if (bRes.ok) setBeneficiary(await bRes.json());
                }
                
                // Audit logs
                const auditRes = await fetch(`${ENDPOINTS.AUDIT_LOGS.LIST}?entity_id=${id}&entity_type=transfer&order_by=created_at&order_dir=desc`);
                if (auditRes.ok) {
                    const aData = await auditRes.json();
                    setAuditLogs(Array.isArray(aData) ? aData : aData.data || []);
                }
            }
        } catch (error) {
            toast.error("Failed to load transfer details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) void fetchData();
    }, [id]);

    const meta = useMemo(() => {
        if (!transfer) return {};
        if (transfer.transfer_meta) return transfer.transfer_meta;
        if (transfer.meta_json) {
            try { return JSON.parse(transfer.meta_json); } catch { return {}; }
        }
        return {};
    }, [transfer]);

    const getStatusVariant = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'completed':
            case 'approved': return 'default';
            case 'processing': return 'secondary';
            case 'rejected':
            case 'cancelled': return 'destructive';
            case 'awaiting_funds': return 'outline';
            default: return 'secondary';
        }
    };

    if (loading) return <div className="p-12 text-center animate-pulse">Loading transfer details...</div>;
    if (!transfer) return <div className="p-12 text-center">Transfer record not found.</div>;

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                        <Link href="/transfers"><ArrowLeft size={16} /></Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Transfer Details</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant={getStatusVariant(transfer.status)} className="uppercase">
                                {transfer.status}
                            </Badge>
                            <span className="text-sm font-mono text-muted-foreground">{transfer.code}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => void fetchData()} aria-label="Refresh transfer" title="Refresh transfer">
                        <RotateCcw size={14} />
                    </Button>
                    <Button size="sm">
                        <Download size={14} className="mr-2" /> Receipt
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
               <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Sending</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">{parseFloat(transfer.source_amount).toLocaleString()} GBP</div>
                        <p className="text-[10px] text-muted-foreground font-medium">Fee: 0.00 GBP</p>
                    </CardContent>
               </Card>
               <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">{parseFloat(transfer.rate).toFixed(2)}</div>
                        <p className="text-[10px] text-muted-foreground font-medium">Customer FX Rate</p>
                    </CardContent>
               </Card>
               <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Receiving</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold text-emerald-600">{parseFloat(transfer.dest_amount).toLocaleString()} {meta.payout_currency || 'AFN'}</div>
                        <p className="text-[10px] text-muted-foreground font-medium">Payment Mode: {transfer.payment_mode}</p>
                    </CardContent>
               </Card>
               <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Creation</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm font-bold">{new Date(transfer.created_at).toLocaleDateString()}</div>
                        <p className="text-[10px] text-muted-foreground font-medium">{new Date(transfer.created_at).toLocaleTimeString()}</p>
                    </CardContent>
               </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-md flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" /> Remitter Info
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-y-3 text-sm">
                             <div className="text-muted-foreground">Store Customer</div>
                             <div className="font-semibold text-right">{remitter?.name || '-'}</div>
                             <div className="text-muted-foreground">Customer ID</div>
                             <div className="font-mono text-right">{remitter?.sender_id || '-'}</div>
                             <div className="text-muted-foreground">Phone</div>
                             <div className="text-right">{remitter?.phone || '-'}</div>
                             <div className="text-muted-foreground">KYC Status</div>
                             <div className="text-right">
                                <Badge variant="outline" className="text-[10px] uppercase font-bold">
                                    {remitter?.kyc_status || 'Pending'}
                                </Badge>
                             </div>
                        </div>
                        <Separator />
                        <div className="text-xs space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Source of Funds:</span>
                                <span>{transfer.source_of_funds}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Purpose:</span>
                                <span>{transfer.purpose}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-md flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" /> Beneficiary Info
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-y-3 text-sm">
                             <div className="text-muted-foreground">Full Name</div>
                             <div className="font-semibold text-right">{beneficiary?.name || '-'}</div>
                             <div className="text-muted-foreground">Contact</div>
                             <div className="text-right">{beneficiary?.mobile_number || '-'}</div>
                             <div className="text-muted-foreground">Bank</div>
                             <div className="text-right font-medium">{beneficiary?.bank_name || 'Cash Pickup'}</div>
                             <div className="text-muted-foreground">Account / CNIC</div>
                             <div className="font-mono text-right">{beneficiary?.account_number || beneficiary?.receiver_id_number || '-'}</div>
                        </div>
                        <Separator />
                        <div className="text-xs space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Country:</span>
                                <span>{beneficiary?.country} ({beneficiary?.city})</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Relation to Sender:</span>
                                <span>{meta.relationship || '-'}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-md flex items-center gap-2">
                        <History className="h-4 w-4 text-primary" /> Transaction Audit Log
                    </CardTitle>
                    <CardDescription>Track state changes and operator actions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Action</TableHead>
                                <TableHead>Performed By</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead className="text-right">Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {auditLogs.length === 0 ? (
                                <TableRow><TableCell colSpan={4} className="h-24 text-center">No logs found.</TableCell></TableRow>
                            ) : (
                                auditLogs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell>
                                            <Badge variant="outline" className="uppercase text-[9px]">{log.action}</Badge>
                                        </TableCell>
                                        <TableCell className="text-xs font-semibold">
                                            {log.performed_by_username} <span className="text-muted-foreground font-normal">({log.performed_by_branch})</span>
                                        </TableCell>
                                        <TableCell className="text-xs max-w-[400px]">
                                            <div className="line-clamp-2 italic text-muted-foreground">
                                                {log.changed_fields || 'System entry initialization'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right text-[10px] text-muted-foreground">
                                            {new Date(log.created_at).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Separator />

            <div className="text-[10px] text-muted-foreground text-center">
                INTERNAL ID: {transfer.id} • AUTH_TOKEN_REF: {transfer.created_by} • LAST_SYNC: {new Date().toISOString()}
            </div>
        </div>
    );
}

'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { Pagination } from "@/components/ui/pagination";
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
  Search,
  Eye,
  PenLine,
  Save,
  Trash2,
  CheckCircle2,
  XCircle,
  Printer,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ImageUp,
  RotateCcw,
} from 'lucide-react';
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

type Transfer = any;
type Remitter = any;
type Beneficiary = any;
type Branch = any;
type User = any;

type TransferRow = {
    id: string;
    rowRef: string;
    rawStatus: string;
    status: string;
    invoiceNo: string;
    invoiceDate: string;
    receivedAmount: number;
    fcAmount: number;
    customerRate: number;
    payoutCurrency: string;
    senderName: string;
    receiverName: string;
    paymentMode: string;
    toBranch: string;
    signatureSigned: boolean;
    signatureImage?: string;
    signatureSignedBy?: string;
    signatureSignedAt?: string;
    [key: string]: any;
};

export default function TransfersPage() {
    const [loading, setLoading] = useState(true);
    const [transfers, setTransfers] = useState<Transfer[]>([]);
    const [remitters, setRemitters] = useState<Remitter[]>([]);
    const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortKey, setSortKey] = useState<string>('invoiceDate');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [page, setPage] = useState(1);
    
    // UI Modals
    const [signModalOpen, setSignModalOpen] = useState(false);
    const [signingTransferId, setSigningTransferId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [hasInk, setHasInk] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const drawingRef = useRef(false);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [tRes, rRes, bRes, brRes, uRes] = await Promise.all([
                fetch(ENDPOINTS.TRANSFERS.LIST),
                fetch(ENDPOINTS.REMITTERS.LIST),
                fetch(ENDPOINTS.BENEFICIARIES.LIST),
                fetch(ENDPOINTS.BRANCHES.LIST),
                fetch(ENDPOINTS.USERS.LIST)
            ]);

            setTransfers(tRes.ok ? await tRes.json() : []);
            setRemitters(rRes.ok ? await rRes.json() : []);
            setBeneficiaries(bRes.ok ? await bRes.json() : []);
            setBranches(brRes.ok ? await brRes.json() : []);
            setUsers(uRes.ok ? await uRes.json() : []);
        } catch (error) {
            console.error('Failed to load transfers data:', error);
            toast.error("Failed to load transfers");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchData();
    }, []);

    const remitterById = useMemo(() => {
        const map = new Map();
        remitters.forEach((r) => map.set(String(r.id), r));
        return map;
    }, [remitters]);

    const beneficiaryById = useMemo(() => {
        const map = new Map();
        beneficiaries.forEach((b) => map.set(String(b.id), b));
        return map;
    }, [beneficiaries]);

    const rows = useMemo(() => {
        return transfers.map((t: any): TransferRow => {
            let meta = {};
            try { meta = t.meta_json ? JSON.parse(t.meta_json) : (t.transfer_meta || {}); } catch { meta = {}; }
            const r = remitterById.get(String(t.remitter_id));
            const b = beneficiaryById.get(String(t.beneficiary_id));

            return {
                id: String(t.id),
                rowRef: String(t.id),
                rawStatus: (t.status || 'pending').toLowerCase(),
                status: (t.status || 'Pending').replace(/_/g, ' '),
                invoiceNo: t.code || '-',
                invoiceDate: t.created_at,
                receivedAmount: Number(t.source_amount) || 0,
                fcAmount: Number(t.dest_amount) || 0,
                customerRate: Number(t.rate) || 0,
                payoutCurrency: (meta as any).payout_currency || '-',
                senderName: (meta as any).sender_name || r?.name || '-',
                receiverName: (meta as any).receiver_name || b?.name || '-',
                paymentMode: t.payment_mode || '-',
                toBranch: String(t.branch_id || '-'),
                signatureSigned: !!(meta as any).signature_image,
                signatureImage: (meta as any).signature_image,
                signatureSignedBy: (meta as any).signature_signed_by,
                signatureSignedAt: (meta as any).signature_signed_at,
            };
        });
    }, [transfers, remitterById, beneficiaryById]);

    const filteredRows = useMemo(() => {
        let rs = rows;
        if (filterStatus !== 'all') rs = rs.filter(r => r.rawStatus === filterStatus);
        const query = searchQuery.trim().toLowerCase();
        if (query) {
            rs = rs.filter(r =>
                r.invoiceNo.toLowerCase().includes(query) ||
                r.senderName.toLowerCase().includes(query) ||
                r.receiverName.toLowerCase().includes(query)
            );
        }
        return rs;
    }, [rows, filterStatus, searchQuery]);

    const sortedRows = useMemo(() => {
        const data = [...filteredRows];
        data.sort((a: any, b: any) => {
            const aVal = a[sortKey];
            const bVal = b[sortKey];
            if (sortDir === 'asc') return aVal > bVal ? 1 : -1;
            return aVal < bVal ? 1 : -1;
        });
        return data;
    }, [filteredRows, sortKey, sortDir]);

    const totalRows = sortedRows.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
    const currentPage = Math.min(page, totalPages);
    const startIndex = totalRows === 0 ? 0 : (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, totalRows);
    const pagedRows = sortedRows.slice(startIndex, endIndex);

    const handleAction = async (id: string, action: 'approve' | 'cancel') => {
        const endpoint = action === 'approve' ? ENDPOINTS.TRANSFERS.APPROVE(id) : ENDPOINTS.TRANSFERS.CANCEL(id);
        try {
            const res = await fetch(endpoint, { method: 'POST' });
            if (res.ok) {
                toast.success(`Transfer ${action}d successfully`);
                void fetchData();
            } else {
                toast.error(`Failed to ${action} transfer`);
            }
        } catch {
            toast.error("An error occurred");
        }
    };

    const handlePrint = (row: TransferRow) => {
        const win = window.open('', '_blank');
        if (!win) return;
        win.document.write(`
            <html>
                <head><title>Invoice ${row.invoiceNo}</title></head>
                <body style="font-family: sans-serif; padding: 40px;">
                    <h1>Transfer Invoice</h1>
                    <p><b>No:</b> ${row.invoiceNo}</p>
                    <p><b>Date:</b> ${new Date(row.invoiceDate).toLocaleString()}</p>
                    <hr/>
                    <p><b>Sender:</b> ${row.senderName}</p>
                    <p><b>Receiver:</b> ${row.receiverName}</p>
                    <p><b>Amount:</b> ${row.receivedAmount.toFixed(2)} GBP</p>
                    <p><b>Payout:</b> ${row.fcAmount.toFixed(2)} ${row.payoutCurrency}</p>
                    <p><b>Rate:</b> ${row.customerRate}</p>
                    ${row.signatureImage ? `<br/><b>Signature:</b><br/><img src="${row.signatureImage}" style="max-width:300px; border:1px solid #ccc;"/>` : ''}
                    <script>window.print();</script>
                </body>
            </html>
        `);
        win.document.close();
    };

    // Signature Logic
    const openSignModal = (id: string) => {
        setSigningTransferId(id);
        setSignModalOpen(true);
        setHasInk(false);
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        drawingRef.current = true;
        lastPointRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        canvas.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!drawingRef.current || !lastPointRef.current) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        const currentPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };

        ctx.beginPath();
        ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        ctx.stroke();
        lastPointRef.current = currentPoint;
        setHasInk(true);
    };

    const handlePointerUp = () => { drawingRef.current = false; lastPointRef.current = null; };

    const saveSignature = async () => {
        if (!canvasRef.current || !signingTransferId) return;
        setSubmitting(true);
        try {
            const dataUrl = canvasRef.current.toDataURL('image/png');
            const user = getStoredUser<any>();
            const res = await fetch(ENDPOINTS.TRANSFERS.DETAIL(signingTransferId), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    meta_json: JSON.stringify({
                        signature_image: dataUrl,
                        signature_signed: 'yes',
                        signature_signed_by: user?.username || 'Admin',
                        signature_signed_at: new Date().toISOString()
                    })
                })
            });
            if (res.ok) {
                toast.success("Signature saved");
                setSignModalOpen(false);
                void fetchData();
            } else {
                toast.error("Failed to save signature");
            }
        } catch {
            toast.error("Error saving signature");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Transfers</h1>
                    <p className="text-muted-foreground">Manage and track all money transfers.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={fetchData} disabled={loading}>
                        <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by ID, sender, receiver..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="rounded-md border bg-card overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Invoice #</TableHead>
                            <TableHead>Sender</TableHead>
                            <TableHead>Receiver</TableHead>
                            <TableHead>Amount (GBP)</TableHead>
                            <TableHead>Payout</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={7} className="h-24 text-center">Loading...</TableCell></TableRow>
                        ) : pagedRows.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="h-24 text-center">No transfers found.</TableCell></TableRow>
                        ) : (
                            pagedRows.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="font-mono text-xs">{row.invoiceNo}</TableCell>
                                    <TableCell className="font-medium">{row.senderName}</TableCell>
                                    <TableCell className="font-medium">{row.receiverName}</TableCell>
                                    <TableCell>{row.receivedAmount.toFixed(2)}</TableCell>
                                    <TableCell>{row.fcAmount.toFixed(2)} {row.payoutCurrency}</TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            row.rawStatus === 'approved' || row.rawStatus === 'completed' ? 'default' :
                                            row.rawStatus === 'cancelled' || row.rawStatus === 'rejected' ? 'destructive' : 'secondary'
                                        }>{row.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => handlePrint(row)}><Printer size={16} /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => openSignModal(row.id)} title="Sign Receipt">
                                                <PenLine size={16} className={row.signatureSigned ? 'text-primary' : ''} />
                                            </Button>
                                            {row.rawStatus === 'pending' && (
                                                <>
                                                    <Button variant="ghost" size="icon" onClick={() => handleAction(row.id, 'approve')} className="text-green-600"><CheckCircle2 size={16} /></Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleAction(row.id, 'cancel')} className="text-red-600"><XCircle size={16} /></Button>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                rowsPerPage={rowsPerPage}
                onPageChange={setPage}
                onRowsPerPageChange={(rows) => {
                    setRowsPerPage(rows);
                    setPage(1);
                }}
            />

            <Dialog open={signModalOpen} onOpenChange={setSignModalOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Sign Receipt</DialogTitle>
                        <DialogDescription>Please provide a signature for this transfer.</DialogDescription>
                    </DialogHeader>
                    <div className="bg-slate-50 dark:bg-slate-900 border-2 border-dashed rounded-lg p-1">
                        <canvas
                            ref={canvasRef}
                            style={{ width: '100%', height: '250px', touchAction: 'none', cursor: 'crosshair' }}
                            onPointerDown={handlePointerDown}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            className="w-full"
                        />
                    </div>
                    <DialogFooter className="flex justify-between sm:justify-between items-center w-full">
                        <Button variant="ghost" size="sm" onClick={() => {
                            const ctx = canvasRef.current?.getContext('2d');
                            ctx?.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
                            setHasInk(false);
                        }}>
                            <RotateCcw size={14} className="mr-2" /> Clear
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setSignModalOpen(false)}>Cancel</Button>
                            <Button onClick={saveSignature} disabled={!hasInk || submitting}>
                                <Save size={16} className="mr-2" /> Save Signature
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}


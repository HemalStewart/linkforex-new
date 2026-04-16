'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
import { Input } from "@/components/ui/input";
import {
  Building2,
  Edit2,
  PlusCircle,
  RefreshCw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type BankRow = {
    id: number | string;
    name?: string | null;
    bank_code?: string | null;
    status?: string | null;
    sender_bank?: any;
    receiver_bank?: any;
    pickup_bank?: any;
};

type BankFormState = {
    name: string;
    bank_code: string;
    sender_bank: boolean;
    receiver_bank: boolean;
    pickup_bank: boolean;
};

const EMPTY_FORM: BankFormState = {
    name: '',
    bank_code: '',
    sender_bank: false,
    receiver_bank: false,
    pickup_bank: false,
};

export default function BanksPage() {
    const [banks, setBanks] = useState<BankRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | string | null>(null);
    const [form, setForm] = useState<BankFormState>(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    useEffect(() => {
        void fetchBanks();
    }, []);

    const fetchBanks = async () => {
        setLoading(true);
        try {
            const res = await fetch(ENDPOINTS.BANKS.LIST);
            if (res.ok) {
                const data = await res.json();
                setBanks(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            toast.error("Failed to load banks");
        } finally {
            setLoading(false);
        }
    };

    const normalizeFlag = (val: any) => {
        const s = String(val || '').toLowerCase();
        return ['1', 'yes', 'true', 'y'].includes(s);
    };

    const filteredBanks = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return banks.filter(b => 
            (b.name || '').toLowerCase().includes(query) ||
            (b.bank_code || '').toLowerCase().includes(query)
        );
    }, [banks, searchQuery]);

    const totalRows = filteredBanks.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
    const startIndex = (page - 1) * rowsPerPage;
    const pagedBanks = filteredBanks.slice(startIndex, startIndex + rowsPerPage);

    useEffect(() => {
        setPage(1);
    }, [searchQuery, rowsPerPage]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const openCreateModal = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setModalOpen(true);
    };

    const openEditModal = (bank: BankRow) => {
        setEditingId(bank.id);
        setForm({
            name: bank.name || '',
            bank_code: bank.bank_code || '',
            sender_bank: normalizeFlag(bank.sender_bank),
            receiver_bank: normalizeFlag(bank.receiver_bank),
            pickup_bank: normalizeFlag(bank.pickup_bank),
        });
        setModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.pickup_bank && !form.receiver_bank) {
            toast.warning("Cash Pickup Bank must also be a Receiver Bank.");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                ...form,
                sender_bank: form.sender_bank ? 1 : 0,
                receiver_bank: form.receiver_bank ? 1 : 0,
                pickup_bank: form.pickup_bank ? 1 : 0,
            };

            const endpoint = editingId ? ENDPOINTS.BANKS.DETAIL(editingId) : ENDPOINTS.BANKS.LIST;
            const res = await fetch(endpoint, {
                method: editingId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success(editingId ? "Bank updated" : "Bank added");
                setModalOpen(false);
                void fetchBanks();
            } else {
                toast.error("Failed to save bank");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await fetch(ENDPOINTS.BANKS.DETAIL(deleteId), { method: 'DELETE' });
            if (res.ok) {
                toast.success("Bank deleted");
                setDeleteId(null);
                void fetchBanks();
            } else {
                toast.error("Failed to delete bank");
            }
        } catch {
            toast.error("Error deleting bank");
        }
    };

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Banks</h1>
                    <p className="text-muted-foreground">Manage sender, receiver, and cash pickup banks.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={fetchBanks} disabled={loading} aria-label="Refresh banks" title="Refresh banks">
                        <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                    </Button>
                    <Button onClick={openCreateModal}><PlusCircle className="mr-2 h-4 w-4" /> Add Bank</Button>
                </div>
            </div>

            <AdminTableFilters
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search banks..."
                title="Search"
                description="Filter banks by bank code or bank name."
            />

            <div className="rounded-md border bg-card overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>Bank Code</TableHead>
                            <TableHead>Bank Name</TableHead>
                            <TableHead>Sender</TableHead>
                            <TableHead>Receiver</TableHead>
                            <TableHead>Pickup</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={7} className="h-24 text-center">Loading...</TableCell></TableRow>
                        ) : pagedBanks.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="h-24 text-center">No banks found.</TableCell></TableRow>
                        ) : (
                            pagedBanks.map((bank, idx) => (
                                <TableRow key={bank.id}>
                                    <TableCell className="text-muted-foreground">{startIndex + idx + 1}</TableCell>
                                    <TableCell className="font-mono text-sm">{bank.bank_code || '-'}</TableCell>
                                    <TableCell className="font-medium">{bank.name}</TableCell>
                                    <TableCell><Badge variant={normalizeFlag(bank.sender_bank) ? 'default' : 'secondary'}>{normalizeFlag(bank.sender_bank) ? 'Yes' : 'No'}</Badge></TableCell>
                                    <TableCell><Badge variant={normalizeFlag(bank.receiver_bank) ? 'default' : 'secondary'}>{normalizeFlag(bank.receiver_bank) ? 'Yes' : 'No'}</Badge></TableCell>
                                    <TableCell><Badge variant={normalizeFlag(bank.pickup_bank) ? 'default' : 'secondary'}>{normalizeFlag(bank.pickup_bank) ? 'Yes' : 'No'}</Badge></TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openEditModal(bank)}><Edit2 size={16} /></Button>
                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(Number(bank.id))}><Trash2 size={16} /></Button>
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

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Edit Bank' : 'Add Bank'}</DialogTitle>
                        <DialogDescription>Enter bank details and configuration flags.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="bank_code">Bank Code (Unique)</Label>
                            <Input id="bank_code" className="uppercase" value={form.bank_code} onChange={e => setForm({...form, bank_code: e.target.value.toUpperCase()})} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Bank Name</Label>
                            <Input id="name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <Label>Sender Bank</Label>
                            <Switch checked={form.sender_bank} onCheckedChange={c => setForm({...form, sender_bank: c})} />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <Label>Receiver Bank</Label>
                            <Switch checked={form.receiver_bank} onCheckedChange={c => setForm({...form, receiver_bank: c})} />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <Label>Cash Pickup Bank</Label>
                            <Switch checked={form.pickup_bank} onCheckedChange={c => setForm({...form, pickup_bank: c})} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteId !== null} onOpenChange={o => !o && setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Bank</DialogTitle>
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

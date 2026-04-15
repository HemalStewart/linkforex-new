'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { 
    PlusCircle, 
    RefreshCw, 
    Search, 
    Trash2, 
    Edit2, 
    ListChecks, 
    Save,
    CheckCircle2,
    XCircle
} from 'lucide-react';
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

// Types
type PurposeRow = {
    id: number | string;
    name?: string | null;
    active?: 'yes' | 'no' | null;
};

export default function PurposesPage() {
    const [rows, setRows] = useState<PurposeRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<PurposeRow | null>(null);
    const [form, setForm] = useState({ name: '', active: true });
    const [submitting, setSubmitting] = useState(false);

    const fetchPurposes = async () => {
        setLoading(true);
        try {
            const res = await fetch(ENDPOINTS.PURPOSES.LIST);
            if (res.ok) {
                const data = await res.json();
                setRows(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            toast.error("Failed to load purposes");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchPurposes();
    }, []);

    const handleOpenModal = (row?: PurposeRow) => {
        if (row) {
            setEditing(row);
            setForm({ name: row.name || '', active: row.active === 'yes' });
        } else {
            setEditing(null);
            setForm({ name: '', active: true });
        }
        setModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const url = editing ? ENDPOINTS.PURPOSES.DETAIL(editing.id) : ENDPOINTS.PURPOSES.LIST;
            const method = editing ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    active: form.active ? 'yes' : 'no'
                })
            });
            if (res.ok) {
                toast.success(editing ? "Purpose updated" : "Purpose created");
                setModalOpen(false);
                await fetchPurposes();
            }
        } catch (e) {
            toast.error("Failed to save purpose");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number | string) => {
        if (!confirm("Are you sure you want to delete this purpose?")) return;
        try {
            const res = await fetch(ENDPOINTS.PURPOSES.DETAIL(id), { method: 'DELETE' });
            if (res.ok) {
                toast.success("Purpose deleted");
                await fetchPurposes();
            }
        } catch (e) {
            toast.error("Failed to delete purpose");
        }
    };

    const filtered = rows.filter(r => 
        !searchQuery || r.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Transfer Purposes</h1>
                    <p className="text-muted-foreground">Manage the list of purposes available to customers for their transfers.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={fetchPurposes} variant="outline" size="icon" aria-label="Refresh purposes" title="Refresh purposes">
                        <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                    </Button>
                    <Button onClick={() => handleOpenModal()} size="sm">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Purpose
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Filter purposes..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">ID</TableHead>
                            <TableHead>Purpose Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={4} className="h-24 text-center">Loading...</TableCell></TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="h-24 text-center">No purposes found.</TableCell></TableRow>
                        ) : (
                            filtered.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="font-mono text-xs">#{row.id}</TableCell>
                                    <TableCell className="font-medium">{row.name}</TableCell>
                                    <TableCell>
                                        <Badge variant={row.active === 'yes' ? 'default' : 'secondary'} className="gap-1">
                                            {row.active === 'yes' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                            {row.active === 'yes' ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(row)}>
                                            <Edit2 size={16} className="text-blue-500" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(row.id)}>
                                            <Trash2 size={16} className="text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent>
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>{editing ? 'Edit Purpose' : 'Add New Purpose'}</DialogTitle>
                            <DialogDescription>
                                Set the purpose label and visibility for customers.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Purpose Name</Label>
                                <Input 
                                    id="name" 
                                    value={form.name} 
                                    onChange={e => setForm({...form, name: e.target.value})}
                                    placeholder="e.g. Family Support"
                                    required
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch 
                                    id="active" 
                                    checked={form.active} 
                                    onCheckedChange={v => setForm({...form, active: v})}
                                />
                                <Label htmlFor="active">Active (Visible to users)</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                                <Save className="mr-2 h-4 w-4" /> Save Purpose
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

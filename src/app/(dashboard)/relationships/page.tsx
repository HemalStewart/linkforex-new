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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PlusCircle,
  RefreshCw,
  Trash2,
  Edit2,
} from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type YesNo = 'yes' | 'no';

type RelationshipRow = {
    id: number | string;
    name?: string | null;
    active?: YesNo | null;
    created_at?: string | null;
    updated_at?: string | null;
};

type RelationshipFormState = {
    name: string;
    active: YesNo;
};

type SortKey = 'name' | 'active';
type SortDir = 'asc' | 'desc';

const EMPTY_FORM: RelationshipFormState = {
    name: '',
    active: 'yes',
};

const normalizeYesNo = (value?: string | null): YesNo =>
    String(value || '').toLowerCase() === 'yes' ? 'yes' : 'no';

export default function RelationshipsPage() {
    const [rows, setRows] = useState<RelationshipRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | YesNo>('all');
    const [sortKey, setSortKey] = useState<SortKey>('name');
    const [sortDir, setSortDir] = useState<SortDir>('asc');
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | string | null>(null);
    const [form, setForm] = useState<RelationshipFormState>(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);

    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        void fetchRelationships();
    }, []);

    const fetchRelationships = async () => {
        setLoading(true);
        try {
            const res = await fetch(ENDPOINTS.RELATIONSHIPS.LIST);
            if (res.ok) {
                const data = await res.json();
                setRows(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Failed to fetch relationships', error);
            toast.error("Failed to fetch relationships");
        } finally {
            setLoading(false);
        }
    };

    const filteredRows = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return rows.filter((row) => {
            const matchesQuery = !query || String(row.name || '').toLowerCase().includes(query);
            const matchesActive = activeFilter === 'all' || normalizeYesNo(row.active) === activeFilter;
            return matchesQuery && matchesActive;
        });
    }, [rows, searchQuery, activeFilter]);

    const sortedRows = useMemo(() => {
        const data = [...filteredRows];
        data.sort((left, right) => {
            const a = getSortValue(left, sortKey);
            const b = getSortValue(right, sortKey);
            if (a === b) return 0;
            if (sortDir === 'asc') return a > b ? 1 : -1;
            return a < b ? 1 : -1;
        });
        return data;
    }, [filteredRows, sortKey, sortDir]);

    const totalRows = sortedRows.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
    const currentPage = Math.min(page, totalPages);
    const startIndex = totalRows === 0 ? 0 : (currentPage - 1) * rowsPerPage;
    const endIndex = totalRows === 0 ? 0 : startIndex + rowsPerPage;
    const pagedRows = sortedRows.slice(startIndex, endIndex);

    useEffect(() => {
        setPage(1);
    }, [searchQuery, activeFilter, rowsPerPage]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const openCreateModal = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setModalOpen(true);
    };

    const openEditModal = (row: RelationshipRow) => {
        setEditingId(row.id);
        setForm({
            name: String(row.name || ''),
            active: normalizeYesNo(row.active),
        });
        setModalOpen(true);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!form.name.trim()) {
            toast.warning("Please enter a relationship name.");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                name: form.name.trim(),
                active: form.active,
            };

            const res = await fetch(
                editingId ? ENDPOINTS.RELATIONSHIPS.DETAIL(editingId) : ENDPOINTS.RELATIONSHIPS.LIST,
                {
                    method: editingId ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                }
            );

            if (res.ok) {
                setModalOpen(false);
                await fetchRelationships();
                toast.success(editingId ? 'Relationship updated.' : 'Relationship added.');
                return;
            }

            toast.error("Failed to save relationship.");
        } catch (error) {
            console.error(error);
            toast.error("An error occurred while saving.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (deleteId == null) return;
        setDeleteLoading(true);
        try {
            const res = await fetch(ENDPOINTS.RELATIONSHIPS.DETAIL(deleteId), { method: 'DELETE' });
            if (res.ok) {
                await fetchRelationships();
                toast.success("Relationship deleted successfully.");
            } else {
                toast.error("Failed to delete relationship.");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred while deleting.");
        } finally {
            setDeleteLoading(false);
            setDeleteId(null);
        }
    };

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'));
            return;
        }
        setSortKey(key);
        setSortDir('asc');
    };

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Relationships</h1>
                    <p className="text-muted-foreground">
                        Maintain relationship labels used in beneficiary and transfer flows.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={fetchRelationships}
                        disabled={loading}
                        aria-label="Refresh relationships"
                        title="Refresh relationships"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button onClick={openCreateModal}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Relationship
                    </Button>
                </div>
            </div>

            <AdminTableFilters
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search relationships"
                title="Search"
                description="Filter relationships by name or active status."
            >
                <div className="w-full md:w-48">
                    <Select
                        value={activeFilter}
                        onValueChange={(val) => setActiveFilter(val as 'all' | YesNo)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="yes">Active</SelectItem>
                            <SelectItem value="no">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </AdminTableFilters>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead
                                className="cursor-pointer"
                                onClick={() => toggleSort('name')}
                            >
                                Name {sortKey === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                            </TableHead>
                            <TableHead
                                className="cursor-pointer"
                                onClick={() => toggleSort('active')}
                            >
                                Active {sortKey === 'active' && (sortDir === 'asc' ? '↑' : '↓')}
                            </TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : pagedRows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No results found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            pagedRows.map((row, idx) => (
                                <TableRow key={row.id}>
                                    <TableCell>{startIndex + idx + 1}</TableCell>
                                    <TableCell className="font-medium">{row.name}</TableCell>
                                    <TableCell>
                                        <Badge variant={normalizeYesNo(row.active) === 'yes' ? 'default' : 'destructive'}>
                                            {normalizeYesNo(row.active) === 'yes' ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openEditModal(row)}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => setDeleteId(Number(row.id))}
                                            >
                                                <Trash2 className="h-4 w-4" />
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

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Edit Relationship' : 'Add Relationship'}</DialogTitle>
                        <DialogDescription>
                            Enter the name and status for the relationship.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g. Family, Friend"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="active"
                                checked={form.active === 'yes'}
                                onCheckedChange={(checked) => setForm({ ...form, active: checked ? 'yes' : 'no' })}
                            />
                            <Label htmlFor="active">Active</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={submitting}>
                            {submitting ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Delete</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this relationship? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
                            {deleteLoading ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function getSortValue(row: RelationshipRow, key: SortKey) {
    switch (key) {
        case 'name':
            return String(row.name || '').toLowerCase();
        case 'active':
            return normalizeYesNo(row.active);
        default:
            return '';
    }
}

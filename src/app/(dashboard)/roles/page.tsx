'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Shield,
  RefreshCw,
} from 'lucide-react';
import { toast } from "sonner";

export default function RolesPage() {
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortKey, setSortKey] = useState<string>('created_at');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [actionBusy, setActionBusy] = useState(false);

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const res = await fetch(ENDPOINTS.ROLES.LIST);
            if (res.ok) {
                const data = await res.json();
                setRoles(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load roles");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchRoles();
    }, []);

    const handleDelete = async () => {
        if (!deleteId) return;
        setActionBusy(true);
        try {
            const res = await fetch(ENDPOINTS.ROLES.DETAIL(deleteId), { method: 'DELETE' });
            if (res.ok) {
                toast.success("Role deleted successfully");
                setRoles(roles.filter(r => r.id !== deleteId));
                setDeleteId(null);
            } else {
                toast.error("Failed to delete role");
            }
        } catch (error) {
            toast.error("Error deleting role");
        } finally {
            setActionBusy(false);
        }
    };

    const filteredRoles = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        let rs = roles;
        if (query) {
            rs = rs.filter(r => (r.name || '').toLowerCase().includes(query));
        }
        return rs;
    }, [roles, searchQuery]);

    const sortedRoles = useMemo(() => {
        const data = [...filteredRoles];
        data.sort((a, b) => {
            const aVal = a[sortKey] ?? '';
            const bVal = b[sortKey] ?? '';
            if (sortDir === 'asc') return aVal > bVal ? 1 : -1;
            return aVal < bVal ? 1 : -1;
        });
        return data;
    }, [filteredRoles, sortKey, sortDir]);

    const totalRows = sortedRoles.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
    const currentPage = Math.min(page, totalPages);
    const startIndex = totalRows === 0 ? 0 : (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, totalRows);
    const pagedRoles = sortedRoles.slice(startIndex, endIndex);

    useEffect(() => {
        setPage(1);
    }, [searchQuery, rowsPerPage]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const toggleSort = (key: string) => {
        if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('asc'); }
    };

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Roles</h1>
                    <p className="text-muted-foreground">Manage user roles and system access levels.</p>
                </div>
                <Button asChild>
                    <Link href="/roles/create"><PlusCircle className="mr-2 h-4 w-4" /> Add Role</Link>
                </Button>
            </div>

            <AdminTableFilters
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search roles..."
                title="Search"
                description="Filter roles by role name."
            >
                <Button variant="outline" size="icon" onClick={fetchRoles} disabled={loading} aria-label="Refresh roles" title="Refresh roles">
                    <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                </Button>
            </AdminTableFilters>

            <div className="rounded-md border bg-card overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead className="cursor-pointer" onClick={() => toggleSort('name')}>
                                Role Name {sortKey === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                            </TableHead>
                            <TableHead>System Defined</TableHead>
                            <TableHead>Entered Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">Loading...</TableCell></TableRow>
                        ) : pagedRoles.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">No roles found.</TableCell></TableRow>
                        ) : (
                            pagedRoles.map((role, idx) => (
                                <TableRow key={role.id}>
                                    <TableCell className="text-muted-foreground">{startIndex + idx + 1}</TableCell>
                                    <TableCell className="font-medium">{role.name}</TableCell>
                                    <TableCell>
                                        <Badge variant={String(role.system_defined).toLowerCase() === 'yes' ? 'destructive' : 'outline'}>
                                            {String(role.system_defined).toLowerCase() === 'yes' ? 'System' : 'Custom'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {role.created_at ? new Date(role.created_at).toLocaleDateString() : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" asChild><Link href={`/roles/${role.id}`}><Eye size={16} /></Link></Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="text-destructive hover:text-destructive"
                                                disabled={String(role.system_defined).toLowerCase() === 'yes'}
                                                onClick={() => setDeleteId(role.id)}
                                            >
                                                <Trash2 size={16} />
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

            <Dialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Role</DialogTitle>
                        <DialogDescription>Are you sure you want to delete this role? This cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={actionBusy}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

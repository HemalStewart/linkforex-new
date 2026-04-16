'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
    Search, 
    UserPlus, 
    Eye, 
    Download, 
    Trash2,
    RefreshCw,
    Smartphone,
    UserCheck,
    AlertCircle
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
import { AdminTableFilters } from "@/components/admin/table-filters"
import { AdminTableFooter } from "@/components/admin/table-footer"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

// Types
type MobileRemitter = {
    id: string | number;
    name?: string;
    email?: string;
    phone?: string;
    status?: string;
    kyc_status?: string;
    created_at?: string;
    last_login?: string;
    joinedDate?: string;
    transfersCount?: number;
    lastLogin?: string;
    kycStatus?: string;
};

export default function MobileProfilesPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [remitters, setRemitters] = useState<MobileRemitter[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    const fetchRemitters = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('registration_source', 'mobile_app');
            if (statusFilter !== 'all') params.append('status', statusFilter);
            if (searchQuery) params.append('search', searchQuery);

            const res = await fetch(`${ENDPOINTS.REMITTERS.LIST}?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                const rows = Array.isArray(data) ? data : [];
                const mapped = rows.map((c: any) => ({
                    ...c,
                    joinedDate: c.created_at ? new Date(c.created_at).toLocaleDateString() : '-',
                    lastLogin: c.last_login || 'Never',
                    kycStatus: c.kyc_status || 'pending'
                }));
                setRemitters(mapped);
            }
        } catch (error) {
            toast.error("Failed to load mobile profiles");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(fetchRemitters, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery, statusFilter]);

    const totalRows = remitters.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
    const currentPage = Math.min(page, totalPages);
    const startIndex = totalRows === 0 ? 0 : (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const pagedRemitters = remitters.slice(startIndex, endIndex);

    useEffect(() => {
        setPage(1);
    }, [searchQuery, statusFilter, rowsPerPage]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const handleDelete = async (id: string | number) => {
        if (!confirm("Delete this mobile user and linked data?")) return;
        try {
            const res = await fetch(ENDPOINTS.REMITTERS.DETAIL(id), { method: 'DELETE' });
            if (res.ok) {
                toast.success("Profile deleted");
                await fetchRemitters();
            }
        } catch (e) {
            toast.error("Delete failed");
        }
    };

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Mobile Profiles</h1>
                    <p className="text-muted-foreground">Manage and review remitters registered via mobile application.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={fetchRemitters} aria-label="Refresh mobile profiles" title="Refresh mobile profiles">
                        <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                    </Button>
                    <Button size="sm">
                        <UserPlus className="mr-2 h-4 w-4" /> Add Profile
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Mobile Users</CardTitle>
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{remitters.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">KYC Verified</CardTitle>
                        <UserCheck className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{remitters.filter(r => r.kycStatus === 'verified').length}</div>
                    </CardContent>
                </Card>
            </div>

            <AdminTableFilters
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search by name, email or phone..."
                title="Search"
                description="Filter mobile profiles by account details and status."
            >
                <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-fit">
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="active">Active</TabsTrigger>
                        <TabsTrigger value="inactive">Inactive</TabsTrigger>
                    </TabsList>
                </Tabs>
            </AdminTableFilters>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Profile</TableHead>
                            <TableHead>Contact Info</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>KYC Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">Loading profiles...</TableCell></TableRow>
                        ) : pagedRemitters.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">No mobile profiles found.</TableCell></TableRow>
                        ) : (
                            pagedRemitters.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold">{row.name}</span>
                                            <span className="text-[10px] text-muted-foreground">Joined: {row.joinedDate}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-xs">
                                            <span>{row.email}</span>
                                            <span className="text-muted-foreground">{row.phone}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={row.status === 'active' ? 'default' : 'secondary'} className="uppercase text-[10px]">
                                            {row.status || 'inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={row.kycStatus === 'verified' ? 'default' : row.kycStatus === 'rejected' ? 'destructive' : 'outline'} className="uppercase text-[10px]">
                                            {row.kycStatus || 'pending'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-1">
                                        <Button variant="ghost" size="icon" asChild>
                                            <Link href={`/remitters/${row.id}`}><Eye size={16} /></Link>
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

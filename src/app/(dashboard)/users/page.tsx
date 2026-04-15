'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Search,
  UserPlus,
  Trash2,
  Users,
  UserCheck,
  User,
  Shield,
  QrCode,
  Eye,
  RotateCcw,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';
import { toast } from "sonner";

export default function UsersPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortKey, setSortKey] = useState<string>('created_at');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserName, setCurrentUserName] = useState('');

    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [resetUser, setResetUser] = useState<any | null>(null);
    const [actionBusy, setActionBusy] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch(ENDPOINTS.USERS.LIST);
            if (res.ok) {
                const data = await res.json();
                setUsers(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchUsers();
        const parsed = getStoredUser<any>();
        setCurrentUserName(parsed?.username || parsed?.name || '');
    }, []);

    const handleDelete = async () => {
        if (!deleteId) return;
        setActionBusy(true);
        try {
            const res = await fetch(ENDPOINTS.USERS.DETAIL(deleteId), { method: 'DELETE' });
            if (res.ok) {
                toast.success("User deleted successfully");
                setUsers(users.filter(u => u.id !== deleteId));
                setDeleteId(null);
            } else {
                toast.error("Failed to delete user");
            }
        } catch (error) {
            toast.error("Error deleting user");
        } finally {
            setActionBusy(false);
        }
    };

    const handleReset = async () => {
        if (!resetUser) return;
        setActionBusy(true);
        const tempPassword = `${Math.random().toString(36).slice(2, 6)}${Math.random().toString(36).slice(2, 6)}!`;

        try {
            const res = await fetch(ENDPOINTS.USERS.DETAIL(resetUser.id), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    password: tempPassword,
                    updated_by: currentUserName || undefined
                })
            });

            if (res.ok) {
                toast.success(`Password reset! Temporary: ${tempPassword}`, { duration: 10000 });
                setResetUser(null);
            } else {
                toast.error("Failed to reset password");
            }
        } catch (error) {
            toast.error("Error resetting password");
        } finally {
            setActionBusy(false);
        }
    };

    const filteredUsers = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        let rs = users;
        if (query) {
            rs = rs.filter(u =>
                (u.username || '').toLowerCase().includes(query) ||
                (u.name || '').toLowerCase().includes(query) ||
                (u.email || '').toLowerCase().includes(query)
            );
        }
        return rs;
    }, [users, searchQuery]);

    const sortedUsers = useMemo(() => {
        const data = [...filteredUsers];
        data.sort((a, b) => {
            const aVal = a[sortKey] ?? '';
            const bVal = b[sortKey] ?? '';
            if (sortDir === 'asc') return aVal > bVal ? 1 : -1;
            return aVal < bVal ? 1 : -1;
        });
        return data;
    }, [filteredUsers, sortKey, sortDir]);

    const totalRows = sortedUsers.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
    const currentPage = Math.min(page, totalPages);
    const startIndex = totalRows === 0 ? 0 : (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, totalRows);
    const pagedUsers = sortedUsers.slice(startIndex, endIndex);

    const stats = useMemo(() => ({
        total: users.length,
        active: users.filter(u => (u.status || '').toLowerCase() === 'active').length,
        system: users.filter(u => String(u.system_defined).toLowerCase() === 'yes').length,
        twofa: users.filter(u => (u.twofa_status || '').toLowerCase() === 'active').length,
    }), [users]);

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Users</h1>
                    <p className="text-muted-foreground">Manage users and assign roles</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="hidden md:flex">
                        <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                    <Button asChild>
                        <Link href="/users/create"><UserPlus className="mr-2 h-4 w-4" /> Add User</Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.active}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Defined</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.system}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">2FA Active</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.twofa}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button variant="outline" onClick={fetchUsers} disabled={loading}>
                    <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                </Button>
            </div>

            <div className="rounded-md border bg-card overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>Username</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>2FA</TableHead>
                            <TableHead>Role Type</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={7} className="h-24 text-center">Loading...</TableCell></TableRow>
                        ) : pagedUsers.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="h-24 text-center">No users found.</TableCell></TableRow>
                        ) : (
                            pagedUsers.map((user, idx) => (
                                <TableRow key={user.id}>
                                    <TableCell className="text-muted-foreground">{startIndex + idx + 1}</TableCell>
                                    <TableCell className="font-medium">{user.username}</TableCell>
                                    <TableCell>{user.name || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant={(user.status || '').toLowerCase() === 'active' ? 'default' : 'secondary'}>
                                            {user.status || 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={(user.twofa_status || '').toLowerCase() === 'active' ? 'outline' : 'secondary'}>
                                            {user.twofa_status === 'active' ? '2FA Active' : 'Off'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {String(user.system_defined).toLowerCase() === 'yes' ? (
                                            <Badge variant="destructive">System</Badge>
                                        ) : (
                                            <Badge variant="outline">User</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => setResetUser(user)} title="Reset Password"><RotateCcw size={16} /></Button>
                                            <Button variant="ghost" size="icon" asChild><Link href={`/users/${user.id}`}><Eye size={16} /></Link></Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="text-destructive hover:text-destructive"
                                                disabled={String(user.system_defined).toLowerCase() === 'yes'}
                                                onClick={() => setDeleteId(user.id)}
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

            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Showing {startIndex + 1} to {endIndex} of {totalRows}</p>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}><ChevronLeft size={16} /></Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === totalPages}><ChevronRight size={16} /></Button>
                </div>
            </div>

            <Dialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogDescription>Are you sure? This will permanently delete the user account.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={actionBusy}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={resetUser !== null} onOpenChange={(o) => !o && setResetUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>Generate a temporary password for {resetUser?.username}?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setResetUser(null)}>Cancel</Button>
                        <Button onClick={handleReset} disabled={actionBusy}>Reset Password</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

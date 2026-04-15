'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
    ArrowLeft, 
    Shield, 
    Save, 
    Loader2, 
    CheckCircle, 
    AlertTriangle,
    Info,
    Lock,
    Unlock,
    Users
} from 'lucide-react';
import { ENDPOINTS } from '@/lib/api';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

export default function RoleFormPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const isEdit = !!id;

    const [loading, setLoading] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 'active',
        permissions: [] as string[]
    });

    const ALL_PERMISSIONS = [
        'view_dashboard', 'manage_transfers', 'approve_transfers',
        'manage_remitters', 'manage_receivers', 'manage_users',
        'manage_branches', 'view_reports', 'manage_rates',
        'manage_compliance', 'manage_settings'
    ];

    useEffect(() => {
        if (isEdit) {
            const fetchRole = async () => {
                try {
                    const res = await fetch(ENDPOINTS.ROLES.DETAIL(id));
                    if (res.ok) {
                        const data = await res.json();
                        setFormData({
                            name: data.name || '',
                            description: data.description || '',
                            status: data.status || 'active',
                            permissions: Array.isArray(data.permissions) ? data.permissions : []
                        });
                    }
                } catch (e) {
                    toast.error("Failed to load role");
                } finally {
                    setLoading(false);
                }
            };
            void fetchRole();
        }
    }, [id]);

    const handleTogglePermission = (perm: string) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(perm)
                ? prev.permissions.filter(p => p !== perm)
                : [...prev.permissions, perm]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(isEdit ? ENDPOINTS.ROLES.DETAIL(id) : ENDPOINTS.ROLES.LIST, {
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                toast.success(isEdit ? "Role updated" : "Role created");
                router.push('/roles');
            } else {
                toast.error("Operation failed");
            }
        } catch (e) {
            toast.error("Network error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-12 text-center animate-pulse">Loading role data...</div>;

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{isEdit ? 'Edit Role' : 'Create Role'}</h1>
                    <p className="text-muted-foreground">Define system access permissions for user groups.</p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/roles"><ArrowLeft size={16} className="mr-2" /> Back</Link>
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-md flex items-center gap-2">
                            <Shield size={16} className="text-primary" /> Role Identity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="space-y-2">
                            <Label>Role Name</Label>
                            <Input 
                                required 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                placeholder="e.g. Compliance Officer"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input 
                                value={formData.description} 
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                placeholder="Access to AML screening and transfer approval"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-md flex items-center gap-2">
                            <Lock size={16} className="text-primary" /> Permissions Matrix
                        </CardTitle>
                        <CardDescription>Toggle specific capabilities for this role.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {ALL_PERMISSIONS.map(permission => (
                                <div key={permission} className="flex items-center justify-between space-x-2 rounded-lg border p-3">
                                    <Label htmlFor={permission} className="flex flex-col space-y-1">
                                        <span className="text-xs font-bold capitalize">{permission.replace(/_/g, ' ')}</span>
                                    </Label>
                                    <Switch 
                                        id={permission} 
                                        checked={formData.permissions.includes(permission)}
                                        onCheckedChange={() => handleTogglePermission(permission)}
                                    />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="ghost" type="button" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" disabled={submitting}>
                        {submitting ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Save size={14} className="mr-2" />}
                        {isEdit ? 'Update Role' : 'Create Role'}
                    </Button>
                </div>
            </form>
        </div>
    );
}

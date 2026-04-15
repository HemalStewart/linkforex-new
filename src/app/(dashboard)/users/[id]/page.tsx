'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { 
    ArrowLeft, 
    User, 
    Mail, 
    Shield, 
    Building, 
    Lock, 
    Save, 
    Loader2, 
    CheckCircle, 
    AlertTriangle,
    History,
    Key,
    UserCheck,
    Info,
    Smartphone
} from 'lucide-react';
import { ENDPOINTS } from '@/lib/api';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

export default function UserDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [roles, setRoles] = useState<any[]>([]);
    const [formData, setFormData] = useState<any>({
        name: '',
        username: '',
        email: '',
        role: 'agent',
        status: 'active',
        branch: '',
        password: ''
    });

    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const [uRes, rRes] = await Promise.all([
                    fetch(ENDPOINTS.USERS.DETAIL(id)),
                    fetch(ENDPOINTS.ROLES.LIST)
                ]);
                if (uRes.ok) setFormData({ ...(await uRes.json()), password: '' });
                if (rRes.ok) setRoles(await rRes.json());
            } catch (e) {
                toast.error("Failed to load user data");
            } finally {
                setLoading(false);
            }
        };
        if (id) void fetchInitial();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const { password, ...rest } = formData;
        const body = password ? formData : rest;

        try {
            const res = await fetch(ENDPOINTS.USERS.DETAIL(id), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                toast.success("User profile updated");
                setFormData((p: typeof formData) => ({ ...p, password: '' }));
            } else {
                toast.error("Update failed");
            }
        } catch (e) {
            toast.error("Network error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-12 text-center animate-pulse">Loading user profile...</div>;

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                        <Link href="/users"><ArrowLeft size={16} /></Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{formData.name}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant={formData.status === 'active' ? 'default' : 'secondary'}>
                                {formData.status?.toUpperCase()}
                            </Badge>
                            <span className="text-sm text-muted-foreground font-mono">{formData.username}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => router.back()}>Cancel</Button>
                    <Button size="sm" onClick={handleSubmit} disabled={submitting}>
                        {submitting ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Save size={14} className="mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Account Profile</CardTitle>
                        <CardDescription>Edit staff personal details and association.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input 
                                    value={formData.name} 
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Username</Label>
                                <Input 
                                    value={formData.username} 
                                    onChange={e => setFormData({...formData, username: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input 
                                    type="email"
                                    value={formData.email} 
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Branch Code</Label>
                                <Input 
                                    value={formData.branch} 
                                    onChange={e => setFormData({...formData, branch: e.target.value})}
                                />
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Key size={14} className="text-primary" /> Reset Password
                            </Label>
                            <Input 
                                type="password"
                                placeholder="Enter new password to reset, or leave blank to keep current"
                                value={formData.password} 
                                onChange={e => setFormData({...formData, password: e.target.value})}
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Shield size={14} className="text-primary" /> Access Control
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>System Role</Label>
                                <Select 
                                    value={formData.role} 
                                    onValueChange={v => setFormData({...formData, role: v})}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {roles.map(r => (
                                            <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Account Status</Label>
                                <Select 
                                    value={formData.status} 
                                    onValueChange={v => setFormData({...formData, status: v})}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                        <SelectItem value="suspended">Suspended</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="pt-2">
                                <Badge variant="outline" className="w-full justify-center py-1 bg-muted/50">
                                    <Smartphone size={10} className="mr-1" /> 2FA: {formData.twofa_status || 'Inactive'}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Info size={14} /> Account Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-[11px] space-y-2">
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Registered:</span>
                                <span>{formData.created_at ? new Date(formData.created_at).toLocaleDateString() : 'Initial Import'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Admin Notes:</span>
                                <span className="font-medium text-emerald-600">LFX Verified</span>
                            </div>
                            <Separator className="my-2" />
                            <Button variant="ghost" size="sm" className="w-full text-[10px] h-7" asChild>
                                <Link href="/logs">View Global Staff Logs</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

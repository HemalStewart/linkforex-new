'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    ArrowLeft, 
    User, 
    Mail, 
    Lock, 
    Shield, 
    Building, 
    Save, 
    MapPin, 
    Phone, 
    FileSignature, 
    ChevronRight,
    Loader2
} from 'lucide-react';
import { ENDPOINTS } from '@/lib/api';
import { getStoredUser } from '@/lib/authStorage';
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
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

export default function CreateUserPage() {
    const router = useRouter();

    const [branches, setBranches] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        username: '',
        address: '',
        phone: '',
        email: '',
        roleId: '',
        branch: '',
        password: '',
        confirmPassword: '',
        status: 'active',
        twofaStatus: 'active'
    });

    const signatureInputRef = useRef<HTMLInputElement | null>(null);
    const [signatureFile, setSignatureFile] = useState<File | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [bRes, rRes] = await Promise.all([
                    fetch(ENDPOINTS.BRANCHES.LIST),
                    fetch(ENDPOINTS.ROLES.LIST)
                ]);
                if (bRes.ok) setBranches(await bRes.json());
                if (rRes.ok) setRoles(await rRes.json());
            } catch (e) {
                toast.error("Failed to load reference data");
            } finally {
                setLoading(false);
            }
        };
        void fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setSubmitting(true);
        const payload = new FormData();
        const selectedBranch = branches.find((branch) => String(branch.id) === formData.branch);
        Object.entries(formData).forEach(([key, val]) => {
            if (key === 'confirmPassword') return;
            if (key === 'branch') {
                payload.append('branch', selectedBranch?.code || selectedBranch?.name || '');
                return;
            }
            payload.append(key, val);
        });
        
        const roleName = roles.find(r => r.id.toString() === formData.roleId)?.name || 'staff';
        payload.append('role', roleName);
        if (signatureFile) payload.append('signature', signatureFile);

        try {
            const res = await fetch(ENDPOINTS.USERS.LIST, {
                method: 'POST',
                body: payload,
            });
            if (res.ok) {
                toast.success("User created successfully");
                router.push('/users');
            } else {
                toast.error("Failed to create user");
            }
        } catch (e) {
            toast.error("Network error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-12 text-center animate-pulse">Loading form data...</div>;

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Add System User</h1>
                    <p className="text-muted-foreground">Create a new staff account for system access.</p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/users"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link>
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-md flex items-center gap-2">
                            <Shield className="h-4 w-4 text-primary" /> Account Credentials
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Username</Label>
                            <Input 
                                required 
                                value={formData.username}
                                onChange={e => setFormData({...formData, username: e.target.value})}
                                placeholder="jdoe"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email Address</Label>
                            <Input 
                                type="email" 
                                required 
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                                placeholder="john@linkforex.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Password</Label>
                            <Input 
                                type="password" 
                                required 
                                value={formData.password}
                                onChange={e => setFormData({...formData, password: e.target.value})}
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Confirm Password</Label>
                            <Input 
                                type="password" 
                                required 
                                value={formData.confirmPassword}
                                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                                placeholder="••••••••"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-md flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" /> Personal & Access
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input 
                                    required 
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    placeholder="John Doe"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Mobile No</Label>
                                <Input 
                                    type="tel" 
                                    value={formData.phone}
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                    placeholder="+44..."
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Address</Label>
                                <Input 
                                    value={formData.address}
                                    onChange={e => setFormData({...formData, address: e.target.value})}
                                    placeholder="Street, City, Postcode"
                                />
                            </div>
                        </div>

                        <Separator />

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <div className="space-y-2">
                                <Label>Role</Label>
                                <Select 
                                    value={formData.roleId} 
                                    onValueChange={v => setFormData({...formData, roleId: v})}
                                >
                                    <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                                    <SelectContent>
                                        {roles.map(r => (
                                            <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Branch</Label>
                                <Select 
                                    value={formData.branch} 
                                    onValueChange={v => setFormData({...formData, branch: v})}
                                >
                                    <SelectTrigger><SelectValue placeholder="Select Branch" /></SelectTrigger>
                                        <SelectContent>
                                            {branches.map(b => (
                                            <SelectItem key={`branch-${b.id}`} value={String(b.id)}>{b.name}</SelectItem>
                                        ))}
                                        </SelectContent>
                                    </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
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
                            <div className="space-y-2">
                                <Label>2FA</Label>
                                <Select 
                                    value={formData.twofaStatus} 
                                    onValueChange={v => setFormData({...formData, twofaStatus: v})}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-md flex items-center gap-2">
                            <FileSignature className="h-4 w-4 text-primary" /> Signature / ID
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <Input 
                                type="file" 
                                className="max-w-sm"
                                onChange={e => setSignatureFile(e.target.files?.[0] || null)}
                            />
                            <p className="text-xs text-muted-foreground italic">
                                PNG, JPG or PDF. This will be used for internal document signing.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3 pt-6">
                    <Button variant="ghost" type="button" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" disabled={submitting}>
                        {submitting ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                        ) : (
                            <><Save className="mr-2 h-4 w-4" /> Create User Account</>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}

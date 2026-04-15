'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { 
    ArrowLeft, 
    Save, 
    Trash2, 
    Building, 
    Tag, 
    User, 
    Calendar, 
    Phone, 
    MapPin, 
    Globe, 
    Briefcase, 
    CreditCard, 
    Shield, 
    Layers, 
    FileText, 
    RefreshCw, 
    ExternalLink,
    CheckCircle2,
    XCircle,
    Info,
    History
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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

export default function RemitterDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [veriffLoading, setVeriffLoading] = useState(false);
    const [formData, setFormData] = useState<any>(null);

    const fetchRemitter = async () => {
        try {
            const res = await fetch(ENDPOINTS.REMITTERS.DETAIL(id));
            if (res.ok) {
                const data = await res.json();
                setFormData(data);
            } else {
                toast.error("Remitter not found");
            }
        } catch (error) {
            toast.error("Failed to fetch remitter");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) void fetchRemitter();
    }, [id]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(ENDPOINTS.REMITTERS.DETAIL(id), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                toast.success("Remitter updated successfully");
                void fetchRemitter();
            } else {
                toast.error("Failed to update remitter");
            }
        } catch (error) {
            toast.error("Network error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this remitter profile?")) return;
        try {
            const res = await fetch(ENDPOINTS.REMITTERS.DETAIL(id), { method: 'DELETE' });
            if (res.ok) {
                toast.success("Remitter deleted");
                router.push('/remitters');
            } else {
                toast.error("Failed to delete");
            }
        } catch (error) {
            toast.error("Network error");
        }
    };

    const handleVeriff = async (action: 'start' | 'sync') => {
        setVeriffLoading(true);
        try {
            const endpoint = action === 'start' 
                ? ENDPOINTS.REMITTERS.VERIFF_START(id) 
                : ENDPOINTS.REMITTERS.VERIFF_SYNC(id);
            const res = await fetch(endpoint, { method: 'POST' });
            const data = await res.json().catch(() => ({}));
            
            if (res.ok) {
                if (action === 'start' && data.session_url) {
                    window.open(data.session_url, '_blank', 'noreferrer');
                }
                toast.success(action === 'start' ? "Verification session started" : "Status synchronized");
                void fetchRemitter();
            } else {
                toast.error(data.message || "Verification action failed");
            }
        } catch (error) {
            toast.error("Compliance server error");
        } finally {
            setVeriffLoading(false);
        }
    };

    if (loading) return <div className="p-12 text-center animate-pulse">Loading profile...</div>;
    if (!formData) return <div className="p-12 text-center">Remitter profile not found.</div>;

    const vState = (formData.verification_state || 'not_started').toLowerCase();
    const getVBadge = () => {
        switch(vState) {
            case 'verified': return <Badge className="bg-emerald-500">Verified</Badge>;
            case 'pending': return <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">Pending</Badge>;
            case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
            case 'expired': return <Badge variant="outline" className="text-red-600 border-red-600">Expired ID</Badge>;
            default: return <Badge variant="outline">Not Started</Badge>;
        }
    };

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                        <Link href="/remitters"><ArrowLeft size={16} /></Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{formData.sender_name || formData.name}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant={formData.status === 'active' ? 'default' : 'secondary'}>
                                {formData.status?.toUpperCase()}
                            </Badge>
                            <span className="text-sm text-muted-foreground font-mono">{formData.sender_id}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => void fetchRemitter()} disabled={veriffLoading} aria-label="Refresh remitter" title="Refresh remitter">
                        <RefreshCw className={veriffLoading ? 'animate-spin' : ''} size={14} />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleDelete}>
                        <Trash2 size={14} className="mr-2" /> Delete
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Profile Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Full Name / Business Name</Label>
                                    <Input 
                                        value={formData.sender_name || ''} 
                                        onChange={e => setFormData({...formData, sender_name: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Branch</Label>
                                    <Input 
                                        value={formData.branch || ''} 
                                        onChange={e => setFormData({...formData, branch: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Telephone</Label>
                                    <Input 
                                        value={formData.phone || ''} 
                                        onChange={e => setFormData({...formData, phone: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Date of Birth</Label>
                                    <Input 
                                        type="date"
                                        value={formData.dob || ''} 
                                        onChange={e => setFormData({...formData, dob: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Place of Birth</Label>
                                    <Input 
                                        value={formData.place_of_birth || ''} 
                                        onChange={e => setFormData({...formData, place_of_birth: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Occupation</Label>
                                    <Input 
                                        value={formData.occupation || ''} 
                                        onChange={e => setFormData({...formData, occupation: e.target.value})}
                                    />
                                </div>
                            </div>

                            <Separator />
                            
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Address 1</Label>
                                    <Input 
                                        value={formData.address_1 || ''} 
                                        onChange={e => setFormData({...formData, address_1: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>City</Label>
                                    <Input 
                                        value={formData.city || ''} 
                                        onChange={e => setFormData({...formData, city: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Postcode</Label>
                                    <Input 
                                        value={formData.postcode || ''} 
                                        onChange={e => setFormData({...formData, postcode: e.target.value})}
                                    />
                                </div>
                            </div>

                            <Separator />

                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label>ID Type</Label>
                                    <Input 
                                        value={formData.id_type || ''} 
                                        onChange={e => setFormData({...formData, id_type: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>ID Number</Label>
                                    <Input 
                                        value={formData.id_number || ''} 
                                        onChange={e => setFormData({...formData, id_number: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Expiry Date</Label>
                                    <Input 
                                        type="date"
                                        value={formData.id_expiry || ''} 
                                        onChange={e => setFormData({...formData, id_expiry: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t gap-2">
                                <Button type="submit" disabled={submitting}>
                                    <Save size={14} className="mr-2" />
                                    {submitting ? 'Saving...' : 'Update Profile'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center justify-between">
                                Compliance & Veriff
                                {getVBadge()}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Sanction Check:</span>
                                    <span className="font-bold">{formData.sanction_list_verified?.toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">ID Verified:</span>
                                    <span className="font-bold">{formData.id_verified?.toUpperCase()}</span>
                                </div>
                                {formData.veriff_decision && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">Decision:</span>
                                        <span className="font-bold text-primary">{formData.veriff_decision}</span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex flex-col gap-2">
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="w-full justify-start"
                                    onClick={() => handleVeriff('start')}
                                    disabled={veriffLoading || (vState === 'verified' && !formData.id_expired)}
                                >
                                    <Shield size={14} className="mr-2" /> Start Verification
                                </Button>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => handleVeriff('sync')}
                                    disabled={veriffLoading}
                                    aria-label="Sync compliance"
                                    title="Sync compliance"
                                >
                                    <RefreshCw size={14} className={veriffLoading ? 'animate-spin' : ''} />
                                </Button>
                                {formData.veriff_url && (
                                    <Button size="sm" variant="secondary" className="w-full justify-start" asChild>
                                        <a href={formData.veriff_url} target="_blank" rel="noreferrer">
                                            <ExternalLink size={14} className="mr-2" /> View Veriff Link
                                        </a>
                                    </Button>
                                )}
                            </div>
                            
                            {formData.id_expired && (
                                <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-2 text-destructive">
                                    <Info size={14} className="mt-0.5" />
                                    <p className="text-[10px] font-medium leading-tight">
                                        ID has expired. New transfers will be blocked until re-verification is completed.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm border-b pb-2">Internal Metadata</CardTitle>
                        </CardHeader>
                        <CardContent className="text-[11px] space-y-2 font-medium">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Created By:</span>
                                <span>{formData.created_by || 'System'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Date:</span>
                                <span>{formData.created_at ? new Date(formData.created_at).toLocaleString() : '-'}</span>
                            </div>
                            <Separator className="my-1" />
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Last Edited:</span>
                                <span>{formData.updated_by || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Modified:</span>
                                <span>{formData.updated_at ? new Date(formData.updated_at).toLocaleString() : '-'}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <History size={14} /> Audit Log
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                             <div className="p-4 text-center">
                                <Button variant="ghost" size="sm" className="text-[10px]" asChild>
                                    <Link href="/logs">View Global Audit Logs</Link>
                                </Button>
                             </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

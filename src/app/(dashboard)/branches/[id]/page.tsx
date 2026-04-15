'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { 
    ArrowLeft, 
    Building, 
    MapPin, 
    Phone, 
    Mail, 
    Printer, 
    Tag, 
    ArrowRightLeft, 
    Coins, 
    Store, 
    MessageSquare, 
    Save, 
    Trash2,
    RefreshCw,
    Info,
    History,
    Settings,
    Map
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

export default function BranchDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<any>(null);

    const fetchData = async () => {
        try {
            const res = await fetch(ENDPOINTS.BRANCHES.DETAIL(id));
            if (res.ok) setFormData(await res.json());
        } catch (e) {
            toast.error("Failed to load branch data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) void fetchData();
    }, [id]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(ENDPOINTS.BRANCHES.DETAIL(id), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                toast.success("Branch details updated");
            } else {
                toast.error("Update failed");
            }
        } catch (e) {
            toast.error("Network error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-12 text-center animate-pulse">Loading branch data...</div>;
    if (!formData) return <div className="p-12 text-center">Branch not found.</div>;

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                        <Link href="/branches"><ArrowLeft size={16} /></Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{formData.name}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant={formData.status === 'active' ? 'default' : 'secondary'}>
                                {formData.status?.toUpperCase()}
                            </Badge>
                            <span className="text-sm font-mono text-muted-foreground">{formData.code || formData.transaction_prefix}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => void fetchData()} aria-label="Refresh branch" title="Refresh branch">
                        <RefreshCw size={14} />
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={submitting}>
                        {submitting ? <RefreshCw size={14} className="mr-2 animate-spin" /> : <Save size={14} className="mr-2" />}
                        Update Branch
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Location & Contact</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                                <Label>Display Name</Label>
                                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Address</Label>
                                <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>Primary Phone</Label>
                                <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>Daily Limit (GBP)</Label>
                                <Input type="number" value={formData.day_transfer_limit} onChange={e => setFormData({...formData, day_transfer_limit: e.target.value})} />
                            </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-2">
                            <Label>Internal Remarks</Label>
                            <Textarea 
                                rows={3} 
                                value={formData.remarks || ''} 
                                onChange={e => setFormData({...formData, remarks: e.target.value})}
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Settings size={14} className="text-primary" /> Branch Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs">Transaction Prefix</Label>
                                <Input value={formData.transaction_prefix} readOnly className="bg-muted font-mono" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Default Mode</Label>
                                <Select value={formData.default_transaction_type} onValueChange={v => setFormData({...formData, default_transaction_type: v})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Sender">Sender Only</SelectItem>
                                        <SelectItem value="Receiver">Receiver Only</SelectItem>
                                        <SelectItem value="Both">Both Enabled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Ownership</Label>
                                <Select value={formData.branch_ownership_type} onValueChange={v => setFormData({...formData, branch_ownership_type: v})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Own">Own Branch</SelectItem>
                                        <SelectItem value="Agent">Agent Office</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Info size={14} /> Branch Audit
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-[11px] space-y-2">
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Internal ID:</span>
                                <span>{formData.id}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Created:</span>
                                <span>{formData.created_at ? new Date(formData.created_at).toLocaleDateString() : '-'}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Last Sync:</span>
                                <span>{new Date().toLocaleTimeString()}</span>
                            </div>
                            <Separator className="my-2" />
                            <div className="flex justify-center">
                                <Button variant="ghost" size="sm" className="text-[10px] h-7" asChild>
                                    <Link href="/logs">View Specific Branch Logs</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

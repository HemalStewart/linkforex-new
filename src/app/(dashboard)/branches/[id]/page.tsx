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
    const [countries, setCountries] = useState<any[]>([]);
    const [formData, setFormData] = useState<any>(null);

    const fetchData = async () => {
        try {
            const [branchRes, countriesRes] = await Promise.all([
                fetch(ENDPOINTS.BRANCHES.DETAIL(id)),
                fetch(ENDPOINTS.COUNTRIES.LIST),
            ]);

            if (branchRes.ok) {
                const data = await branchRes.json();
                setFormData({
                    ...data,
                    building_number: data.building_number || '',
                    address_line_1: data.address_line_1 || data.address || '',
                    city: data.city || '',
                    postcode: data.postcode || '',
                    country: data.country || '',
                    telephone_1: data.telephone_1 || data.phone || '',
                    telephone_2: data.telephone_2 || '',
                    fax_1: data.fax_1 || '',
                    fax_2: data.fax_2 || '',
                    email_1: data.email_1 || data.email || '',
                    email_2: data.email_2 || '',
                    transaction_prefix: data.transaction_prefix || data.code || '',
                    default_transaction_type: data.default_transaction_type || data.branch_default_transaction_type || '',
                    branch_ownership_type: data.branch_ownership_type || 'Own',
                    remarks: data.remarks || '',
                    status: data.status || 'active',
                });
            }

            if (countriesRes.ok) {
                setCountries(await countriesRes.json());
            }
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
                        <CardTitle className="text-lg">Branch Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                                <Label>Branch Name</Label>
                                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>Building Number</Label>
                                <Input value={formData.building_number} onChange={e => setFormData({...formData, building_number: e.target.value})} />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Address</Label>
                                <Input value={formData.address_line_1} onChange={e => setFormData({...formData, address_line_1: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>City</Label>
                                <Input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>Postcode</Label>
                                <Input value={formData.postcode} onChange={e => setFormData({...formData, postcode: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>Country</Label>
                                <Select value={formData.country} onValueChange={v => setFormData({...formData, country: v})}>
                                    <SelectTrigger><SelectValue placeholder="Select Country" /></SelectTrigger>
                                    <SelectContent>
                                        {countries.map(country => (
                                            <SelectItem key={country.id} value={country.name}>{country.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold">Contact Section</h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Primary Contact</Label>
                                    <Input value={formData.telephone_1} onChange={e => setFormData({...formData, telephone_1: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Secondary Contact</Label>
                                    <Input value={formData.telephone_2} onChange={e => setFormData({...formData, telephone_2: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Primary Fax</Label>
                                    <Input value={formData.fax_1} onChange={e => setFormData({...formData, fax_1: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Secondary Fax</Label>
                                    <Input value={formData.fax_2} onChange={e => setFormData({...formData, fax_2: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Primary Email</Label>
                                    <Input type="email" value={formData.email_1} onChange={e => setFormData({...formData, email_1: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Secondary Email</Label>
                                    <Input type="email" value={formData.email_2} onChange={e => setFormData({...formData, email_2: e.target.value})} />
                                </div>
                            </div>
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
                                <Input value={formData.transaction_prefix} onChange={e => setFormData({...formData, transaction_prefix: e.target.value.toUpperCase()})} className="font-mono uppercase" />
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
                                <Label className="text-xs">Daily Transfer Limit</Label>
                                <Input type="number" value={formData.day_transfer_limit || ''} onChange={e => setFormData({...formData, day_transfer_limit: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Branch Ownership Type</Label>
                                <Select value={formData.branch_ownership_type} onValueChange={v => setFormData({...formData, branch_ownership_type: v})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Own">Own Branch</SelectItem>
                                        <SelectItem value="Agent">Agent Office</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Status</Label>
                                <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Remarks</Label>
                                <Textarea rows={4} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} />
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

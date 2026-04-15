'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { 
    ArrowLeft, 
    User, 
    Building, 
    CreditCard, 
    Save, 
    Loader2, 
    ChevronRight, 
    Search, 
    MapPin, 
    Phone, 
    ShieldCheck, 
    Landmark,
    History,
    RefreshCw,
    Info,
    Settings
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

export default function ReceiverDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<any>(null);
    const [banks, setBanks] = useState<any[]>([]);
    const [countries, setCountries] = useState<any[]>([]);
    const [remitters, setRemitters] = useState<any[]>([]);
    const [relationships, setRelationships] = useState<any[]>([]);

    const eligibleBanks = useMemo(() => {
        if (!formData) return [];
        const isCashPickup = formData.payment_mode?.toLowerCase().includes('cash') || formData.payment_mode?.toLowerCase().includes('pickup');
        return banks.filter((bank) => {
            if (isCashPickup) return String(bank?.pickup_bank || '').toLowerCase() === 'yes' || Number(bank?.pickup_bank) === 1;
            return String(bank?.receiver_bank || '').toLowerCase() === 'yes' || Number(bank?.receiver_bank) === 1;
        });
    }, [banks, formData]);

    const fetchData = async () => {
        try {
            const [bRes, cRes, rRes, relRes, detRes] = await Promise.all([
                fetch(ENDPOINTS.BANKS.LIST),
                fetch(ENDPOINTS.COUNTRIES.LIST),
                fetch(ENDPOINTS.REMITTERS.LIST),
                fetch(ENDPOINTS.RELATIONSHIPS.LIST),
                fetch(ENDPOINTS.BENEFICIARIES.DETAIL(id))
            ]);
            const bankRows = bRes.ok ? await bRes.json() : [];
            if (bRes.ok) setBanks(bankRows);
            if (cRes.ok) setCountries(await cRes.json());
            if (rRes.ok) setRemitters(await rRes.json());
            if (relRes.ok) setRelationships(await relRes.json());
            if (detRes.ok) {
                const detail = await detRes.json();
                const matchingBank = (Array.isArray(bankRows) ? bankRows : [])
                    .find((bank: any) => String(bank?.name || '').trim().toLowerCase() === String(detail?.bank_name || '').trim().toLowerCase());
                setFormData({
                    ...detail,
                    bank_id: matchingBank ? String(matchingBank.id) : '',
                });
            }
        } catch (e) {
            toast.error("Failed to load receiver data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) void fetchData();
    }, [id]);

    useEffect(() => {
        if (!formData || !banks.length) return;
        if (String(formData.payment_mode || '').includes('Allied')) {
            const allied = banks.find((bank) => String(bank?.name || '').toLowerCase().includes('allied'));
            if (!allied) return;
            setFormData((prev: any) => ({
                ...prev,
                bank_id: String(allied.id),
                bank_name: allied.name,
            }));
        }
    }, [banks, formData?.payment_mode]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const selectedBank = banks.find((bank) => String(bank.id) === String(formData.bank_id || ''));
            const res = await fetch(ENDPOINTS.BENEFICIARIES.DETAIL(id), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    bank_name: formData.payment_mode?.includes('Allied') ? 'Allied Bank' : (selectedBank?.name || formData.bank_name),
                }),
            });
            if (res.ok) {
                toast.success("Receiver profile updated");
            } else {
                toast.error("Update failed");
            }
        } catch (e) {
            toast.error("Network error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-12 text-center animate-pulse">Loading receiver details...</div>;
    if (!formData) return <div className="p-12 text-center">Receiver record not found.</div>;

    const isCashPickup = formData.payment_mode?.toLowerCase().includes('cash') || formData.payment_mode?.toLowerCase().includes('pickup');

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                        <Link href="/receivers"><ArrowLeft size={16} /></Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{formData.name}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant={formData.status === 'active' ? 'default' : 'secondary'}>
                                {formData.status?.toUpperCase()}
                            </Badge>
                            <span className="text-sm text-muted-foreground">{formData.country}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => void fetchData()} aria-label="Refresh receiver" title="Refresh receiver">
                        <RefreshCw size={14} />
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={submitting}>
                        {submitting ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Save size={14} className="mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Receiver Profile</CardTitle>
                        <CardDescription>linked to {remitters.find(r => r.id === formData.customer_id)?.name || 'Remitter ID ' + formData.customer_id}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Full Legal Name</Label>
                                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>Mobile Number</Label>
                                <Input value={formData.mobile_number} onChange={e => setFormData({...formData, mobile_number: e.target.value})} />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Address</Label>
                                <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>City</Label>
                                <Input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>Country</Label>
                                <Select value={formData.country} onValueChange={v => setFormData({...formData, country: v})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {countries.map(c => (
                                            <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold flex items-center gap-2">
                                <Landmark size={14} className="text-primary" /> Banking Details
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Payment Mode</Label>
                                    <Select value={formData.payment_mode} onValueChange={v => setFormData({...formData, payment_mode: v})}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Direct deposit to Allied Bank">Direct deposit to Allied Bank</SelectItem>
                                            <SelectItem value="Direct deposit to another bank">Direct deposit to another bank</SelectItem>
                                            <SelectItem value="Cash over the counter or cash pickup">Cash Pickup</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Bank Name</Label>
                                    <Select
                                        value={String(formData.bank_id || '')}
                                        onValueChange={v => {
                                            const bank = banks.find((item) => String(item.id) === v);
                                            setFormData({...formData, bank_id: v, bank_name: bank?.name || ''});
                                        }}
                                        disabled={formData.payment_mode?.includes('Allied')}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Select Destination Bank" /></SelectTrigger>
                                        <SelectContent>
                                            {eligibleBanks.map(bank => (
                                                <SelectItem key={bank.id} value={String(bank.id)}>{bank.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Account / IBAN</Label>
                                    <Input value={formData.account_number} onChange={e => setFormData({...formData, account_number: e.target.value})} />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Settings size={14} className="text-primary" /> Associations
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs">Linked Remitter</Label>
                                <Select value={formData.customer_id?.toString()} onValueChange={v => setFormData({...formData, customer_id: v})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {remitters.map(r => (
                                            <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Relationship</Label>
                                <Select value={formData.relation} onValueChange={v => setFormData({...formData, relation: v})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {relationships.map(r => (
                                            <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                                        ))}
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
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <ShieldCheck size={14} className="text-primary" /> ID Details (Pickup)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-xs">
                             <div className="space-y-1">
                                <Label className="text-[10px]">ID Type</Label>
                                <Input className="h-9" value={formData.receiver_id_type || ''} onChange={e => setFormData({...formData, receiver_id_type: e.target.value})} />
                             </div>
                             <div className="space-y-1">
                                <Label className="text-[10px]">ID Number</Label>
                                <Input className="h-9" value={formData.receiver_id_number || ''} onChange={e => setFormData({...formData, receiver_id_number: e.target.value})} />
                             </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

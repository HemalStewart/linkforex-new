'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
    Plus
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
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

export default function CreateReceiverPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedCustomerId = searchParams.get('customer_id') || '';
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [remitters, setRemitters] = useState<any[]>([]);
    const [banks, setBanks] = useState<any[]>([]);
    const [countries, setCountries] = useState<any[]>([]);
    const [relationships, setRelationships] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        customer_id: preselectedCustomerId,
        name: '',
        country: 'United Kingdom',
        address: '',
        city: '',
        payment_mode: 'Direct deposit to Allied Bank',
        bank_id: '',
        bank_name: 'Allied Bank',
        account_number: '',
        iba: '',
        branch_name: '',
        branch_code: '',
        receiver_id_type: '',
        receiver_id_number: '',
        relation: 'Family',
        mobile_number: '',
        status: 'active'
    });

    const eligibleBanks = useMemo(() => {
        const isCashPickup = formData.payment_mode.toLowerCase().includes('cash') || formData.payment_mode.toLowerCase().includes('pickup');
        return banks.filter((bank) => {
            if (isCashPickup) return String(bank?.pickup_bank || '').toLowerCase() === 'yes' || Number(bank?.pickup_bank) === 1;
            return String(bank?.receiver_bank || '').toLowerCase() === 'yes' || Number(bank?.receiver_bank) === 1;
        });
    }, [banks, formData.payment_mode]);

    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const [rRes, bRes, cRes, relRes] = await Promise.all([
                    fetch(ENDPOINTS.REMITTERS.LIST),
                    fetch(ENDPOINTS.BANKS.LIST),
                    fetch(ENDPOINTS.COUNTRIES.LIST),
                    fetch(ENDPOINTS.RELATIONSHIPS.LIST)
                ]);
                if (rRes.ok) setRemitters(await rRes.json());
                if (bRes.ok) setBanks(await bRes.json());
                if (cRes.ok) setCountries(await cRes.json());
                if (relRes.ok) setRelationships(await relRes.json());
            } catch (e) {
                toast.error("Failed to load reference data");
            } finally {
                setLoading(false);
            }
        };
        void fetchInitial();
    }, []);

    useEffect(() => {
        if (!banks.length) return;
        if (formData.payment_mode.includes('Allied')) {
            const allied = banks.find((bank) => String(bank?.name || '').toLowerCase().includes('allied'));
            setFormData((prev) => ({
                ...prev,
                bank_id: allied ? String(allied.id) : prev.bank_id,
                bank_name: allied?.name || 'Allied Bank',
            }));
        }
    }, [banks, formData.payment_mode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const selectedBank = banks.find((bank) => String(bank.id) === formData.bank_id);
            const res = await fetch(ENDPOINTS.BENEFICIARIES.LIST, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    bank_name: formData.payment_mode.includes('Allied') ? 'Allied Bank' : (selectedBank?.name || formData.bank_name),
                }),
            });
            if (res.ok) {
                toast.success("Receiver added successfully");
                router.push('/receivers');
            } else {
                toast.error("Failed to add receiver");
            }
        } catch (e) {
            toast.error("Network error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-12 text-center animate-pulse">Loading creation form...</div>;

    const isCashPickup = formData.payment_mode.toLowerCase().includes('cash') || formData.payment_mode.toLowerCase().includes('pickup');

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Add New Receiver</h1>
                    <p className="text-muted-foreground">Register a beneficiary for a specific remitter.</p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/receivers"><ArrowLeft size={16} className="mr-2" /> Back</Link>
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-md flex items-center gap-2">
                            <User size={16} className="text-primary" /> Core Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2 md:col-span-2">
                            <Label>Linked Remitter</Label>
                            <Select 
                                value={formData.customer_id} 
                                onValueChange={v => setFormData({...formData, customer_id: v})}
                            >
                                <SelectTrigger><SelectValue placeholder="Select a Remitter" /></SelectTrigger>
                                <SelectContent>
                                    {remitters.map(r => (
                                        <SelectItem key={r.id} value={r.id.toString()}>
                                            {r.name} ({r.sender_id})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 lg:col-span-2">
                            <Label>Receiver Legal Name</Label>
                            <Input 
                                required 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                placeholder="Full name as on ID"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Relationship</Label>
                            <Select 
                                value={formData.relation} 
                                onValueChange={v => setFormData({...formData, relation: v})}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {relationships.map(r => (
                                        <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                                    ))}
                                    {relationships.length === 0 && (
                                        <>
                                            <SelectItem value="Family">Family</SelectItem>
                                            <SelectItem value="Friend">Friend</SelectItem>
                                            <SelectItem value="Business">Business</SelectItem>
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Landmark size={16} className="text-primary" /> Payout & Banking
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Payment Mode</Label>
                                <Select 
                                    value={formData.payment_mode} 
                                    onValueChange={v => setFormData({...formData, payment_mode: v})}
                                >
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
                                    value={formData.bank_id} 
                                    onValueChange={v => {
                                        const bank = banks.find((item) => String(item.id) === v);
                                        setFormData({...formData, bank_id: v, bank_name: bank?.name || ''});
                                    }}
                                    disabled={formData.payment_mode.includes('Allied')}
                                >
                                    <SelectTrigger><SelectValue placeholder="Select Destination Bank" /></SelectTrigger>
                                    <SelectContent>
                                        {eligibleBanks.map(b => (
                                            <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Account / IBAN</Label>
                                <Input 
                                    required={!isCashPickup}
                                    value={formData.account_number} 
                                    onChange={e => setFormData({...formData, account_number: e.target.value})}
                                    placeholder={isCashPickup ? "Optional for pickup" : "Enter account number"}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <MapPin size={16} className="text-primary" /> Location & Contact
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs">Country</Label>
                                    <Select value={formData.country} onValueChange={v => setFormData({...formData, country: v})}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {countries.map(c => (
                                                <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">City</Label>
                                    <Input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <Label className="text-xs">Physical Address</Label>
                                    <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <Label className="text-xs">Mobile Number</Label>
                                    <Input value={formData.mobile_number} onChange={e => setFormData({...formData, mobile_number: e.target.value})} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="ghost" type="button" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" disabled={saving}>
                        {saving ? <><Loader2 size={14} className="mr-2 animate-spin" /> Saving...</> : <><Save size={14} className="mr-2" /> Save Receiver</>}
                    </Button>
                </div>
            </form>
        </div>
    );
}

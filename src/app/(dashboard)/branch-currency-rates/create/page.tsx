'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
    ArrowLeft, 
    Landmark, 
    Coins, 
    BadgePoundSterling, 
    Save, 
    Loader2,
    CheckCircle2,
    AlertTriangle
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
  CardFooter,
} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

export default function CreateBranchCurrencyRatePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [branches, setBranches] = useState<any[]>([]);
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [existingRows, setExistingRows] = useState<any[]>([]);
    
    const [formData, setFormData] = useState({
        branchId: '',
        currencyCode: '',
        customerRate: '',
        setAllBranches: false
    });

    useEffect(() => {
        const fetchSetup = async () => {
            try {
                const [bRes, cRes, eRes] = await Promise.all([
                    fetch(`${ENDPOINTS.BRANCHES.LIST}?status=active`),
                    fetch(`${ENDPOINTS.COUNTRIES.LIST}?status=active&payout_currency=yes`),
                    fetch(ENDPOINTS.BRANCH_CURRENCY_RATES.LIST)
                ]);
                if (bRes.ok) setBranches(await bRes.json());
                if (cRes.ok) setCurrencies(await cRes.json());
                if (eRes.ok) setExistingRows(await eRes.json());
            } catch (e) {
                toast.error("Failed to load setup data");
            } finally {
                setLoading(false);
            }
        };
        void fetchSetup();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const targetBranches = formData.setAllBranches 
                ? branches.filter(b => b.is_sender_branch || b.sender_enabled === 'yes') 
                : [branches.find(b => String(b.id) === formData.branchId)];

            if (targetBranches.length === 0 || !targetBranches[0]) {
                toast.error("No valid branches selected");
                setSaving(false);
                return;
            }

            for (const branch of targetBranches) {
                const payload = {
                    branch_code: branch.code || branch.transaction_prefix,
                    branch_name: branch.name,
                    currency_code: formData.currencyCode,
                    customer_rate: Number(formData.customerRate),
                    active: 'yes'
                };
                
                const res = await fetch(ENDPOINTS.BRANCH_CURRENCY_RATES.LIST, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    const created = await res.json();
                    // Deactivate duplicates (Parity with legacy logic)
                    const duplicates = existingRows.filter(r => 
                        r.branch_code === payload.branch_code && 
                        r.currency_code === payload.currency_code && 
                        r.id !== created.id && 
                        r.active === 'yes'
                    );
                    for (const dup of duplicates) {
                        await fetch(ENDPOINTS.BRANCH_CURRENCY_RATES.DETAIL(dup.id), {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ active: 'no' })
                        });
                    }
                }
            }
            toast.success("Branch rates updated successfully");
            router.push('/branch-currency-rates');
        } catch (e) {
            toast.error("An error occurred during mass update");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-12 text-center animate-pulse">Loading setup...</div>;

    const senderBranches = branches.filter(b => b.is_sender_branch || b.sender_enabled === 'yes' || b.default_transaction_type === 'sender');

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Add Cash Rate</h1>
                    <p className="text-muted-foreground">Define new payout rates for customer cash transactions.</p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/branch-currency-rates"><ArrowLeft size={16} className="mr-2" /> Back</Link>
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
                <Card className="border-primary/20 shadow-lg">
                    <CardHeader className="bg-primary/5">
                        <CardTitle className="text-md flex items-center gap-2">
                            <Coins size={18} className="text-primary" /> Rate Configuration
                        </CardTitle>
                        <CardDescription>Updates are applied instantly to the selected scope.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-bold">Apply to all branches</Label>
                                <p className="text-[11px] text-muted-foreground">Global update for all sender-enabled branches.</p>
                            </div>
                            <Switch 
                                checked={formData.setAllBranches} 
                                onCheckedChange={v => setFormData({...formData, setAllBranches: v, branchId: v ? '' : formData.branchId})} 
                            />
                        </div>

                        {!formData.setAllBranches && (
                            <div className="space-y-2">
                                <Label className="text-xs">Specific Branch</Label>
                                <Select value={formData.branchId} onValueChange={v => setFormData({...formData, branchId: v})}>
                                    <SelectTrigger><SelectValue placeholder="Select target branch" /></SelectTrigger>
                                    <SelectContent>
                                        {senderBranches.map(b => (
                                            <SelectItem key={`branch-${b.id}`} value={String(b.id)}>{b.name} ({b.code || b.transaction_prefix})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-xs">Currency</Label>
                                <Select value={formData.currencyCode} onValueChange={v => setFormData({...formData, currencyCode: v})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {currencies.map(c => (
                                            <SelectItem key={`currency-${c.id}`} value={c.currency_code}>{c.currency_code} - {c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Customer Rate (per £1)</Label>
                                <div className="relative">
                                    <BadgePoundSterling size={14} className="absolute left-3 top-3 text-muted-foreground" />
                                    <Input 
                                        type="number" 
                                        step="0.0001" 
                                        className="pl-9"
                                        placeholder="0.0000"
                                        value={formData.customerRate}
                                        onChange={e => setFormData({...formData, customerRate: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 flex gap-3 text-xs font-medium">
                            <AlertTriangle size={16} className="shrink-0" />
                            <p>Saving this rate will automatically deactivate all existing active rates for the same branch and currency combination.</p>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-muted/10 border-t justify-end gap-3">
                        <Button variant="ghost" type="button" onClick={() => router.back()}>Cancel</Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? <><Loader2 size={14} className="mr-2 animate-spin" /> Applying...</> : <><Save size={14} className="mr-2" /> Save Rate</>}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}

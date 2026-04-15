'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
    ArrowLeft, 
    Search, 
    Plus, 
    Calendar, 
    Landmark, 
    Coins, 
    User, 
    Phone, 
    MapPin, 
    Building2, 
    Wallet, 
    Save, 
    Copy,
    RefreshCw,
    ShieldCheck,
    AlertCircle,
    Info,
    ChevronRight,
    Users,
    PoundSterling
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
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

export default function CreateTransferPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Data Sources
    const [branches, setBranches] = useState<any[]>([]);
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [countries, setCountries] = useState<any[]>([]);
    const [relationships, setRelationships] = useState<string[]>(['Family', 'Friend', 'Business']);
    
    // Search States
    const [senderSearch, setSenderSearch] = useState('');
    const [senderResults, setSenderResults] = useState<any[]>([]);
    const [selectedSender, setSelectedSender] = useState<any>(null);
    const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
    const [selectedBeneficiary, setSelectedBeneficiary] = useState<any>(null);

    const branchOptions = useMemo(
        () =>
            branches.map((branch) => ({
                value: String(branch.id),
                label: branch.code ? `${branch.name} (${branch.code})` : branch.name,
            })),
        [branches]
    );

    const currencyOptions = useMemo(() => {
        const seen = new Set<string>();
        return currencies.filter((currency) => {
            const code = String(currency?.code || '').trim().toUpperCase();
            if (!code || seen.has(code)) return false;
            seen.add(code);
            return true;
        });
    }, [currencies]);

    // Form State
    const [formData, setFormData] = useState({
        to_branch: '',
        payout_currency: 'AFN',
        customer_rate: '1',
        receive_amount: '0',
        dest_amount: '0',
        payment_mode: 'P - CASH PICKUP',
        source_of_funds: 'Salary',
        purpose: 'Family Maintenance',
        relationship: 'Family',
        remarks: ''
    });

    useEffect(() => {
        const fetchBaseData = async () => {
            try {
                const [bRes, cRes, coRes] = await Promise.all([
                    fetch(ENDPOINTS.BRANCHES.LIST),
                    fetch(ENDPOINTS.CURRENCIES.LIST),
                    fetch(ENDPOINTS.COUNTRIES.LIST)
                ]);
                if (bRes.ok) setBranches(await bRes.json());
                if (cRes.ok) setCurrencies(await cRes.json());
                if (coRes.ok) setCountries(await coRes.json());
            } catch (e) {
                toast.error("Failed to load reference data");
            } finally {
                setLoading(false);
            }
        };
        void fetchBaseData();
    }, []);

    // Sender Search Logic
    useEffect(() => {
        if (senderSearch.length < 2) return;
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`${ENDPOINTS.REMITTERS.LIST}?search=${encodeURIComponent(senderSearch)}`);
                if (res.ok) setSenderResults(await res.json());
            } catch (e) {}
        }, 300);
        return () => clearTimeout(timer);
    }, [senderSearch]);

    const handleSelectSender = async (remitter: any) => {
        setSelectedSender(remitter);
        setSenderSearch('');
        setSenderResults([]);
        
        // Load beneficiaries for this sender
        try {
            const res = await fetch(`${ENDPOINTS.BENEFICIARIES.LIST}?customer_id=${remitter.id}`);
            if (res.ok) setBeneficiaries(await res.json());
        } catch (e) {
            toast.error("Failed to load beneficiaries");
        }
    };

    // Amount Calculation Logic
    const calculateRecipientAmount = (source: string, rate: string) => {
        const s = parseFloat(source) || 0;
        const r = parseFloat(rate) || 1;
        setFormData(prev => ({ ...prev, receive_amount: source, dest_amount: (s * r).toFixed(2) }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSender || !selectedBeneficiary) {
            toast.error("Please select both sender and receiver");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                ...formData,
                remitter_id: selectedSender.id,
                beneficiary_id: selectedBeneficiary.id,
                branch_id: formData.to_branch,
                status: 'pending'
            };
            const res = await fetch(ENDPOINTS.TRANSFERS.LIST, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const result = await res.json();
                toast.success("Transfer created successfully");
                router.push(`/transfers/${result.id}`);
            } else {
                toast.error("Failed to create transfer");
            }
        } catch (e) {
            toast.error("Network error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-12 text-center animate-pulse">Loading creation form...</div>;

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Transfer</h1>
                    <p className="text-muted-foreground">Initiate a new money transfer transaction.</p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/transfers"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link>
                </Button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Financial Information */}
                    <Card className="shadow-sm border-primary/10">
                        <CardHeader className="bg-primary/5">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <PoundSterling className="h-4 w-4 text-primary" /> Financials & Payout
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Payout Branch</Label>
                                    <Select 
                                        value={formData.to_branch} 
                                        onValueChange={v => setFormData({...formData, to_branch: v})}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Select Branch" /></SelectTrigger>
                                        <SelectContent>
                                            {branchOptions.map((branch) => (
                                                <SelectItem key={branch.value} value={branch.value}>{branch.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Payout Currency</Label>
                                    <Select 
                                        value={formData.payout_currency} 
                                        onValueChange={v => setFormData({...formData, payout_currency: v})}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {currencyOptions.map((currency) => (
                                                <SelectItem key={String(currency.id)} value={String(currency.code).toUpperCase()}>
                                                    {String(currency.code).toUpperCase()}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Rate</Label>
                                    <Input 
                                        type="number" 
                                        step="any"
                                        value={formData.customer_rate}
                                        onChange={e => {
                                            const r = e.target.value;
                                            setFormData(p => ({...p, customer_rate: r}));
                                            calculateRecipientAmount(formData.receive_amount, r);
                                        }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Sending Amount (GBP)</Label>
                                    <Input 
                                        type="number" 
                                        value={formData.receive_amount}
                                        onChange={e => calculateRecipientAmount(e.target.value, formData.customer_rate)}
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Recipient Receives</Label>
                                    <div className="relative">
                                        <Input 
                                            readOnly 
                                            value={formData.dest_amount} 
                                            className="bg-muted font-bold text-lg text-primary"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-sm">
                                            {formData.payout_currency}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sender Selection */}
                    <Card className="shadow-sm border-primary/10">
                        <CardHeader className="bg-primary/5">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <User className="h-4 w-4 text-primary" /> Sender Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            {selectedSender ? (
                                <div className="rounded-lg border p-4 bg-muted/30 relative">
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="absolute top-2 right-2 h-6 w-6 p-0"
                                        onClick={() => { setSelectedSender(null); setBeneficiaries([]); setSelectedBeneficiary(null); }}
                                    >
                                        <XCircle size={14} />
                                    </Button>
                                    <div className="font-bold">{selectedSender.sender_name}</div>
                                    <div className="text-xs text-muted-foreground font-mono">{selectedSender.sender_id}</div>
                                    <div className="mt-2 text-xs flex gap-4">
                                        <span className="flex items-center gap-1"><Phone size={10} /> {selectedSender.phone}</span>
                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${selectedSender.kyc_status === 'verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {selectedSender.kyc_status}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            placeholder="Search by name, ID or phone..." 
                                            className="pl-9"
                                            value={senderSearch}
                                            onChange={e => setSenderSearch(e.target.value)}
                                        />
                                    </div>
                                    {senderResults.length > 0 && (
                                        <div className="border rounded-lg max-h-[200px] overflow-auto divide-y shadow-md bg-white">
                                            {senderResults.map(r => (
                                                <div 
                                                    key={r.id} 
                                                    className="p-3 hover:bg-muted cursor-pointer transition-colors"
                                                    onClick={() => handleSelectSender(r)}
                                                >
                                                    <div className="text-sm font-bold">{r.sender_name}</div>
                                                    <div className="text-[10px] text-muted-foreground">{r.sender_id} • {r.phone}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <Button variant="outline" className="w-full text-xs h-8" asChild>
                                        <Link href="/remitters/create"><Plus size={14} className="mr-2" /> Register New Sender</Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Receiver Selection */}
                    <Card className="shadow-sm border-primary/10">
                        <CardHeader className="bg-primary/5">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Users className="h-4 w-4 text-primary" /> Receiver Selection
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            {!selectedSender ? (
                                <div className="h-24 flex items-center justify-center border border-dashed rounded-lg text-muted-foreground text-xs">
                                    Select a sender first to view beneficiaries
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <Select 
                                        value={selectedBeneficiary?.id?.toString()} 
                                        onValueChange={v => setSelectedBeneficiary(beneficiaries.find(b => b.id.toString() === v))}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Select Beneficiary" /></SelectTrigger>
                                        <SelectContent>
                                            {beneficiaries.map(b => (
                                                <SelectItem key={b.id} value={b.id.toString()}>
                                                    {b.name} ({b.bank_name || 'Cash'})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    
                                    {selectedBeneficiary && (
                                        <div className="rounded-lg border p-4 bg-primary/5 text-xs space-y-2">
                                            <div className="font-bold flex justify-between">
                                                <span>{selectedBeneficiary.name}</span>
                                                <span className="text-muted-foreground uppercase">{selectedBeneficiary.mobile_number}</span>
                                            </div>
                                            <div className="text-muted-foreground">
                                                {selectedBeneficiary.bank_name} • {selectedBeneficiary.account_number || 'Cash Pickup'}
                                            </div>
                                            <div className="text-muted-foreground">
                                                {selectedBeneficiary.country}, {selectedBeneficiary.city}
                                            </div>
                                        </div>
                                    )}

                                    <Button variant="outline" className="w-full text-xs h-8" asChild>
                                        <Link href={`/receivers/create?remitter_id=${selectedSender.id}`}><Plus size={14} className="mr-2" /> Add New Receiver</Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Additional Metadata */}
                    <Card className="shadow-sm border-primary/10">
                        <CardHeader className="bg-primary/5">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Info className="h-4 w-4 text-primary" /> Compliance Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Source of Funds</Label>
                                    <Select 
                                        value={formData.source_of_funds} 
                                        onValueChange={v => setFormData({...formData, source_of_funds: v})}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Salary">Salary / Savings</SelectItem>
                                            <SelectItem value="Business">Business Earnings</SelectItem>
                                            <SelectItem value="Gift">Gift / Inheritance</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Purpose</Label>
                                    <Select 
                                        value={formData.purpose} 
                                        onValueChange={v => setFormData({...formData, purpose: v})}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Family Maintenance">Family Maintenance</SelectItem>
                                            <SelectItem value="Savings">Savings</SelectItem>
                                            <SelectItem value="Investment">Investment</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Internal Remarks</Label>
                                    <Input 
                                        placeholder="Add notes for compliance..." 
                                        value={formData.remarks}
                                        onChange={e => setFormData({...formData, remarks: e.target.value})}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="ghost" type="button" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" size="lg" disabled={saving}>
                        {saving ? (
                            <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                        ) : (
                            <><Save className="mr-2 h-4 w-4" /> Finalize Transfer</>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}

function XCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  )
}

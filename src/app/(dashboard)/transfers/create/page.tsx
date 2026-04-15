'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    ArrowLeft, 
    Search, 
    Plus, 
    User, 
    Phone, 
    Save, 
    Copy,
    RefreshCw,
    Info,
    Users,
    PoundSterling
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

const generateCode = (prefix: string): string => `${prefix}${Math.floor(10000 + Math.random() * 90000)}`;

export default function CreateTransferPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Data Sources
    const [branches, setBranches] = useState<any[]>([]);
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [countries, setCountries] = useState<any[]>([]);
    const [branchRates, setBranchRates] = useState<any[]>([]);
    const [countryCurrencyMap, setCountryCurrencyMap] = useState<Record<string, string>>({});
    const [relationships, setRelationships] = useState<string[]>(['Family']);
    const [purposes, setPurposes] = useState<string[]>(['Family Maintenance/Savings']);
    
    // Search States
    const [senderSearch, setSenderSearch] = useState('');
    const [senderResults, setSenderResults] = useState<any[]>([]);
    const [selectedSender, setSelectedSender] = useState<any>(null);
    const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
    const [selectedBeneficiary, setSelectedBeneficiary] = useState<any>(null);
    const [selectedBranchRate, setSelectedBranchRate] = useState('');

    const branchOptions = useMemo(() => {
        const seen = new Set<string>();

        return branches.reduce<Array<{ value: string; label: string }>>((items, branch) => {
            const id = String(branch?.id ?? '').trim();
            if (!id || seen.has(id)) return items;

            seen.add(id);
            items.push({
                value: id,
                label: branch.code ? `${branch.name} (${branch.code})` : branch.name,
            });

            return items;
        }, []);
    }, [branches]);

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
        invoice_no: generateCode('LFX'),
        payout_currency: '',
        customer_rate: '',
        receive_amount: '',
        dest_amount: '',
        transaction_id: generateCode('LFX'),
        other_transaction_id: '',
        payment_mode: 'P - CASH PICKUP',
        source_of_funds: 'Salary',
        purpose: 'Family Maintenance/Savings',
        relationship: 'Family',
        remarks: ''
    });

    const selectedBranch = useMemo(
        () => branches.find((branch) => String(branch.id) === formData.to_branch) || null,
        [branches, formData.to_branch]
    );

    useEffect(() => {
        const fetchBaseData = async () => {
            try {
                const [bRes, coRes, relRes, purposeRes, rateRes] = await Promise.all([
                    fetch(`${ENDPOINTS.BRANCHES.LIST}?status=active`),
                    fetch(`${ENDPOINTS.COUNTRIES.LIST}?status=active&payout_currency=yes&sort=name&dir=asc`),
                    fetch(`${ENDPOINTS.RELATIONSHIPS.LIST}?status=active`),
                    fetch(`${ENDPOINTS.PURPOSES.LIST}?status=active`),
                    fetch(ENDPOINTS.BRANCH_CURRENCY_RATES.LIST)
                ]);

                let branchData: any[] = [];
                if (bRes.ok) {
                    branchData = await bRes.json();
                    setBranches(Array.isArray(branchData) ? branchData : []);
                }

                if (coRes.ok) {
                    const countryData = await coRes.json();
                    const normalizedCountries = Array.isArray(countryData) ? countryData : [];
                    setCountries(normalizedCountries);

                    const seenCurrencies = new Map<string, { code: string; name: string; symbol: string }>();
                    const nextCountryCurrencyMap = normalizedCountries.reduce<Record<string, string>>((acc, country) => {
                        const countryName = String(country?.name || '').trim();
                        const currencyCode = String(country?.currency_code || '').trim().toUpperCase();
                        if (countryName && currencyCode) {
                            acc[countryName.toLowerCase()] = currencyCode;
                        }
                        if (
                            String(country?.payout_currency || '').trim().toLowerCase() === 'yes' &&
                            currencyCode &&
                            !seenCurrencies.has(currencyCode)
                        ) {
                            seenCurrencies.set(currencyCode, {
                                code: currencyCode,
                                name: String(country?.currency_name || '').trim() || currencyCode,
                                symbol: String(country?.currency_symbol || '').trim(),
                            });
                        }
                        return acc;
                    }, {});

                    setCountryCurrencyMap(nextCountryCurrencyMap);
                    setCurrencies(Array.from(seenCurrencies.values()));

                    setFormData((prev) => ({
                        ...prev,
                        payout_currency:
                            prev.payout_currency ||
                            (seenCurrencies.has('AFN') ? 'AFN' : Array.from(seenCurrencies.keys())[0] || ''),
                    }));
                }

                if (relRes.ok) {
                    const relationshipData = await relRes.json();
                    const names = (Array.isArray(relationshipData) ? relationshipData : [])
                        .filter((row) => String(row?.active || '').toLowerCase() !== 'no')
                        .map((row) => String(row?.name || '').trim())
                        .filter(Boolean);
                    if (names.length) {
                        setRelationships(names);
                        setFormData((prev) => ({ ...prev, relationship: names.includes(prev.relationship) ? prev.relationship : names[0] }));
                    }
                }

                if (purposeRes.ok) {
                    const purposeData = await purposeRes.json();
                    const names = (Array.isArray(purposeData) ? purposeData : [])
                        .filter((row) => String(row?.active || '').toLowerCase() !== 'no')
                        .map((row) => String(row?.name || '').trim())
                        .filter(Boolean);
                    if (names.length) {
                        setPurposes(names);
                        setFormData((prev) => ({ ...prev, purpose: names.includes(prev.purpose) ? prev.purpose : names[0] }));
                    }
                }

                if (rateRes.ok) {
                    const rateData = await rateRes.json();
                    setBranchRates(Array.isArray(rateData) ? rateData : []);
                }

                if (branchData.length) {
                    setFormData((prev) => ({
                        ...prev,
                        to_branch: prev.to_branch || String(branchData[0].id),
                    }));
                }
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
        setSelectedBeneficiary(null);
        
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
        const r = parseFloat(rate) || 0;
        setFormData(prev => ({
            ...prev,
            receive_amount: source,
            dest_amount: source === '' ? '' : (s * r).toFixed(2)
        }));
    };

    useEffect(() => {
        if (!selectedBranch || !formData.payout_currency) return;

        const branchCode = String(selectedBranch.code || selectedBranch.transaction_prefix || selectedBranch.id);
        const matchingRows = branchRates.filter((row) => {
            const rowBranchCode = String(row?.branch_code || '').trim();
            const rowCurrency = String(row?.currency_code || '').trim().toUpperCase();
            return rowBranchCode === branchCode && rowCurrency === formData.payout_currency;
        });

        const sortByLatest = (a: any, b: any) =>
            new Date(b.updated_at || b.created_at || 0).getTime() -
            new Date(a.updated_at || a.created_at || 0).getTime();

        const activeRow = matchingRows
            .filter((row) => String(row?.active || '').trim().toLowerCase() === 'yes')
            .sort(sortByLatest)[0];

        const fallbackRow = [...matchingRows].sort(sortByLatest)[0];
        const selectedRateRow = activeRow || fallbackRow;

        if (!selectedRateRow) {
            setSelectedBranchRate('');
            setFormData((prev) => ({
                ...prev,
                customer_rate: prev.customer_rate || '',
                dest_amount: prev.receive_amount && prev.customer_rate
                    ? (Number(prev.receive_amount || 0) * Number(prev.customer_rate || 0)).toFixed(2)
                    : prev.dest_amount,
            }));
            return;
        }

        const rateValue = Number(selectedRateRow.customer_rate || 0).toFixed(2);
        setSelectedBranchRate(String(selectedRateRow.branch_rate || ''));
        setFormData((prev) => ({
            ...prev,
            customer_rate: rateValue,
            dest_amount: prev.receive_amount ? (Number(prev.receive_amount || 0) * Number(rateValue)).toFixed(2) : '',
        }));
    }, [selectedBranch, formData.payout_currency, branchRates]);

    useEffect(() => {
        if (!selectedBeneficiary) return;

        const payoutCurrency = countryCurrencyMap[String(selectedBeneficiary.country || '').trim().toLowerCase()];
        const paymentMode =
            String(selectedBeneficiary.payment_mode || '').trim() ||
            ((selectedBeneficiary.bank_name || selectedBeneficiary.account_number) ? 'D - BANK TRANSFER' : 'P - CASH PICKUP');

        setFormData((prev) => ({
            ...prev,
            payout_currency: payoutCurrency || prev.payout_currency,
            relationship: selectedBeneficiary.relation || prev.relationship,
            payment_mode: paymentMode,
        }));
    }, [selectedBeneficiary, countryCurrencyMap]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSender || !selectedBeneficiary) {
            toast.error("Please select both sender and receiver");
            return;
        }
        if (!selectedBranch || !formData.customer_rate || !formData.receive_amount || !formData.dest_amount) {
            toast.error("Please complete branch, rate, and amount details");
            return;
        }

        setSaving(true);
        try {
            const branchCode = String(selectedBranch.code || selectedBranch.transaction_prefix || selectedBranch.id);
            const payload = {
                remitter_id: selectedSender.id,
                code: formData.invoice_no,
                beneficiary_id: selectedBeneficiary.id,
                branch_id: branchCode,
                source_amount: Number(formData.receive_amount || 0),
                dest_amount: Number(formData.dest_amount || 0),
                rate: Number(formData.customer_rate || 0),
                payment_mode: formData.payment_mode.startsWith('P') ? 'P' : 'D',
                source_of_funds: formData.source_of_funds,
                purpose: formData.purpose,
                status: 'pending',
                type: 'branch',
                collection_method: formData.payment_mode.startsWith('P') ? 'cash' : 'bank_transfer',
                transfer_meta: {
                    transaction_id: formData.transaction_id,
                    other_transaction_id: formData.other_transaction_id,
                    branch_name: selectedBranch.name || '',
                    relationship: formData.relationship,
                    payout_currency: formData.payout_currency,
                    customer_rate_for_gbp: formData.customer_rate,
                    branch_rate_for_gbp: selectedBranchRate,
                    receiver_name: selectedBeneficiary.name || '',
                    receiver_country: selectedBeneficiary.country || '',
                    receiver_city: selectedBeneficiary.city || '',
                    receiver_bank: selectedBeneficiary.bank_name || '',
                    receiver_account_no: selectedBeneficiary.account_number || '',
                    receiver_payment_mode: formData.payment_mode,
                    remarks: formData.remarks,
                },
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
                const message = await res.text();
                toast.error(message || "Failed to create transfer");
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
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        type="button"
                        onClick={() =>
                            setFormData((prev) => ({
                                ...prev,
                                invoice_no: generateCode(selectedBranch?.code || 'LFX'),
                                transaction_id: generateCode(selectedBranch?.code || 'LFX'),
                                other_transaction_id: '',
                            }))
                        }
                    >
                        <RefreshCw className="mr-2 h-4 w-4" /> Regenerate IDs
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/transfers"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link>
                    </Button>
                </div>
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
                                    <Label>Invoice No</Label>
                                    <div className="relative">
                                        <Input value={formData.invoice_no} onChange={e => setFormData({...formData, invoice_no: e.target.value.toUpperCase()})} className="pr-10" />
                                        <Copy className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Payout Branch</Label>
                                    <Select 
                                        value={formData.to_branch} 
                                        onValueChange={v => setFormData({...formData, to_branch: v})}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Select Branch" /></SelectTrigger>
                                        <SelectContent>
                                            {branchOptions.map((branch) => (
                                                <SelectItem key={`branch-${branch.value}`} value={branch.value}>{branch.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Transaction ID</Label>
                                    <Input value={formData.transaction_id} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <Label>Other Transaction ID</Label>
                                    <Input value={formData.other_transaction_id} onChange={e => setFormData({...formData, other_transaction_id: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Payout Currency</Label>
                                    <Select 
                                        value={formData.payout_currency} 
                                        onValueChange={v => setFormData({...formData, payout_currency: v})}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
                                        <SelectContent>
                                            {currencyOptions.map((currency) => (
                                                <SelectItem key={`currency-${String(currency.code).toUpperCase()}`} value={String(currency.code).toUpperCase()}>
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
                                    <p className="text-xs text-muted-foreground">Branch Rate For £: {selectedBranchRate || '-'}</p>
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
                                    <div className="font-bold">{selectedSender.sender_name || selectedSender.name}</div>
                                    <div className="text-xs text-muted-foreground font-mono">{selectedSender.sender_id || selectedSender.id}</div>
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
                                                    key={`sender-${r.id}`} 
                                                    className="p-3 hover:bg-muted cursor-pointer transition-colors"
                                                    onClick={() => handleSelectSender(r)}
                                                >
                                                    <div className="text-sm font-bold">{r.sender_name || r.name}</div>
                                                    <div className="text-[10px] text-muted-foreground">{r.sender_id || r.id} • {r.phone}</div>
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
                                                <SelectItem key={`beneficiary-${b.id}`} value={b.id.toString()}>
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
                                            {purposes.map((purpose) => (
                                                <SelectItem key={`purpose-${purpose}`} value={purpose}>{purpose}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Relationship</Label>
                                    <Select
                                        value={formData.relationship}
                                        onValueChange={v => setFormData({...formData, relationship: v})}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {relationships.map((relationship) => (
                                                <SelectItem key={`relationship-${relationship}`} value={relationship}>{relationship}</SelectItem>
                                            ))}
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

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
    User, 
    Calendar, 
    MapPin, 
    Briefcase, 
    Phone, 
    CreditCard,
    Upload, 
    ArrowLeft,
    Save, 
    Users, 
    AlertCircle, 
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import Link from 'next/link';

type DuplicateMatch = {
    id: number;
    name: string;
    sender_id?: string;
    branch?: string;
    status?: string;
    score?: number;
    reasons?: string[];
    same_branch?: boolean;
    verification_state?: string;
    id_expired?: boolean;
};

type DuplicateSignals = {
    sender_name: string;
    date_of_birth: string;
    telephone: string;
    id_no: string;
    postcode: string;
    address_1: string;
    city: string;
    country: string;
};

export default function CreateRemitterPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnUrl = searchParams.get('returnUrl');

    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [duplicateChecking, setDuplicateChecking] = useState(false);
    const [possibleDuplicates, setPossibleDuplicates] = useState<DuplicateMatch[]>([]);
    const [duplicateFormSignals, setDuplicateFormSignals] = useState<DuplicateSignals>({
        sender_name: '',
        date_of_birth: '',
        telephone: '',
        id_no: '',
        postcode: '',
        address_1: '',
        city: '',
        country: 'United Kingdom',
    });
    const [duplicateModal, setDuplicateModal] = useState<{
        isOpen: boolean;
        message: string;
        matches: DuplicateMatch[];
        payload: FormData | null;
    }>({
        isOpen: false,
        message: '',
        matches: [],
        payload: null,
    });

    const buildPostCreateReceiverUrl = (remitterId: string | number) => {
        const params = new URLSearchParams({
            customer_id: String(remitterId),
        });

        if (returnUrl) {
            params.set('returnUrl', returnUrl);
        }

        return `/receivers/create?${params.toString()}`;
    };

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const res = await fetch(ENDPOINTS.BRANCHES.LIST);
                if (res.ok) {
                    const data = await res.json();
                    setBranches(data);
                }
            } catch (e) {
                console.error("Failed to fetch branches", e);
            }
        };
        void fetchBranches();
    }, []);

    const hasMinimumDuplicateSignals = useCallback((signals: DuplicateSignals): boolean => {
        const name = signals.sender_name.trim();
        const idNo = signals.id_no.trim();
        const phoneDigits = (signals.telephone || '').replace(/\D+/g, '');
        const hasNameContext = Boolean(name && (signals.date_of_birth || signals.postcode || signals.address_1));
        return Boolean(idNo || phoneDigits.length >= 7 || hasNameContext);
    }, []);

    const buildDuplicateQuery = useCallback((signals: DuplicateSignals): string => {
        const params = new URLSearchParams();
        const resolvedName = signals.sender_name.trim();

        if (resolvedName) params.set('sender_name', resolvedName);
        if (signals.date_of_birth.trim()) params.set('dob', signals.date_of_birth.trim());
        if (signals.telephone.trim()) params.set('phone', signals.telephone.trim());
        if (signals.id_no.trim()) params.set('id_no', signals.id_no.trim());
        if (signals.postcode.trim()) params.set('postcode', signals.postcode.trim());
        if (signals.address_1.trim()) params.set('address_1', signals.address_1.trim());
        if (signals.city.trim()) params.set('city', signals.city.trim());
        if (signals.country.trim()) params.set('country', signals.country.trim());

        return params.toString();
    }, []);

    const fetchPotentialMatches = useCallback(async (signals: DuplicateSignals): Promise<DuplicateMatch[]> => {
        if (!hasMinimumDuplicateSignals(signals)) return [];

        const query = buildDuplicateQuery(signals);
        if (!query) return [];

        const response = await fetch(`${ENDPOINTS.REMITTERS.POTENTIAL_MATCHES}?${query}`);
        if (!response.ok) return [];

        const data = await response.json() as { matches?: DuplicateMatch[] };
        return Array.isArray(data.matches) ? data.matches : [];
    }, [buildDuplicateQuery, hasMinimumDuplicateSignals]);

    useEffect(() => {
        if (!hasMinimumDuplicateSignals(duplicateFormSignals)) {
            setPossibleDuplicates([]);
            return;
        }

        const timer = window.setTimeout(async () => {
            setDuplicateChecking(true);
            try {
                const matches = await fetchPotentialMatches(duplicateFormSignals);
                setPossibleDuplicates(matches);
            } catch (error) {
                console.error('Failed to check potential duplicate remitters', error);
                setPossibleDuplicates([]);
            } finally {
                setDuplicateChecking(false);
            }
        }, 450);

        return () => window.clearTimeout(timer);
    }, [duplicateFormSignals, fetchPotentialMatches, hasMinimumDuplicateSignals]);

    const createRemitter = useCallback(async (
        payload: FormData,
        forceCreate: boolean
    ): Promise<{ createdId?: string | number; blockedByDuplicate?: boolean }> => {
        const body = new FormData();
        payload.forEach((value, key) => body.append(key, value));
        if (forceCreate) body.set('force_create', '1');

        const res = await fetch(ENDPOINTS.REMITTERS.LIST, {
            method: 'POST',
            body,
        });

        if (res.status === 409) {
            const duplicateData = await res.json() as { message?: string; matches?: DuplicateMatch[] };
            const matches = Array.isArray(duplicateData.matches) ? duplicateData.matches : [];
            setPossibleDuplicates(matches);
            setDuplicateModal({
                isOpen: true,
                message: duplicateData.message || 'Possible matching remitter already exists.',
                matches,
                payload,
            });
            return { blockedByDuplicate: true };
        }

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData?.message || 'Failed to create remitter');
        }

        const result = await res.json();
        return { createdId: result.id };
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const submitData = new FormData();
        
        // Base API Data
        const apiData: any = {
            client_type: 'individual',
            status: 'active',
            kyc_status: 'pending',
            branch: formData.get('branch_id'),
            role: 'customer',
            sys_entry_from: 'admin',
            sender_name: formData.get('sender_name'),
            phone: formData.get('telephone'),
            telephone: formData.get('telephone'),
            email: formData.get('email'),
            address_1: formData.get('address_1'),
            address_2: formData.get('address_2'),
            city: formData.get('city'),
            postcode: formData.get('postcode'),
            county: formData.get('county'),
            country: formData.get('country'),
            id_type: formData.get('id_type'),
            id_no: formData.get('id_no'),
            id_expire_date: formData.get('id_expire_date'),
            date_of_birth: formData.get('date_of_birth'),
            place_of_birth: formData.get('place_of_birth'),
            occupation: formData.get('occupation'),
        };

        Object.entries(apiData).forEach(([key, val]) => {
            if (val !== null && val !== undefined) submitData.append(key, String(val));
        });

        // Files
        const fileFields = ['passport_copy', 'id_copy', 'proof_of_address_doc', 'aml_doc'];
        fileFields.forEach(field => {
            const file = formData.get(field) as File;
            if (file && file.size > 0) submitData.append(field, file);
        });

        try {
            const result = await createRemitter(submitData, false);
            if (result.blockedByDuplicate) return;

            toast.success("Remitter created successfully");
            router.push(buildPostCreateReceiverUrl(String(result.createdId)));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Network error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmDuplicateCreate = async () => {
        if (!duplicateModal.payload) return;

        setDuplicateModal((prev) => ({ ...prev, isOpen: false }));
        setLoading(true);
        try {
            const result = await createRemitter(duplicateModal.payload, true);
            toast.success("Remitter created successfully");
            router.push(buildPostCreateReceiverUrl(String(result.createdId)));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to create remitter');
        } finally {
            setLoading(false);
        }
    };

    const verificationLabel = (state?: string) => {
        if (!state || String(state).toLowerCase() === 'not_started') {
            return 'Verification Not Started';
        }

        const value = String(state).replace(/_/g, ' ');
        return value.charAt(0).toUpperCase() + value.slice(1);
    };

    const verificationBadgeClass = (state?: string) => {
        switch (String(state || '').toLowerCase()) {
            case 'verified':
                return 'bg-emerald-100 text-emerald-700';
            case 'pending':
            case 'in_review':
                return 'bg-amber-100 text-amber-700';
            case 'rejected':
            case 'failed':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <Dialog open={duplicateModal.isOpen} onOpenChange={(open) => !open && setDuplicateModal({ isOpen: false, message: '', matches: [], payload: null })}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Possible Existing Remitter Found</DialogTitle>
                        <DialogDescription>
                            {duplicateModal.message || 'Potential match found. Please review before creating a duplicate profile.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[50vh] space-y-3 overflow-y-auto">
                        {duplicateModal.matches.map((match) => (
                            <div key={`duplicate-modal-${match.id}`} className="rounded-lg border bg-muted/20 p-3 text-sm">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="font-semibold">{match.name} {match.sender_id ? `(${match.sender_id})` : ''}</div>
                                        <div className="mt-1 text-xs text-muted-foreground">
                                            Branch: {match.branch || '-'} · Score: {match.score ?? 0}
                                        </div>
                                    </div>
                                    <Badge className={verificationBadgeClass(match.verification_state)}>
                                        {verificationLabel(match.verification_state)}
                                    </Badge>
                                </div>
                                {Array.isArray(match.reasons) && match.reasons.length > 0 ? (
                                    <div className="mt-2 text-xs text-amber-700">{match.reasons.join(', ')}</div>
                                ) : null}
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => setDuplicateModal({ isOpen: false, message: '', matches: [], payload: null })}
                        >
                            Review Details
                        </Button>
                        <Button type="button" onClick={handleConfirmDuplicateCreate} disabled={loading}>
                            {loading ? 'Creating...' : 'Create Anyway'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Remitter</h1>
                    <p className="text-muted-foreground">Onboard a new individual customer.</p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/remitters">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
                    </Link>
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Account Setup
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-1">
                        <div className="space-y-2">
                            <Label>Branch</Label>
                            <Select name="branch_id" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map(b => (
                                        <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            Personal Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input
                                name="sender_name"
                                required
                                placeholder="John Doe"
                                onChange={(e) => setDuplicateFormSignals((prev) => ({ ...prev, sender_name: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Date of Birth</Label>
                            <Input
                                name="date_of_birth"
                                type="date"
                                required
                                onChange={(e) => setDuplicateFormSignals((prev) => ({ ...prev, date_of_birth: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Place of Birth</Label>
                            <Input name="place_of_birth" placeholder="London, UK" />
                        </div>
                        <div className="space-y-2">
                            <Label>Occupation</Label>
                            <Input name="occupation" placeholder="Engineer" />
                        </div>
                        <div className="space-y-2">
                            <Label>Telephone</Label>
                            <Input
                                name="telephone"
                                required
                                placeholder="+44 7..."
                                onChange={(e) => setDuplicateFormSignals((prev) => ({ ...prev, telephone: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input name="email" type="email" placeholder="john@example.com" />
                        </div>
                    </CardContent>
                </Card>

                {(duplicateChecking || possibleDuplicates.length > 0) ? (
                    <Card className={possibleDuplicates.length > 0 ? 'border-amber-300/70 bg-amber-50/40' : ''}>
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-3">
                                <AlertCircle className={`mt-0.5 h-4 w-4 ${possibleDuplicates.length > 0 ? 'text-amber-600' : 'text-muted-foreground'}`} />
                                <div className="w-full">
                                    <p className="text-sm font-semibold">
                                        {duplicateChecking ? 'Checking for possible duplicates...' : `Possible match found (${possibleDuplicates.length})`}
                                    </p>
                                    {!duplicateChecking && possibleDuplicates.length > 0 ? (
                                        <div className="mt-3 space-y-2">
                                            {possibleDuplicates.slice(0, 3).map((match) => (
                                                <div key={`duplicate-preview-${match.id}`} className="rounded-lg border bg-background/80 p-3 text-xs">
                                                    <div className="font-semibold">
                                                        {match.name} {match.sender_id ? `(${match.sender_id})` : ''}
                                                    </div>
                                                    <div className="mt-1 text-muted-foreground">
                                                        Branch: {match.branch || '-'} · Score: {match.score ?? 0}
                                                    </div>
                                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                                        <Badge className={verificationBadgeClass(match.verification_state)}>
                                                            {verificationLabel(match.verification_state)}
                                                        </Badge>
                                                        {match.id_expired ? (
                                                            <Badge variant="destructive">ID Expired</Badge>
                                                        ) : null}
                                                    </div>
                                                    {Array.isArray(match.reasons) && match.reasons.length > 0 ? (
                                                        <div className="mt-2 text-amber-700">{match.reasons.join(', ')}</div>
                                                    ) : null}
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : null}

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            Address Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2 md:col-span-2">
                            <Label>Address Line 1</Label>
                            <Input
                                name="address_1"
                                required
                                placeholder="Street name and number"
                                onChange={(e) => setDuplicateFormSignals((prev) => ({ ...prev, address_1: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Postcode</Label>
                            <Input
                                name="postcode"
                                required
                                placeholder="SW1A 1AA"
                                onChange={(e) => setDuplicateFormSignals((prev) => ({ ...prev, postcode: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>City</Label>
                            <Input
                                name="city"
                                required
                                placeholder="London"
                                onChange={(e) => setDuplicateFormSignals((prev) => ({ ...prev, city: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>County</Label>
                            <Input name="county" placeholder="Greater London" />
                        </div>
                        <div className="space-y-2">
                            <Label>Country</Label>
                            <Input
                                name="country"
                                defaultValue="United Kingdom"
                                required
                                onChange={(e) => setDuplicateFormSignals((prev) => ({ ...prev, country: e.target.value }))}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-primary" />
                            Identification Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label>ID Type</Label>
                            <Select name="id_type" defaultValue="Passport">
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Passport">Passport</SelectItem>
                                    <SelectItem value="Driving License">Driving License</SelectItem>
                                    <SelectItem value="National ID">National ID</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>ID Number</Label>
                            <Input
                                name="id_no"
                                required
                                placeholder="A1234567"
                                onChange={(e) => setDuplicateFormSignals((prev) => ({ ...prev, id_no: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Expiry Date</Label>
                            <Input name="id_expire_date" type="date" required />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Upload className="h-5 w-5 text-primary" />
                            Document Uploads
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <div className="grid w-full items-center gap-1.5">
                            <Label>ID Copy</Label>
                            <Input name="id_copy" type="file" className="text-xs" />
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                            <Label>Proof of Address</Label>
                            <Input name="proof_of_address_doc" type="file" className="text-xs" />
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                            <Label>AML/Risk Review</Label>
                            <Input name="aml_doc" type="file" className="text-xs" />
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                            <Label>Secondary ID</Label>
                            <Input name="passport_copy" type="file" className="text-xs" />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button variant="ghost" type="button" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" size="lg" disabled={loading}>
                        <Save className="mr-2 h-4 w-4" />
                        {loading ? 'Creating...' : 'Create Remitter'}
                    </Button>
                </div>
            </form>
        </div>
    );
}

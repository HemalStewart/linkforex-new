'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
    User, 
    Calendar, 
    MapPin, 
    Briefcase, 
    Phone, 
    Building, 
    CreditCard,
    Globe, 
    FileText, 
    Upload, 
    Plus, 
    ArrowLeft,
    CheckCircle, 
    Shield, 
    Layers, 
    Save, 
    Users, 
    AlertCircle, 
    RefreshCw,
    Trash2
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
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import Link from 'next/link';

export default function CreateRemitterPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnUrl = searchParams.get('returnUrl');

    const [clientType, setClientType] = useState<'individual' | 'business'>('individual');
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Director State
    interface Director {
        name: string;
        dob: string;
        address: string;
        idType: string;
        idNumber: string;
    }
    const [directors, setDirectors] = useState<Director[]>([
        { name: '', dob: '', address: '', idType: 'Passport', idNumber: '' }
    ]);

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

    const addDirector = () => {
        if (directors.length < 3) {
            setDirectors([...directors, { name: '', dob: '', address: '', idType: 'Passport', idNumber: '' }]);
        }
    };

    const removeDirector = (index: number) => setDirectors(directors.filter((_, i) => i !== index));
    
    const updateDirector = (index: number, field: keyof Director, value: string) => {
        const updated = [...directors];
        updated[index][field] = value;
        setDirectors(updated);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const submitData = new FormData();
        
        // Base API Data
        const apiData: any = {
            client_type: clientType,
            status: 'active',
            kyc_status: 'pending',
            branch: formData.get('branch_id'),
            role: 'customer',
            sys_entry_from: 'admin',
            sender_name: clientType === 'business' ? formData.get('company_name') : formData.get('sender_name'),
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
        };

        if (clientType === 'individual') {
            apiData.date_of_birth = formData.get('date_of_birth');
            apiData.place_of_birth = formData.get('place_of_birth');
            apiData.occupation = formData.get('occupation');
        } else {
            apiData.bc_company_name = formData.get('company_name');
            apiData.bc_type_of_company = formData.get('company_type');
            apiData.bc_company_house_no = formData.get('company_reg_no');
            
            directors.forEach((d, i) => {
                const p = `bc_d${i + 1}`;
                apiData[`${p}_name`] = d.name;
                apiData[`${p}_dob`] = d.dob;
                apiData[`${p}_address1`] = d.address;
                apiData[`${p}_file_director_id`] = `${d.idType}:${d.idNumber}`;
            });
        }

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
            const res = await fetch(ENDPOINTS.REMITTERS.LIST, {
                method: 'POST',
                body: submitData,
            });

            if (res.ok) {
                const result = await res.json();
                toast.success("Remitter created successfully");
                if (returnUrl) {
                    router.push(`${returnUrl}${returnUrl.includes('?') ? '&' : '?'}newRemitterId=${result.id}`);
                } else {
                    router.push(`/remitters/${result.id}`);
                }
            } else {
                toast.error("Failed to create remitter");
            }
        } catch (error) {
            toast.error("Network error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Remitter</h1>
                    <p className="text-muted-foreground">Onboard a new individual or business customer.</p>
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
                        <CardDescription>Select the client type and branch.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-3">
                            <Label>Client Type</Label>
                            <Tabs value={clientType} onValueChange={(v: any) => setClientType(v)} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="individual">Individual</TabsTrigger>
                                    <TabsTrigger value="business">Business</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
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
                            {clientType === 'individual' ? <User className="h-5 w-5 text-primary" /> : <Building className="h-5 w-5 text-primary" />}
                            {clientType === 'individual' ? 'Personal Details' : 'Company Details'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {clientType === 'individual' ? (
                            <>
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input name="sender_name" required placeholder="John Doe" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Date of Birth</Label>
                                    <Input name="date_of_birth" type="date" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Place of Birth</Label>
                                    <Input name="place_of_birth" placeholder="London, UK" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Occupation</Label>
                                    <Input name="occupation" placeholder="Engineer" />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Company Name</Label>
                                    <Input name="company_name" required placeholder="Acme Corp Ltd" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Company Type</Label>
                                    <Select name="company_type" defaultValue="LTD">
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="LTD">LTD</SelectItem>
                                            <SelectItem value="PLC">PLC</SelectItem>
                                            <SelectItem value="Sole Trader">Sole Trader</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Reg No</Label>
                                    <Input name="company_reg_no" required placeholder="12345678" />
                                </div>
                            </>
                        )}
                        <div className="space-y-2">
                            <Label>Telephone</Label>
                            <Input name="telephone" required placeholder="+44 7..." />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input name="email" type="email" placeholder="john@example.com" />
                        </div>
                    </CardContent>
                </Card>

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
                            <Input name="address_1" required placeholder="Street name and number" />
                        </div>
                        <div className="space-y-2">
                            <Label>Postcode</Label>
                            <Input name="postcode" required placeholder="SW1A 1AA" />
                        </div>
                        <div className="space-y-2">
                            <Label>City</Label>
                            <Input name="city" required placeholder="London" />
                        </div>
                        <div className="space-y-2">
                            <Label>County</Label>
                            <Input name="county" placeholder="Greater London" />
                        </div>
                        <div className="space-y-2">
                            <Label>Country</Label>
                            <Input name="country" defaultValue="United Kingdom" required />
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
                            <Input name="id_no" required placeholder="A1234567" />
                        </div>
                        <div className="space-y-2">
                            <Label>Expiry Date</Label>
                            <Input name="id_expire_date" type="date" required />
                        </div>
                    </CardContent>
                </Card>

                {clientType === 'business' && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Directors</CardTitle>
                                <CardDescription>List up to 3 company directors.</CardDescription>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={addDirector} disabled={directors.length >= 3}>
                                <Plus className="mr-2 h-4 w-4" /> Add
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {directors.map((d, i) => (
                                <div key={i} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end border-b pb-4 last:border-0 last:pb-0">
                                    <div className="space-y-1">
                                        <Label className="text-[10px]">Name</Label>
                                        <Input value={d.name} onChange={e => updateDirector(i, 'name', e.target.value)} placeholder="Full Name" className="h-8 text-xs" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px]">DOB</Label>
                                        <Input type="date" value={d.dob} onChange={e => updateDirector(i, 'dob', e.target.value)} className="h-8 text-xs" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px]">Address</Label>
                                        <Input value={d.address} onChange={e => updateDirector(i, 'address', e.target.value)} placeholder="Residential Address" className="h-8 text-xs" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px]">ID Type & No</Label>
                                        <div className="flex gap-1">
                                            <Input value={d.idType} onChange={e => updateDirector(i, 'idType', e.target.value)} className="h-8 text-[10px] w-1/2" />
                                            <Input value={d.idNumber} onChange={e => updateDirector(i, 'idNumber', e.target.value)} className="h-8 text-xs w-1/2" />
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button type="button" variant="ghost" size="sm" onClick={() => removeDirector(i)} disabled={directors.length === 1}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

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

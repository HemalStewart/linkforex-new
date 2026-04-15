'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
    Flag,
    Plus,
    Loader2
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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

export default function CreateBranchPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [countries, setCountries] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        building_number: '',
        address_line_1: '',
        city: '',
        postcode: '',
        country: '',
        telephone_1: '',
        telephone_2: '',
        fax_1: '',
        fax_2: '',
        email_1: '',
        email_2: '',
        transaction_prefix: '',
        default_transaction_type: '',
        day_transfer_limit: '100000',
        branch_ownership_type: 'Own',
        remarks: '',
        status: 'active'
    });

    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const res = await fetch(ENDPOINTS.COUNTRIES.LIST);
                if (res.ok) setCountries(await res.json());
            } catch (e) {}
        };
        void fetchCountries();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(ENDPOINTS.BRANCHES.LIST, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                toast.success("Branch created successfully");
                router.push('/branches');
            } else {
                toast.error("Failed to create branch");
            }
        } catch (e) {
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Add Branch</h1>
                    <p className="text-muted-foreground">Setup a new physical or virtual branch location.</p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/branches"><ArrowLeft size={16} className="mr-2" /> Back</Link>
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-md flex items-center gap-2">
                            <Building size={16} className="text-primary" /> Branch Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2 md:col-span-2">
                            <Label>Branch Name</Label>
                            <Input 
                                required 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                placeholder="London Central Branch"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Transaction Prefix</Label>
                            <Input 
                                required 
                                maxLength={3}
                                className="uppercase font-mono"
                                value={formData.transaction_prefix} 
                                onChange={e => setFormData({...formData, transaction_prefix: e.target.value.toUpperCase()})}
                                placeholder="LFX"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Building / Suite</Label>
                            <Input 
                                value={formData.building_number} 
                                onChange={e => setFormData({...formData, building_number: e.target.value})}
                                placeholder="Suite 404"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label>Street Address</Label>
                            <Input 
                                value={formData.address_line_1} 
                                onChange={e => setFormData({...formData, address_line_1: e.target.value})}
                                placeholder="123 Example Street"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>City</Label>
                            <Input 
                                value={formData.city} 
                                onChange={e => setFormData({...formData, city: e.target.value})}
                                placeholder="London"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Postcode</Label>
                            <Input 
                                value={formData.postcode} 
                                onChange={e => setFormData({...formData, postcode: e.target.value})}
                                placeholder="E1 6AN"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Country</Label>
                            <Select value={formData.country} onValueChange={v => setFormData({...formData, country: v})}>
                                <SelectTrigger><SelectValue placeholder="Select Country" /></SelectTrigger>
                                <SelectContent>
                                    {countries.map(c => (
                                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Phone size={16} className="text-primary" /> Contact Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs">Primary Contact</Label>
                                    <Input value={formData.telephone_1} onChange={e => setFormData({...formData, telephone_1: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Secondary Contact</Label>
                                    <Input value={formData.telephone_2} onChange={e => setFormData({...formData, telephone_2: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Primary Fax</Label>
                                    <Input value={formData.fax_1} onChange={e => setFormData({...formData, fax_1: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Secondary Fax</Label>
                                    <Input value={formData.fax_2} onChange={e => setFormData({...formData, fax_2: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Primary Email</Label>
                                    <Input type="email" value={formData.email_1} onChange={e => setFormData({...formData, email_1: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Secondary Email</Label>
                                    <Input type="email" value={formData.email_2} onChange={e => setFormData({...formData, email_2: e.target.value})} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Store size={16} className="text-primary" /> Branch Configuration
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs">Daily Limit (GBP)</Label>
                                    <Input type="number" value={formData.day_transfer_limit} onChange={e => setFormData({...formData, day_transfer_limit: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Ownership</Label>
                                    <Select value={formData.branch_ownership_type} onValueChange={v => setFormData({...formData, branch_ownership_type: v})}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Own">Own Branch</SelectItem>
                                            <SelectItem value="Agent">Agent Office</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <Label className="text-xs">Transaction Type</Label>
                                    <Select value={formData.default_transaction_type} onValueChange={v => setFormData({...formData, default_transaction_type: v})}>
                                        <SelectTrigger><SelectValue placeholder="Select transaction type" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Sender">Sender Only</SelectItem>
                                            <SelectItem value="Receiver">Receiver Only</SelectItem>
                                            <SelectItem value="Both">Both Enabled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-bold">Additional Remarks</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea 
                            rows={3} 
                            value={formData.remarks} 
                            onChange={e => setFormData({...formData, remarks: e.target.value})}
                            placeholder="Internal notes about this branch..."
                        />
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="ghost" type="button" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? <><Loader2 size={14} className="mr-2 animate-spin" /> Saving...</> : <><Save size={14} className="mr-2" /> Save Branch</>}
                    </Button>
                </div>
            </form>
        </div>
    );
}

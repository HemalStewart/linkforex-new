'use client';

import React, { useState, useEffect } from 'react';
import { ENDPOINTS } from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw,
  PlusCircle,
  Edit2,
  Save,
  X,
  Globe,
  Coins,
} from 'lucide-react';
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function CurrenciesPage() {
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [countries, setCountries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | number | null>(null);
    const [editRate, setEditRate] = useState('');

    const [addModalOpen, setAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newCurrency, setNewCurrency] = useState({
        name: '',
        code: '',
        symbol: '',
        rate: ''
    });

    useEffect(() => {
        void fetchRates();
        void fetchCountries();
    }, []);

    const fetchCountries = async () => {
        try {
            const res = await fetch(`${ENDPOINTS.COUNTRIES.LIST}?status=active&sort=name&dir=asc`);
            if (res.ok) {
                const data = await res.json();
                setCountries(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Failed to fetch countries', error);
        }
    };

    const fetchRates = async () => {
        setLoading(true);
        try {
            const res = await fetch(ENDPOINTS.CURRENCIES.LIST);
            if (res.ok) {
                const data = await res.json();
                setCurrencies(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Failed to fetch rates', error);
            toast.error("Failed to fetch rates");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (currency: any) => {
        setEditingId(currency.id);
        setEditRate(currency.rate);
    };

    const handleSaveEdit = async (id: number) => {
        try {
            const res = await fetch(ENDPOINTS.CURRENCIES.DETAIL(id), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rate: editRate })
            });
            if (res.ok) {
                setEditingId(null);
                void fetchRates();
                toast.success("Rate updated");
            } else {
                toast.error("Failed to update rate");
            }
        } catch (error) {
            toast.error("Error updating rate");
        }
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch(ENDPOINTS.CURRENCIES.LIST, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCurrency)
            });

            if (res.ok) {
                setAddModalOpen(false);
                setNewCurrency({ name: '', code: '', symbol: '', rate: '' });
                toast.success("Currency added successfully");
                void fetchRates();
            } else {
                toast.error("Failed to add currency");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Currencies</h1>
                    <p className="text-muted-foreground">Manage supported currency metadata and exchange rates.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={fetchRates} disabled={loading}>
                        <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                    </Button>
                    <Button onClick={() => setAddModalOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Currency
                    </Button>
                </div>
            </div>

            <div className="rounded-md border bg-card overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Currency</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Rate (Base: GBP)</TableHead>
                            <TableHead>Last Updated</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">Loading...</TableCell></TableRow>
                        ) : currencies.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">No currencies found.</TableCell></TableRow>
                        ) : (
                            currencies.map((currency) => (
                                <TableRow key={currency.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                                {currency.symbol || '$'}
                                            </div>
                                            {currency.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">{currency.code}</TableCell>
                                    <TableCell>
                                        {editingId === currency.id ? (
                                            <Input
                                                type="number"
                                                value={editRate}
                                                onChange={(e) => setEditRate(e.target.value)}
                                                className="w-24 h-8"
                                                autoFocus
                                            />
                                        ) : (
                                            <Badge variant="outline" className="font-mono">
                                                {parseFloat(currency.rate).toFixed(2)}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {new Date(currency.updated_at).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {editingId === currency.id ? (
                                            <div className="flex justify-end gap-1">
                                                <Button size="icon" variant="ghost" onClick={() => handleSaveEdit(currency.id)}><Save size={16} className="text-primary" /></Button>
                                                <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}><X size={16} /></Button>
                                            </div>
                                        ) : (
                                            <Button size="icon" variant="ghost" onClick={() => handleEdit(currency)}><Edit2 size={16} /></Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Currency</DialogTitle>
                        <DialogDescription>Select a country to pre-fill currency details or enter manually.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddSubmit} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Select Country (Optional)</Label>
                            <Select onValueChange={(val) => {
                                const country = countries.find(c => String(c.id) === val);
                                if (country) {
                                    setNewCurrency({
                                        ...newCurrency,
                                        name: country.currency_name || (country.name + ' Currency'),
                                        code: country.currency_code || '',
                                        symbol: country.currency_symbol || ''
                                    });
                                }
                            }}>
                                <SelectTrigger><SelectValue placeholder="Pre-fill from country" /></SelectTrigger>
                                <SelectContent>
                                    {countries.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Currency Name</Label>
                            <Input required value={newCurrency.name} onChange={e => setNewCurrency({...newCurrency, name: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Code</Label>
                                <Input required className="uppercase" value={newCurrency.code} onChange={e => setNewCurrency({...newCurrency, code: e.target.value.toUpperCase()})} />
                            </div>
                            <div className="space-y-2">
                                <Label>Symbol</Label>
                                <Input required value={newCurrency.symbol} onChange={e => setNewCurrency({...newCurrency, symbol: e.target.value})} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Exchange Rate (Base: GBP)</Label>
                            <Input type="number" step="0.0001" required value={newCurrency.rate} onChange={e => setNewCurrency({...newCurrency, rate: e.target.value})} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setAddModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Currency'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

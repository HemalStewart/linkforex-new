'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import { AdminTableFilters } from "@/components/admin/table-filters";
import { AdminTableFooter } from "@/components/admin/table-footer";
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
  Globe,
  Coins,
  DollarSign,
} from 'lucide-react';
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function RatesPage() {
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [countries, setCountries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(25);

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

    const filteredCurrencies = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return currencies;
        return currencies.filter((currency) =>
            [currency.name, currency.code, currency.symbol, currency.rate]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query))
        );
    }, [currencies, searchQuery]);

    const totalRows = filteredCurrencies.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
    const currentPage = Math.min(page, totalPages);
    const startIndex = totalRows === 0 ? 0 : (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const pagedCurrencies = filteredCurrencies.slice(startIndex, endIndex);

    useEffect(() => {
        setPage(1);
    }, [searchQuery, rowsPerPage]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const fetchCountries = async () => {
        try {
            const res = await fetch(`${ENDPOINTS.COUNTRIES.LIST}?status=active&payout_currency=yes&sort=name&dir=asc`);
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
            toast.error("Failed to fetch rates");
        } finally {
            setLoading(false);
        }
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                ...newCurrency,
                code: String(newCurrency.code || '').trim().toUpperCase(),
                status: 'active',
            };

            const res = await fetch(ENDPOINTS.CURRENCIES.LIST, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const created = await res.json();
                const createdId = created?.id;

                // Simple inactivation logic for previous active rates of same code
                const sameCodeActiveRows = currencies.filter((row: any) => {
                    const sameCode = String(row?.code || '').trim().toUpperCase() === payload.code;
                    const isActive = String(row?.status || 'active').trim().toLowerCase() === 'active';
                    const isNew = String(row?.id) === String(createdId);
                    return sameCode && isActive && !isNew;
                });

                for (const oldRow of sameCodeActiveRows) {
                    await fetch(ENDPOINTS.CURRENCIES.DETAIL(oldRow.id), {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'inactive' })
                    });
                }

                setAddModalOpen(false);
                setNewCurrency({ name: '', code: '', symbol: '', rate: '' });
                toast.success("Digital rate added. Previous active rates inactivated.");
                void fetchRates();
            } else {
                toast.error("Failed to add rate");
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
                    <h1 className="text-3xl font-bold tracking-tight">Customer Digital Rate</h1>
                    <p className="text-muted-foreground">Manage global digital rates for customers.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={fetchRates} disabled={loading} aria-label="Refresh customer digital rates" title="Refresh customer digital rates">
                        <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                    </Button>
                    <Button onClick={() => setAddModalOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Rate
                    </Button>
                </div>
            </div>

            <AdminTableFilters
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search digital rates by currency..."
                title="Search"
                description="Filter customer digital rates by currency code, name, symbol, or rate."
            />

            <div className="rounded-md border bg-card overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Currency</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Rate (GBP Base)</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Updated</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">Loading...</TableCell></TableRow>
                        ) : pagedCurrencies.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">No rates found.</TableCell></TableRow>
                        ) : (
                            pagedCurrencies.map((currency) => (
                                <TableRow key={currency.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                                <Globe className="h-4 w-4 text-primary" />
                                            </div>
                                            {currency.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">{currency.code} ({currency.symbol})</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-lg font-mono">
                                            {parseFloat(currency.rate || '0').toFixed(2)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={String(currency.status || 'active').toLowerCase() === 'active' ? 'default' : 'secondary'}>
                                            {String(currency.status || 'active').toLowerCase() === 'active' ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {new Date(currency.updated_at).toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <AdminTableFooter
                currentPage={currentPage}
                totalPages={totalPages}
                totalRows={totalRows}
                rowsPerPage={rowsPerPage}
                startIndex={startIndex}
                endIndex={endIndex}
                onPageChange={setPage}
                onRowsPerPageChange={setRowsPerPage}
            />

            <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Customer Digital Rate</DialogTitle>
                        <DialogDescription>Adding a new active rate will automatically inactivate the previous active rate for the same currency.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddSubmit} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Select Country</Label>
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
                                <SelectTrigger><SelectValue placeholder="Search country..." /></SelectTrigger>
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
                                <Input required className="uppercase font-mono" value={newCurrency.code} onChange={e => setNewCurrency({...newCurrency, code: e.target.value.toUpperCase()})} />
                            </div>
                            <div className="space-y-2">
                                <Label>Symbol</Label>
                                <Input required className="font-mono text-center" value={newCurrency.symbol} onChange={e => setNewCurrency({...newCurrency, symbol: e.target.value})} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Exchange Rate (Base: GBP)</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input type="number" step="0.0001" required className="pl-10 font-mono" value={newCurrency.rate} onChange={e => setNewCurrency({...newCurrency, rate: e.target.value})} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setAddModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Rate'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

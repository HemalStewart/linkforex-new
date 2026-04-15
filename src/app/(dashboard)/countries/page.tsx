'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ENDPOINTS } from '@/lib/api';
import { getStoredUser } from '@/lib/authStorage';
import { isPrivilegedUser } from '@/lib/permissions';
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
  PlusCircle,
  RefreshCw,
  Search,
  Trash2,
  Edit2,
  Globe,
  Save,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type YesNo = 'yes' | 'no';

type CountryRow = {
    id: number | string;
    name?: string | null;
    iso_code?: string | null;
    currency_code?: string | null;
    currency_symbol?: string | null;
    currency_name?: string | null;
    high_risk_country?: YesNo | null;
    black_list_country?: YesNo | null;
    payout_currency?: YesNo | null;
};

type CountryFormState = {
    name: string;
    iso_code: string;
    high_risk_country: YesNo;
    black_list_country: YesNo;
    currency_code: string;
    currency_symbol: string;
    currency_name: string;
    payout_currency: YesNo;
};

type SortKey =
    | 'name'
    | 'high_risk_country'
    | 'black_list_country'
    | 'currency_code'
    | 'currency_symbol'
    | 'currency_name'
    | 'payout_currency';

type SortDir = 'asc' | 'desc';

const EMPTY_FORM: CountryFormState = {
    name: '',
    iso_code: '',
    high_risk_country: 'no',
    black_list_country: 'no',
    currency_code: '',
    currency_symbol: '',
    currency_name: '',
    payout_currency: 'no',
};

export default function CountriesPage() {
    const [countries, setCountries] = useState<CountryRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [highRiskFilter, setHighRiskFilter] = useState<'all' | YesNo>('all');
    const [blackListFilter, setBlackListFilter] = useState<'all' | YesNo>('all');
    const [payoutFilter, setPayoutFilter] = useState<'all' | YesNo>('all');
    const [canDeleteCountry, setCanDeleteCountry] = useState(false);
    const [sortKey, setSortKey] = useState<SortKey>('name');
    const [sortDir, setSortDir] = useState<SortDir>('asc');
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | string | null>(null);
    const [form, setForm] = useState<CountryFormState>(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);

    const [deleteCountryId, setDeleteCountryId] = useState<number | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        void fetchCountries();
        void resolveDeletePermission();
    }, []);

    const resolveDeletePermission = async () => {
        try {
            const user = getStoredUser<{ role?: string | null; username?: string | null; email?: string | null; name?: string | null; system_defined?: string | null }>();
            if (!user) {
                setCanDeleteCountry(false);
                return;
            }

            if (isPrivilegedUser(user)) {
                setCanDeleteCountry(true);
                return;
            }

            const roleName = String(user.role || '').trim().toLowerCase();
            if (!roleName) {
                setCanDeleteCountry(false);
                return;
            }

            const response = await fetch(ENDPOINTS.PERMISSION_GROUPS.LIST);
            if (!response.ok) {
                setCanDeleteCountry(false);
                return;
            }

            const data = await response.json();
            const allowed = Array.isArray(data) && data.some((row) => {
                const role = String(row?.role_name || '').trim().toLowerCase();
                const section = String(row?.page_section || '').trim().toUpperCase();
                const operation = String(row?.operation || '').trim().toUpperCase();
                const active = String(row?.active || '').trim().toLowerCase();
                if (role !== roleName) return false;
                if (active !== 'yes') return false;
                if (operation !== 'DELETE') return false;
                return section === 'COUNTRY' || section === 'COUNTRIES' || section === 'COUNTRY_MASTER';
            });

            setCanDeleteCountry(allowed);
        } catch {
            setCanDeleteCountry(false);
        }
    };

    const fetchCountries = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${ENDPOINTS.COUNTRIES.LIST}?include_blacklisted=yes`);
            if (res.ok) {
                const data = await res.json();
                setCountries(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Failed to fetch countries', error);
            toast.error("Failed to fetch countries");
        } finally {
            setLoading(false);
        }
    };

    const filteredCountries = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return countries.filter((country) => {
            const matchesQuery = !query || [
                country.name,
                country.iso_code,
                country.currency_code,
                country.currency_symbol,
                country.currency_name,
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query));

            const matchesHighRisk = highRiskFilter === 'all' || normalizeYesNo(country.high_risk_country) === highRiskFilter;
            const matchesBlackList = blackListFilter === 'all' || normalizeYesNo(country.black_list_country) === blackListFilter;
            const matchesPayout = payoutFilter === 'all' || normalizeYesNo(country.payout_currency) === payoutFilter;

            return matchesQuery && matchesHighRisk && matchesBlackList && matchesPayout;
        });
    }, [countries, searchQuery, highRiskFilter, blackListFilter, payoutFilter]);

    const sortedCountries = useMemo(() => {
        const rows = [...filteredCountries];
        rows.sort((left, right) => {
            const a = getSortValue(left, sortKey);
            const b = getSortValue(right, sortKey);
            if (a === b) return 0;
            if (sortDir === 'asc') return a > b ? 1 : -1;
            return a < b ? 1 : -1;
        });
        return rows;
    }, [filteredCountries, sortKey, sortDir]);

    const totalRows = sortedCountries.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
    const currentPage = Math.min(page, totalPages);
    const startIndex = totalRows === 0 ? 0 : (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, totalRows);
    const pagedCountries = sortedCountries.slice(startIndex, endIndex);

    const openAddModal = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setModalOpen(true);
    };

    const openEditModal = (country: CountryRow) => {
        setEditingId(country.id);
        setForm({
            name: String(country.name || ''),
            iso_code: String(country.iso_code || ''),
            high_risk_country: normalizeYesNo(country.high_risk_country),
            black_list_country: normalizeYesNo(country.black_list_country),
            currency_code: String(country.currency_code || ''),
            currency_symbol: String(country.currency_symbol || ''),
            currency_name: String(country.currency_name || ''),
            payout_currency: normalizeYesNo(country.payout_currency),
        });
        setModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const payload = normalizeForm(form);

        try {
            const endpoint = editingId == null ? ENDPOINTS.COUNTRIES.LIST : ENDPOINTS.COUNTRIES.DETAIL(editingId);
            const method = editingId == null ? 'POST' : 'PUT';
            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setModalOpen(false);
                await fetchCountries();
                toast.success(editingId == null ? 'Country added successfully.' : 'Country updated successfully.');
            } else {
                toast.error("Failed to save country.");
            }
        } catch (error) {
            console.error('Failed to save country', error);
            toast.error("An error occurred while saving.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (deleteCountryId == null) return;
        setDeleteLoading(true);
        try {
            const res = await fetch(ENDPOINTS.COUNTRIES.DETAIL(deleteCountryId), { method: 'DELETE' });
            if (res.ok) {
                await fetchCountries();
                toast.success("Country deleted successfully.");
            } else {
                toast.error("Failed to delete country.");
            }
        } catch (error) {
            console.error('Failed to delete country', error);
            toast.error("An error occurred while deleting.");
        } finally {
            setDeleteLoading(false);
            setDeleteCountryId(null);
        }
    };

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'));
            return;
        }
        setSortKey(key);
        setSortDir('asc');
    };

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Countries</h1>
                    <p className="text-muted-foreground">
                        Maintain the master country directory. Payout availability is driven by the payout currency flag.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="icon" onClick={fetchCountries} disabled={loading} aria-label="Refresh countries" title="Refresh countries">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button onClick={openAddModal}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Country
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-12 gap-4">
                <div className="xl:col-span-6">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by country, code, currency..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="xl:col-span-2">
                    <Select value={highRiskFilter} onValueChange={(val) => setHighRiskFilter(val as any)}>
                        <SelectTrigger>
                            <SelectValue placeholder="High Risk" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">High Risk: All</SelectItem>
                            <SelectItem value="yes">High Risk: Yes</SelectItem>
                            <SelectItem value="no">High Risk: No</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="xl:col-span-2">
                    <Select value={blackListFilter} onValueChange={(val) => setBlackListFilter(val as any)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Blacklist" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Blacklist: All</SelectItem>
                            <SelectItem value="yes">Blacklist: Yes</SelectItem>
                            <SelectItem value="no">Blacklist: No</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="xl:col-span-2">
                    <Select value={payoutFilter} onValueChange={(val) => setPayoutFilter(val as any)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Payout" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Payout: All</SelectItem>
                            <SelectItem value="yes">Payout: Yes</SelectItem>
                            <SelectItem value="no">Payout: No</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">#</TableHead>
                                <TableHead>ISO</TableHead>
                                <TableHead className="cursor-pointer" onClick={() => toggleSort('name')}>
                                    Country Name {sortKey === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                                </TableHead>
                                <TableHead>High Risk</TableHead>
                                <TableHead>Blacklist</TableHead>
                                <TableHead>Currency</TableHead>
                                <TableHead>Payout</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">Loading...</TableCell>
                                </TableRow>
                            ) : pagedCountries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">No countries found.</TableCell>
                                </TableRow>
                            ) : (
                                pagedCountries.map((country, idx) => (
                                    <TableRow key={country.id}>
                                        <TableCell>{startIndex + idx + 1}</TableCell>
                                        <TableCell className="font-mono text-xs">{country.iso_code}</TableCell>
                                        <TableCell className="font-medium">{country.name}</TableCell>
                                        <TableCell>
                                            <Badge variant={normalizeYesNo(country.high_risk_country) === 'yes' ? 'destructive' : 'secondary'}>
                                                {normalizeYesNo(country.high_risk_country) === 'yes' ? 'Yes' : 'No'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={normalizeYesNo(country.black_list_country) === 'yes' ? 'destructive' : 'secondary'}>
                                                {normalizeYesNo(country.black_list_country) === 'yes' ? 'Yes' : 'No'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{country.currency_code} ({country.currency_symbol})</TableCell>
                                        <TableCell>
                                            <Badge variant={normalizeYesNo(country.payout_currency) === 'yes' ? 'default' : 'secondary'}>
                                                {normalizeYesNo(country.payout_currency) === 'yes' ? 'Yes' : 'No'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => openEditModal(country)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => setDeleteCountryId(Number(country.id))}
                                                    disabled={!canDeleteCountry}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Showing {Math.min(startIndex + 1, totalRows)} to {endIndex} of {totalRows}
                </p>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>
                        <ChevronLeft className="h-4 w-4" /> Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === totalPages}>
                        Next <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingId == null ? 'Add Country' : 'Edit Country'}</DialogTitle>
                        <DialogDescription>Enter the country and currency details below.</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Country Name</Label>
                            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="iso">ISO Code (Alpha-2)</Label>
                            <Input id="iso" value={form.iso_code} onChange={(e) => setForm({ ...form, iso_code: e.target.value.toUpperCase() })} maxLength={2} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cur_code">Currency Code</Label>
                            <Input id="cur_code" value={form.currency_code} onChange={(e) => setForm({ ...form, currency_code: e.target.value.toUpperCase() })} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cur_sym">Symbol</Label>
                            <Input id="cur_sym" value={form.currency_symbol} onChange={(e) => setForm({ ...form, currency_symbol: e.target.value })} />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="cur_name">Currency Name</Label>
                            <Input id="cur_name" value={form.currency_name} onChange={(e) => setForm({ ...form, currency_name: e.target.value })} />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch checked={form.high_risk_country === 'yes'} onCheckedChange={(c) => setForm({ ...form, high_risk_country: c ? 'yes' : 'no' })} />
                            <Label>High Risk Country</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch checked={form.black_list_country === 'yes'} onCheckedChange={(c) => setForm({ ...form, black_list_country: c ? 'yes' : 'no' })} />
                            <Label>Blacklist Country</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch checked={form.payout_currency === 'yes'} onCheckedChange={(c) => setForm({ ...form, payout_currency: c ? 'yes' : 'no' })} />
                            <Label>Payout Available</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteCountryId !== null} onOpenChange={(o) => !o && setDeleteCountryId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Delete</DialogTitle>
                        <DialogDescription>Are you sure you want to delete this country? This cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteCountryId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>{deleteLoading ? 'Deleting...' : 'Delete'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function normalizeYesNo(value: CountryRow['high_risk_country']): YesNo {
    return String(value || '').toLowerCase() === 'yes' ? 'yes' : 'no';
}

function normalizeForm(form: CountryFormState): CountryFormState {
    return {
        ...form,
        name: form.name.trim(),
        iso_code: form.iso_code.trim().toUpperCase().slice(0, 2),
        currency_code: form.currency_code.trim().toUpperCase(),
        currency_symbol: form.currency_symbol.trim(),
        currency_name: form.currency_name.trim(),
    };
}

function getSortValue(country: CountryRow, key: SortKey): string {
    switch (key) {
        case 'high_risk_country':
            return normalizeYesNo(country.high_risk_country);
        case 'black_list_country':
            return normalizeYesNo(country.black_list_country);
        case 'payout_currency':
            return normalizeYesNo(country.payout_currency);
        default:
            return String(country[key] || '').toLowerCase();
    }
}

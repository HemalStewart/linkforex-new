'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, Plus, Trash2, Layout, Image as ImageIcon, Link as LinkIcon, Hash } from 'lucide-react';
import { ENDPOINTS } from '@/lib/api';
import type { MobileAd } from '@/lib/mobileControl';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

export default function MobileInAppAdsPage() {
    const [loading, setLoading] = useState(true);
    const [creatingAd, setCreatingAd] = useState(false);
    const [ads, setAds] = useState<MobileAd[]>([]);
    const [adForm, setAdForm] = useState({
        title: '',
        description: '',
        image_url: '',
        click_url: '',
        priority: 0,
        status: 'active' as 'active' | 'inactive',
    });

    const loadAds = async () => {
        setLoading(true);
        try {
            const res = await fetch(ENDPOINTS.MOBILE_ADMIN.ADS);
            if (res.ok) {
                const data = await res.json();
                setAds(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            toast.error("Failed to load ads");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadAds();
    }, []);

    const createAd = async () => {
        if (!adForm.title.trim()) {
            toast.error("Ad title is required");
            return;
        }
        setCreatingAd(true);
        try {
            const res = await fetch(ENDPOINTS.MOBILE_ADMIN.ADS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(adForm),
            });
            if (res.ok) {
                setAdForm({
                    title: '',
                    description: '',
                    image_url: '',
                    click_url: '',
                    priority: 0,
                    status: 'active',
                });
                await loadAds();
                toast.success("Ad created successfully");
            } else {
                toast.error("Failed to create ad");
            }
        } catch (error) {
            toast.error("Network error");
        } finally {
            setCreatingAd(false);
        }
    };

    const toggleAdStatus = async (ad: MobileAd) => {
        try {
            const res = await fetch(ENDPOINTS.MOBILE_ADMIN.AD_DETAIL(ad.id), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: ad.status === 'active' ? 'inactive' : 'active',
                }),
            });
            if (res.ok) {
                await loadAds();
                toast.success(`Ad ${ad.status === 'active' ? 'disabled' : 'enabled'}`);
            } else {
                toast.error("Failed to update status");
            }
        } catch (error) {
            toast.error("Network error");
        }
    };

    const deleteAd = async (adId: number) => {
        if (!window.confirm("Delete this ad permanentely?")) return;
        try {
            const res = await fetch(ENDPOINTS.MOBILE_ADMIN.AD_DETAIL(adId), { method: 'DELETE' });
            if (res.ok) {
                await loadAds();
                toast.success("Ad deleted");
            } else {
                toast.error("Failed to delete ad");
            }
        } catch (error) {
            toast.error("Network error");
        }
    };

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">In-App Ads</h1>
                    <p className="text-muted-foreground">Manage promotional banners and featured content in the app.</p>
                </div>
                <Button variant="outline" size="icon" onClick={loadAds} disabled={loading} aria-label="Refresh in-app ads" title="Refresh in-app ads">
                    <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-7">
                <Card className="md:col-span-3">
                    <CardHeader>
                        <CardTitle>Create New Ad</CardTitle>
                        <CardDescription>Add a new advertisement segment.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                                <Layout size={12} /> Title
                            </label>
                            <Input 
                                placeholder="Summer Remittance Special" 
                                value={adForm.title}
                                onChange={(e) => setAdForm(p => ({ ...p, title: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Description</label>
                            <Textarea 
                                placeholder="Short ad copy..."
                                className="min-h-[80px]"
                                value={adForm.description}
                                onChange={(e) => setAdForm(p => ({ ...p, description: e.target.value }))}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                                    <ImageIcon size={12} /> Image URL
                                </label>
                                <Input 
                                    placeholder="https://..." 
                                    value={adForm.image_url}
                                    onChange={(e) => setAdForm(p => ({ ...p, image_url: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                                    <LinkIcon size={12} /> Click URL
                                </label>
                                <Input 
                                    placeholder="https://..." 
                                    value={adForm.click_url}
                                    onChange={(e) => setAdForm(p => ({ ...p, click_url: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                                    <Hash size={12} /> Priority
                                </label>
                                <Input 
                                    type="number"
                                    value={adForm.priority}
                                    onChange={(e) => setAdForm(p => ({ ...p, priority: parseInt(e.target.value) }))}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-muted-foreground">Status</label>
                                <Select value={adForm.status} onValueChange={(val: any) => setAdForm(p => ({ ...p, status: val }))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <Button className="w-full" disabled={creatingAd} onClick={createAd}>
                            <Plus className="mr-2 h-4 w-4" /> Create Ad
                        </Button>
                    </CardContent>
                </Card>

                <Card className="md:col-span-4">
                    <CardHeader>
                        <CardTitle>Active Inventory</CardTitle>
                        <CardDescription>Managed ads shown on mobile homepage.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ad Template</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center">Loading...</TableCell></TableRow>
                                ) : ads.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center">No ads found.</TableCell></TableRow>
                                ) : (
                                    ads.sort((a,b) => b.priority - a.priority).map((ad) => (
                                        <TableRow key={ad.id}>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-semibold text-xs">{ad.title}</span>
                                                    <span className="text-[10px] text-muted-foreground line-clamp-1">{ad.description || 'No description'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-[10px] font-mono">{ad.priority}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={ad.status === 'active' ? 'default' : 'secondary'} className="text-[9px] uppercase">
                                                    {ad.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={() => toggleAdStatus(ad)}>
                                                        {ad.status === 'active' ? 'Disable' : 'Enable'}
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteAd(ad.id)}>
                                                        <Trash2 size={12} />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

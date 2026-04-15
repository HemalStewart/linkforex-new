'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, Send, PlusCircle, FileText, History, Users, Megaphone, CheckCircle2 } from 'lucide-react';
import { ENDPOINTS } from '@/lib/api';
import type { Campaign } from '@/lib/mobileControl';
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
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

export default function MobileCampaignsPage() {
    const [loading, setLoading] = useState(true);
    const [creatingCampaign, setCreatingCampaign] = useState(false);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [campaignForm, setCampaignForm] = useState({
        title: '',
        message: '',
        channel: 'both' as 'push' | 'email' | 'both',
        target_audience: 'all' as 'all' | 'kyc_pending' | 'kyc_verified' | 'inactive',
        include_exchange_rate: false,
    });

    const loadCampaigns = async () => {
        setLoading(true);
        try {
            const res = await fetch(ENDPOINTS.MOBILE_ADMIN.CAMPAIGNS);
            if (res.ok) {
                const data = await res.json();
                setCampaigns(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            toast.error("Failed to load campaigns");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadCampaigns();
    }, []);

    const createCampaign = async (sendNow = false) => {
        if (!campaignForm.title.trim() || !campaignForm.message.trim()) {
            toast.error("Campaign title and message are required");
            return;
        }
        setCreatingCampaign(true);
        try {
            const res = await fetch(ENDPOINTS.MOBILE_ADMIN.CAMPAIGNS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: campaignForm.title,
                    message: campaignForm.message,
                    channel: campaignForm.channel,
                    target_audience: campaignForm.target_audience,
                    include_exchange_rate: campaignForm.include_exchange_rate ? 'yes' : 'no',
                    send_now: sendNow ? 'yes' : 'no',
                }),
            });
            if (res.ok) {
                setCampaignForm({
                    title: '',
                    message: '',
                    channel: 'both',
                    target_audience: 'all',
                    include_exchange_rate: false,
                });
                await loadCampaigns();
                toast.success(sendNow ? 'Campaign sent.' : 'Campaign saved as draft.');
            } else {
                toast.error("Failed to create campaign");
            }
        } catch (error) {
            toast.error("Network error");
        } finally {
            setCreatingCampaign(false);
        }
    };

    const sendDraftCampaign = async (campaignId: number) => {
        try {
            const res = await fetch(ENDPOINTS.MOBILE_ADMIN.SEND_CAMPAIGN(campaignId), { method: 'POST' });
            if (res.ok) {
                await loadCampaigns();
                toast.success("Campaign sent successfully");
            } else {
                toast.error("Failed to send campaign");
            }
        } catch (error) {
            toast.error("Network error");
        }
    };

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Campaign Center</h1>
                    <p className="text-muted-foreground">Manage push and email notifications for mobile users.</p>
                </div>
                <Button variant="outline" size="icon" onClick={loadCampaigns} disabled={loading} aria-label="Refresh campaigns" title="Refresh campaigns">
                    <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
                        <History className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{campaigns.filter(c => c.status === 'sent').length}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-7">
                <Card className="md:col-span-3">
                    <CardHeader>
                        <CardTitle>Create Campaign</CardTitle>
                        <CardDescription>Draft or send a new notification.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Title</label>
                            <Input 
                                placeholder="Summer Promotion" 
                                value={campaignForm.title}
                                onChange={(e) => setCampaignForm(p => ({ ...p, title: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Message</label>
                            <Textarea 
                                placeholder="Enter campaign message..."
                                className="min-h-[100px]"
                                value={campaignForm.message}
                                onChange={(e) => setCampaignForm(p => ({ ...p, message: e.target.value }))}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Channel</label>
                                <Select value={campaignForm.channel} onValueChange={(val: any) => setCampaignForm(p => ({ ...p, channel: val }))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="both">Push + Email</SelectItem>
                                        <SelectItem value="push">Push Only</SelectItem>
                                        <SelectItem value="email">Email Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Audience</label>
                                <Select value={campaignForm.target_audience} onValueChange={(val: any) => setCampaignForm(p => ({ ...p, target_audience: val }))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Users</SelectItem>
                                        <SelectItem value="kyc_pending">KYC Pending</SelectItem>
                                        <SelectItem value="kyc_verified">KYC Verified</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="rates" 
                                checked={campaignForm.include_exchange_rate}
                                onCheckedChange={(val: boolean) => setCampaignForm(p => ({ ...p, include_exchange_rate: val }))}
                            />
                            <label htmlFor="rates" className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Include live exchange rates in message
                            </label>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button 
                                variant="outline" 
                                className="flex-1" 
                                disabled={creatingCampaign}
                                onClick={() => createCampaign(false)}
                            >
                                Save Draft
                            </Button>
                            <Button 
                                className="flex-1" 
                                disabled={creatingCampaign}
                                onClick={() => createCampaign(true)}
                            >
                                <Send className="mr-2 h-4 w-4" /> Send Now
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-4">
                    <CardHeader>
                        <CardTitle>Campaign History</CardTitle>
                        <CardDescription>Drafts and recently sent campaigns.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Channel</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center">Loading...</TableCell></TableRow>
                                ) : campaigns.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center">No campaigns yet.</TableCell></TableRow>
                                ) : (
                                    campaigns.map((c) => (
                                        <TableRow key={c.id}>
                                            <TableCell className="font-medium text-xs">{c.title}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-[10px] uppercase font-mono">{c.channel}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={c.status === 'sent' ? 'default' : 'secondary'} className="text-[10px] uppercase">
                                                    {c.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {c.status === 'draft' && (
                                                    <Button size="sm" variant="ghost" className="h-7 text-[10px] text-primary" onClick={() => sendDraftCampaign(c.id)}>
                                                        Send
                                                    </Button>
                                                )}
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

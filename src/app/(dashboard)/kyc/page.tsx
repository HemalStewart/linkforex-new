'use client';

import React, { useState, useEffect } from 'react';
import { 
    Filter, 
    Download, 
    Clock, 
    Search, 
    AlertCircle, 
    CheckCircle, 
    XCircle, 
    User, 
    Phone, 
    Calendar, 
    FileText, 
    Shield, 
    RefreshCcw,
    ChevronRight,
    ExternalLink
} from 'lucide-react';
import { ENDPOINTS } from '@/lib/api';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"

export default function KYCPage() {
    const [remitters, setRemitters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');

    const fetchRemitters = async () => {
        setLoading(true);
        try {
            const res = await fetch(ENDPOINTS.REMITTERS.LIST);
            if (res.ok) {
                setRemitters(await res.json());
            }
        } catch (error) {
            toast.error("Failed to fetch KYC applications");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchRemitters();
    }, []);

    const mapStatus = (kycStatus?: string, verificationState?: string) => {
        const normalizedKyc = String(kycStatus || '').toLowerCase().trim();
        if (normalizedKyc === 'verified') return 'approved';
        if (normalizedKyc) return normalizedKyc;
        const normalizedVerification = String(verificationState || '').toLowerCase().trim();
        if (normalizedVerification === 'verified') return 'approved';
        if (normalizedVerification === 'pending') return 'in_review';
        return 'pending';
    };

    const processedApplications = Array.isArray(remitters) ? remitters.map(r => ({
        id: r.id.toString(),
        user: r.sender_name || r.name || r.company_name || `Remitter #${r.id}`,
        email: r.email,
        phone: r.phone,
        submittedDate: r.created_at ? new Date(r.created_at).toLocaleDateString() : '-',
        status: mapStatus(r.kyc_status, r.verification_state),
        riskLevel: r.risk_level || 'low',
        country: r.country || 'UK'
    })) : [];

    const stats = {
        pending: processedApplications.filter(k => k.status === 'pending').length,
        in_review: processedApplications.filter(k => k.status === 'in_review').length,
        approved: processedApplications.filter(k => k.status === 'approved').length,
        rejected: processedApplications.filter(k => k.status === 'rejected').length,
    };

    const filteredApplications = processedApplications.filter(app =>
        filterStatus === 'all' || app.status === filterStatus
    );

    if (loading) return <div className="p-12 text-center animate-pulse">Loading KYC queue...</div>;

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">KYC Reviews</h1>
                    <p className="text-muted-foreground">Review and verify client onboarding applications.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => void fetchRemitters()}>
                        <RefreshCcw size={14} className="mr-2" /> Refresh
                    </Button>
                    <Button size="sm">
                        <Download size={14} className="mr-2" /> Export
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pending}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Analysis</CardTitle>
                        <Search className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.in_review}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.approved}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Alerts</CardTitle>
                        <AlertCircle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.rejected}</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="all" onValueChange={setFilterStatus} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="all">All Applications</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="in_review">In Review</TabsTrigger>
                    <TabsTrigger value="approved">Approved</TabsTrigger>
                </TabsList>
                
                <TabsContent value={filterStatus} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredApplications.map((app) => (
                            <Card key={app.id} className="overflow-hidden transition-all hover:shadow-md group">
                                <CardHeader className="pb-3 border-b bg-muted/30">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 border-2 border-background">
                                                <AvatarFallback className="bg-primary/10 text-primary">{app.user.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <CardTitle className="text-sm font-bold">{app.user}</CardTitle>
                                                <CardDescription className="text-[10px]">{app.country}</CardDescription>
                                            </div>
                                        </div>
                                        <Badge variant={app.status === 'approved' ? 'default' : app.status === 'pending' ? 'secondary' : 'outline'} className="capitalize text-[10px]">
                                            {app.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-4">
                                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                                        <div className="space-y-1">
                                            <p className="text-muted-foreground font-medium uppercase tracking-tighter">Phone</p>
                                            <p className="font-bold">{app.phone || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-muted-foreground font-medium uppercase tracking-tighter">Submitted</p>
                                            <p className="font-bold">{app.submittedDate}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-muted/40 border">
                                        <span className="flex items-center gap-1.5"><Shield size={12} className="text-primary" /> Risk Profile</span>
                                        <Badge variant="outline" className={`h-5 text-[9px] uppercase ${app.riskLevel === 'high' ? 'border-destructive text-destructive' : 'border-emerald-500 text-emerald-500'}`}>
                                            {app.riskLevel}
                                        </Badge>
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-0 border-t bg-muted/10">
                                    <Button variant="ghost" className="w-full h-9 text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-all" asChild>
                                        <a href={`/remitters/${app.id}`}>
                                            Detail Review <ExternalLink size={12} className="ml-2" />
                                        </a>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                    {filteredApplications.length === 0 && (
                        <div className="py-20 text-center border rounded-xl bg-muted/20 border-dashed">
                            <Shield size={40} className="mx-auto text-muted-foreground/30 mb-4" />
                            <h3 className="text-lg font-bold">No Applications in Queue</h3>
                            <p className="text-muted-foreground text-sm">All cleared or no matches for "{filterStatus}" filter.</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

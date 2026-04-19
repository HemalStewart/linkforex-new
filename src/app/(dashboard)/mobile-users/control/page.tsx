'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
    Bell, 
    Newspaper, 
    RefreshCw, 
    Send, 
    ShieldAlert, 
    ShieldCheck, 
    Smartphone,
    ArrowRight,
    Wallet,
    Globe,
    Settings
} from 'lucide-react';
import { ENDPOINTS } from '@/lib/api';
import type { OverviewData } from '@/lib/mobileControl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function MobileControlOverviewPage() {
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState<OverviewData>({
        mobile_users_total: 0,
        kyc_pending: 0,
        kyc_verified: 0,
        inactive_users: 0,
        campaigns_sent: 0,
        active_ads: 0,
        wallet_awaiting_funds: 0,
        wallet_funds_received: 0,
        wallet_processing: 0,
    });

    const loadOverview = async () => {
        setLoading(true);
        try {
            const res = await fetch(ENDPOINTS.MOBILE_ADMIN.OVERVIEW);
            if (res.ok) {
                const data = await res.json();
                setOverview(prev => ({ ...prev, ...data }));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadOverview();
    }, []);

    const stats = [
        { label: 'Mobile Users', value: overview.mobile_users_total, icon: Smartphone, color: 'text-blue-500' },
        { label: 'KYC Pending', value: overview.kyc_pending, icon: ShieldAlert, color: 'text-amber-500' },
        { label: 'KYC Verified', value: overview.kyc_verified, icon: ShieldCheck, color: 'text-emerald-500' },
        { label: 'Active Ads', value: overview.active_ads, icon: Newspaper, color: 'text-purple-500' },
        { label: 'Wallet Awaiting', value: overview.wallet_awaiting_funds, icon: Wallet, color: 'text-amber-500' },
        { label: 'Wallet Received', value: overview.wallet_funds_received, icon: Wallet, color: 'text-emerald-500' },
    ];

    const shortcuts = [
        { 
            href: '/mobile-users/control/app-flow-settings', 
            title: 'App Flow Settings', 
            description: 'OTP, verification, liveness and provider setup.',
            icon: Settings
        },
        { 
            href: '/mobile-users/control/exchange-rates', 
            title: 'Customer Digital Rates', 
            description: 'Choose which branch-backed digital rates appear in the app.',
            icon: Globe
        },
        { 
            href: '/mobile-users/control/wallet-transfers', 
            title: 'Wallet Funding Queue', 
            description: 'Review wallet-funded mobile transfers and update status.',
            icon: Wallet
        },
        { 
            href: '/mobile-users/control/profile-review-queue', 
            title: 'Profile Review Queue', 
            description: 'Review and approve/reject pending mobile profiles.',
            icon: ShieldCheck
        },
        { 
            href: '/mobile-users/control/campaigns', 
            title: 'Campaigns', 
            description: 'Create and send push/email campaigns.',
            icon: Send
        },
        { 
            href: '/mobile-users/control/in-app-ads', 
            title: 'Onboarding & Carousel', 
            description: 'Control onboarding slides and homepage carousel content from the backend.',
            icon: Newspaper
        },
    ];

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Mobile Control Center</h1>
                    <p className="text-muted-foreground">Central management for the Linkforex mobile ecosystem.</p>
                </div>
                <Button variant="outline" size="icon" onClick={loadOverview} disabled={loading} aria-label="Refresh mobile control overview" title="Refresh mobile control overview">
                    <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                {stats.map((stat) => (
                    <Card key={stat.label}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">{stat.label}</CardTitle>
                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{loading ? '...' : stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {shortcuts.map((item) => (
                    <Card key={item.href} className="hover:bg-accent/50 transition-colors cursor-pointer group">
                        <Link href={item.href} className="block h-full">
                            <CardHeader className="flex flex-row items-center gap-4">
                                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                    <item.icon className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">{item.title}</CardTitle>
                                    <CardDescription>{item.description}</CardDescription>
                                </div>
                                <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                            </CardHeader>
                        </Link>
                    </Card>
                ))}
            </div>
        </div>
    );
}

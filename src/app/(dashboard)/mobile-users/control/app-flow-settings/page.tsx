'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { 
    BadgeCheck, 
    Bell, 
    Mail, 
    Megaphone, 
    Newspaper, 
    RefreshCw, 
    Save, 
    ShieldAlert, 
    ShieldCheck, 
    Smartphone,
    Lock,
    Globe,
    MessageCircle
} from 'lucide-react';
import { ENDPOINTS } from '@/lib/api';
import { type SettingsData } from '@/lib/mobileControl';
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
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

const defaultSettings: SettingsData = {
    require_email_otp: 'yes',
    require_mobile_otp: 'yes',
    enable_liveness_check: 'yes',
    enable_sanction_screening: 'yes',
    lock_profile_after_verification: 'yes',
    allow_profile_edit_after_lock: 'no',
    enable_google_sign_in: 'yes',
    enable_apple_sign_in: 'yes',
    enable_in_app_ads: 'no',
    enable_push_notifications: 'yes',
    enable_email_notifications: 'yes',
    enable_secure_message: 'yes',
    send_exchange_rate_push: 'no',
    restrict_blacklisted_countries: 'no',
    require_new_device_verification: 'no',
    blacklisted_countries: '',
    password_rotation_days: 180,
    support_email: '',
    trust_wallet_label: 'LinkForex Trust Wallet',
    trust_wallet_network: '',
    trust_wallet_address: '',
    trust_wallet_instructions: '',
    liveness_provider: 'veriff',
    veriff_base_url: 'https://stationapi.veriff.com',
    veriff_api_key: '',
    veriff_hmac_secret: '',
    veriff_callback_url: '',
    veriff_configured: false,
};

const YES_NO_KEYS = [
    'require_email_otp', 'require_mobile_otp', 'enable_liveness_check', 
    'enable_sanction_screening', 'lock_profile_after_verification', 
    'allow_profile_edit_after_lock', 'enable_google_sign_in', 
    'enable_apple_sign_in', 'enable_in_app_ads', 'enable_push_notifications', 
    'enable_email_notifications', 'enable_secure_message', 
    'send_exchange_rate_push', 'restrict_blacklisted_countries', 
    'require_new_device_verification'
];

export default function MobileAppFlowSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);
    const [settings, setSettings] = useState<SettingsData>(defaultSettings);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch(ENDPOINTS.MOBILE_ADMIN.SETTINGS);
            if (res.ok) {
                const data = await res.json();
                const next: SettingsData = { ...defaultSettings };
                
                YES_NO_KEYS.forEach((key) => {
                    const value = String(data?.[key] || next[key as keyof SettingsData]).toLowerCase();
                    (next as any)[key] = value === 'yes' ? 'yes' : 'no';
                });

                next.liveness_provider = data?.liveness_provider === 'none' ? 'none' : 'veriff';
                next.veriff_base_url = data?.veriff_base_url || next.veriff_base_url;
                next.veriff_callback_url = data?.veriff_callback_url || '';
                next.blacklisted_countries = Array.isArray(data?.blacklisted_countries) 
                    ? data.blacklisted_countries.join('\n') 
                    : String(data?.blacklisted_countries || '').trim();
                next.password_rotation_days = Number(data?.password_rotation_days || 180);
                next.support_email = data?.support_email || '';
                next.trust_wallet_label = data?.trust_wallet_label || next.trust_wallet_label;
                next.trust_wallet_network = data?.trust_wallet_network || '';
                next.trust_wallet_address = data?.trust_wallet_address || '';
                next.trust_wallet_instructions = data?.trust_wallet_instructions || '';
                next.veriff_configured = Boolean(data?.veriff_configured);
                
                setSettings(next);
            }
        } catch (error) {
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadSettings();
    }, []);

    const saveSettings = async () => {
        setSavingSettings(true);
        try {
            const res = await fetch(ENDPOINTS.MOBILE_ADMIN.SETTINGS, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });
            if (res.ok) {
                toast.success("Mobile settings updated");
                void loadSettings();
            } else {
                toast.error("Failed to save settings");
            }
        } catch (error) {
            toast.error("Network error");
        } finally {
            setSavingSettings(false);
        }
    };

    const toggle = (key: keyof SettingsData) => {
        setSettings(prev => ({
            ...prev,
            [key]: prev[key] === 'yes' ? 'no' : 'yes'
        }));
    };

    const settingItems = [
        { key: 'require_email_otp', label: 'Email OTP Verification', icon: Mail },
        { key: 'require_mobile_otp', label: 'Mobile OTP Verification', icon: Smartphone },
        { key: 'enable_liveness_check', label: 'Liveness/Selfie Verification', icon: ShieldCheck },
        { key: 'enable_sanction_screening', label: 'Automatic AML Screening', icon: ShieldAlert },
        { key: 'lock_profile_after_verification', label: 'Lock KYC after Verification', icon: Lock },
        { key: 'enable_push_notifications', label: 'Mobile Push Notifications', icon: Bell },
        { key: 'enable_in_app_ads', label: 'Promotional Banners (Ads)', icon: Newspaper },
        { key: 'send_exchange_rate_push', label: 'Auto Exchange Rate Alerts', icon: Megaphone },
    ];

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">App Flow Settings</h1>
                    <p className="text-muted-foreground">Configure global mobile app logic and security thresholds.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={loadSettings} disabled={loading}>
                        <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                    </Button>
                    <Button size="sm" onClick={saveSettings} disabled={savingSettings || loading}>
                        <Save className="mr-2" size={16} />
                        {savingSettings ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Onboarding & Security</CardTitle>
                        <CardDescription>Control the verification and access flow.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {settingItems.map((item) => (
                            <div key={item.key} className="flex items-center justify-between space-x-2">
                                <Label htmlFor={item.key} className="flex flex-col gap-1">
                                    <span className="flex items-center gap-2 font-semibold">
                                        <item.icon size={14} className="text-primary" />
                                        {item.label}
                                    </span>
                                </Label>
                                <Switch 
                                    id={item.key} 
                                    checked={settings[item.key as keyof SettingsData] === 'yes'}
                                    onCheckedChange={() => toggle(item.key as keyof SettingsData)}
                                />
                            </div>
                        ))}
                        <div className="pt-4 border-t space-y-3">
                            <div className="space-y-1">
                                <Label className="text-xs uppercase font-bold text-muted-foreground">Support Email</Label>
                                <Input 
                                    value={settings.support_email} 
                                    onChange={(e) => setSettings(p => ({ ...p, support_email: e.target.value }))}
                                    placeholder="support@linkforex.com"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs uppercase font-bold text-muted-foreground">Password Rotation (Days)</Label>
                                <Input 
                                    type="number"
                                    value={settings.password_rotation_days} 
                                    onChange={(e) => setSettings(p => ({ ...p, password_rotation_days: parseInt(e.target.value) }))}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Wholesale Crypto Funding</CardTitle>
                            <CardDescription>Setup the fixed wallet destination for mobile users.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs uppercase">Wallet Label</Label>
                                    <Input value={settings.trust_wallet_label} onChange={(e) => setSettings(p => ({ ...p, trust_wallet_label: e.target.value }))} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs uppercase">Network</Label>
                                    <Input value={settings.trust_wallet_network} onChange={(e) => setSettings(p => ({ ...p, trust_wallet_network: e.target.value }))} placeholder="TRC20" />
                                </div>
                           </div>
                           <div className="space-y-1">
                                <Label className="text-xs uppercase">Destination Address</Label>
                                <Input value={settings.trust_wallet_address} onChange={(e) => setSettings(p => ({ ...p, trust_wallet_address: e.target.value }))} className="font-mono text-xs" />
                           </div>
                           <div className="space-y-1">
                                <Label className="text-xs uppercase">User Instructions</Label>
                                <Textarea 
                                    value={settings.trust_wallet_instructions} 
                                    onChange={(e) => setSettings(p => ({ ...p, trust_wallet_instructions: e.target.value }))}
                                    className="text-xs min-h-[80px]"
                                />
                           </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                Compliance Engine (Veriff)
                                <Badge variant={settings.veriff_configured ? "default" : "outline"} className="text-[9px]">
                                    {settings.veriff_configured ? "CONNECTED" : "UNCONFIGURED"}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-1">
                                <Label className="text-xs uppercase">Liveness Provider</Label>
                                <Select value={settings.liveness_provider} onValueChange={(val: any) => setSettings(p => ({ ...p, liveness_provider: val }))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="veriff">Veriff (Selfie + ID)</SelectItem>
                                        <SelectItem value="none">Disabled (Manual Review)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1 font-mono text-[10px]">
                                    <Label>API Key</Label>
                                    <Input type="password" value={settings.veriff_api_key} onChange={(e) => setSettings(p => ({ ...p, veriff_api_key: e.target.value }))} placeholder="••••••••" />
                                </div>
                                <div className="space-y-1 font-mono text-[10px]">
                                    <Label>HMAC Secret</Label>
                                    <Input type="password" value={settings.veriff_hmac_secret} onChange={(e) => setSettings(p => ({ ...p, veriff_hmac_secret: e.target.value }))} placeholder="••••••••" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

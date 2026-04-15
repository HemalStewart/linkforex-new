'use client';

import React, { useState, useEffect } from 'react';
import { 
    Settings, 
    User, 
    Shield, 
    Lock, 
    Bell, 
    Palette, 
    Save, 
    Loader2,
    Mail,
    Phone,
    Building,
    CheckCircle2,
    Camera
} from 'lucide-react';
import { ENDPOINTS } from '@/lib/api';
import { getStoredUser } from '@/lib/authStorage';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<any>(null);

    const [passwordForm, setPasswordForm] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Mocking stored user fetch or real API call
                const user = getStoredUser<any>();
                if (user?.id) {
                    const res = await fetch(ENDPOINTS.USERS.DETAIL(user.id));
                    if (res.ok) setProfile(await res.json());
                }
            } catch (e) {
                toast.error("Failed to load profile settings");
            } finally {
                setLoading(false);
            }
        };
        void fetchProfile();
    }, []);

    const handleSaveGeneral = async () => {
        setSaving(true);
        setTimeout(() => {
            toast.success("Preferences updated");
            setSaving(false);
        }, 800);
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordForm.new !== passwordForm.confirm) {
            toast.error("Passwords do not match");
            return;
        }
        setSaving(true);
        try {
            const res = await fetch(ENDPOINTS.AUTH.CHANGE_PASSWORD, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: profile?.email,
                    current_password: passwordForm.current,
                    new_password: passwordForm.new,
                    confirm_password: passwordForm.confirm
                })
            });
            if (res.ok) {
                toast.success("Password changed successfully");
                setPasswordForm({ current: '', new: '', confirm: '' });
            } else {
                toast.error("Failed to change password. check current password.");
            }
        } catch (e) {
            toast.error("Network error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-12 text-center animate-pulse">Loading system settings...</div>;

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
                    <p className="text-muted-foreground">Manage your account, preferences, and security.</p>
                </div>
            </div>

            <Tabs defaultValue="profile" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="appearance">Appearance</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile" className="space-y-4">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <Card className="lg:col-span-1">
                            <CardHeader>
                                <CardTitle className="text-md">Profile Image</CardTitle>
                                <CardDescription>Update your avatar.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center gap-4">
                                <Avatar className="h-32 w-32 border-4 border-muted">
                                    <AvatarImage src={profile?.profile_photo_url} />
                                    <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                                        {profile?.name?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <Button variant="outline" size="sm" className="w-full">
                                    <Camera size={14} className="mr-2" /> Change Photo
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-md">Identity Information</CardTitle>
                                <CardDescription>Basic system identifiers (Read-only).</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Full Name</Label>
                                    <div className="font-bold flex items-center gap-2"><User size={14} className="text-primary" /> {profile?.name || 'N/A'}</div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Username</Label>
                                    <div className="font-bold">{profile?.username || 'N/A'}</div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Email</Label>
                                    <div className="font-bold flex items-center gap-2"><Mail size={14} className="text-primary" /> {profile?.email || 'N/A'}</div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Role</Label>
                                    <div className="font-bold flex items-center gap-2"><Shield size={14} className="text-primary" /> {profile?.role || 'N/A'}</div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Branch</Label>
                                    <div className="font-bold flex items-center gap-2"><Building size={14} className="text-primary" /> {profile?.branch || 'N/A'}</div>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-muted/30 border-t pt-4">
                                <p className="text-[10px] text-muted-foreground">Identity fields can only be modified by system administrators.</p>
                            </CardFooter>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="appearance" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-md">UI Preferences</CardTitle>
                            <CardDescription>Customize your workspace experience.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
                                <div className="space-y-1">
                                    <Label className="font-bold">Density Mode</Label>
                                    <p className="text-xs text-muted-foreground">Compressed tables and tighter spacing for data-heavy views.</p>
                                </div>
                                <Switch />
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
                                <div className="space-y-1">
                                    <Label className="font-bold">Real-time Notifications</Label>
                                    <p className="text-xs text-muted-foreground">Get toast alerts for new incoming transfers.</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                        </CardContent>
                        <CardFooter className="border-t justify-end pt-4">
                             <Button onClick={handleSaveGeneral} disabled={saving}>
                                 {saving ? 'Saving...' : 'Save Preferences'}
                             </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="security" className="space-y-4">
                    <Card className="max-w-2xl">
                        <CardHeader>
                            <CardTitle className="text-md">Change Password</CardTitle>
                            <CardDescription>Ensure your account remains secure with a strong password.</CardDescription>
                        </CardHeader>
                        <form onSubmit={handlePasswordChange}>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">Current Password</Label>
                                    <Input 
                                        type="password" 
                                        required 
                                        value={passwordForm.current}
                                        onChange={e => setPasswordForm({...passwordForm, current: e.target.value})}
                                    />
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-xs">New Password</Label>
                                        <Input 
                                            type="password" 
                                            required 
                                            value={passwordForm.new}
                                            onChange={e => setPasswordForm({...passwordForm, new: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Confirm New Password</Label>
                                        <Input 
                                            type="password" 
                                            required 
                                            value={passwordForm.confirm}
                                            onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t justify-end pt-4">
                                <Button type="submit" disabled={saving}>
                                    {saving ? 'Processing...' : 'Update Password'}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

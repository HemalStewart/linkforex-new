'use client';

import React, { useState, useEffect } from 'react';
import { 
    Settings, 
    User, 
    Shield, 
    Mail,
    Building,
    Camera,
    Crop,
    Upload,
    X
} from 'lucide-react';
import { ENDPOINTS } from '@/lib/api';
import { getStoredUser } from '@/lib/authStorage';
import { persistStoredUser, resolveProfilePhotoUrl } from '@/lib/user-profile';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

const CROP_SIZE = 280;

type CropState = {
    zoom: number;
    offsetX: number;
    offsetY: number;
};

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

const getDisplayMetrics = (imageWidth: number, imageHeight: number, zoom: number) => {
    const baseScale = Math.max(CROP_SIZE / imageWidth, CROP_SIZE / imageHeight);
    return {
        displayWidth: imageWidth * baseScale * zoom,
        displayHeight: imageHeight * baseScale * zoom,
    };
};

const clampOffsets = (imageWidth: number, imageHeight: number, zoom: number, offsetX: number, offsetY: number) => {
    const { displayWidth, displayHeight } = getDisplayMetrics(imageWidth, imageHeight, zoom);
    const maxOffsetX = Math.max(0, (displayWidth - CROP_SIZE) / 2);
    const maxOffsetY = Math.max(0, (displayHeight - CROP_SIZE) / 2);
    return {
        offsetX: clamp(offsetX, -maxOffsetX, maxOffsetX),
        offsetY: clamp(offsetY, -maxOffsetY, maxOffsetY),
    };
};

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [cropSourceUrl, setCropSourceUrl] = useState<string | null>(null);
    const [cropState, setCropState] = useState<CropState>({ zoom: 1, offsetX: 0, offsetY: 0 });
    const [cropImageSize, setCropImageSize] = useState({ width: 0, height: 0 });
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);
    const imageRef = React.useRef<HTMLImageElement | null>(null);
    const dragStateRef = React.useRef({ startX: 0, startY: 0, originX: 0, originY: 0, active: false });

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
                    if (res.ok) {
                        const data = await res.json();
                        setProfile(data);
                        setPhotoPreview(resolveProfilePhotoUrl(data?.profile_photo, data?.profile_photo_url));
                    }
                }
            } catch (e) {
                toast.error("Failed to load profile settings");
            } finally {
                setLoading(false);
            }
        };
        void fetchProfile();
    }, []);

    React.useEffect(() => {
        if (!cropModalOpen) return;

        const handleMouseMove = (event: MouseEvent) => {
            if (!dragStateRef.current.active || !cropImageSize.width || !cropImageSize.height) return;
            const nextX = dragStateRef.current.originX + (event.clientX - dragStateRef.current.startX);
            const nextY = dragStateRef.current.originY + (event.clientY - dragStateRef.current.startY);
            const clamped = clampOffsets(cropImageSize.width, cropImageSize.height, cropState.zoom, nextX, nextY);
            setCropState((prev) => ({ ...prev, ...clamped }));
        };

        const stopDrag = () => {
            dragStateRef.current.active = false;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', stopDrag);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', stopDrag);
        };
    }, [cropModalOpen, cropImageSize.height, cropImageSize.width, cropState.zoom]);

    const closeCropModal = () => {
        if (cropSourceUrl?.startsWith('blob:')) URL.revokeObjectURL(cropSourceUrl);
        setCropModalOpen(false);
        setCropSourceUrl(null);
        setCropState({ zoom: 1, offsetX: 0, offsetY: 0 });
        setCropImageSize({ width: 0, height: 0 });
        dragStateRef.current.active = false;
    };

    const handlePhotoSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        if (!file) return;
        const objectUrl = URL.createObjectURL(file);
        setCropSourceUrl(objectUrl);
        setCropState({ zoom: 1, offsetX: 0, offsetY: 0 });
        setCropImageSize({ width: 0, height: 0 });
        setCropModalOpen(true);
    };

    const handleCropImageLoad = () => {
        const image = imageRef.current;
        if (!image) return;
        setCropImageSize({ width: image.naturalWidth, height: image.naturalHeight });
    };

    const handleCropConfirm = async () => {
        const image = imageRef.current;
        if (!image || !cropImageSize.width || !cropImageSize.height) return;

        const { displayWidth, displayHeight } = getDisplayMetrics(cropImageSize.width, cropImageSize.height, cropState.zoom);
        const left = (CROP_SIZE - displayWidth) / 2 + cropState.offsetX;
        const top = (CROP_SIZE - displayHeight) / 2 + cropState.offsetY;
        const sx = clamp(((0 - left) / displayWidth) * cropImageSize.width, 0, cropImageSize.width);
        const sy = clamp(((0 - top) / displayHeight) * cropImageSize.height, 0, cropImageSize.height);
        const sw = clamp((CROP_SIZE / displayWidth) * cropImageSize.width, 1, cropImageSize.width - sx);
        const sh = clamp((CROP_SIZE / displayHeight) * cropImageSize.height, 1, cropImageSize.height - sy);

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        if (!context) return;

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.drawImage(image, sx, sy, sw, sh, 0, 0, 512, 512);

        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((result) => resolve(result), 'image/jpeg', 0.92));
        if (!blob) {
            toast.error("Failed to crop image");
            return;
        }

        const croppedFile = new File([blob], `profile-${Date.now()}.jpg`, { type: 'image/jpeg' });
        const previewUrl = URL.createObjectURL(blob);
        setPhotoFile(croppedFile);
        setPhotoPreview((prev) => {
            if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
            return previewUrl;
        });
        closeCropModal();
    };

    const handlePhotoUpload = async () => {
        const user = getStoredUser<any>();
        if (!user?.id || !photoFile) return;

        setUploadingPhoto(true);
        try {
            const formData = new FormData();
            formData.append('profile_photo', photoFile);

            const res = await fetch(ENDPOINTS.USERS.DETAIL(user.id), {
                method: 'PUT',
                body: formData,
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast.error(data?.message || "Failed to update profile picture.");
                return;
            }

            const nextUrl = resolveProfilePhotoUrl(data?.profile_photo, data?.profile_photo_url);
            const nextProfile = { ...(profile || {}), ...data, profile_photo_url: nextUrl || undefined };
            setProfile(nextProfile);
            setPhotoPreview(nextUrl);
            setPhotoFile(null);
            persistStoredUser({
                ...(user || {}),
                ...data,
                profile_photo_url: nextUrl || undefined,
            });
            toast.success("Profile picture updated successfully");
        } catch {
            toast.error("Failed to update profile picture.");
        } finally {
            setUploadingPhoto(false);
        }
    };

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
        <>
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
                                <CardDescription>Upload and crop your profile picture.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center gap-4">
                                <Avatar className="h-32 w-32 border-4 border-muted">
                                    <AvatarImage src={photoPreview || undefined} />
                                    <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                                        {profile?.name?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handlePhotoSelection}
                                />
                                <div className="grid w-full gap-2">
                                    <Button variant="outline" size="sm" className="w-full" onClick={() => fileInputRef.current?.click()}>
                                        <Camera size={14} className="mr-2" /> Change Photo
                                    </Button>
                                    {photoFile && (
                                        <Button size="sm" className="w-full" onClick={handlePhotoUpload} disabled={uploadingPhoto}>
                                            <Upload size={14} className="mr-2" />
                                            {uploadingPhoto ? "Uploading..." : "Upload Photo"}
                                        </Button>
                                    )}
                                </div>
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

        <Dialog open={cropModalOpen} onOpenChange={(open) => { if (!open) closeCropModal(); }}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Crop Profile Picture</DialogTitle>
                    <DialogDescription>Drag to position the image and adjust zoom before upload.</DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                    <div className="flex flex-col items-center gap-4">
                        <div
                            className="relative overflow-hidden rounded-[32px] border bg-muted/30 shadow-inner select-none"
                            style={{ width: CROP_SIZE, height: CROP_SIZE }}
                            onMouseDown={(event) => {
                                dragStateRef.current = {
                                    startX: event.clientX,
                                    startY: event.clientY,
                                    originX: cropState.offsetX,
                                    originY: cropState.offsetY,
                                    active: true,
                                };
                            }}
                        >
                            {cropSourceUrl && (
                                <img
                                    ref={imageRef}
                                    src={cropSourceUrl}
                                    alt="Crop preview"
                                    onLoad={handleCropImageLoad}
                                    draggable={false}
                                    className="absolute top-1/2 left-1/2 max-w-none pointer-events-none"
                                    style={{
                                        width: cropImageSize.width ? getDisplayMetrics(cropImageSize.width, cropImageSize.height, cropState.zoom).displayWidth : 'auto',
                                        height: cropImageSize.height ? getDisplayMetrics(cropImageSize.width, cropImageSize.height, cropState.zoom).displayHeight : 'auto',
                                        transform: `translate(calc(-50% + ${cropState.offsetX}px), calc(-50% + ${cropState.offsetY}px))`,
                                    }}
                                />
                            )}
                            <div className="pointer-events-none absolute inset-0 rounded-[32px] ring-2 ring-white/80 dark:ring-primary/70" />
                        </div>
                        <p className="text-xs text-muted-foreground">Drag to position. Use zoom for a tighter crop.</p>
                    </div>
                    <div className="space-y-2">
                        <Label>Zoom ({cropState.zoom.toFixed(1)}x)</Label>
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.1}
                            value={cropState.zoom}
                            onChange={(event) => {
                                const zoom = Number(event.target.value);
                                const clamped = clampOffsets(cropImageSize.width, cropImageSize.height, zoom, cropState.offsetX, cropState.offsetY);
                                setCropState((prev) => ({ ...prev, zoom, ...clamped }));
                            }}
                            className="w-full accent-primary"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={closeCropModal}>
                        <X size={14} className="mr-2" />
                        Cancel
                    </Button>
                    <Button onClick={() => void handleCropConfirm()}>
                        <Crop size={14} className="mr-2" />
                        Crop & Use
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}

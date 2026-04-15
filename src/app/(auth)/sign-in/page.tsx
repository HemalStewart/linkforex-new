'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ENDPOINTS } from '@/lib/api';
import { getStoredUser, setStoredUser } from '@/lib/authStorage';
import { Logo } from '@/components/logo';
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');

  React.useEffect(() => {
    const user = getStoredUser();
    if (user) {
      router.replace('/dashboard');
    }

    const rememberedLogin = localStorage.getItem('remembered_login');
    if (rememberedLogin) {
      setIdentifier(rememberedLogin);
      setRememberMe(true);
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier, username: identifier, password })
      });

      const data = await response.json();

      if (response.ok) {
        setStoredUser(data.user, rememberMe);
        if (rememberMe) {
          localStorage.setItem('remembered_login', identifier);
        } else {
          localStorage.removeItem('remembered_login');
        }
        toast.success("Welcome back!");
        const nextPath = searchParams.get('next') || '/dashboard';
        router.push(nextPath);
      } else {
        toast.error(data.messages?.error || "Invalid login credentials.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Logo size={34} className="w-auto" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome</h2>
          <p className="text-sm text-muted-foreground">Enter your credentials to access the portal</p>
        </div>

        <div className="rounded-xl border bg-card p-8 shadow-lg">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email or Username</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  placeholder="name@example.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium leading-none">Password</label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  className="pl-10 pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(!!checked)}
              />
              <label htmlFor="remember" className="text-sm font-medium leading-none cursor-pointer">Remember me</label>
            </div>

            <Button className="w-full" type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>
        
        <p className="text-center text-xs text-muted-foreground">
          © 2026 LinkForex. Protected by 256-bit encryption.
        </p>
      </div>
    </div>
  );
}

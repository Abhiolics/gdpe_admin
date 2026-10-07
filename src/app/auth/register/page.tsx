'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { UserPlus, User, Mail, Phone, Lock, Loader2, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    referralCode: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await register(formData);
      router.push('/auth/login');
    } catch (err) {
      // toast shown in context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4 selection:bg-emerald-500 selection:text-slate-950">
      {/* Background radial glow */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950" />

      <Card className="w-full max-w-md border-slate-800/80 bg-slate-900/50 backdrop-blur-xl shadow-2xl shadow-emerald-950/20">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <UserPlus className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-1.5">
            <span>Create <span className="text-emerald-400">GD<span className="text-white">Pay</span></span> Admin</span>
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">
            Sign up as an administrator for GDPay Operations
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-slate-300">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Sandeep Gupta"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="pl-10 border-slate-800 bg-slate-950 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@gdpe.info"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="pl-10 border-slate-800 bg-slate-950 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-slate-300">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="9198140801"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  className="pl-10 border-slate-800 bg-slate-950 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="pl-10 border-slate-800 bg-slate-950 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="referralCode" className="text-slate-300">Referral Code</Label>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">(Optional)</span>
              </div>
              <div className="relative">
                <Share2 className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input
                  id="referralCode"
                  type="text"
                  placeholder="GDPE83A9"
                  value={formData.referralCode}
                  onChange={handleChange}
                  className="pl-10 border-slate-800 bg-slate-950 text-emerald-400 font-mono placeholder:text-slate-600 uppercase focus-visible:ring-emerald-500"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading} 
              className="w-full bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition-all font-semibold mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Register Administrator'
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 border-t border-slate-800/60 pt-6 text-center">
          <div className="text-sm text-slate-400">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
              Login here
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

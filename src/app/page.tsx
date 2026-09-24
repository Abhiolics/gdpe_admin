'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push('/admin');
      } else {
        router.push('/auth/login');
      }
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 text-white gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      <p className="text-sm text-slate-500 font-medium">Redirecting...</p>
    </div>
  );
}

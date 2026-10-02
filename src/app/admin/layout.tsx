'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Loader2 } from 'lucide-react';

interface TabContextProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabContext = createContext<TabContextProps>({
  activeTab: 'dashboard',
  setActiveTab: () => {},
});

export const useTab = () => useContext(TabContext);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');

  const bypassAuth = false;

  // Sync tab with URL parameter on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab) {
        setActiveTab(tab);
      }
    }
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', `/admin?tab=${tab}`);
    }
  };

  useEffect(() => {
    if (!bypassAuth && !isLoading) {
      if (!isAuthenticated || user?.role !== 'admin' || user?.email?.toLowerCase() !== 'keralawins123@gmail.com') {
        router.push('/auth/login');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 text-white gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
        <p className="text-sm text-slate-400 font-medium animate-pulse">Checking credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated && !bypassAuth) {
    return null;
  }

  return (
    <TabContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
      <div className="h-full min-h-screen bg-slate-950 text-white">
        {/* Sidebar gets tab state directly */}
        <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />

        {/* Main Panel Content Wrapper */}
        <div className="pl-64 flex flex-col min-h-screen">
          {/* Top Header navbar */}
          <Header />

          {/* Dynamic page container */}
          <main className="flex-1 px-8 py-24 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </TabContext.Provider>
  );
}

'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Activity, 
  Gem, 
  ClipboardList, 
  Settings, 
  LogOut,
  Sparkles,
  Share2,
  Wallet
} from 'lucide-react';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ className, activeTab, setActiveTab }: SidebarProps) {
  const { logout, setSandboxMode } = useAuth();

  const menuItems = [
    {
      title: 'Dashboard',
      key: 'dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Users & Wallet',
      key: 'users',
      icon: Users,
    },
    {
      title: 'Deposits Review',
      key: 'deposits',
      icon: ArrowUpCircle,
    },
    {
      title: 'Withdrawals Review',
      key: 'withdrawals',
      icon: ArrowDownCircle,
    },
    {
      title: 'Subscription Plans',
      key: 'plans',
      icon: Gem,
    },
    {
      title: 'Tasks & Proofs',
      key: 'tasks',
      icon: ClipboardList,
    },
    {
      title: 'Gift Codes',
      key: 'gift-codes',
      icon: Activity,
    },
    {
      title: 'Referrals Audit',
      key: 'referrals',
      icon: Share2,
    },
    {
      title: 'UPI Directory',
      key: 'upi-directory',
      icon: Wallet,
    },
    {
      title: 'System Settings',
      key: 'settings',
      icon: Settings,
    },
  ];

  return (
    <aside className={cn("fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-slate-800 bg-slate-900/60 backdrop-blur-xl transition-all duration-300", className)}>
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
        <button onClick={() => setActiveTab('dashboard')} className="flex items-center gap-3 cursor-pointer bg-transparent border-none p-0 text-left group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 text-slate-950 font-black shadow-[0_0_18px_rgba(16,185,129,0.4)] border border-emerald-300/30 group-hover:scale-105 transition-transform duration-200">
            <span className="text-sm font-black tracking-tighter text-slate-950">GD</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-black tracking-tight text-white">GD<span className="text-emerald-400">Pay</span></span>
            <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">Admin</span>
          </div>
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={cn(
                "w-full group flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer border-none text-left",
                isActive 
                  ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-600/20 border-l-2 border-emerald-400" 
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
              )}
            >
              <item.icon className={cn("h-4.5 w-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110", isActive ? "text-white" : "text-slate-500 group-hover:text-emerald-400")} />
              <span>{item.title}</span>
            </button>
          );
        })}
      </nav>


      <div className="border-t border-slate-800 p-4 space-y-2">
        <button
          onClick={() => logout()}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800/40 px-4 py-2.5 text-sm font-medium text-slate-400 border border-slate-800/50 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

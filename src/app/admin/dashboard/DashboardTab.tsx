'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Users, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ClipboardCheck, 
  Coins, 
  Loader2, 
  TrendingUp, 
  Clock, 
  Gem, 
  Gift
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';
import Link from 'next/link';

// Fallback mockup stats in case API returns empty or fails
const fallbackStats = {
  totalUsers: 1420,
  activeUsers: 890,
  blockedUsers: 15,
  totalDeposits: 458900,
  pendingDeposits: 8,
  totalWithdrawals: 189400,
  pendingWithdrawals: 12,
  activePlans: 4,
  activeTasks: 18,
  activeGiftCodes: 9,
  recentActivity: [
    { id: '1', type: 'deposit', user: 'Sandeep Gupta', amount: 4000, status: 'pending' },
    { id: '2', type: 'withdrawal', user: 'Amit Kumar', amount: 500, status: 'pending' },
    { id: '3', type: 'task_submission', user: 'Rohan Shah', task: 'Complete Profile', status: 'pending' },
  ],
  cashFlowData: [
    { month: 'Jan', deposits: 12000, withdrawals: 5000 },
    { month: 'Feb', deposits: 19000, withdrawals: 8000 },
    { month: 'Mar', deposits: 32000, withdrawals: 15000 },
    { month: 'Apr', deposits: 28000, withdrawals: 12000 },
    { month: 'May', deposits: 45000, withdrawals: 22000 },
    { month: 'Jun', deposits: 58000, withdrawals: 29000 },
  ],
  onboardingData: [
    { day: 'Mon', count: 12 },
    { day: 'Tue', count: 19 },
    { day: 'Wed', count: 32 },
    { day: 'Thu', count: 25 },
    { day: 'Fri', count: 45 },
    { day: 'Sat', count: 35 },
    { day: 'Sun', count: 28 },
  ]
};

export default function DashboardPage() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const { data: dashboardRes, isLoading, error, isError } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminApi.getDashboard(),
    retry: 1,
    enabled: mounted,
  });

  const stats = dashboardRes?.data?.data || {};

  // Extract nested metrics with backward compatibility for flat objects
  const totalUsers = stats.users?.total ?? stats.totalUsers ?? 0;
  const activeUsers = stats.users?.active ?? stats.activeUsers ?? 0;
  const blockedUsers = stats.users?.blocked ?? stats.blockedUsers ?? 0;

  const totalDepositsAmount = stats.deposits?.totalApprovedAmount ?? stats.totalDeposits ?? 0;
  const pendingDeposits = stats.deposits?.pendingCount ?? stats.pendingDeposits ?? 0;

  const totalWithdrawalsAmount = stats.withdrawals?.totalApprovedAmount ?? stats.totalWithdrawals ?? 0;
  const pendingWithdrawals = stats.withdrawals?.pendingCount ?? stats.pendingWithdrawals ?? 0;

  const totalTasks = stats.tasks?.totalTasks ?? stats.totalTasks ?? stats.activeTasks ?? 0;
  const pendingSubmissions = stats.tasks?.pendingSubmissions ?? stats.pendingSubmissions ?? stats.taskStats?.pending ?? 0;

  const totalPlans = stats.plans?.totalPlans ?? stats.totalPlans ?? stats.activePlans ?? 0;

  const totalWalletBalance = stats.wallets?.totalWalletBalance ?? stats.totalWalletBalance ?? 0;

  // Fallback data for charts if missing
  const cashFlowData = stats.cashFlowData && stats.cashFlowData.length > 0 
    ? stats.cashFlowData 
    : fallbackStats.cashFlowData;

  const onboardingData = stats.onboardingData && stats.onboardingData.length > 0 
    ? stats.onboardingData 
    : fallbackStats.onboardingData;

  const cardData = [
    {
      title: 'Total System Users',
      value: totalUsers,
      description: `${activeUsers} Active · ${blockedUsers} Blocked`,
      icon: Users,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/25',
      href: '/admin?tab=users',
    },
    {
      title: 'Total Wallet Liabilities',
      value: `₹${totalWalletBalance.toLocaleString('en-IN')}`,
      description: 'Combined system balance',
      icon: Coins,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
      href: '/admin?tab=users',
    },
    {
      title: 'Approved Deposits',
      value: `₹${totalDepositsAmount.toLocaleString('en-IN')}`,
      description: `${pendingDeposits} Pending verifications`,
      icon: ArrowUpRight,
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/25',
      href: '/admin?tab=deposits',
    },
    {
      title: 'Approved Withdrawals',
      value: `₹${totalWithdrawalsAmount.toLocaleString('en-IN')}`,
      description: `${pendingWithdrawals} Pending payouts`,
      icon: ArrowDownLeft,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/25',
      href: '/admin?tab=withdrawals',
    },
    {
      title: 'Task Submissions',
      value: `${totalTasks} Tasks`,
      description: `${pendingSubmissions} Pending audits`,
      icon: ClipboardCheck,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
      href: '/admin?tab=tasks',
    },
    {
      title: 'Subscription Plans',
      value: `${totalPlans} Plans`,
      description: 'Configured packages',
      icon: Gem,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/25',
      href: '/admin?tab=plans',
    },
  ];

  if (!mounted || isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <p className="text-sm text-slate-400 font-medium">Aggregating system reports...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center p-6 border border-dashed border-rose-500/20 bg-rose-500/5 rounded-xl max-w-2xl mx-auto">
        <p className="text-sm text-rose-400 font-semibold">Failed to fetch dashboard statistics</p>
        <p className="text-xs text-rose-455">{error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }


  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Title */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Operations Dashboard</h1>
        <p className="text-slate-400 text-sm">Real-time ledger overview, deposits validation, and system parameters control.</p>
      </div>

      {/* Grid Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cardData.map((card, idx) => {
          const Content = (
            <Card className="border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 transition-all duration-200 cursor-pointer shadow-lg backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                  {card.title}
                </CardTitle>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${card.color}`}>
                  <card.icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white tracking-tight">{card.value}</div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-400 shrink-0" />
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );

          return card.href ? (
            <Link key={idx} href={card.href} passHref>
              {Content}
            </Link>
          ) : (
            <React.Fragment key={idx}>{Content}</React.Fragment>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Cashflow Chart */}
        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white">Cashflow Statements</CardTitle>
            <CardDescription className="text-slate-500 text-xs">Comparison of monthly deposits vs withdrawals</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDeposits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorWithdrawals" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                <Area type="monotone" name="Deposits" dataKey="deposits" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorDeposits)" />
                <Area type="monotone" name="Withdrawals" dataKey="withdrawals" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorWithdrawals)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Onboarding Chart */}
        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white">Daily Registration Trends</CardTitle>
            <CardDescription className="text-slate-500 text-xs">Number of new user signups over the last week</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={onboardingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }} />
                <Bar name="New Signups" dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { referralApi } from '@/lib/api';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  Share2, 
  Play, 
  Sparkles, 
  TrendingUp, 
  RefreshCw, 
  AlertCircle,
  Coins,
  Users,
  Copy,
  Users2
} from 'lucide-react';
import { toast } from 'sonner';

export default function ReferralsTab() {
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('system-ledger');

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // 1. GET referral/admin/commissions (Platform global log)
  const { 
    data: adminCommsRes, 
    isLoading: isAdminCommsLoading, 
    isError: isAdminCommsError, 
    refetch: refetchAdminComms 
  } = useQuery({
    queryKey: ['admin', 'commissions'],
    queryFn: () => referralApi.getCommissionsAdmin(),
    enabled: mounted,
  });

  // 2. GET referral/stats (Personal referral stats)
  const { 
    data: statsRes, 
    isLoading: isStatsLoading, 
    refetch: refetchStats 
  } = useQuery({
    queryKey: ['user', 'referral-stats'],
    queryFn: () => referralApi.getStats(),
    enabled: mounted,
  });

  // 3. GET referral/my-team (Personal network list)
  const { 
    data: teamRes, 
    isLoading: isTeamLoading, 
    refetch: refetchTeam 
  } = useQuery({
    queryKey: ['user', 'team'],
    queryFn: () => referralApi.getMyTeam(),
    enabled: mounted && activeSubTab === 'my-team',
  });

  // 4. GET referral/commissions (Personal earnings log)
  const { 
    data: userCommsRes, 
    isLoading: isUserCommsLoading, 
    refetch: refetchUserComms 
  } = useQuery({
    queryKey: ['user', 'commissions'],
    queryFn: () => referralApi.getCommissions(),
    enabled: mounted && activeSubTab === 'my-earnings',
  });

  // Safe list extractor
  const extractList = (res: any) => {
    if (!res) return [];
    const rData = res.data?.data;
    if (Array.isArray(rData)) return rData;
    if (rData && typeof rData === 'object') {
      for (const key of Object.keys(rData)) {
        if (Array.isArray((rData as any)[key])) return (rData as any)[key];
      }
    }
    const responseData = res.data;
    if (Array.isArray(responseData)) return responseData;
    if (responseData && typeof responseData === 'object') {
      for (const key of Object.keys(responseData)) {
        if (Array.isArray((responseData as any)[key])) return (responseData as any)[key];
      }
    }
    return [];
  };

  const adminCommissions = extractList(adminCommsRes);
  const team = extractList(teamRes);
  const userCommissions = extractList(userCommsRes);

  const refStats = statsRes?.data?.data || statsRes?.data || {
    referralCode: 'N/A',
    totalEarnings: 0,
    totalReferrals: 0,
    level1Count: 0,
    level2Count: 0,
    level3Count: 0
  };

  // 5. POST referral/admin/run-income (Admin execution engine)
  const runIncomeMutation = useMutation({
    mutationFn: () => referralApi.runIncomeAdmin(),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'commissions'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'referral-stats'] });
      toast.success(res?.data?.message || 'Referral income distribution completed successfully!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to execute referral income job');
    }
  });

  // Calculate platform disburse sum
  const globalDisbursedSum = adminCommissions.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

  const handleRunIncome = () => {
    toast.promise(runIncomeMutation.mutateAsync(), {
      loading: 'Calculating network hierarchy and distributing payouts...',
      success: 'Commission processing finished!',
      error: 'Payout engine execution failed.',
    });
  };

  const syncAllData = () => {
    refetchAdminComms();
    refetchStats();
    if (activeSubTab === 'my-team') refetchTeam();
    if (activeSubTab === 'my-earnings') refetchUserComms();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Share2 className="h-8 w-8 text-emerald-400" />
            Referrals & Commissions Portal
          </h1>
          <p className="text-slate-400 text-sm">
            Distribute platform-wide level payouts, audit global commission registers, and check network statistics.
          </p>
        </div>
        
        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button 
            onClick={handleRunIncome}
            disabled={runIncomeMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-2 shadow-lg shadow-emerald-600/10"
          >
            {runIncomeMutation.isPending ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
            ) : (
              <Play className="h-4.5 w-4.5 fill-current" />
            )}
            Run Income Engine
          </Button>

          <Button 
            variant="outline"
            onClick={syncAllData}
            className="border-slate-800 bg-slate-900/50 text-slate-300 hover:bg-slate-850 hover:text-white"
          >
            <RefreshCw className="h-4.5 w-4.5" />
          </Button>
        </div>
      </div>

      {/* Referral Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl">
          <CardContent className="pt-6 text-center space-y-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">My Referrer Code</span>
            <div className="flex items-center justify-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-850/65">
              <span className="font-mono text-sm font-bold text-white select-all">{refStats.referralCode}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 hover:bg-slate-800 text-slate-400 hover:text-white"
                onClick={() => {
                  navigator.clipboard.writeText(refStats.referralCode);
                  toast.success('Referral code copied to clipboard!');
                }}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl">
          <CardContent className="pt-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Network Team</span>
              <h3 className="text-xl font-bold text-white">{refStats.totalReferrals || 0} Users</h3>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/15">
              <Users2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl">
          <CardContent className="pt-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">My Commissions Earned</span>
              <h3 className="text-xl font-bold text-white">₹{refStats.totalEarnings?.toLocaleString('en-IN') || 0}</h3>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/15">
              <Coins className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl">
          <CardContent className="pt-4 flex flex-col justify-center gap-1.5">
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Level Breakdown</span>
            <div className="grid grid-cols-3 gap-1 text-center">
              <div className="bg-slate-950/45 py-1 rounded border border-slate-850/60 text-[10px]">
                <div className="text-slate-450 font-semibold text-[9px]">L1</div>
                <div className="font-bold text-white text-[11px]">{refStats.level1Count || 0}</div>
              </div>
              <div className="bg-slate-950/45 py-1 rounded border border-slate-850/60 text-[10px]">
                <div className="text-slate-450 font-semibold text-[9px]">L2</div>
                <div className="font-bold text-white text-[11px]">{refStats.level2Count || 0}</div>
              </div>
              <div className="bg-slate-950/45 py-1 rounded border border-slate-850/60 text-[10px]">
                <div className="text-slate-450 font-semibold text-[9px]">L3</div>
                <div className="font-bold text-white text-[11px]">{refStats.level3Count || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sub-Tabs selection */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="border-slate-800 bg-slate-900 text-slate-400">
          <TabsTrigger value="system-ledger" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            System Ledger (Global)
          </TabsTrigger>
          <TabsTrigger value="my-team" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            My Network Team
          </TabsTrigger>
          <TabsTrigger value="my-earnings" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            My Earning Logs
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Global system ledger (commissions admin) */}
        <TabsContent value="system-ledger" className="mt-6">
          <Card className="border-slate-800 bg-slate-900/30 backdrop-blur-xl shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <CardTitle className="text-base font-bold text-white">System Payout Registry</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Global ledger of all referral settlements processed on the platform. (Current Sum: ₹{globalDisbursedSum.toLocaleString('en-IN')})
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isAdminCommsLoading ? (
                <div className="flex h-60 flex-col items-center justify-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                  <p className="text-sm text-slate-400">Loading platform records...</p>
                </div>
              ) : isAdminCommsError ? (
                <div className="flex h-60 flex-col items-center justify-center gap-2 text-rose-400">
                  <AlertCircle className="h-8 w-8" />
                  <p className="text-sm">Failed to retrieve ledger data.</p>
                </div>
              ) : adminCommissions.length === 0 ? (
                <div className="py-20 text-center text-slate-500 text-sm italic">
                  No system commission payouts registered yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-950/20 border-b border-slate-800">
                      <TableRow className="border-slate-850 hover:bg-transparent">
                        <TableHead className="text-slate-400 font-semibold text-xs py-3.5 pl-6">Referrer</TableHead>
                        <TableHead className="text-slate-400 font-semibold text-xs py-3.5">Referred User</TableHead>
                        <TableHead className="text-slate-400 font-semibold text-xs py-3.5">Compensation Level</TableHead>
                        <TableHead className="text-slate-400 font-semibold text-xs py-3.5">Settled Amount</TableHead>
                        <TableHead className="text-slate-400 font-semibold text-xs py-3.5">State</TableHead>
                        <TableHead className="text-slate-400 font-semibold text-xs py-3.5 pr-6 text-right">Settled On</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminCommissions.map((item: any) => {
                        const itemId = item._id || item.id;
                        const referrerName = item.referrer?.fullName || item.userId?.fullName || 'Platform User';
                        const referrerEmail = item.referrer?.email || item.userId?.email || 'N/A';
                        
                        const referredName = item.referredUser?.fullName || item.referee?.fullName || 'Task Performer';
                        const referredEmail = item.referredUser?.email || item.referee?.email || 'N/A';

                        return (
                          <TableRow key={itemId} className="border-slate-850 hover:bg-slate-850/20">
                            <TableCell className="py-3.5 pl-6">
                              <div className="font-semibold text-white text-sm">{referrerName}</div>
                              <div className="text-slate-500 text-xs">{referrerEmail}</div>
                            </TableCell>
                            <TableCell className="py-3.5">
                              <div className="font-medium text-slate-300 text-sm">{referredName}</div>
                              <div className="text-slate-500 text-xs">{referredEmail}</div>
                            </TableCell>
                            <TableCell className="py-3.5">
                              <Badge className="bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[10px] px-2 py-0.5 font-bold">
                                Level {item.level || 1}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-3.5 font-bold text-white text-sm">
                              ₹{(item.amount || 0).toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell className="py-3.5">
                              <Badge className="bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 text-[10px] px-2 py-0.5">
                                {(item.status || 'paid').toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-3.5 pr-6 text-right text-xs text-slate-500 font-mono">
                              {item.createdAt ? new Date(item.createdAt).toLocaleString('en-IN') : 'Just now'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Personal Network Team (my-team) */}
        <TabsContent value="my-team" className="mt-6">
          <Card className="border-slate-800 bg-slate-900/30 backdrop-blur-xl shadow-xl">
            <CardHeader className="border-b border-slate-800 pb-4">
              <CardTitle className="text-base font-bold text-white">My Direct & Indirect Referrals</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Registered platform profiles that signed up using your referrer code.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isTeamLoading ? (
                <div className="flex h-60 flex-col items-center justify-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                  <p className="text-sm text-slate-400">Loading network tree...</p>
                </div>
              ) : team.length === 0 ? (
                <div className="py-20 text-center text-slate-500 text-sm italic">
                  No network team members linked to your profile code yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-950/20 border-b border-slate-800">
                      <TableRow className="border-slate-850 hover:bg-transparent">
                        <TableHead className="text-slate-400 font-semibold text-xs py-3.5 pl-6">Member Profile</TableHead>
                        <TableHead className="text-slate-400 font-semibold text-xs py-3.5">Network Level</TableHead>
                        <TableHead className="text-slate-400 font-semibold text-xs py-3.5">Registration Status</TableHead>
                        <TableHead className="text-slate-400 font-semibold text-xs py-3.5 pr-6 text-right">Joined On</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {team.map((member: any) => {
                        const mId = member._id || member.id;
                        return (
                          <TableRow key={mId} className="border-slate-850 hover:bg-slate-850/20">
                            <TableCell className="py-3.5 pl-6">
                              <div className="font-semibold text-white text-sm">{member.fullName || 'Network Partner'}</div>
                              <div className="text-slate-500 text-xs">{member.email}</div>
                            </TableCell>
                            <TableCell className="py-3.5">
                              <Badge className="bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[10px] px-2 py-0.5 font-bold">
                                Level {member.level || 1}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-3.5">
                              <Badge className="bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 text-[10px] px-2 py-0.5 font-semibold">
                                Active Partner
                              </Badge>
                            </TableCell>
                            <TableCell className="py-3.5 pr-6 text-right text-xs text-slate-500 font-mono">
                              {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Personal commission logs (commissions user) */}
        <TabsContent value="my-earnings" className="mt-6">
          <Card className="border-slate-800 bg-slate-900/30 backdrop-blur-xl shadow-xl">
            <CardHeader className="border-b border-slate-800 pb-4">
              <CardTitle className="text-base font-bold text-white">My Commission Earnings Log</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Detailed record of rewards credited directly to your balance from your network team activities.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isUserCommsLoading ? (
                <div className="flex h-60 flex-col items-center justify-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                  <p className="text-sm text-slate-400">Loading commission ledger...</p>
                </div>
              ) : userCommissions.length === 0 ? (
                <div className="py-20 text-center text-slate-500 text-sm italic">
                  No personal referral rewards earned on this account yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-950/20 border-b border-slate-800">
                      <TableRow className="border-slate-850 hover:bg-transparent">
                        <TableHead className="text-slate-400 font-semibold text-xs py-3.5 pl-6">Source User</TableHead>
                        <TableHead className="text-slate-400 font-semibold text-xs py-3.5">Compensation Level</TableHead>
                        <TableHead className="text-slate-400 font-semibold text-xs py-3.5">Credited Amount</TableHead>
                        <TableHead className="text-slate-400 font-semibold text-xs py-3.5 pr-6 text-right">Settled Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userCommissions.map((comm: any) => {
                        const cId = comm._id || comm.id;
                        const refereeEmail = comm.referredUser?.email || comm.referee?.email || 'Referee User';
                        const refereeName = comm.referredUser?.fullName || comm.referee?.fullName || 'Client User';

                        return (
                          <TableRow key={cId} className="border-slate-850 hover:bg-slate-850/20">
                            <TableCell className="py-3.5 pl-6">
                              <div className="font-semibold text-slate-200 text-sm">{refereeName}</div>
                              <div className="text-slate-500 text-xs">{refereeEmail}</div>
                            </TableCell>
                            <TableCell className="py-3.5">
                              <Badge className="bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 text-[10px] px-2 py-0.5 font-bold">
                                L{comm.level || 1}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-3.5 font-bold text-white text-sm">
                              ₹{(comm.amount || 0).toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell className="py-3.5 pr-6 text-right text-xs text-slate-500 font-mono">
                              {comm.createdAt ? new Date(comm.createdAt).toLocaleDateString() : 'Just now'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

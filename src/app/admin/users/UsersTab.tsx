'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { adminApi, upiApi } from '@/lib/api';
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
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Lock, 
  Unlock, 
  UserMinus, 
  UserCheck, 
  Wallet, 
  Loader2, 
  User,
  Copy,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

// Fallback mockup data
const fallbackUsers = [
  { 
    id: '6a265cedaa6616b5229e932c', 
    fullName: 'Sandeep Gupta', 
    email: 'sgupta73853@bbdu.ac.in', 
    phoneNumber: '9198140801', 
    balance: 3500, 
    isBlocked: false, 
    isActive: true,
    referralCode: 'GDPE83A9',
    referredBy: { fullName: 'System Admin', referralCode: 'SYS0001' }
  },
  { 
    id: '6a256d2e6eb9af80615c2e10', 
    fullName: 'Amit Kumar', 
    email: 'amit@gmail.com', 
    phoneNumber: '9198140802', 
    balance: 450, 
    isBlocked: true, 
    isActive: true,
    referralCode: 'AMIT9921',
    referredBy: { fullName: 'Sandeep Gupta', referralCode: 'GDPE83A9' }
  },
  { 
    id: '6a20e4b6035e8afb971f3597', 
    fullName: 'John Doe', 
    email: 'johndoe@example.com', 
    phoneNumber: '9198140803', 
    balance: 120, 
    isBlocked: false, 
    isActive: false,
    referralCode: 'JOHN1102',
    referredBy: null
  },
];

const fallbackUpis = [
  { id: 'u1', upiId: 'sgupta73853@paytm', accountHolderName: 'Sandeep Gupta', userId: '6a265cedaa6616b5229e932c', isPrimary: true },
  { id: 'u2', upiId: 'amitkumar@okaxis', accountHolderName: 'Amit Kumar', userId: '6a256d2e6eb9af80615c2e10', isPrimary: true },
  { id: 'u3', upiId: 'amit.k@upi', accountHolderName: 'Amit Kumar', userId: '6a256d2e6eb9af80615c2e10', isPrimary: false },
  { id: 'u4', upiId: 'johndoe@okicici', accountHolderName: 'John Doe', userId: '6a20e4b6035e8afb971f3597', isPrimary: true },
];

export default function UserManagementPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // User Details Modal state
  const [selectedUserDetails, setSelectedUserDetails] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const pageParam = searchParams.get('page');
  const initialPage = pageParam ? parseInt(pageParam, 10) : 1;
  const [currentPage, setCurrentPage] = useState(initialPage);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };
  
  // Wallet Adjust form state
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('debit');
  const [adjustReason, setAdjustReason] = useState('');
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);

  const [mounted, setMounted] = useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Users
  const { data: usersRes, isLoading: isQueryLoading, isFetching, error, isError } = useQuery({
    queryKey: ['admin', 'users', currentPage],
    queryFn: () => adminApi.getUsers(currentPage),
    enabled: mounted,
    placeholderData: keepPreviousData,
  });

  // Fetch UPIs
  const { data: upisRes } = useQuery({
    queryKey: ['admin', 'upis'],
    queryFn: () => upiApi.getAllUpisAdmin(),
    enabled: mounted,
  });

  const isLoading = !mounted || isQueryLoading;

  const getUpisList = () => {
    if (!upisRes) return fallbackUpis;
    const rData = upisRes.data?.data;
    if (Array.isArray(rData)) return rData;
    if (rData && typeof rData === 'object') {
      for (const key of Object.keys(rData)) {
        if (Array.isArray((rData as any)[key])) return (rData as any)[key];
      }
    }
    const responseData = upisRes.data;
    if (Array.isArray(responseData)) return responseData;
    if (responseData && typeof responseData === 'object') {
      for (const key of Object.keys(responseData)) {
        if (Array.isArray((responseData as any)[key])) return (responseData as any)[key];
      }
    }
    return fallbackUpis;
  };

  const upiList = getUpisList();

  // Robust list extractor
  const getUsersList = () => {
    if (!usersRes) return [];
    const rData = usersRes.data?.data;
    if (Array.isArray(rData)) return rData;
    if (rData && typeof rData === 'object') {
      for (const key of Object.keys(rData)) {
        if (Array.isArray((rData as any)[key])) return (rData as any)[key];
      }
    }
    const responseData = usersRes.data;
    if (Array.isArray(responseData)) return responseData;
    if (responseData && typeof responseData === 'object') {
      for (const key of Object.keys(responseData)) {
        if (Array.isArray((responseData as any)[key])) return (responseData as any)[key];
      }
    }
    return [];
  };

  const users = getUsersList();

  const getPagination = () => {
    if (!usersRes) return { page: 1, limit: 10, total: 0, pages: 1 };
    if (usersRes.data?.data?.pagination) return usersRes.data.data.pagination;
    if (usersRes.data?.pagination) return usersRes.data.pagination;
    return { page: 1, limit: 10, total: 0, pages: 1 };
  };

  const pagination = getPagination();

  // Mutation: Block/Unblock
  const toggleBlockMutation = useMutation({
    mutationFn: ({ id, isBlocked }: { id: string; isBlocked: boolean }) => 
      isBlocked ? adminApi.unblockUser(id) : adminApi.blockUser(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success(`User successfully ${variables.isBlocked ? 'unblocked' : 'blocked'}`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Block action failed');
    }
  });

  // Mutation: Activate/Deactivate
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      isActive ? adminApi.deactivateUser(id) : adminApi.activateUser(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success(`User successfully ${variables.isActive ? 'deactivated' : 'activated'}`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Activation action failed');
    }
  });

  // Mutation: Adjust Wallet
  const adjustWalletMutation = useMutation({
    mutationFn: (data: { userId: string; amount: number; type: 'credit' | 'debit'; description: string }) => 
      adminApi.adjustWallet(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Wallet adjusted successfully');
      setIsAdjustOpen(false);
      setAdjustAmount('');
      setAdjustReason('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Wallet adjustment failed');
    }
  });

  const handleWalletAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !adjustAmount) return;
    
    const amountNum = parseFloat(adjustAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid positive amount');
      return;
    }

    adjustWalletMutation.mutate({
      userId: selectedUser.id || selectedUser._id,
      amount: amountNum,
      type: adjustType,
      description: adjustReason || `${adjustType === 'credit' ? 'Manual credit' : 'Manual debit'} by admin`,
    });
  };

  const getUserUpis = (u: any) => {
    if (!u) return [];
    if (Array.isArray(u.upis) && u.upis.length > 0) {
      return u.upis;
    }
    if (u.upi && typeof u.upi === 'object' && u.upi.upiId) {
      return [u.upi];
    }
    if (u.upiId) {
      return [{ 
        _id: u.upi?._id || 'direct-upi',
        upiId: u.upiId, 
        accountHolderName: u.upi?.accountHolderName || u.fullName || '', 
        isPrimary: true 
      }];
    }
    if (Array.isArray(u.upiIds) && u.upiIds.length > 0) {
      return u.upiIds.map((id: string, idx: number) => ({
        _id: `upi-${idx}`,
        upiId: id,
        accountHolderName: u.fullName || '',
        isPrimary: idx === 0,
      }));
    }
    if (u.upis !== undefined || u.upi !== undefined || u.upiId !== undefined || u.upiIds !== undefined) {
      return [];
    }
    const userId = u.id || u._id;
    return upiList.filter((upi: any) => {
      const upiUserId = upi.userId?._id || upi.userId?.id || upi.userId;
      const upiUserObjId = upi.user?._id || upi.user?.id;
      return upiUserId === userId || upiUserObjId === userId;
    });
  };

  const filteredUsers = users.filter((user: any) => {
    const term = searchTerm.toLowerCase();
    const matchesName = user.fullName?.toLowerCase().includes(term);
    const matchesEmail = user.email?.toLowerCase().includes(term);
    const matchesPhone = user.phoneNumber?.includes(term);
    const matchesRefCode = user.referralCode?.toLowerCase().includes(term);
    const matchesInviterName = typeof user.referredBy === 'object' && user.referredBy?.fullName?.toLowerCase().includes(term);
    const matchesInviterCode = typeof user.referredBy === 'object' && user.referredBy?.referralCode?.toLowerCase().includes(term);
    const matchesInviterStr = typeof user.referredBy === 'string' && user.referredBy?.toLowerCase().includes(term);
    const matchesUpiId = user.upiId?.toLowerCase().includes(term);
    const matchesUpiObj = user.upi?.upiId?.toLowerCase().includes(term);
    const matchesUpiIds = Array.isArray(user.upiIds) && user.upiIds.some((id: string) => id?.toLowerCase().includes(term));
    const matchesUpis = Array.isArray(user.upis) && user.upis.some((upi: any) => 
      upi?.upiId?.toLowerCase().includes(term) || upi?.accountHolderName?.toLowerCase().includes(term)
    );

    return matchesName || matchesEmail || matchesPhone || matchesRefCode || matchesInviterName || matchesInviterCode || matchesInviterStr || matchesUpiId || matchesUpiObj || matchesUpiIds || matchesUpis;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">User Directory</h1>
          <p className="text-slate-400 text-sm">Control account statuses, manage security holds, inspect referral networks, and adjust wallet balances.</p>
        </div>
        
        {/* Search controls */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search name, email, ref code, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-slate-800 bg-slate-900/50 text-white focus-visible:ring-emerald-500"
          />
        </div>
      </div>

      <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl shadow-lg">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-60 flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              <p className="text-sm text-slate-400">Loading user registry...</p>
            </div>
          ) : isError ? (
            <div className="py-20 text-center text-rose-400 text-sm">
              Failed to load users: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-20 text-center text-slate-500 text-sm">
              No accounts matching criteria found.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto relative">
                {isFetching && (
                  <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px] z-10 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                  </div>
                )}
                <Table>
                <TableHeader className="border-slate-800 bg-slate-950/45">
                  <TableRow className="border-slate-850 hover:bg-transparent">
                    <TableHead className="text-slate-400 font-semibold py-3.5">User Profile</TableHead>
                    <TableHead className="text-slate-400 font-semibold py-3.5">Contact</TableHead>
                    <TableHead className="text-slate-400 font-semibold py-3.5">Referral Code</TableHead>
                    <TableHead className="text-slate-400 font-semibold py-3.5">Referred By (Inviter)</TableHead>
                    <TableHead className="text-slate-400 font-semibold py-3.5 text-right">Wallet Balance</TableHead>
                    <TableHead className="text-slate-400 font-semibold py-3.5 text-center">UPI</TableHead>
                    <TableHead className="text-slate-400 font-semibold py-3.5 text-center">Account State</TableHead>
                    <TableHead className="text-slate-400 font-semibold py-3.5 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u: any) => {
                    const userId = u.id || u._id;
                    const userUpis = getUserUpis(u);
                    const refCode = u.referralCode || 'N/A';

                    return (
                      <TableRow key={userId} className="border-slate-850 hover:bg-slate-900/20 transition-colors">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div 
                              onClick={() => {
                                setSelectedUserDetails(u);
                                setIsDetailsOpen(true);
                              }}
                              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors cursor-pointer shrink-0"
                              title="Click to view full profile"
                            >
                              <User className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span 
                                  onClick={() => {
                                    setSelectedUserDetails(u);
                                    setIsDetailsOpen(true);
                                  }}
                                  className="text-sm font-semibold text-slate-200 truncate max-w-[120px] hover:text-emerald-400 cursor-pointer transition-colors"
                                >
                                  {u.fullName}
                                </span>
                                {u.isBlocked && (
                                  <Badge variant="destructive" className="bg-rose-500/10 text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 text-[9px] px-1 py-0 shrink-0 font-semibold">
                                    Blocked
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[150px]">{u.email}</span>
                              <span className="text-[9px] text-slate-600 font-mono mt-0.5 truncate max-w-[150px]">ID: {userId}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-slate-350 text-xs font-mono">{u.phoneNumber}</span>
                            {u.registeredAt && (
                              <span className="text-[10px] text-slate-500 mt-0.5">
                                Reg: {new Date(u.registeredAt).toLocaleDateString('en-IN')}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Referral Code Column */}
                        <TableCell>
                          {refCode !== 'N/A' ? (
                            <div className="flex items-center gap-1.5 font-mono text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 w-fit">
                              <span>{refCode}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(refCode);
                                  toast.success(`Copied: ${refCode}`);
                                }}
                                className="p-0.5 rounded text-emerald-500 hover:text-emerald-300 transition-colors cursor-pointer"
                                title="Copy Referral Code"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-xs italic">N/A</span>
                          )}
                        </TableCell>

                        {/* Referred By (Inviter) Column */}
                        <TableCell>
                          {(() => {
                            if (!u.referredBy) {
                              return (
                                <Badge variant="outline" className="bg-slate-800/40 text-slate-400 border-slate-700/60 text-[10px] font-medium">
                                  Direct (No Inviter)
                                </Badge>
                              );
                            }
                            if (typeof u.referredBy === 'object') {
                              const inviterName = u.referredBy.fullName || u.referredBy.name || u.referredBy.email || 'Inviter';
                              const inviterCode = u.referredBy.referralCode;
                              return (
                                <div className="flex flex-col">
                                  <span className="text-xs font-medium text-slate-200">{inviterName}</span>
                                  {inviterCode && (
                                    <span className="text-[10px] font-mono text-teal-400 font-semibold">({inviterCode})</span>
                                  )}
                                </div>
                              );
                            }
                            return <span className="text-xs font-mono text-slate-300">{u.referredBy}</span>;
                          })()}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-white text-sm">
                              ₹{(u.wallet?.balance ?? u.balance ?? 0).toLocaleString('en-IN')}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[9px] font-mono shrink-0">
                              <span className="text-emerald-400">Cr: ₹{(u.wallet?.totalCredited ?? 0).toLocaleString('en-IN')}</span>
                              <span className="text-slate-600">|</span>
                              <span className="text-rose-450">Dr: ₹{(u.wallet?.totalDebited ?? 0).toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {userUpis.length === 0 ? (
                            <span className="text-slate-500 text-xs italic">No UPI Registered</span>
                          ) : (
                            <div className="flex flex-col gap-1.5 items-center justify-center">
                              {userUpis.map((upi: any, idx: number) => {
                                const upiString = typeof upi === 'string' ? upi : upi.upiId;
                                const isPrimary = upi.isPrimary ?? (idx === 0);
                                if (!upiString) return null;
                                return (
                                  <div key={upi._id || upi.id || idx} className="flex flex-col items-center">
                                    <div className="flex items-center gap-1.5 justify-center group/upi font-mono text-xs">
                                      <span className="text-teal-400 font-semibold">{upiString}</span>
                                      {isPrimary && (
                                        <Badge className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 text-[9px] px-1 py-0 font-bold shrink-0">
                                          Primary
                                        </Badge>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          navigator.clipboard.writeText(upiString);
                                          toast.success(`Copied: ${upiString}`);
                                        }}
                                        className="p-0.5 rounded text-slate-500 hover:text-emerald-400 hover:bg-slate-800/80 transition-colors opacity-70 group-hover/upi:opacity-100 cursor-pointer"
                                        title="Copy UPI ID"
                                      >
                                        <Copy className="h-3 w-3" />
                                      </button>
                                    </div>
                                    {upi.accountHolderName && upi.accountHolderName !== u.fullName && (
                                      <span className="text-[10px] text-slate-400 font-sans mt-0.5">
                                        ({upi.accountHolderName})
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {u.isActive ? (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-slate-800 text-slate-400">
                              Deactivated
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Details Button */}
                            <Button
                              onClick={() => {
                                setSelectedUserDetails(u);
                                setIsDetailsOpen(true);
                              }}
                              size="icon"
                              variant="outline"
                              className="h-8 w-8 border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-850 hover:text-white"
                              title="View Full Profile & Referral Details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>

                            {/* Wallet Adjust Action */}
                            <Button
                              onClick={() => {
                                setSelectedUser(u);
                                setIsAdjustOpen(true);
                              }}
                              size="sm"
                              variant="outline"
                              className="h-8 border-slate-800 bg-slate-950 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 gap-1 text-xs"
                            >
                              <Wallet className="h-3.5 w-3.5" />
                              Adjust
                            </Button>

                            {/* Block Toggle */}
                            <Button
                              onClick={() => toggleBlockMutation.mutate({ id: userId, isBlocked: u.isBlocked })}
                              size="icon"
                              variant="outline"
                              className={`h-8 w-8 border-slate-800 bg-slate-950 ${
                                u.isBlocked 
                                  ? 'text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300' 
                                  : 'text-rose-450 hover:bg-rose-500/10 hover:text-rose-400'
                              }`}
                              title={u.isBlocked ? 'Unblock User' : 'Block User'}
                            >
                              {u.isBlocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                            </Button>

                            {/* Active Toggle */}
                            <Button
                              onClick={() => toggleActiveMutation.mutate({ id: userId, isActive: u.isActive })}
                              size="icon"
                              variant="outline"
                              className={`h-8 w-8 border-slate-800 bg-slate-950 ${
                                u.isActive 
                                  ? 'text-slate-400 hover:bg-slate-800 hover:text-white' 
                                  : 'text-blue-400 hover:bg-blue-500/10 hover:text-blue-300'
                              }`}
                              title={u.isActive ? 'Deactivate User' : 'Activate User'}
                            >
                              {u.isActive ? <UserMinus className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {/* Pagination Controls */}
            {users.length > 0 && (
              <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/45 px-4 py-3">
                <div className="text-sm text-slate-400">
                  Showing <span className="font-medium text-white">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="font-medium text-white">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium text-white">{pagination.total}</span> users
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                    disabled={pagination.page <= 1}
                    className="border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-900 hover:text-white"
                  >
                    Previous
                  </Button>
                  <div className="text-sm text-slate-400 mx-2">
                    Page {pagination.page} of {pagination.pages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(Math.min(pagination.pages, pagination.page + 1))}
                    disabled={pagination.page >= pagination.pages}
                    className="border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-900 hover:text-white"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
          )}
        </CardContent>
      </Card>

      {/* User Details / Profile Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="border-slate-800 bg-slate-900 text-white max-w-lg sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-white">
              <User className="h-5 w-5 text-emerald-400" />
              User Profile & Referral Info
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Complete profile view and referral hierarchy for <strong>{selectedUserDetails?.fullName}</strong>
            </DialogDescription>
          </DialogHeader>

          {selectedUserDetails && (
            <div className="space-y-5 pt-2">
              {/* Header profile card */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-lg shrink-0">
                    {selectedUserDetails.fullName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">{selectedUserDetails.fullName}</h3>
                    <p className="text-xs text-slate-400">{selectedUserDetails.email}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">Phone: {selectedUserDetails.phoneNumber}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {selectedUserDetails.isBlocked ? (
                    <Badge variant="destructive" className="bg-rose-500/10 text-rose-400 border border-rose-500/20">Blocked</Badge>
                  ) : selectedUserDetails.isActive ? (
                    <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Deactivated</Badge>
                  )}
                  <span className="text-[10px] text-slate-500 font-mono">ID: {selectedUserDetails.id || selectedUserDetails._id}</span>
                </div>
              </div>

              {/* Referral details grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Referral Code */}
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Referral Code
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-emerald-400">
                      {selectedUserDetails.referralCode || 'N/A'}
                    </span>
                    {selectedUserDetails.referralCode && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedUserDetails.referralCode);
                          toast.success(`Copied: ${selectedUserDetails.referralCode}`);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                        title="Copy Code"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500">Is user ka unique invite code.</p>
                </div>

                {/* Invited By */}
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Invited By (Referrer)
                  </span>
                  <div className="flex flex-col">
                    {(() => {
                      const inviter = selectedUserDetails.referredBy;
                      if (!inviter) {
                        return <span className="text-sm font-medium text-slate-400 italic">Direct Join (No Inviter)</span>;
                      }
                      if (typeof inviter === 'object') {
                        const name = inviter.fullName || inviter.name || inviter.email || 'Inviter';
                        const code = inviter.referralCode;
                        return (
                          <>
                            <span className="text-sm font-semibold text-slate-200">
                              {name}
                            </span>
                            {code && (
                              <span className="text-xs font-mono text-teal-400 font-semibold">
                                Code: {code}
                              </span>
                            )}
                          </>
                        );
                      }
                      return <span className="text-sm font-mono text-slate-200">{inviter}</span>;
                    })()}
                  </div>
                  <p className="text-[10px] text-slate-500">User kis ke referral code se join hua hai.</p>
                </div>
              </div>

              {/* Financial Balance Summary */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Wallet Overview
                </span>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Balance</span>
                    <span className="text-sm font-bold text-white">
                      ₹{(selectedUserDetails.wallet?.balance ?? selectedUserDetails.balance ?? 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Total Credited</span>
                    <span className="text-sm font-bold text-emerald-400">
                      ₹{(selectedUserDetails.wallet?.totalCredited ?? 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Total Debited</span>
                    <span className="text-sm font-bold text-rose-400">
                      ₹{(selectedUserDetails.wallet?.totalDebited ?? 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* UPI Registered */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Registered UPI Addresses
                </span>
                {(() => {
                  const userUpis = getUserUpis(selectedUserDetails);
                  if (userUpis.length === 0) {
                    return <p className="text-xs text-slate-500 italic">No UPI registered for this account.</p>;
                  }
                  return (
                    <div className="space-y-1.5">
                      {userUpis.map((upi: any, idx: number) => {
                        const upiStr = typeof upi === 'string' ? upi : upi.upiId;
                        const isPrimary = upi.isPrimary ?? (idx === 0);
                        if (!upiStr) return null;
                        return (
                          <div key={upi._id || upi.id || idx} className="flex items-center justify-between text-xs bg-slate-900/60 p-2 rounded border border-slate-800">
                            <span className="font-mono text-teal-400 font-semibold">{upiStr}</span>
                            {isPrimary && (
                              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px]">Primary</Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              <DialogFooter className="pt-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDetailsOpen(false)}
                  className="border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-white"
                >
                  Close
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setSelectedUser(selectedUserDetails);
                    setIsDetailsOpen(false);
                    setIsAdjustOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-1.5"
                >
                  <Wallet className="h-4 w-4" />
                  Adjust Wallet
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Wallet Adjustment Dialog Modal */}
      <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
        <DialogContent className="border-slate-800 bg-slate-900 text-white max-w-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-400" />
              Adjust Wallet Balance
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Directly credit or debit wallet balance for <strong>{selectedUser?.fullName}</strong>.
            </DialogDescription>
            {selectedUser && (() => {
              const selectedUpis = getUserUpis(selectedUser);
              const primaryUpi = selectedUpis.find((upi: any) => upi.isPrimary) || selectedUpis[0];
              if (!primaryUpi) return null;
              const upiStr = typeof primaryUpi === 'string' ? primaryUpi : primaryUpi.upiId;
              if (!upiStr) return null;
              return (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
                  <span>Registered UPI:</span>
                  <span className="font-mono text-teal-400 font-semibold">{upiStr}</span>
                </div>
              );
            })()}
          </DialogHeader>

          <form onSubmit={handleWalletAdjustSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="adjustType">Type</Label>
                <Input
                  id="adjustType"
                  value="Debit (-)"
                  className="border-slate-800 bg-slate-950 text-rose-450 font-semibold"
                  disabled
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="adjustAmount">Amount (₹)</Label>
                <Input
                  id="adjustAmount"
                  type="number"
                  placeholder="1000"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-700"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adjustReason">Adjustment Reason</Label>
              <Textarea
                id="adjustReason"
                placeholder="Referral bonus / correction adjustment / refund"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-700 resize-none h-20"
                required
              />
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAdjustOpen(false)}
                className="border-slate-800 text-slate-350 hover:bg-slate-850 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={adjustWalletMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-600/20"
              >
                {adjustWalletMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating Ledger...
                  </>
                ) : (
                  'Submit Adjust'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

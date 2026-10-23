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
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Globe
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
  const [currentPage, setCurrentPage] = useState(initialPage > 0 ? initialPage : 1);
  const [pageSize, setPageSize] = useState<number>(10);

  const [mounted, setMounted] = useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Sync currentPage from URL query parameter on navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const p = parseInt(params.get('page') || '1', 10);
      if (!isNaN(p) && p > 0 && p !== currentPage) {
        setCurrentPage(p);
      }
    }
  }, [searchParams]);

  const handlePageChange = (newPage: number) => {
    const validPage = Math.max(1, newPage);
    setCurrentPage(validPage);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('tab', 'users');
      params.set('page', validPage.toString());
      window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('tab', 'users');
      params.set('page', '1');
      window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('tab', 'users');
      params.set('page', '1');
      window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
    }
  };
  
  // Wallet Adjust form state
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('debit');
  const [adjustReason, setAdjustReason] = useState('');
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);

  // Debounced search term for API synchronization
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch paginated Users (for default page view)
  const { 
    data: usersRes, 
    isLoading: isPageQueryLoading, 
    isFetching: isPageFetching, 
    error, 
    isError 
  } = useQuery({
    queryKey: ['admin', 'users', currentPage, pageSize],
    queryFn: () => adminApi.getUsers(currentPage, pageSize),
    enabled: mounted,
    placeholderData: keepPreviousData,
  });

  // Global All Users query (fetches entire user base from API for comprehensive global search)
  const { 
    data: allUsersRes, 
    isLoading: isAllUsersLoading, 
    isFetching: isAllUsersFetching 
  } = useQuery({
    queryKey: ['admin', 'users', 'all', debouncedSearch],
    queryFn: () => adminApi.getAllUsers(debouncedSearch || undefined),
    enabled: mounted,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

  // Fetch UPIs
  const { data: upisRes } = useQuery({
    queryKey: ['admin', 'upis'],
    queryFn: () => upiApi.getAllUpisAdmin(),
    enabled: mounted,
  });

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
  const extractUsersList = (res: any) => {
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

  const pagedUsers = extractUsersList(usersRes);
  const allUsers = extractUsersList(allUsersRes);

  // Active user pool for rendering and global searching
  const activeUserPool = React.useMemo(() => {
    const isSearching = Boolean(searchTerm.trim());
    if (!isSearching) {
      if (pagedUsers.length > 0) return pagedUsers;
      if (allUsers.length > 0) return allUsers;
      return fallbackUsers;
    }

    // Global search pool: combine allUsers with pagedUsers and fallbackUsers, deduplicated by ID
    const userMap = new Map<string, any>();
    allUsers.forEach((u: any) => {
      const id = String(u.id || u._id || `${u.phoneNumber}-${u.email}`);
      if (id) userMap.set(id, u);
    });
    pagedUsers.forEach((u: any) => {
      const id = String(u.id || u._id || `${u.phoneNumber}-${u.email}`);
      if (id && !userMap.has(id)) {
        userMap.set(id, u);
      }
    });

    if (userMap.size === 0) {
      fallbackUsers.forEach((u: any) => {
        const id = String(u.id || `${u.phoneNumber}-${u.email}`);
        userMap.set(id, u);
      });
    }

    return Array.from(userMap.values());
  }, [searchTerm, pagedUsers, allUsers]);

  const isLoading = !mounted || (isPageQueryLoading && pagedUsers.length === 0 && allUsers.length === 0);
  const isFetching = isPageFetching || (Boolean(searchTerm.trim()) && isAllUsersFetching);

  // Robust server pagination extractor
  const extractServerPagination = () => {
    if (!usersRes?.data) return null;
    const raw = usersRes.data;

    // Check nested pagination objects
    const nested = raw.data?.pagination || raw.pagination || raw.meta?.pagination || raw.meta;
    if (nested && typeof nested === 'object') {
      const page = Number(nested.page || nested.currentPage || 1);
      const limit = Number(nested.limit || nested.perPage || nested.pageSize || pageSize);
      const total = Number(nested.total || nested.totalUsers || nested.totalCount || nested.count || 0);
      const pages = Number(nested.pages || nested.totalPages || (limit > 0 ? Math.ceil(total / limit) : 1));
      if (total > 0 || pages > 1) {
        return { page, limit, total, pages };
      }
    }

    // Check direct fields on top-level or data-level
    const target = raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data) ? raw.data : raw;
    const directTotal = Number(target.total ?? target.totalUsers ?? target.totalCount ?? target.count);
    const directPages = Number(target.pages ?? target.totalPages);
    const directPage = Number(target.page ?? target.currentPage);
    const directLimit = Number(target.limit ?? target.perPage ?? target.pageSize);

    if (!isNaN(directTotal) && directTotal > 0) {
      const lim = !isNaN(directLimit) && directLimit > 0 ? directLimit : pageSize;
      const pgs = !isNaN(directPages) && directPages > 0 ? directPages : Math.max(1, Math.ceil(directTotal / lim));
      const pg = !isNaN(directPage) && directPage > 0 ? directPage : currentPage;
      return { page: pg, limit: lim, total: directTotal, pages: pgs };
    }

    return null;
  };

  const serverPagination = extractServerPagination();

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

  const filteredUsers = React.useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return activeUserPool;

    return activeUserPool.filter((user: any) => {
      const userId = String(user.id || user._id || '').toLowerCase();
      const matchesId = userId.includes(term);
      const matchesName = user.fullName?.toLowerCase().includes(term);
      const matchesEmail = user.email?.toLowerCase().includes(term);
      const matchesPhone = user.phoneNumber?.includes(term);
      const matchesRefCode = user.referralCode?.toLowerCase().includes(term);

      // Inviter matching
      const matchesInviterName = typeof user.referredBy === 'object' && user.referredBy?.fullName?.toLowerCase().includes(term);
      const matchesInviterCode = typeof user.referredBy === 'object' && user.referredBy?.referralCode?.toLowerCase().includes(term);
      const matchesInviterStr = typeof user.referredBy === 'string' && user.referredBy?.toLowerCase().includes(term);

      // Wallet matching (balance, amount, commission, credited, debited)
      const totalVal = String(user.wallet?.total ?? user.total ?? user.wallet?.balance ?? user.balance ?? '');
      const commVal = String(user.wallet?.commission ?? user.commission ?? '');
      const amtVal = String(user.wallet?.amount ?? user.amount ?? '');
      const crVal = String(user.wallet?.totalCredited ?? '');
      const drVal = String(user.wallet?.totalDebited ?? '');
      const matchesWallet = 
        totalVal.includes(term) || 
        commVal.includes(term) || 
        amtVal.includes(term) ||
        crVal.includes(term) ||
        drVal.includes(term);

      // UPI matching
      const userUpis = getUserUpis(user);
      const matchesResolvedUpis = userUpis.some((upi: any) => {
        const upiStr = typeof upi === 'string' ? upi : upi?.upiId;
        const nameStr = upi?.accountHolderName || '';
        return upiStr?.toLowerCase().includes(term) || nameStr?.toLowerCase().includes(term);
      });
      const matchesUpiId = user.upiId?.toLowerCase().includes(term);
      const matchesUpiObj = user.upi?.upiId?.toLowerCase().includes(term);
      const matchesUpiIds = Array.isArray(user.upiIds) && user.upiIds.some((id: string) => id?.toLowerCase().includes(term));
      const matchesUpisArray = Array.isArray(user.upis) && user.upis.some((upi: any) => 
        upi?.upiId?.toLowerCase().includes(term) || upi?.accountHolderName?.toLowerCase().includes(term)
      );

      // Status matching
      const matchesStatus = 
        (term === 'blocked' && user.isBlocked) ||
        (term === 'unblocked' && !user.isBlocked) ||
        (term === 'active' && user.isActive) ||
        (term === 'deactivated' && !user.isActive) ||
        (term === 'inactive' && !user.isActive);

      return (
        matchesId ||
        matchesName ||
        matchesEmail ||
        matchesPhone ||
        matchesRefCode ||
        matchesInviterName ||
        matchesInviterCode ||
        matchesInviterStr ||
        matchesWallet ||
        matchesResolvedUpis ||
        matchesUpiId ||
        matchesUpiObj ||
        matchesUpiIds ||
        matchesUpisArray ||
        matchesStatus
      );
    });
  }, [searchTerm, activeUserPool, upiList]);

  // Server pagination is active if server provides valid pagination metadata, search is empty,
  // and server total is greater than returned users array length (indicating server-side slicing).
  const isServerPaginated = Boolean(
    !searchTerm.trim() &&
    serverPagination &&
    serverPagination.total > pagedUsers.length &&
    pagedUsers.length <= serverPagination.limit
  );

  const effectiveLimit = isServerPaginated && serverPagination ? serverPagination.limit : pageSize;
  const totalCount = isServerPaginated && serverPagination ? serverPagination.total : filteredUsers.length;
  const totalPages = isServerPaginated && serverPagination 
    ? Math.max(1, serverPagination.pages) 
    : Math.max(1, Math.ceil(filteredUsers.length / pageSize));

  // Current validated active page
  const activePage = Math.min(Math.max(1, currentPage), totalPages);

  // Users displayed on the current page
  const displayedUsers = isServerPaginated
    ? filteredUsers
    : filteredUsers.slice((activePage - 1) * pageSize, activePage * pageSize);

  const startRecord = totalCount === 0 ? 0 : (activePage - 1) * effectiveLimit + 1;
  const endRecord = totalCount === 0 ? 0 : Math.min(startRecord + displayedUsers.length - 1, totalCount);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);
    if (activePage > 3) {
      pages.push('...');
    }

    const start = Math.max(2, activePage - 1);
    const end = Math.min(totalPages - 1, activePage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (activePage < totalPages - 2) {
      pages.push('...');
    }

    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">User Directory</h1>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-xs py-0.5 px-2">
              <Globe className="h-3 w-3 mr-1" />
              Global Search
            </Badge>
          </div>
          <p className="text-slate-400 text-sm">Control account statuses, manage security holds, inspect referral networks, and adjust wallet balances.</p>
        </div>
        
        {/* Search controls */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Global search (name, email, phone, ID, wallet...)"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-9 border-slate-800 bg-slate-900/50 text-white focus-visible:ring-emerald-500 placeholder:text-slate-500 text-xs sm:text-sm"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="absolute right-2.5 top-2.5 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Global search status indicator bar */}
      {searchTerm.trim() && (
        <div className="flex items-center justify-between bg-slate-900/70 border border-slate-800/80 px-4 py-2.5 rounded-lg text-xs backdrop-blur-sm">
          <div className="flex items-center gap-2 text-slate-300">
            <Globe className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>
              Global Search Active: Found <strong className="text-white font-semibold">{filteredUsers.length}</strong> matching {filteredUsers.length === 1 ? 'user' : 'users'} across entire database
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isAllUsersFetching && (
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <Loader2 className="h-3 w-3 animate-spin text-emerald-400" />
                <span>Syncing live API...</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSearchChange('')}
              className="h-6 px-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Reset Search
            </Button>
          </div>
        </div>
      )}

      <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl shadow-lg">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-60 flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              <p className="text-sm text-slate-400">Loading user registry...</p>
            </div>
          ) : isError && activeUserPool.length === 0 ? (
            <div className="py-20 text-center text-rose-400 text-sm">
              Failed to load users: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-20 text-center text-slate-500 text-sm">
              {searchTerm.trim() ? (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-slate-400">No accounts matching &ldquo;{searchTerm}&rdquo; found across the entire user database.</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleSearchChange('')} 
                    className="border-slate-800 bg-slate-900 text-xs text-slate-300 hover:text-white mt-1"
                  >
                    Clear Search
                  </Button>
                </div>
              ) : (
                'No accounts matching criteria found.'
              )}
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
                  {displayedUsers.map((u: any) => {
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
                          {(() => {
                            const totalVal = Number(u.wallet?.total ?? u.total ?? u.wallet?.balance ?? u.balance ?? 0);
                            const commVal = Number(u.wallet?.commission ?? u.commission ?? 0);
                            const amtVal = Number(u.wallet?.amount ?? u.amount ?? Math.max(0, totalVal - commVal));
                            return (
                              <div className="flex flex-col items-end">
                                <span className="font-bold text-white text-sm">
                                  ₹{totalVal.toLocaleString('en-IN')}
                                </span>
                                <div className="flex items-center gap-1 mt-0.5 text-[10px] font-mono shrink-0">
                                  <span className="text-slate-350" title="Base Amount">
                                    ₹{amtVal.toLocaleString('en-IN')}
                                  </span>
                                  <span className="text-slate-500">+</span>
                                  <span className="text-amber-400 font-semibold" title="Commission">
                                    ₹{commVal.toLocaleString('en-IN')}
                                  </span>
                                  <span className="text-slate-500">=</span>
                                  <span className="text-emerald-400 font-semibold" title="Total">
                                    ₹{totalVal.toLocaleString('en-IN')}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5 text-[9px] font-mono shrink-0 text-slate-500">
                                  <span className="text-emerald-400/80">Cr: ₹{(u.wallet?.totalCredited ?? 0).toLocaleString('en-IN')}</span>
                                  <span className="text-slate-700">|</span>
                                  <span className="text-rose-400/80">Dr: ₹{(u.wallet?.totalDebited ?? 0).toLocaleString('en-IN')}</span>
                                </div>
                              </div>
                            );
                          })()}
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
            {filteredUsers.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800 bg-slate-950/60 px-4 py-3.5">
                <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-400">
                  <div>
                    Showing <span className="font-semibold text-white">{startRecord}</span> to{' '}
                    <span className="font-semibold text-white">{endRecord}</span> of{' '}
                    <span className="font-semibold text-white">{totalCount}</span> users
                    {searchTerm.trim() && (
                      <span className="text-emerald-400 text-xs ml-1.5 font-medium">(globally searched)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-xs">Per page:</span>
                    <Select
                      value={pageSize.toString()}
                      onValueChange={(val) => handlePageSizeChange(parseInt(val || '10', 10))}
                    >
                      <SelectTrigger className="h-8 w-18 border-slate-800 bg-slate-900 text-xs text-white">
                        <SelectValue placeholder="10" />
                      </SelectTrigger>
                      <SelectContent className="border-slate-800 bg-slate-900 text-white">
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-1.5">
                  {/* First Page */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(1)}
                    disabled={activePage <= 1}
                    className="h-8 w-8 border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-850 hover:text-white disabled:opacity-40"
                    title="First Page"
                  >
                    <ChevronsLeft className="h-3.5 w-3.5" />
                  </Button>

                  {/* Previous Page */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(activePage - 1)}
                    disabled={activePage <= 1}
                    className="h-8 px-2.5 border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-850 hover:text-white disabled:opacity-40 text-xs"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                    Prev
                  </Button>

                  {/* Page Numbers */}
                  <div className="hidden sm:flex items-center gap-1 mx-1">
                    {getPageNumbers().map((p, idx) => {
                      if (p === '...') {
                        return (
                          <span key={`ellipsis-${idx}`} className="px-1 text-slate-500 text-xs select-none">
                            ...
                          </span>
                        );
                      }
                      const pageNum = Number(p);
                      const isCurrent = pageNum === activePage;
                      return (
                        <Button
                          key={`page-${pageNum}`}
                          variant={isCurrent ? 'default' : 'outline'}
                          size="icon"
                          onClick={() => handlePageChange(pageNum)}
                          className={`h-8 w-8 text-xs font-medium ${
                            isCurrent
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-transparent shadow-sm shadow-emerald-900/50'
                              : 'border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-850 hover:text-white'
                          }`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <div className="sm:hidden text-xs text-slate-400 px-2 font-medium">
                    {activePage} / {totalPages}
                  </div>

                  {/* Next Page */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(activePage + 1)}
                    disabled={activePage >= totalPages}
                    className="h-8 px-2.5 border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-850 hover:text-white disabled:opacity-40 text-xs"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>

                  {/* Last Page */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={activePage >= totalPages}
                    className="h-8 w-8 border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-850 hover:text-white disabled:opacity-40"
                    title="Last Page"
                  >
                    <ChevronsRight className="h-3.5 w-3.5" />
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
                    <span className="text-[10px] text-slate-500 block">Total Balance</span>
                    <span className="text-sm font-bold text-emerald-400">
                      ₹{(selectedUserDetails.wallet?.total ?? selectedUserDetails.total ?? selectedUserDetails.wallet?.balance ?? selectedUserDetails.balance ?? 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Base Amount</span>
                    <span className="text-sm font-bold text-slate-200">
                      ₹{(selectedUserDetails.wallet?.amount ?? selectedUserDetails.amount ?? Math.max(0, (selectedUserDetails.wallet?.balance ?? 0) - (selectedUserDetails.wallet?.commission ?? 0))).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Commission</span>
                    <span className="text-sm font-bold text-amber-400">
                      ₹{(selectedUserDetails.wallet?.commission ?? selectedUserDetails.commission ?? 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center pt-1">
                  <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-850">
                    <span className="text-[9px] text-slate-500 block">Total Credited</span>
                    <span className="text-xs font-semibold text-emerald-400">
                      ₹{(selectedUserDetails.wallet?.totalCredited ?? 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-850">
                    <span className="text-[9px] text-slate-500 block">Total Debited</span>
                    <span className="text-xs font-semibold text-rose-400">
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

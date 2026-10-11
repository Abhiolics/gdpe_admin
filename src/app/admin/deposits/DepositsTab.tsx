'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { depositApi } from '@/lib/api';
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
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Eye, 
  FileCheck, 
  ExternalLink,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { toast } from 'sonner';

// Fallback mockup data
const fallbackDeposits = [
  { 
    _id: '6a20e561035e8afb971f359e', 
    user: { fullName: 'Sandeep Gupta', email: 'sgupta@bbdu.ac.in' }, 
    planId: '6a265e1caa6616b5229e9340', 
    amount: 4000, 
    transactionRef: 'TXN123456756', 
    paymentProof: 'https://images.unsplash.com/photo-1601597111158-2fceff270190?auto=format&fit=crop&q=80&w=600', 
    status: 'pending', 
    createdAt: '2026-06-11T12:00:00.000Z' 
  },
  { 
    _id: '6a20e561035e8afb971f359f', 
    user: { fullName: 'Amit Kumar', email: 'amit@gmail.com' }, 
    planId: '6a265e31aa6616b5229e9344', 
    amount: 1399, 
    transactionRef: 'TXN998877665', 
    paymentProof: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600', 
    status: 'approved', 
    createdAt: '2026-06-10T15:30:00.000Z' 
  },
];

export default function DepositManagementPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const queryClient = useQueryClient();
  const [selectedDeposit, setSelectedDeposit] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

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
      params.set('tab', 'deposits');
      params.set('page', validPage.toString());
      window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('tab', 'deposits');
      params.set('page', '1');
      window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
    }
  };

  const handleTabFilterChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };
  
  // Rejection Form states
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Fetch deposits
  const { data: depositsRes, isLoading: isQueryLoading, isFetching, error, isError } = useQuery({
    queryKey: ['admin', 'deposits', currentPage, pageSize],
    queryFn: () => depositApi.getAllDepositsAdmin(currentPage, pageSize),
    enabled: mounted,
    placeholderData: keepPreviousData,
  });

  const isLoading = !mounted || isQueryLoading;

  // Robust list extractor
  const getDepositsList = () => {
    if (!depositsRes) return [];
    const rData = depositsRes.data?.data;
    if (Array.isArray(rData)) return rData;
    if (rData && typeof rData === 'object') {
      for (const key of Object.keys(rData)) {
        if (Array.isArray((rData as any)[key])) return (rData as any)[key];
      }
    }
    const responseData = depositsRes.data;
    if (Array.isArray(responseData)) return responseData;
    if (responseData && typeof responseData === 'object') {
      for (const key of Object.keys(responseData)) {
        if (Array.isArray((responseData as any)[key])) return (responseData as any)[key];
      }
    }
    return [];
  };

  const deposits = getDepositsList();

  // Robust server pagination extractor
  const extractServerPagination = () => {
    if (!depositsRes?.data) return null;
    const raw = depositsRes.data;

    const nested = raw.data?.pagination || raw.pagination || raw.meta?.pagination || raw.meta;
    if (nested && typeof nested === 'object') {
      const page = Number(nested.page || nested.currentPage || 1);
      const limit = Number(nested.limit || nested.perPage || nested.pageSize || pageSize);
      const total = Number(nested.total || nested.totalDeposits || nested.totalCount || nested.count || 0);
      const pages = Number(nested.pages || nested.totalPages || (limit > 0 ? Math.ceil(total / limit) : 1));
      if (total > 0 || pages > 1) {
        return { page, limit, total, pages };
      }
    }

    const target = raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data) ? raw.data : raw;
    const directTotal = Number(target.total ?? target.totalDeposits ?? target.totalCount ?? target.count);
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

  // Approve Mutation
  const approveMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => 
      depositApi.approveDeposit(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'deposits'] });
      toast.success('Deposit payment successfully approved');
      setIsPreviewOpen(false);
      setSelectedDeposit(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Approval failed');
    }
  });

  // Reject Mutation
  const rejectMutation = useMutation({
    mutationFn: (id: string) => depositApi.rejectDeposit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'deposits'] });
      toast.success('Deposit payment successfully rejected');
      setIsRejectOpen(false);
      setIsPreviewOpen(false);
      setSelectedDeposit(null);
      setRejectReason('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Rejection failed');
    }
  });

  const handleApprove = (deposit: any) => {
    approveMutation.mutate({
      id: deposit._id || deposit.id,
      reason: 'Approved by admin dashboard verification'
    });
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeposit) return;
    rejectMutation.mutate(selectedDeposit._id || selectedDeposit.id);
  };

  const filteredDeposits = deposits.filter((d: any) => {
    if (activeTab === 'all') return true;
    return d.status === activeTab;
  });

  const isServerPaginated = Boolean(
    activeTab === 'all' &&
    serverPagination &&
    serverPagination.total > deposits.length &&
    deposits.length <= serverPagination.limit
  );

  const effectiveLimit = isServerPaginated && serverPagination ? serverPagination.limit : pageSize;
  const totalCount = isServerPaginated && serverPagination ? serverPagination.total : filteredDeposits.length;
  const totalPages = isServerPaginated && serverPagination
    ? Math.max(1, serverPagination.pages)
    : Math.max(1, Math.ceil(filteredDeposits.length / pageSize));

  const activePage = Math.min(Math.max(1, currentPage), totalPages);

  const displayedDeposits = isServerPaginated
    ? filteredDeposits
    : filteredDeposits.slice((activePage - 1) * pageSize, activePage * pageSize);

  const startRecord = totalCount === 0 ? 0 : (activePage - 1) * effectiveLimit + 1;
  const endRecord = totalCount === 0 ? 0 : Math.min(startRecord + displayedDeposits.length - 1, totalCount);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20">Pending Verification</Badge>;
      case 'approved':
        return <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-rose-500/10 text-rose-450 border border-rose-500/20">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-60 flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <p className="text-sm text-slate-400">Loading UI Layout...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Deposit Inflows</h1>
          <p className="text-slate-400 text-sm">Verify screenshots of bank transfers and UPI receipts submitted by users to purchase membership plans.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabFilterChange} className="w-full">
        <TabsList className="border-slate-800 bg-slate-900 text-slate-400">
          <TabsTrigger value="all" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">All Deposits</TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">Pending Requests</TabsTrigger>
          <TabsTrigger value="approved" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white">Approved</TabsTrigger>
          <TabsTrigger value="rejected" className="data-[state=active]:bg-rose-650 data-[state=active]:text-white">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl shadow-lg">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex h-60 flex-col items-center justify-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                  <p className="text-sm text-slate-400">Loading incoming deposits log...</p>
                </div>
              ) : isError ? (
                <div className="py-20 text-center text-rose-400 text-sm">
                  Failed to load deposits: {error instanceof Error ? error.message : 'Unknown error'}
                </div>
              ) : filteredDeposits.length === 0 ? (
                <div className="py-20 text-center text-slate-500 text-sm">
                  No deposits found in this category.
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
                        <TableHead className="text-slate-400 font-semibold py-3.5">User Details</TableHead>
                        <TableHead className="text-slate-400 font-semibold py-3.5">Plan Selection</TableHead>
                        <TableHead className="text-slate-400 font-semibold py-3.5">Transaction Reference</TableHead>
                        <TableHead className="text-slate-400 font-semibold py-3.5 text-right">Amount</TableHead>
                        <TableHead className="text-slate-400 font-semibold py-3.5 text-center">Status</TableHead>
                        <TableHead className="text-slate-400 font-semibold py-3.5 text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedDeposits.map((d: any) => {
                        const depositId = d._id || d.id;
                        const userName = d.user?.fullName || 'Sandbox User';
                        const userEmail = d.user?.email || 'user@example.com';
                        
                        return (
                          <TableRow key={depositId} className="border-slate-850 hover:bg-slate-900/20 transition-colors">
                            <TableCell className="font-medium">
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-slate-200">{userName}</span>
                                <span className="text-[11px] text-slate-500 mt-0.5">{userEmail}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-350 text-xs">
                              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                                <Layers className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                                {d.planId ? `Plan ID: ${d.planId}` : 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-300 font-mono text-xs">{d.transactionRef}</TableCell>
                            <TableCell className="text-right font-bold text-white text-sm">
                              ₹{d.amount.toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell className="text-center">{getStatusBadge(d.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  onClick={() => {
                                    setSelectedDeposit(d);
                                    setIsPreviewOpen(true);
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="h-8 border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-850 hover:text-white gap-1 text-xs"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  Inspect Proof
                                </Button>
                                
                                {d.status === 'pending' && (
                                  <>
                                    <Button
                                      onClick={() => handleApprove(d)}
                                      size="icon"
                                      variant="outline"
                                      className="h-8 w-8 border-emerald-500/20 bg-emerald-500/10 text-emerald-450 hover:bg-emerald-500/20 hover:text-emerald-350"
                                      title="Approve Deposit"
                                    >
                                      <CheckCircle className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        setSelectedDeposit(d);
                                        setIsRejectOpen(true);
                                      }}
                                      size="icon"
                                      variant="outline"
                                      className="h-8 w-8 border-rose-500/20 bg-rose-500/10 text-rose-450 hover:bg-rose-500/20 hover:text-rose-350"
                                      title="Reject Deposit"
                                    >
                                      <XCircle className="h-3.5 w-3.5" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                {/* Pagination Controls */}
                {filteredDeposits.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800 bg-slate-950/60 px-4 py-3.5">
                    <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-400">
                      <div>
                        Showing <span className="font-semibold text-white">{startRecord}</span> to{' '}
                        <span className="font-semibold text-white">{endRecord}</span> of{' '}
                        <span className="font-semibold text-white">{totalCount}</span> deposits
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
        </TabsContent>
      </Tabs>

      {/* Lightbox / Proof inspection Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="border-slate-800 bg-slate-900 text-white max-w-2xl sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <FileCheck className="h-5 w-5 text-emerald-400" />
              Receipt Verification
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Verify details for transaction reference code: <strong>{selectedDeposit?.transactionRef}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {/* Image Box */}
            <div className="relative flex flex-col items-center justify-center border border-slate-800 bg-slate-950 rounded-xl overflow-hidden p-2 group h-72">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedDeposit?.paymentProof}
                alt="Payment proof receipt screenshot"
                className="max-h-full max-w-full object-contain rounded-lg transition-transform group-hover:scale-[1.03] duration-300"
              />
              <a 
                href={selectedDeposit?.paymentProof} 
                target="_blank" 
                rel="noreferrer" 
                className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-900 px-3 py-1.5 text-[11px] font-semibold border border-slate-800 text-emerald-400 backdrop-blur-md shadow-lg"
              >
                Open Original <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Info details */}
            <div className="flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="rounded-lg bg-slate-950/40 border border-slate-850 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs border-b border-slate-900 pb-1.5">
                    <span className="text-slate-500">Applicant:</span>
                    <span className="text-slate-300 font-semibold">{selectedDeposit?.user?.fullName || 'Sandbox User'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs border-b border-slate-900 pb-1.5">
                    <span className="text-slate-500">Declared Amount:</span>
                    <span className="text-emerald-400 font-bold">₹{selectedDeposit?.amount?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs border-b border-slate-900 pb-1.5">
                    <span className="text-slate-500">Declared Reference:</span>
                    <span className="font-mono text-slate-350">{selectedDeposit?.transactionRef}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Submitted On:</span>
                    <span className="text-slate-405 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-550" />
                      {selectedDeposit?.createdAt ? new Date(selectedDeposit.createdAt).toLocaleString() : 'Just now'}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg bg-slate-950/20 border border-slate-850/60 p-3 text-[11px] text-slate-400 leading-relaxed">
                  Verify that the amount shown on the screenshot matches the declared amount, and the transaction reference identifier exists and matches your business ledger.
                </div>
              </div>

              {/* Action states inside Modal */}
              {selectedDeposit?.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-slate-850">
                  <Button
                    onClick={() => {
                      setIsRejectOpen(true);
                    }}
                    type="button"
                    variant="outline"
                    className="flex-1 border-rose-500/25 bg-rose-500/5 text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 font-semibold text-xs h-10"
                  >
                    Reject payment
                  </Button>
                  <Button
                    onClick={() => handleApprove(selectedDeposit)}
                    disabled={approveMutation.isPending}
                    type="button"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-550 text-white font-semibold text-xs h-10"
                  >
                    {approveMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      'Approve Payment'
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="border-slate-800 bg-slate-900 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-rose-450 font-bold">Reject Deposit Request?</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Confirming this will mark the user&apos;s deposit as rejected. Let them know why.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRejectSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="rejectReason">Rejection Reason</Label>
              <Textarea
                id="rejectReason"
                placeholder="Payment proof is unclear, or reference code does not match bank records."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-700 resize-none h-20 text-xs"
                required
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRejectOpen(false)}
                className="border-slate-800 text-slate-350 hover:bg-slate-850 hover:text-white text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={rejectMutation.isPending}
                className="bg-rose-650 hover:bg-rose-550 text-white font-semibold text-xs"
              >
                {rejectMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Declining...
                  </>
                ) : (
                  'Reject Deposit'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

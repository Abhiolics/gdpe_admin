'use client';

import React, { useState } from 'react';
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
  Loader2, 
  CheckCircle, 
  XCircle, 
  Eye, 
  FileCheck, 
  ExternalLink,
  Calendar,
  Layers
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
  const [currentPage, setCurrentPage] = useState(initialPage);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };
  
  // Rejection Form states
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [mounted, setMounted] = useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch deposits
  const { data: depositsRes, isLoading: isQueryLoading, isFetching, error, isError } = useQuery({
    queryKey: ['admin', 'deposits', currentPage],
    queryFn: () => depositApi.getAllDepositsAdmin(currentPage),
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

  const getPagination = () => {
    if (!depositsRes) return { page: 1, limit: 10, total: 0, pages: 1 };
    if (depositsRes.data?.data?.pagination) return depositsRes.data.data.pagination;
    if (depositsRes.data?.pagination) return depositsRes.data.pagination;
    return { page: 1, limit: 10, total: 0, pages: 1 };
  };

  const pagination = getPagination();

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

  const getFilteredDeposits = () => {
    if (activeTab === 'all') return deposits;
    return deposits.filter((d: any) => d.status === activeTab);
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
              ) : getFilteredDeposits().length === 0 ? (
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
                      {getFilteredDeposits().map((d: any) => {
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
                {deposits.length > 0 && (
                  <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/45 px-4 py-3">
                    <div className="text-sm text-slate-400">
                      Showing <span className="font-medium text-white">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="font-medium text-white">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium text-white">{pagination.total}</span> deposits
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

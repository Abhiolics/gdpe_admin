'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { withdrawalApi } from '@/lib/api';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  Check, 
  X, 
  Copy, 
  ExternalLink,
  CreditCard,
  Building,
  CheckCircle,
  XCircle,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Fallback mockup data
const fallbackWithdrawals = [
  { 
    _id: '6a269b260913d8ca8ada63be', 
    user: { fullName: 'Sandeep Gupta', email: 'sgupta@bbdu.ac.in' }, 
    amount: 1500, 
    bankDetails: { 
      accountHolderName: 'Sandeep Gupta', 
      bankName: 'State Bank of India', 
      accountNumber: '123456789012', 
      ifscCode: 'SBIN0001234', 
      upiId: 'sandeep@upi' 
    }, 
    status: 'pending', 
    createdAt: '2026-06-11T13:45:00.000Z' 
  },
  { 
    _id: '6a269b260913d8ca8ada63bf', 
    user: { fullName: 'Amit Kumar', email: 'amit@gmail.com' }, 
    amount: 500, 
    bankDetails: { 
      accountHolderName: 'Amit Kumar', 
      bankName: 'HDFC Bank', 
      accountNumber: '987654321098', 
      ifscCode: 'HDFC0000123', 
      upiId: 'amit@upi' 
    }, 
    status: 'approved', 
    createdAt: '2026-06-10T10:00:00.000Z' 
  },
];

export default function WithdrawalManagementPage() {
  const queryClient = useQueryClient();
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('all');
  
  // Dialog confirmation states
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [copiedText, setCopiedText] = useState('');

  // Create Payout form states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [amount, setAmount] = useState('5');
  const [accountHolderName, setAccountHolderName] = useState('Sandeep Gupta');
  const [bankName, setBankName] = useState('State Bank of India');
  const [accountNumber, setAccountNumber] = useState('123456789012');
  const [ifscCode, setIfscCode] = useState('SBIN0001234');
  const [upiId, setUpiId] = useState('sandeep@upi');

  // Create Withdrawal Mutation
  const createWithdrawalMutation = useMutation({
    mutationFn: (data: { amount: number; bankDetails: { accountHolderName: string; bankName: string; accountNumber: string; ifscCode: string; upiId: string } }) => 
      withdrawalApi.userCreateWithdrawal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'withdrawals'] });
      toast.success('Withdrawal request created successfully');
      setIsCreateOpen(false);
      // Reset form states
      setAmount('5');
      setAccountHolderName('Sandeep Gupta');
      setBankName('State Bank of India');
      setAccountNumber('123456789012');
      setIfscCode('SBIN0001234');
      setUpiId('sandeep@upi');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create withdrawal');
    }
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!accountHolderName || !bankName || !accountNumber || !ifscCode || !upiId) {
      toast.error('All bank and UPI details are required');
      return;
    }
    createWithdrawalMutation.mutate({
      amount: parsedAmount,
      bankDetails: {
        accountHolderName,
        bankName,
        accountNumber,
        ifscCode,
        upiId,
      }
    });
  };

  const [mounted, setMounted] = useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch withdrawals
  const { data: withdrawalsRes, isLoading, error, isError } = useQuery({
    queryKey: ['admin', 'withdrawals'],
    queryFn: () => withdrawalApi.getAllWithdrawalsAdmin(),
    enabled: mounted,
  });

  // Robust list extractor
  const getWithdrawalsList = () => {
    if (!withdrawalsRes) return [];
    const rData = withdrawalsRes.data?.data;
    if (Array.isArray(rData)) return rData;
    if (rData && typeof rData === 'object') {
      for (const key of Object.keys(rData)) {
        if (Array.isArray((rData as any)[key])) return (rData as any)[key];
      }
    }
    const responseData = withdrawalsRes.data;
    if (Array.isArray(responseData)) return responseData;
    if (responseData && typeof responseData === 'object') {
      for (const key of Object.keys(responseData)) {
        if (Array.isArray((responseData as any)[key])) return (responseData as any)[key];
      }
    }
    return [];
  };

  const withdrawals = getWithdrawalsList();

  // Approve Mutation
  const approveMutation = useMutation({
    mutationFn: (id: string) => withdrawalApi.approveWithdrawal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'withdrawals'] });
      toast.success('Withdrawal request approved successfully');
      setIsApproveOpen(false);
      setSelectedWithdrawal(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Approval failed');
    }
  });

  // Reject Mutation
  const rejectMutation = useMutation({
    mutationFn: (id: string) => withdrawalApi.rejectWithdrawal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'withdrawals'] });
      toast.success('Withdrawal request rejected successfully');
      setIsRejectOpen(false);
      setSelectedWithdrawal(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Rejection failed');
    }
  });

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const handleApproveConfirm = () => {
    if (!selectedWithdrawal) return;
    approveMutation.mutate(selectedWithdrawal._id || selectedWithdrawal.id);
  };

  const handleRejectConfirm = () => {
    if (!selectedWithdrawal) return;
    rejectMutation.mutate(selectedWithdrawal._id || selectedWithdrawal.id);
  };

  const getFilteredWithdrawals = () => {
    if (activeTab === 'all') return withdrawals;
    return withdrawals.filter((w: any) => w.status === activeTab);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20">Awaiting Payout</Badge>;
      case 'approved':
        return <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Paid & Settled</Badge>;
      case 'rejected':
        return <Badge className="bg-rose-500/10 text-rose-450 border border-rose-500/20">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (!mounted) {
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
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Withdrawal Outflows</h1>
          <p className="text-slate-400 text-sm">Review, copy bank/UPI credentials, and settle payout requests submitted by users.</p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 h-9 px-4 shrink-0 shadow-md shadow-emerald-600/20"
        >
          <Plus className="h-4 w-4" />
          Create Payout
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="border-slate-800 bg-slate-900 text-slate-400">
          <TabsTrigger value="all" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">All Payouts</TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">Pending Settle</TabsTrigger>
          <TabsTrigger value="approved" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white">Paid</TabsTrigger>
          <TabsTrigger value="rejected" className="data-[state=active]:bg-rose-650 data-[state=active]:text-white">Declined</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl shadow-lg">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex h-60 flex-col items-center justify-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                  <p className="text-sm text-slate-400">Loading payout queue...</p>
                </div>
              ) : isError ? (
                <div className="py-20 text-center text-rose-400 text-sm">
                  Failed to load withdrawals: {error instanceof Error ? error.message : 'Unknown error'}
                </div>
              ) : getFilteredWithdrawals().length === 0 ? (
                <div className="py-20 text-center text-slate-500 text-sm">
                  No withdrawal requests found in this category.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="border-slate-800 bg-slate-950/45">
                      <TableRow className="border-slate-850 hover:bg-transparent">
                        <TableHead className="text-slate-400 font-semibold py-3.5">User Details</TableHead>
                        <TableHead className="text-slate-400 font-semibold py-3.5">Bank Payout Info</TableHead>
                        <TableHead className="text-slate-400 font-semibold py-3.5">UPI Info</TableHead>
                        <TableHead className="text-slate-400 font-semibold py-3.5 text-right">Amount</TableHead>
                        <TableHead className="text-slate-400 font-semibold py-3.5 text-center">Status</TableHead>
                        <TableHead className="text-slate-400 font-semibold py-3.5 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredWithdrawals().map((w: any) => {
                        const withdrawalId = w._id || w.id;
                        const userName = w.user?.fullName || 'Sandbox User';
                        const userEmail = w.user?.email || 'user@example.com';
                        const hasBank = w.bankDetails?.bankName && w.bankDetails?.accountNumber;
                        const hasUpi = w.bankDetails?.upiId;

                        return (
                          <TableRow key={withdrawalId} className="border-slate-850 hover:bg-slate-900/20 transition-colors">
                            <TableCell className="font-medium">
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-slate-200">{userName}</span>
                                <span className="text-[11px] text-slate-500 mt-0.5">{userEmail}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {hasBank ? (
                                <div className="space-y-1 text-xs text-slate-350">
                                  <div className="flex items-center gap-1.5">
                                    <Building className="h-3 w-3 text-slate-500 shrink-0" />
                                    <span className="font-semibold text-slate-200">{w.bankDetails.bankName}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                                    <span>Acc: {w.bankDetails.accountNumber}</span>
                                    <button 
                                      onClick={() => copyToClipboard(w.bankDetails.accountNumber, 'Account Number')}
                                      className="text-slate-500 hover:text-emerald-400"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                                    <span>IFSC: {w.bankDetails.ifscCode}</span>
                                    <button 
                                      onClick={() => copyToClipboard(w.bankDetails.ifscCode, 'IFSC Code')}
                                      className="text-slate-500 hover:text-emerald-400"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-650 text-xs italic">No Bank Account Details</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {hasUpi ? (
                                <div className="flex items-center gap-1.5 font-mono text-xs text-slate-300 bg-slate-950/45 px-2.5 py-1.5 rounded-lg border border-slate-850/50 w-fit">
                                  <CreditCard className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                                  <span>{w.bankDetails.upiId}</span>
                                  <button 
                                    onClick={() => copyToClipboard(w.bankDetails.upiId, 'UPI ID')}
                                    className="text-slate-500 hover:text-emerald-400 ml-1"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-650 text-xs italic">No UPI ID Configured</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-bold text-white text-sm">
                              ₹{w.amount.toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell className="text-center">{getStatusBadge(w.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {w.status === 'pending' ? (
                                  <>
                                    <Button
                                      onClick={() => {
                                        setSelectedWithdrawal(w);
                                        setIsApproveOpen(true);
                                      }}
                                      size="sm"
                                      className="h-8 bg-emerald-650 hover:bg-emerald-550 text-white gap-1 text-xs"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                      Paid
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        setSelectedWithdrawal(w);
                                        setIsRejectOpen(true);
                                      }}
                                      size="icon"
                                      variant="outline"
                                      className="h-8 w-8 border-rose-500/20 bg-rose-500/10 text-rose-450 hover:bg-rose-500/20 hover:text-rose-350"
                                      title="Decline Request"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </Button>
                                  </>
                                ) : (
                                  <span className="text-slate-600 text-xs">-</span>
                                )}
                              </div>
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

      {/* Payout Approve Confirmation Dialog */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent className="border-slate-800 bg-slate-900 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle className="h-5 w-5" />
              Settle Withdrawal Payout?
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Confirm that you have transferred <strong>₹{selectedWithdrawal?.amount?.toLocaleString('en-IN')}</strong> to the user&apos;s credentials.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-slate-950/50 border border-slate-850 rounded-lg p-3.5 text-xs space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Recipient:</span>
              <span className="text-slate-200 font-bold">{selectedWithdrawal?.user?.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount:</span>
              <span className="text-emerald-400 font-extrabold">₹{selectedWithdrawal?.amount?.toLocaleString('en-IN')}</span>
            </div>
            {selectedWithdrawal?.bankDetails?.upiId && (
              <div className="flex justify-between">
                <span className="text-slate-500">UPI Payout:</span>
                <span className="text-slate-300 font-semibold">{selectedWithdrawal?.bankDetails?.upiId}</span>
              </div>
            )}
            {selectedWithdrawal?.bankDetails?.accountNumber && (
              <div className="flex justify-between">
                <span className="text-slate-500">Bank Number:</span>
                <span className="text-slate-300 font-semibold">{selectedWithdrawal?.bankDetails?.accountNumber}</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsApproveOpen(false)}
              className="border-slate-800 text-slate-350 hover:bg-slate-850 hover:text-white text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleApproveConfirm}
              disabled={approveMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-550 text-white font-semibold text-xs"
            >
              {approveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Saddling...
                </>
              ) : (
                'Confirm Paid'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payout Decline Confirmation Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="border-slate-800 bg-slate-900 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-450 font-bold">
              <XCircle className="h-5 w-5" />
              Decline Withdrawal?
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Confirming this action will cancel the payout request. The balance will be refunded back to the user&apos;s ledger.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRejectOpen(false)}
              className="border-slate-800 text-slate-350 hover:bg-slate-850 hover:text-white text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleRejectConfirm}
              disabled={rejectMutation.isPending}
              className="bg-rose-650 hover:bg-rose-550 text-white font-semibold text-xs"
            >
              {rejectMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Declining...
                </>
              ) : (
                'Decline Payout'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Withdrawal Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="border-slate-800 bg-slate-900 text-white max-w-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-400 font-bold">
              <Plus className="h-5 w-5" />
              Create Payout Request
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Simulate or initiate a user withdrawal request. Note: this uses the logged in user&apos;s wallet balance.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="createAmount">Withdrawal Amount (₹)</Label>
              <Input
                id="createAmount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="border-slate-850 bg-slate-950 text-white text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="createHolder">Account Holder Name</Label>
              <Input
                id="createHolder"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                className="border-slate-850 bg-slate-950 text-white text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="createBank">Bank Name</Label>
                <Input
                  id="createBank"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="border-slate-850 bg-slate-950 text-white text-xs"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="createNumber">Account Number</Label>
                <Input
                  id="createNumber"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="border-slate-850 bg-slate-950 text-white text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="createIfsc">IFSC Code</Label>
                <Input
                  id="createIfsc"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                  className="border-slate-850 bg-slate-950 text-white text-xs font-mono"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="createUpi">UPI ID</Label>
                <Input
                  id="createUpi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="border-slate-850 bg-slate-950 text-white text-xs font-mono"
                  required
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="border-slate-800 text-slate-350 hover:bg-slate-850 hover:text-white text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createWithdrawalMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20"
              >
                {createWithdrawalMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Request'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

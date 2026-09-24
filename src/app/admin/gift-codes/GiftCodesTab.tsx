'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { giftCodeApi } from '@/lib/api';
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
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Loader2, 
  Plus, 
  Edit, 
  Trash2, 
  Gift, 
  Calendar,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Users2
} from 'lucide-react';
import { toast } from 'sonner';

// Fallback mockup data
const fallbackGiftCodes = [
  { _id: '6a2662b3aa6616b5229e9365', code: 'FESTIVE50', rewardAmount: 50, maxUsers: 200, usedCount: 45, expiryDate: '2026-10-31T23:59:59.000Z', isActive: true },
  { _id: '6a2662b3aa6616b5229e9366', code: 'WELCOME20', rewardAmount: 20, maxUsers: 500, usedCount: 120, expiryDate: '2026-12-31T23:59:59.000Z', isActive: true },
  { _id: '6a26628aaa6616b5229e935d', code: 'EXCLUSIVE100', rewardAmount: 100, maxUsers: 50, usedCount: 50, expiryDate: '2026-05-01T23:59:59.000Z', isActive: false },
];

export default function GiftCodesPage() {
  const queryClient = useQueryClient();
  const [selectedCode, setSelectedCode] = useState<any>(null);
  
  // Dialogs
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form states
  const [code, setCode] = useState('');
  const [rewardAmount, setRewardAmount] = useState('');
  const [maxUsers, setMaxUsers] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const [mounted, setMounted] = useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch gift codes
  const { data: giftCodesRes, isLoading, error, isError } = useQuery({
    queryKey: ['admin', 'gift-codes'],
    queryFn: () => giftCodeApi.getGiftCodesAdmin(),
    enabled: mounted,
  });

  // Robust list extractor
  const getGiftCodesList = () => {
    if (!giftCodesRes) return [];
    const rData = giftCodesRes.data?.data;
    if (Array.isArray(rData)) return rData;
    if (rData && typeof rData === 'object') {
      for (const key of Object.keys(rData)) {
        if (Array.isArray((rData as any)[key])) return (rData as any)[key];
      }
    }
    const responseData = giftCodesRes.data;
    if (Array.isArray(responseData)) return responseData;
    if (responseData && typeof responseData === 'object') {
      for (const key of Object.keys(responseData)) {
        if (Array.isArray((responseData as any)[key])) return (responseData as any)[key];
      }
    }
    return [];
  };

  const giftCodes = getGiftCodesList();

  // Create/Update mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => giftCodeApi.createGiftCode(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'gift-codes'] });
      toast.success('Gift code voucher created successfully');
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create gift code');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => giftCodeApi.updateGiftCode(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'gift-codes'] });
      toast.success('Gift code voucher updated successfully');
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update gift code');
    }
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => giftCodeApi.toggleGiftCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'gift-codes'] });
      toast.success('Gift code voucher status toggled');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Toggle status failed');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => giftCodeApi.deleteGiftCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'gift-codes'] });
      toast.success('Gift code voucher deleted successfully');
      setIsDeleteOpen(false);
      setSelectedCode(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete gift code');
    }
  });

  const handleEditClick = (gcode: any) => {
    setSelectedCode(gcode);
    setCode(gcode.code);
    setRewardAmount(gcode.rewardAmount.toString());
    setMaxUsers(gcode.maxUsers.toString());
    // Format date string to yyyy-MM-dd format for HTML calendar input
    const dateFormatted = gcode.expiryDate ? new Date(gcode.expiryDate).toISOString().split('T')[0] : '';
    setExpiryDate(dateFormatted);
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setCode('');
    setRewardAmount('');
    setMaxUsers('');
    setExpiryDate('');
    setSelectedCode(null);
    setIsFormOpen(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !rewardAmount || !maxUsers || !expiryDate) return;

    const rewardNum = parseFloat(rewardAmount);
    const maxUsersNum = parseInt(maxUsers);

    if (isNaN(rewardNum) || rewardNum <= 0) {
      toast.error('Reward must be a positive number');
      return;
    }
    if (isNaN(maxUsersNum) || maxUsersNum <= 0) {
      toast.error('Max Users limit must be a positive integer');
      return;
    }

    // Convert expiry input date to full UTC string
    const expiryUtc = new Date(`${expiryDate}T23:59:59.000Z`).toISOString();

    const payload = {
      code: code.trim().toUpperCase(),
      rewardAmount: rewardNum,
      maxUsers: maxUsersNum,
      expiryDate: expiryUtc,
    };

    if (selectedCode) {
      updateMutation.mutate({ id: selectedCode._id || selectedCode.id, data: payload });
    } else {
      createMutation.mutate(payload);
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
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Promo & Gift Vouchers</h1>
          <p className="text-slate-400 text-sm">Issue redeemable balance vouchers, configure usage caps, and manage promo campaign lifespans.</p>
        </div>
        
        <Button 
          onClick={() => setIsFormOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-1.5 w-fit self-start md:self-auto shadow-md shadow-emerald-600/20"
        >
          <Plus className="h-4.5 w-4.5" />
          Generate Voucher
        </Button>
      </div>

      <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl shadow-lg">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-60 flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              <p className="text-sm text-slate-400">Loading active promo codes...</p>
            </div>
          ) : isError ? (
            <div className="py-20 text-center text-rose-400 text-sm">
              Failed to load gift codes: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
          ) : giftCodes.length === 0 ? (
            <div className="py-20 text-center text-slate-500 text-sm">
              No promo vouchers generated. Click &quot;Generate Voucher&quot; to build coupon structures.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="border-slate-800 bg-slate-950/45">
                  <TableRow className="border-slate-850 hover:bg-transparent">
                    <TableHead className="text-slate-400 font-semibold py-3.5">Coupon Code</TableHead>
                    <TableHead className="text-slate-400 font-semibold py-3.5">Reward Value</TableHead>
                    <TableHead className="text-slate-400 font-semibold py-3.5">Usage Metrics</TableHead>
                    <TableHead className="text-slate-400 font-semibold py-3.5">Expiration Date</TableHead>
                    <TableHead className="text-slate-400 font-semibold py-3.5 text-center">Status</TableHead>
                    <TableHead className="text-slate-400 font-semibold py-3.5 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {giftCodes.map((g: any) => {
                    const codeId = g._id || g.id;
                    const expiry = g.expiryDate ? new Date(g.expiryDate) : null;
                    const isExpired = expiry ? expiry < new Date() : false;
                    const used = g.usedCount ?? 0;
                    const usageRate = (used / g.maxUsers) * 100;

                    return (
                      <TableRow key={codeId} className={`border-slate-850 hover:bg-slate-900/20 transition-colors ${
                        (!g.isActive || isExpired) && 'opacity-65'
                      }`}>
                        <TableCell className="font-bold">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <Gift className="h-4 w-4" />
                            </div>
                            <span className="font-mono tracking-wider text-sm text-slate-200">{g.code}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-white text-sm">
                          ₹{g.rewardAmount}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1.5 max-w-[150px]">
                            <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                              <span className="flex items-center gap-0.5"><Users2 className="h-3 w-3" /> {used}/{g.maxUsers} Claims</span>
                              <span>{Math.round(usageRate)}%</span>
                            </div>
                            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-900">
                              <div 
                                className={`h-full rounded-full ${usageRate >= 100 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                                style={{ width: `${Math.min(usageRate, 100)}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-350 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-500" />
                            <span>{expiry ? expiry.toLocaleDateString() : 'N/A'}</span>
                            {isExpired && (
                              <Badge className="bg-rose-500/10 text-rose-400 text-[9px] hover:bg-rose-500/10 border border-rose-500/20 px-1 py-0 scale-90">
                                Expired
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {g.isActive && !isExpired ? (
                            <Badge className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20">
                              Redeemable
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-slate-800 text-slate-400">
                              Disabled
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Toggle status */}
                            <Button
                              onClick={() => toggleMutation.mutate(codeId)}
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 border-slate-800 bg-slate-950 text-slate-350 hover:bg-slate-850"
                              title={g.isActive ? 'Disable Code' : 'Enable Code'}
                              disabled={isExpired}
                            >
                              {g.isActive ? <ToggleRight className="h-4 w-4 text-emerald-400" /> : <ToggleLeft className="h-4 w-4 text-slate-500" />}
                            </Button>

                            {/* Edit */}
                            <Button
                              onClick={() => handleEditClick(g)}
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 border-slate-800 bg-slate-950 text-slate-350 hover:bg-slate-850"
                              title="Edit Code"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>

                            {/* Delete */}
                            <Button
                              onClick={() => {
                                setSelectedCode(g);
                                setIsDeleteOpen(true);
                              }}
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 border-slate-800 bg-slate-950 text-rose-455 hover:bg-rose-500/10 hover:border-rose-500/20"
                              title="Delete Code"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
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

      {/* Code Creation Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(val) => !val && resetForm()}>
        <DialogContent className="border-slate-800 bg-slate-900 text-white max-w-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-400" />
              {selectedCode ? 'Modify Promo Code' : 'Generate Gift Voucher'}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Vouchers will grant credit rewards straight into user wallets upon code activation.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="codeString">Coupon Code</Label>
                <Input
                  id="codeString"
                  placeholder="NEWYEAR50"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-700 font-mono tracking-wider uppercase text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="codeReward">Reward (₹)</Label>
                <Input
                  id="codeReward"
                  type="number"
                  placeholder="50"
                  value={rewardAmount}
                  onChange={(e) => setRewardAmount(e.target.value)}
                  className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-700 text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="codeMaxUsers">Max Usage Claims</Label>
                <Input
                  id="codeMaxUsers"
                  type="number"
                  placeholder="200"
                  value={maxUsers}
                  onChange={(e) => setMaxUsers(e.target.value)}
                  className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-700 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="codeExpiry">Expiration Date</Label>
                <Input
                  id="codeExpiry"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-700 text-xs text-left"
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="border-slate-800 text-slate-350 hover:bg-slate-850 hover:text-white text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  selectedCode ? 'Update Voucher' : 'Publish Voucher'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="border-slate-800 bg-slate-900 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-rose-455 font-bold">Delete Promo Voucher?</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Confirm deleting coupon <strong>{selectedCode?.code}</strong>. This removes it from registry immediately.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              className="border-slate-800 text-slate-350 hover:bg-slate-850 hover:text-white text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (selectedCode) {
                  deleteMutation.mutate(selectedCode._id || selectedCode.id);
                }
              }}
              disabled={deleteMutation.isPending}
              className="bg-rose-650 hover:bg-rose-550 text-white font-semibold text-xs"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Removing...
                </>
              ) : (
                'Confirm Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

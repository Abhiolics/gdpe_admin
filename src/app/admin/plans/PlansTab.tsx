'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { planApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Sparkles,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

// Fallback mockup data
const fallbackPlans = [
  { _id: '6a265e1caa6616b5229e9340', name: 'Bronze Plan', amount: 500, description: 'Starter plan with 5 tasks daily and regular transfer speeds.', isActive: true },
  { _id: '6a265e31aa6616b5229e9344', name: 'Gold Premium', amount: 1399, description: 'Unlimited transaction streams with cashback membership privileges and priority support.', isActive: true },
  { _id: '6a20e4b6035e8afb971f3597', name: 'Platinum VIP', amount: 3000, description: 'VIP exclusive investments, instant cash withdrawal settle speeds, and max tasks limits.', isActive: false },
];

export default function PlansPage() {
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  
  // Dialog controls
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form inputs
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [incomeOnApproval, setIncomeOnApproval] = useState('');

  const [mounted, setMounted] = useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch plans
  const { data: plansRes, isLoading: isQueryLoading, error, isError } = useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: () => planApi.getPlansAdmin(),
    enabled: mounted,
  });

  const isLoading = !mounted || isQueryLoading;


  // Robust list extractor
  const getPlansList = () => {
    if (!plansRes) return [];
    const rData = plansRes.data?.data;
    if (Array.isArray(rData)) return rData;
    if (rData && typeof rData === 'object') {
      for (const key of Object.keys(rData)) {
        if (Array.isArray((rData as any)[key])) return (rData as any)[key];
      }
    }
    const responseData = plansRes.data;
    if (Array.isArray(responseData)) return responseData;
    if (responseData && typeof responseData === 'object') {
      for (const key of Object.keys(responseData)) {
        if (Array.isArray((responseData as any)[key])) return (responseData as any)[key];
      }
    }
    return [];
  };

  const plans = getPlansList();

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: { name: string; amount: number; description: string; incomeOnApproval?: number }) => 
      planApi.createPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] });
      toast.success('Subscription plan created successfully');
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create plan');
    }
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; amount: number; description: string; incomeOnApproval?: number } }) => 
      planApi.updatePlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] });
      toast.success('Subscription plan updated successfully');
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update plan');
    }
  });

  // Toggle Mutation
  const toggleMutation = useMutation({
    mutationFn: (id: string) => planApi.togglePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] });
      toast.success('Plan status toggled successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to toggle plan status');
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => planApi.deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] });
      toast.success('Subscription plan deleted successfully');
      setIsDeleteOpen(false);
      setSelectedPlan(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete plan');
    }
  });

  const handleEditClick = (plan: any) => {
    setSelectedPlan(plan);
    setName(plan.name);
    setAmount(plan.amount.toString());
    setDescription(plan.description);
    setIncomeOnApproval(plan.incomeOnApproval !== undefined && plan.incomeOnApproval !== null ? plan.incomeOnApproval.toString() : '');
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setName('');
    setAmount('');
    setDescription('');
    setIncomeOnApproval('');
    setSelectedPlan(null);
    setIsFormOpen(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Amount must be a positive number');
      return;
    }

    const incomeOnApprovalNum = incomeOnApproval ? parseFloat(incomeOnApproval) : undefined;
    if (incomeOnApprovalNum !== undefined && (isNaN(incomeOnApprovalNum) || incomeOnApprovalNum < 0)) {
      toast.error('Income on approval must be a non-negative number');
      return;
    }

    const payload = { 
      name, 
      amount: amountNum, 
      description, 
      incomeOnApproval: incomeOnApprovalNum 
    };

    if (selectedPlan) {
      updateMutation.mutate({ id: selectedPlan._id || selectedPlan.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Investment Plans</h1>
          <p className="text-slate-400 text-sm">Configure subscription packages, set pricing structures, and manage operational products.</p>
        </div>
        
        <Button 
          onClick={() => setIsFormOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-1.5 w-fit self-start md:self-auto shadow-md shadow-emerald-600/20"
        >
          <Plus className="h-4.5 w-4.5" />
          Create Plan
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-60 flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-sm text-slate-400">Loading active subscription plans...</p>
        </div>
      ) : isError ? (
        <div className="py-20 text-center border border-dashed border-rose-500/20 rounded-xl bg-rose-500/5 text-rose-400">
          Failed to load active subscription plans: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      ) : plans.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/10 text-slate-500">
          No investment plans configured. Click &quot;Create Plan&quot; to begin product setup.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan: any) => {
            const planId = plan._id || plan.id;
            return (
              <Card 
                key={planId} 
                className={`flex flex-col justify-between border-slate-800 bg-slate-900/30 backdrop-blur-xl shadow-lg hover:border-slate-700/80 transition-all ${
                  !plan.isActive && 'opacity-65'
                }`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    {plan.isActive ? (
                      <Badge className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20">
                        Active Product
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-slate-800 text-slate-400">
                        Suspended
                      </Badge>
                    )}
                    <span className="text-xs text-slate-500 font-mono">ID: {planId.slice(-6)}</span>
                  </div>
                  <CardTitle className="text-xl font-bold text-white mt-3">{plan.name}</CardTitle>
                  <CardDescription className="text-slate-405 text-xs line-clamp-2 mt-1.5">
                    {plan.description || 'No description provided'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-2 space-y-2">
                  <div className="flex items-baseline gap-1 bg-slate-950/45 px-3 py-2.5 rounded-lg border border-slate-850 w-full justify-center">
                    <span className="text-slate-500 text-xs font-semibold">Price:</span>
                    <span className="text-2xl font-extrabold text-white">₹{plan.amount.toLocaleString('en-IN')}</span>
                  </div>
                  {plan.incomeOnApproval !== undefined && plan.incomeOnApproval !== null && (
                    <div className="flex items-center justify-between bg-emerald-950/30 px-3 py-2 rounded-lg border border-emerald-900/30 text-xs text-emerald-300">
                      <span>Income on Approval:</span>
                      <span className="font-semibold text-white">₹{plan.incomeOnApproval.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex gap-2 pt-4 border-t border-slate-850/60 mt-4">
                  {/* Active Toggle */}
                  <Button
                    onClick={() => toggleMutation.mutate(planId)}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-slate-800 bg-slate-950/50 text-slate-300 hover:bg-slate-850 hover:text-white"
                  >
                    {plan.isActive ? (
                      <span className="flex items-center gap-1.5 text-xs text-amber-400">
                        <ToggleRight className="h-4 w-4" /> Suspended
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-450">
                        <ToggleLeft className="h-4 w-4" /> Activate
                      </span>
                    )}
                  </Button>

                  {/* Edit */}
                  <Button
                    onClick={() => handleEditClick(plan)}
                    variant="outline"
                    size="icon"
                    className="border-slate-800 bg-slate-950/50 text-slate-350 hover:bg-slate-850 hover:text-white"
                    title="Edit Plan"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>

                  {/* Delete */}
                  <Button
                    onClick={() => {
                      setSelectedPlan(plan);
                      setIsDeleteOpen(true);
                    }}
                    variant="outline"
                    size="icon"
                    className="border-slate-800 bg-slate-950/50 text-rose-400 hover:bg-rose-500/10 hover:text-rose-350 hover:border-rose-500/20"
                    title="Delete Plan"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Form Drawer Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(val) => !val && resetForm()}>
        <DialogContent className="border-slate-800 bg-slate-900 text-white max-w-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-400" />
              {selectedPlan ? 'Update Investment Plan' : 'Create Subscription Package'}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Fill details below. Users will instantly see this product listed on their storefront.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="planName">Package Title</Label>
              <Input
                id="planName"
                placeholder="Gold Premium / Elite VIP"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-700"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="planPrice">Price (₹)</Label>
                <Input
                  id="planPrice"
                  type="number"
                  placeholder="1499"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-700"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="incomeOnApproval">Income on Approval (₹)</Label>
                <Input
                  id="incomeOnApproval"
                  type="number"
                  placeholder="0"
                  value={incomeOnApproval}
                  onChange={(e) => setIncomeOnApproval(e.target.value)}
                  className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-700"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="planDesc">Description & Privileges</Label>
              <Textarea
                id="planDesc"
                placeholder="List package features: e.g. 5 tasks limit, 2x withdrawal settle speed, exclusive priority chat support..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-700 resize-none h-24 text-xs"
                required
              />
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="border-slate-800 text-slate-350 hover:bg-slate-850 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-600/20"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Product...
                  </>
                ) : (
                  selectedPlan ? 'Update Plan' : 'Publish Plan'
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
            <DialogTitle className="flex items-center gap-2 text-rose-450 font-bold">
              <AlertCircle className="h-5 w-5" />
              Delete Product Configuration?
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Deleting <strong>{selectedPlan?.name}</strong> will remove it from the system. This cannot be undone.
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
                if (selectedPlan) {
                  deleteMutation.mutate(selectedPlan._id || selectedPlan.id);
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

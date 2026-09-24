'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, upiApi, paymentMethodApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Loader2, 
  Settings, 
  Coins, 
  Phone, 
  AlertTriangle,
  QrCode,
  Building,
  Plus,
  Edit,
  Trash2,
  Save,
  CheckCircle2,
  Wallet,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

// Fallback settings mockup
const fallbackSettings = {
  maintenanceMode: false,
  maintenanceMessage: 'The system is currently undergoing scheduled maintenance. Please check back later.',
  forceUpdate: false,
  updateMessage: 'A critical update is available. Please update your application to continue.',
  currentVersion: '1.0.0',
  qrCode: {
    enabled: false,
    imageUrl: '',
  },
  bankAccount: {
    enabled: true,
    accountHolder: 'Sandeep Gupta',
    bankName: 'State Bank of India',
    accountNumber: '123456789012',
    ifscCode: 'SBIN0001234',
  },
  upis: [
    { upiId: 'payee1@upi', payeeName: 'Sandeep Gupta', enabled: true },
    { upiId: 'payee2@upi', payeeName: 'GDPe Services', enabled: false }
  ],
  contacts: [
    { _id: '6a267c8d0913d8ca8ada628b', type: 'whatsapp', label: 'Urgent Support', value: '9198140806' },
    { _id: '6a267cd10913d8ca8ada62b3', type: 'support', label: 'Help Desk', value: 'https://example.com/support' },
  ]
};

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('app');

  const [mounted, setMounted] = useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Settings
  const { data: settingsRes, isLoading: isQueryLoading, error, isError } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => adminApi.getSettings(),
    enabled: mounted,
  });

  // Fetch UPI Directory (Admin)
  const { data: upisRes, isLoading: isUpiLoading, error: upiError, isError: isUpiError, refetch: refetchUpis } = useQuery({
    queryKey: ['admin', 'upis'],
    queryFn: () => upiApi.getAllUpisAdmin(),
    enabled: mounted && activeTab === 'upi',
  });

  const getUpisList = () => {
    if (!upisRes) return [];
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
    return [];
  };

  const upiList = getUpisList();

  // Fetch Payment Methods (Admin)
  const { data: paymentMethodsRes, isLoading: isPaymentMethodsLoading, error: pmError, isError: isPmError } = useQuery({
    queryKey: ['admin', 'paymentMethods'],
    queryFn: () => paymentMethodApi.getPaymentMethodsAdmin(),
    enabled: mounted && activeTab === 'billing',
  });

  const getPaymentMethodsList = () => {
    if (!paymentMethodsRes) return [];
    const rData = paymentMethodsRes.data?.data;
    if (Array.isArray(rData)) return rData;
    if (rData && typeof rData === 'object') {
      for (const key of Object.keys(rData)) {
        if (Array.isArray((rData as any)[key])) return (rData as any)[key];
      }
    }
    const responseData = paymentMethodsRes.data;
    if (Array.isArray(responseData)) return responseData;
    if (responseData && typeof responseData === 'object') {
      for (const key of Object.keys(responseData)) {
        if (Array.isArray((responseData as any)[key])) return (responseData as any)[key];
      }
    }
    return [];
  };

  const paymentMethodsList = getPaymentMethodsList();
  const upiMethods = paymentMethodsList.filter((pm: any) => pm.type === 'upi');
  const bankMethods = paymentMethodsList.filter((pm: any) => pm.type === 'bank');

  const isLoading = !mounted || isQueryLoading;

  const settings = settingsRes?.data?.data || settingsRes?.data || fallbackSettings;
  const contacts = settings.contacts ?? fallbackSettings.contacts;


  // Mutations
  const maintenanceMutation = useMutation({
    mutationFn: (data: any) => adminApi.updateMaintenance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      toast.success('Maintenance mode configurations updated');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update maintenance settings')
  });

  const appControlMutation = useMutation({
    mutationFn: (data: any) => adminApi.updateAppControl(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      toast.success('App update parameters updated');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update app control settings')
  });

  // Granular Payment Methods mutations
  const addPaymentMethodMutation = useMutation({
    mutationFn: (data: any) => paymentMethodApi.addPaymentMethod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'paymentMethods'] });
      toast.success('Payment method added successfully');
      closePaymentMethodForm();
    },
    onError: (err: any) => toast.error(err.message || 'Failed to add payment method')
  });

  const updatePaymentMethodMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => paymentMethodApi.updatePaymentMethod(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'paymentMethods'] });
      toast.success('Payment method updated successfully');
      closePaymentMethodForm();
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update payment method')
  });

  const deletePaymentMethodMutation = useMutation({
    mutationFn: (id: string) => paymentMethodApi.deletePaymentMethod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'paymentMethods'] });
      toast.success('Payment method deleted successfully');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete payment method')
  });

  const enablePaymentMethodMutation = useMutation({
    mutationFn: (data: { type: 'upi' | 'bank'; enabled: boolean | string }) => 
      paymentMethodApi.enablePaymentMethod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'paymentMethods'] });
      toast.success('Payment method status updated');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to toggle status')
  });

  // Contacts mutations
  const [editingContact, setEditingContact] = useState<any>(null);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [cType, setCType] = useState('whatsapp');
  const [cLabel, setCLabel] = useState('');
  const [cValue, setCValue] = useState('');

  const addContactMutation = useMutation({
    mutationFn: (data: any) => adminApi.addContact(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      toast.success('Support contact added');
      closeContactForm();
    },
    onError: (err: any) => toast.error(err.message || 'Failed to add contact')
  });

  const updateContactMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.updateContact(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      toast.success('Support contact updated');
      closeContactForm();
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update contact')
  });

  const deleteContactMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      toast.success('Support contact deleted');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete contact')
  });

  // State bindings for direct updates (initialized when data is ready or fallback)
  // Maintenance bindings
  const [mMode, setMMode] = useState(settings.maintenanceMode);
  const [mMessage, setMMessage] = useState(settings.maintenanceMessage);

  // App Control bindings
  const [fUpdate, setFUpdate] = useState(settings.forceUpdate);
  const [uMessage, setUMessage] = useState(settings.updateMessage);
  const [cVersion, setCVersion] = useState(settings.currentVersion);

  // Global payment method switches
  const [upiGlobalEnabled, setUpiGlobalEnabled] = useState(true);
  const [bankGlobalEnabled, setBankGlobalEnabled] = useState(true);

  // UPI Form states
  const [isUpiConfigFormOpen, setIsUpiConfigFormOpen] = useState(false);
  const [editingUpiMethod, setEditingUpiMethod] = useState<any>(null);
  const [upiPayeeName, setUpiPayeeName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [upiEnabled, setUpiEnabled] = useState(true);

  // Bank Form states
  const [isBankConfigFormOpen, setIsBankConfigFormOpen] = useState(false);
  const [editingBankMethod, setEditingBankMethod] = useState<any>(null);
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankEnabledState, setBankEnabledState] = useState(true);

  const openUpiAdd = () => {
    setEditingUpiMethod(null);
    setUpiPayeeName('');
    setUpiId('');
    setUpiEnabled(true);
    setIsUpiConfigFormOpen(true);
  };

  const openUpiEdit = (pm: any) => {
    setEditingUpiMethod(pm);
    setUpiPayeeName(pm.upiPayeeName || pm.payeeName || '');
    setUpiId(pm.upiId || '');
    setUpiEnabled(pm.enabled ?? true);
    setIsUpiConfigFormOpen(true);
  };

  const closeUpiConfigForm = () => {
    setEditingUpiMethod(null);
    setUpiPayeeName('');
    setUpiId('');
    setUpiEnabled(true);
    setIsUpiConfigFormOpen(false);
  };

  const handleUpiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiId || !upiPayeeName) return;

    const payload = {
      type: 'upi',
      upiId,
      upiPayeeName,
      enabled: upiEnabled,
    };

    if (editingUpiMethod) {
      const pmId = editingUpiMethod._id || editingUpiMethod.id;
      updatePaymentMethodMutation.mutate({ id: pmId, data: payload });
    } else {
      addPaymentMethodMutation.mutate(payload);
    }
  };

  const openBankAdd = () => {
    setEditingBankMethod(null);
    setBankAccountHolder('');
    setBankName('');
    setBankAccountNumber('');
    setBankIfsc('');
    setBankEnabledState(true);
    setIsBankConfigFormOpen(true);
  };

  const openBankEdit = (pm: any) => {
    setEditingBankMethod(pm);
    setBankAccountHolder(pm.accountHolderName || pm.accountHolder || '');
    setBankName(pm.bankName || '');
    setBankAccountNumber(pm.accountNumber || '');
    setBankIfsc(pm.ifscCode || pm.ifsc || '');
    setBankEnabledState(pm.enabled ?? true);
    setIsBankConfigFormOpen(true);
  };

  const closeBankConfigForm = () => {
    setEditingBankMethod(null);
    setBankAccountHolder('');
    setBankName('');
    setBankAccountNumber('');
    setBankIfsc('');
    setBankEnabledState(true);
    setIsBankConfigFormOpen(false);
  };

  const handleBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankAccountHolder || !bankName || !bankAccountNumber || !bankIfsc) return;

    const payload = {
      type: 'bank',
      accountHolderName: bankAccountHolder,
      bankName,
      accountNumber: bankAccountNumber,
      ifscCode: bankIfsc,
      enabled: bankEnabledState,
    };

    if (editingBankMethod) {
      const pmId = editingBankMethod._id || editingBankMethod.id;
      updatePaymentMethodMutation.mutate({ id: pmId, data: payload });
    } else {
      addPaymentMethodMutation.mutate(payload);
    }
  };

  const closePaymentMethodForm = () => {
    closeUpiConfigForm();
    closeBankConfigForm();
  };

  const handleUpiGlobalToggle = (checked: boolean) => {
    setUpiGlobalEnabled(checked);
    enablePaymentMethodMutation.mutate({ type: 'upi', enabled: checked.toString() });
  };

  const handleBankGlobalToggle = (checked: boolean) => {
    setBankGlobalEnabled(checked);
    enablePaymentMethodMutation.mutate({ type: 'bank', enabled: checked.toString() });
  };

  // Keep state synced when API responds
  React.useEffect(() => {
    if (settingsRes?.data) {
      const s = settingsRes.data.data || settingsRes.data;
      if (s) {
        setMMode(s.maintenanceMode ?? fallbackSettings.maintenanceMode);
        setMMessage(s.maintenanceMessage ?? fallbackSettings.maintenanceMessage);
        setFUpdate(s.forceUpdate ?? fallbackSettings.forceUpdate);
        setUMessage(s.updateMessage ?? fallbackSettings.updateMessage);
        setCVersion(s.currentVersion ?? fallbackSettings.currentVersion);
        setBankGlobalEnabled(s.bankAccount?.enabled ?? s.isBankEnabled ?? true);
        setUpiGlobalEnabled(s.qrCode?.enabled ?? s.isUpiEnabled ?? true);
      }
    }
  }, [settingsRes]);

  React.useEffect(() => {
    if (paymentMethodsRes?.data) {
      const d = paymentMethodsRes.data.data || paymentMethodsRes.data;
      if (d && typeof d === 'object') {
        if (d.isUpiEnabled !== undefined) setUpiGlobalEnabled(d.isUpiEnabled);
        if (d.isBankEnabled !== undefined) setBankGlobalEnabled(d.isBankEnabled);
      }
    }
  }, [paymentMethodsRes]);

  const handleMaintenanceSave = (e: React.FormEvent) => {
    e.preventDefault();
    maintenanceMutation.mutate({ maintenanceMode: mMode, maintenanceMessage: mMessage });
  };

  const handleAppControlSave = (e: React.FormEvent) => {
    e.preventDefault();
    appControlMutation.mutate({ forceUpdate: fUpdate, updateMessage: uMessage, currentVersion: cVersion });
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cLabel || !cValue) return;
    const payload = { type: cType, label: cLabel, value: cValue };
    if (editingContact) {
      updateContactMutation.mutate({ id: editingContact._id || editingContact.id, data: payload });
    } else {
      addContactMutation.mutate(payload);
    }
  };

  const openContactEdit = (contact: any) => {
    setEditingContact(contact);
    setCType(contact.type);
    setCLabel(contact.label);
    setCValue(contact.value);
    setIsContactFormOpen(true);
  };

  const closeContactForm = () => {
    setEditingContact(null);
    setCType('whatsapp');
    setCLabel('');
    setCValue('');
    setIsContactFormOpen(false);
  };

  if (isError) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center p-6 border border-dashed border-rose-500/20 bg-rose-500/5 rounded-xl max-w-2xl mx-auto">
        <p className="text-sm text-rose-400 font-semibold">Failed to fetch settings configurations</p>
        <p className="text-xs text-rose-455">{error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <p className="text-sm text-slate-400">Loading system parameters...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">System Settings</h1>
        <p className="text-slate-400 text-sm">Manage platform maintenance states, configure billing details, and update customer contact logs.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="border-slate-800 bg-slate-900 text-slate-400">
          <TabsTrigger value="app" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white gap-1.5">
            <Settings className="h-4 w-4" /> App Controls
          </TabsTrigger>
          <TabsTrigger value="billing" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white gap-1.5">
            <Coins className="h-4 w-4" /> Payment Setup
          </TabsTrigger>
          <TabsTrigger value="contacts" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white gap-1.5">
            <Phone className="h-4 w-4" /> Support Channels
          </TabsTrigger>
          <TabsTrigger value="upi" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white gap-1.5">
            <Wallet className="h-4 w-4" /> UPI Directory
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: App Maintenance Controls */}
        <TabsContent value="app" className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Maintenance Mode */}
            <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl">
              <form onSubmit={handleMaintenanceSave}>
                <CardHeader>
                  <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Maintenance Mode
                  </CardTitle>
                  <CardDescription className="text-slate-500 text-xs">
                    Suspend user API activities. Admins bypass this setting automatically.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-slate-850 bg-slate-950/45 p-3.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-slate-200">Enable Maintenance</span>
                      <span className="text-[10px] text-slate-550">Restricts user interfaces instantly</span>
                    </div>
                    <Switch 
                      checked={mMode} 
                      onCheckedChange={setMMode} 
                      className="data-[state=checked]:bg-emerald-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="mMessage">Maintenance Warning Message</Label>
                    <Textarea
                      id="mMessage"
                      value={mMessage}
                      onChange={(e) => setMMessage(e.target.value)}
                      className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-700 h-24 text-xs resize-none"
                      disabled={!mMode}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter className="border-t border-slate-850/60 pt-4">
                  <Button
                    type="submit"
                    disabled={maintenanceMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs ml-auto gap-1.5 shadow-md shadow-emerald-600/20"
                  >
                    {maintenanceMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save Config
                  </Button>
                </CardFooter>
              </form>
            </Card>

            {/* Version control */}
            <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl">
              <form onSubmit={handleAppControlSave}>
                <CardHeader>
                  <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    App Version Controls
                  </CardTitle>
                  <CardDescription className="text-slate-500 text-xs">
                    Push forced upgrades to mobile or web client application shells.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-slate-850 bg-slate-950/45 p-3.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-slate-200">Force App Update</span>
                      <span className="text-[10px] text-slate-550">Lock screen until update completes</span>
                    </div>
                    <Switch 
                      checked={fUpdate} 
                      onCheckedChange={setFUpdate} 
                      className="data-[state=checked]:bg-emerald-600"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1 space-y-1.5">
                      <Label htmlFor="cVersion">Target Version</Label>
                      <Input
                        id="cVersion"
                        value={cVersion}
                        onChange={(e) => setCVersion(e.target.value)}
                        className="border-slate-800 bg-slate-950 text-white font-mono"
                        required
                      />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label htmlFor="uMessage">Upgrade Description</Label>
                      <Input
                        id="uMessage"
                        value={uMessage}
                        onChange={(e) => setUMessage(e.target.value)}
                        className="border-slate-800 bg-slate-950 text-white text-xs"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-slate-850/60 pt-4">
                  <Button
                    type="submit"
                    disabled={appControlMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs ml-auto gap-1.5 shadow-md shadow-emerald-600/20"
                  >
                    {appControlMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Update Version
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Billing Payment Setup */}
        <TabsContent value="billing" className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Card 1: UPI Gateway Configurations */}
            <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl">
              <CardHeader className="pb-4 border-b border-slate-850/60">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-emerald-400" />
                      UPI Payment VPAs
                    </CardTitle>
                    <CardDescription className="text-slate-500 text-xs">
                      Manage active UPI virtual payment addresses for user deposits.
                    </CardDescription>
                  </div>
                  <Switch 
                    checked={upiGlobalEnabled} 
                    onCheckedChange={handleUpiGlobalToggle}
                    className="data-[state=checked]:bg-emerald-600"
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Configured handles:</span>
                  <Button
                    type="button"
                    onClick={openUpiAdd}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-1.5 h-8 text-xs px-3 shadow-md shadow-emerald-600/20"
                  >
                    <Plus className="h-4 w-4" /> Add UPI VPA
                  </Button>
                </div>

                {isPaymentMethodsLoading ? (
                  <div className="py-12 flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                  </div>
                ) : upiMethods.length === 0 ? (
                  <div className="py-8 text-center text-slate-550 text-xs italic border border-dashed border-slate-850 rounded-lg">
                    No UPI VPAs configured. Click "Add UPI VPA".
                  </div>
                ) : (
                  <div className="border border-slate-850 rounded-lg overflow-hidden bg-slate-950/20">
                    <Table>
                      <TableHeader className="bg-slate-950/40 border-b border-slate-850">
                        <TableRow className="border-slate-850 hover:bg-transparent">
                          <TableHead className="text-slate-400 font-semibold text-xs py-2 pl-4">Payee</TableHead>
                          <TableHead className="text-slate-400 font-semibold text-xs py-2">UPI ID</TableHead>
                          <TableHead className="text-slate-400 font-semibold text-xs py-2 text-center">Status</TableHead>
                          <TableHead className="text-slate-400 font-semibold text-xs py-2 pr-4 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {upiMethods.map((pm: any) => {
                          const pmId = pm._id || pm.id;
                          return (
                            <TableRow key={pmId} className="border-slate-850 hover:bg-slate-900/15 transition-colors">
                              <TableCell className="py-2.5 pl-4 text-xs text-white font-semibold">{pm.upiPayeeName || pm.payeeName}</TableCell>
                              <TableCell className="py-2.5 text-xs text-teal-400 font-mono font-semibold truncate max-w-[120px]">{pm.upiId}</TableCell>
                              <TableCell className="py-2.5 text-center">
                                {pm.enabled ? (
                                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-1.5 py-0 font-bold">Active</Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-slate-800 text-slate-500 text-[9px] px-1.5 py-0 font-bold">Disabled</Badge>
                                )}
                              </TableCell>
                              <TableCell className="py-2.5 pr-4 text-right">
                                <div className="flex justify-end gap-1.5">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => openUpiEdit(pm)}
                                    className="h-7 w-7 p-0 border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => deletePaymentMethodMutation.mutate(pmId)}
                                    className="h-7 w-7 p-0 border-slate-850 text-rose-450 hover:bg-rose-500/10 hover:text-rose-400"
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

            {/* Card 2: Bank Account Configurations */}
            <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl">
              <CardHeader className="pb-4 border-b border-slate-850/60">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                      <Building className="h-5 w-5 text-emerald-400" />
                      Bank Account Details
                    </CardTitle>
                    <CardDescription className="text-slate-500 text-xs">
                      Manage bank transfer coordinates visible during user deposits.
                    </CardDescription>
                  </div>
                  <Switch 
                    checked={bankGlobalEnabled} 
                    onCheckedChange={handleBankGlobalToggle}
                    className="data-[state=checked]:bg-emerald-600"
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Configured accounts:</span>
                  <Button
                    type="button"
                    onClick={openBankAdd}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-1.5 h-8 text-xs px-3 shadow-md shadow-emerald-600/20"
                  >
                    <Plus className="h-4 w-4" /> Add Bank Account
                  </Button>
                </div>

                {isPaymentMethodsLoading ? (
                  <div className="py-12 flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                  </div>
                ) : bankMethods.length === 0 ? (
                  <div className="py-8 text-center text-slate-550 text-xs italic border border-dashed border-slate-850 rounded-lg">
                    No Bank Accounts configured. Click "Add Bank Account".
                  </div>
                ) : (
                  <div className="border border-slate-850 rounded-lg overflow-hidden bg-slate-950/20">
                    <Table>
                      <TableHeader className="bg-slate-950/40 border-b border-slate-850">
                        <TableRow className="border-slate-850 hover:bg-transparent">
                          <TableHead className="text-slate-400 font-semibold text-xs py-2 pl-4">Holder / Bank</TableHead>
                          <TableHead className="text-slate-400 font-semibold text-xs py-2">Acc / IFSC</TableHead>
                          <TableHead className="text-slate-400 font-semibold text-xs py-2 text-center">Status</TableHead>
                          <TableHead className="text-slate-400 font-semibold text-xs py-2 pr-4 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bankMethods.map((pm: any) => {
                          const pmId = pm._id || pm.id;
                          return (
                            <TableRow key={pmId} className="border-slate-850 hover:bg-slate-900/15 transition-colors">
                              <TableCell className="py-2.5 pl-4 text-xs font-semibold">
                                <div className="text-white">{pm.accountHolderName || pm.accountHolder}</div>
                                <div className="text-[10px] text-slate-555">{pm.bankName}</div>
                              </TableCell>
                              <TableCell className="py-2.5 text-xs font-mono font-semibold">
                                <div className="text-teal-400">{pm.accountNumber}</div>
                                <div className="text-[10px] text-slate-550">{pm.ifscCode || pm.ifsc}</div>
                              </TableCell>
                              <TableCell className="py-2.5 text-center">
                                {pm.enabled ? (
                                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-1.5 py-0 font-bold">Active</Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-slate-800 text-slate-500 text-[9px] px-1.5 py-0 font-bold">Disabled</Badge>
                                )}
                              </TableCell>
                              <TableCell className="py-2.5 pr-4 text-right">
                                <div className="flex justify-end gap-1.5">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => openBankEdit(pm)}
                                    className="h-7 w-7 p-0 border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => deletePaymentMethodMutation.mutate(pmId)}
                                    className="h-7 w-7 p-0 border-slate-850 text-rose-455 hover:bg-rose-500/10 hover:text-rose-400"
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
          </div>
        </TabsContent>

        {/* Tab 3: Support Contacts */}
        <TabsContent value="contacts" className="mt-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-slate-350">Platform Support Lines</h2>
            <Button
              onClick={() => setIsContactFormOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-1.5 size-sm h-9 text-xs shadow-md shadow-emerald-600/20"
            >
              <Plus className="h-4 w-4" /> Add Line
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {contacts.map((contact: any) => {
              const cid = contact._id || contact.id;
              return (
                <Card key={cid} className="border-slate-800 bg-slate-900/40 backdrop-blur-xl">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <CardTitle className="text-sm font-bold text-white capitalize">{contact.label}</CardTitle>
                      <CardDescription className="text-[10px] text-slate-500 uppercase tracking-wider">{contact.type}</CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-mono select-none">
                      {contact.type === 'whatsapp' ? 'Phone Line' : 'Redirect Link'}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg bg-slate-950/45 border border-slate-850/60 p-3.5 font-mono text-xs text-slate-250 truncate">
                      {contact.value}
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2 border-t border-slate-850/60 pt-3 mt-1.5">
                    <Button
                      onClick={() => openContactEdit(contact)}
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 border-slate-800 bg-slate-950 text-slate-350 hover:bg-slate-850 hover:text-white text-xs gap-1.5"
                    >
                      <Edit className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button
                      onClick={() => deleteContactMutation.mutate(cid)}
                      variant="outline"
                      size="sm"
                      className="border-slate-850 text-rose-400 hover:bg-rose-500/10 hover:text-rose-350 hover:border-rose-500/20 text-xs gap-1.5 px-3"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab 4: UPI Directory */}
        <TabsContent value="upi" className="mt-6">
          <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-emerald-400" />
                  Global UPI Directory
                </CardTitle>
                <CardDescription className="text-slate-500 text-xs">
                  Review and audit registered UPI handles across all client wallets.
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => refetchUpis()}
                disabled={isUpiLoading}
                className="border-slate-850 bg-slate-950/40 text-slate-400 hover:text-white text-xs"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isUpiLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {isUpiLoading ? (
                <div className="flex h-60 flex-col items-center justify-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                  <p className="text-sm text-slate-400">Loading UPI directory...</p>
                </div>
              ) : isUpiError ? (
                <div className="flex h-60 flex-col items-center justify-center gap-2 text-rose-455 p-6 text-center">
                  <AlertTriangle className="h-8 w-8 text-rose-500" />
                  <p className="text-sm font-semibold">Failed to fetch UPI records</p>
                  <p className="text-xs text-rose-500/80">{upiError instanceof Error ? upiError.message : 'Unknown error'}</p>
                </div>
              ) : upiList.length === 0 ? (
                <div className="py-20 text-center text-slate-500 text-sm">
                  No user UPI accounts registered on the platform.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-950/20 border-b border-slate-800">
                      <TableRow className="border-slate-850 hover:bg-transparent">
                        <TableHead className="text-slate-400 font-semibold text-xs py-3.5 pl-6">Owner Name</TableHead>
                        <TableHead className="text-slate-400 font-semibold text-xs py-3.5">UPI Address / VPA</TableHead>
                        <TableHead className="text-slate-400 font-semibold text-xs py-3.5">Owner User Account</TableHead>
                        <TableHead className="text-slate-400 font-semibold text-xs py-3.5">Priority</TableHead>
                        <TableHead className="text-slate-400 font-semibold text-xs py-3.5 pr-6 text-right">Created At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upiList.map((upi: any) => {
                        const upiIdVal = upi._id || upi.id;
                        const userEmail = upi.userId?.email || upi.user?.email || upi.userId || 'N/A';
                        const userFullName = upi.userId?.fullName || upi.user?.fullName || 'Client User';

                        return (
                          <TableRow key={upiIdVal} className="border-slate-850 hover:bg-slate-850/20">
                            <TableCell className="py-3.5 pl-6 font-medium text-white text-sm">
                              {upi.accountHolderName || 'N/A'}
                            </TableCell>
                            <TableCell className="py-3.5 font-mono text-teal-400 text-sm">
                              {upi.upiId}
                            </TableCell>
                            <TableCell className="py-3.5">
                              <div className="text-white text-xs font-semibold">{userFullName}</div>
                              <div className="text-slate-500 text-xs">{userEmail}</div>
                            </TableCell>
                            <TableCell className="py-3.5">
                              {upi.isPrimary ? (
                                <Badge className="bg-emerald-500/10 text-emerald-450 hover:bg-emerald-500/10 border border-emerald-500/20 text-[10px] px-2 py-0.5 font-bold">
                                  Primary
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5">
                                  Secondary
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="py-3.5 pr-6 text-right text-xs text-slate-500 font-mono">
                              {upi.createdAt ? new Date(upi.createdAt).toLocaleString('en-IN') : 'Just now'}
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

      {/* Contact Form Dialog */}
      <Dialog open={isContactFormOpen} onOpenChange={(val) => !val && closeContactForm()}>
        <DialogContent className="border-slate-800 bg-slate-900 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-emerald-400" />
              {editingContact ? 'Edit Support Line' : 'Add Support Channel'}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Vouchers and lines will show up in the customer support pages.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleContactSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="cType">Channel Type</Label>
              <select
                id="cType"
                value={cType}
                onChange={(e) => setCType(e.target.value)}
                className="w-full rounded-md border border-slate-800 bg-slate-950 text-white px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="whatsapp" className="bg-slate-900 text-white">WhatsApp Direct Number</option>
                <option value="support" className="bg-slate-900 text-white">Support URL Link</option>
                <option value="email" className="bg-slate-900 text-white">Support Email Address</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cLabel">Channel Label</Label>
              <Input
                id="cLabel"
                placeholder="Urgent WhatsApp Help / Customer Desk"
                value={cLabel}
                onChange={(e) => setCLabel(e.target.value)}
                className="border-slate-800 bg-slate-950 text-white text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cValue">Connection Endpoint (Link/Number)</Label>
              <Input
                id="cValue"
                placeholder="9198140806 / https://help.gdpe.info"
                value={cValue}
                onChange={(e) => setCValue(e.target.value)}
                className="border-slate-800 bg-slate-950 text-white text-xs font-mono"
                required
              />
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeContactForm}
                className="border-slate-800 text-slate-355 hover:bg-slate-850 hover:text-white text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addContactMutation.isPending || updateContactMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20"
              >
                {addContactMutation.isPending || updateContactMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingContact ? 'Save Changes' : 'Add Contact'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Merchant UPI Configuration Dialog */}
      <Dialog open={isUpiConfigFormOpen} onOpenChange={(val) => !val && closeUpiConfigForm()}>
        <DialogContent className="border-slate-800 bg-slate-900 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-400" />
              {editingUpiMethod ? 'Edit Merchant UPI VPA' : 'Add Merchant UPI VPA'}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Configure deposit virtual payment addresses for client transactions.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpiSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="upiPayeeName">Payee Name</Label>
              <Input
                id="upiPayeeName"
                placeholder="e.g. GDPe Services Ltd"
                value={upiPayeeName}
                onChange={(e) => setUpiPayeeName(e.target.value)}
                className="border-slate-800 bg-slate-950 text-white text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="upiId">UPI ID (VPA Address)</Label>
              <Input
                id="upiId"
                placeholder="e.g. gdpe@okaxis"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="border-slate-800 bg-slate-950 text-white text-xs font-mono"
                required
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-850 bg-slate-950/45 p-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-slate-200">Active Status</span>
                <span className="text-[9px] text-slate-550">Users can pay to this address immediately</span>
              </div>
              <Switch 
                checked={upiEnabled} 
                onCheckedChange={setUpiEnabled}
                className="data-[state=checked]:bg-emerald-600"
              />
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeUpiConfigForm}
                className="border-slate-800 text-slate-355 hover:bg-slate-850 hover:text-white text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addPaymentMethodMutation.isPending || updatePaymentMethodMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20"
              >
                {addPaymentMethodMutation.isPending || updatePaymentMethodMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingUpiMethod ? 'Save Changes' : 'Add UPI VPA'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Merchant Bank Account Configuration Dialog */}
      <Dialog open={isBankConfigFormOpen} onOpenChange={(val) => !val && closeBankConfigForm()}>
        <DialogContent className="border-slate-800 bg-slate-900 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-emerald-400" />
              {editingBankMethod ? 'Edit Bank Account' : 'Add Bank Account'}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Configure deposit bank accounts for client transfers.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBankSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="bankAccountHolder">Account Holder Name</Label>
              <Input
                id="bankAccountHolder"
                placeholder="e.g. GDPe Services Ltd"
                value={bankAccountHolder}
                onChange={(e) => setBankAccountHolder(e.target.value)}
                className="border-slate-800 bg-slate-950 text-white text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                placeholder="e.g. State Bank of India"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="border-slate-800 bg-slate-950 text-white text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bankAccountNumber">Account Number</Label>
              <Input
                id="bankAccountNumber"
                placeholder="e.g. 1234567890"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                className="border-slate-800 bg-slate-950 text-white text-xs font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bankIfsc">IFSC Code</Label>
              <Input
                id="bankIfsc"
                placeholder="e.g. SBIN0001234"
                value={bankIfsc}
                onChange={(e) => setBankIfsc(e.target.value)}
                className="border-slate-800 bg-slate-950 text-white text-xs font-mono"
                required
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-850 bg-slate-950/45 p-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-slate-200">Active Status</span>
                <span className="text-[9px] text-slate-550">Users can pay to this account immediately</span>
              </div>
              <Switch 
                checked={bankEnabledState} 
                onCheckedChange={setBankEnabledState}
                className="data-[state=checked]:bg-emerald-600"
              />
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeBankConfigForm}
                className="border-slate-800 text-slate-355 hover:bg-slate-850 hover:text-white text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addPaymentMethodMutation.isPending || updatePaymentMethodMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20"
              >
                {addPaymentMethodMutation.isPending || updatePaymentMethodMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingBankMethod ? 'Save Changes' : 'Add Bank Account'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

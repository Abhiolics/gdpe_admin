'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { upiApi } from '@/lib/api';
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
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Loader2, 
  Wallet, 
  RefreshCw, 
  AlertTriangle,
  Search,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

export default function UpiDirectoryTab() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const pageParam = searchParams.get('page');
  const initialPage = pageParam ? parseInt(pageParam, 10) : 1;
  const [currentPage, setCurrentPage] = useState(initialPage > 0 ? initialPage : 1);
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => {
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
      params.set('tab', 'upi-directory');
      params.set('page', validPage.toString());
      window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('tab', 'upi-directory');
      params.set('page', '1');
      window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
    }
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  // Fetch all registered user UPIs (Admin API) with page and limit
  const { data: upisRes, isLoading: isQueryLoading, error, isError, refetch } = useQuery({
    queryKey: ['admin', 'upis', currentPage, pageSize],
    queryFn: () => upiApi.getAllUpisAdmin(currentPage, pageSize),
    enabled: mounted,
    placeholderData: keepPreviousData,
  });

  const isLoading = !mounted || isQueryLoading;

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

  // Robust server pagination extractor
  const extractServerPagination = () => {
    if (!upisRes?.data) return null;
    const raw = upisRes.data;

    const nested = raw.data?.pagination || raw.pagination || raw.meta?.pagination || raw.meta;
    if (nested && typeof nested === 'object') {
      const page = Number(nested.page || nested.currentPage || 1);
      const limit = Number(nested.limit || nested.perPage || nested.pageSize || pageSize);
      const total = Number(nested.total || nested.totalUpis || nested.totalCount || nested.count || 0);
      const pages = Number(nested.pages || nested.totalPages || (limit > 0 ? Math.ceil(total / limit) : 1));
      if (total > 0 || pages > 1) {
        return { page, limit, total, pages };
      }
    }

    const target = raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data) ? raw.data : raw;
    const directTotal = Number(target.total ?? target.totalUpis ?? target.totalCount ?? target.count);
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

  // Filter list by search query
  const filteredUpis = upiList.filter((upi: any) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    const handle = String(upi.upiId || '').toLowerCase();
    const holder = String(upi.accountHolderName || '').toLowerCase();
    const email = String(upi.userId?.email || upi.user?.email || '').toLowerCase();
    const name = String(upi.userId?.fullName || upi.user?.fullName || '').toLowerCase();
    
    return handle.includes(term) || 
           holder.includes(term) || 
           email.includes(term) || 
           name.includes(term);
  });

  const isServerPaginated = Boolean(
    !searchTerm.trim() &&
    serverPagination &&
    serverPagination.total > upiList.length &&
    upiList.length <= serverPagination.limit
  );

  const effectiveLimit = isServerPaginated && serverPagination ? serverPagination.limit : pageSize;
  const totalCount = isServerPaginated && serverPagination ? serverPagination.total : filteredUpis.length;
  const totalPages = isServerPaginated && serverPagination
    ? Math.max(1, serverPagination.pages)
    : Math.max(1, Math.ceil(filteredUpis.length / pageSize));

  const activePage = Math.min(Math.max(1, currentPage), totalPages);

  const displayedUpis = isServerPaginated
    ? filteredUpis
    : filteredUpis.slice((activePage - 1) * pageSize, activePage * pageSize);

  const startRecord = totalCount === 0 ? 0 : (activePage - 1) * effectiveLimit + 1;
  const endRecord = totalCount === 0 ? 0 : Math.min(startRecord + displayedUpis.length - 1, totalCount);

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
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Wallet className="h-8 w-8 text-emerald-400" />
            Global UPI Directory
          </h1>
          <p className="text-slate-400 text-sm">
            Monitor and audit all UPI virtual payment addresses (VPAs) registered across platform client wallets.
          </p>
        </div>
        
        <Button 
          variant="outline"
          onClick={() => refetch()}
          disabled={isLoading}
          className="border-slate-800 bg-slate-900/50 text-slate-300 hover:bg-slate-850 hover:text-white font-semibold gap-2 w-fit self-start md:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Registry
        </Button>
      </div>

      {/* Filter and Table container */}
      <Card className="border-slate-800 bg-slate-900/30 backdrop-blur-xl shadow-xl">
        <CardHeader className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold text-white">Payment Addresses Directory</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Registered UPI virtual addresses mapped to user profile accounts.
            </CardDescription>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search VPA, owner, email..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-slate-850 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-60 flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              <p className="text-sm text-slate-400">Loading payment addresses...</p>
            </div>
          ) : isError ? (
            <div className="flex h-60 flex-col items-center justify-center gap-2 text-rose-400 p-6 text-center">
              <AlertTriangle className="h-8 w-8" />
              <p className="text-sm font-semibold">Failed to fetch UPI records</p>
              <p className="text-xs text-rose-500/80">{error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
          ) : filteredUpis.length === 0 ? (
            <div className="py-20 text-center text-slate-500 text-sm italic">
              {searchTerm ? 'No matching UPI records found.' : 'No registered UPI handles on the platform.'}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-950/20 border-b border-slate-800">
                    <TableRow className="border-slate-850 hover:bg-transparent">
                      <TableHead className="text-slate-400 font-semibold text-xs py-3.5 pl-6">Owner Name</TableHead>
                      <TableHead className="text-slate-400 font-semibold text-xs py-3.5">UPI ID / VPA</TableHead>
                      <TableHead className="text-slate-400 font-semibold text-xs py-3.5">Owner User Account</TableHead>
                      <TableHead className="text-slate-400 font-semibold text-xs py-3.5">Priority</TableHead>
                      <TableHead className="text-slate-400 font-semibold text-xs py-3.5 pr-6 text-right">Created At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedUpis.map((upi: any) => {
                      const upiIdVal = upi._id || upi.id;
                      const userEmail = upi.userId?.email || upi.user?.email || upi.userId || 'N/A';
                      const userFullName = upi.userId?.fullName || upi.user?.fullName || 'Client User';

                      return (
                        <TableRow key={upiIdVal} className="border-slate-850 hover:bg-slate-850/20">
                          <TableCell className="py-3.5 pl-6">
                            <div className="font-semibold text-white text-sm flex items-center gap-1.5">
                              <UserCheck className="h-3.5 w-3.5 text-slate-500" />
                              {upi.accountHolderName || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell className="py-3.5 font-mono text-teal-400 text-sm font-semibold">
                            {upi.upiId}
                          </TableCell>
                          <TableCell className="py-3.5">
                            <div className="text-white text-xs font-semibold">{userFullName}</div>
                            <div className="text-slate-500 text-xs">{userEmail}</div>
                          </TableCell>
                          <TableCell className="py-3.5">
                            {upi.isPrimary ? (
                              <Badge className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 text-[10px] px-2 py-0.5 font-bold">
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

              {/* Pagination Controls */}
              {filteredUpis.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800 bg-slate-950/60 px-4 py-3.5">
                  <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-400">
                    <div>
                      Showing <span className="font-semibold text-white">{startRecord}</span> to{' '}
                      <span className="font-semibold text-white">{endRecord}</span> of{' '}
                      <span className="font-semibold text-white">{totalCount}</span> addresses
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
    </div>
  );
}

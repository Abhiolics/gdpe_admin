'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/lib/api';
import { Bell, User, CheckCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

import { useTab } from '@/app/admin/layout';

export default function Header() {
  const { activeTab } = useTab();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Get unread notification count
  const { data: unreadCountRes } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationApi.getUnreadCount(),
    refetchInterval: 15000, // Poll every 15s
    enabled: !!user,
  });

  // Get notifications list
  const { data: notificationsRes, isLoading: isNotificationsLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getNotifications(),
    enabled: isOpen && !!user,
  });

  const unreadCount = unreadCountRes?.data?.data?.count ?? unreadCountRes?.data?.count ?? unreadCountRes?.data?.data ?? 0;
  
  const notifications = (() => {
    if (!notificationsRes) return [];
    const rData = notificationsRes.data?.data;
    if (Array.isArray(rData)) return rData;
    if (rData && typeof rData === 'object') {
      for (const key of Object.keys(rData)) {
        if (Array.isArray((rData as any)[key])) return (rData as any)[key];
      }
    }
    const responseData = notificationsRes.data;
    if (Array.isArray(responseData)) return responseData;
    if (responseData && typeof responseData === 'object') {
      for (const key of Object.keys(responseData)) {
        if (Array.isArray((responseData as any)[key])) return (responseData as any)[key];
      }
    }
    return [];
  })();

  // Mark all read mutation
  const markAllReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      toast.success('All notifications marked as read');
    },
  });

  // Mark single read mutation
  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  // Helper to generate breadcrumbs
  const getBreadcrumbs = () => {
    return (
      <div className="flex items-center text-sm">
        <span className="text-slate-400 capitalize">Admin</span>
        <span className="mx-2 text-slate-650">/</span>
        <span className="text-emerald-400 font-semibold capitalize">
          {activeTab.replace(/-/g, ' ')}
        </span>
      </div>
    );
  };

  return (
    <header className="fixed top-0 right-0 left-64 z-10 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950/60 px-8 backdrop-blur-xl">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm">{getBreadcrumbs()}</div>

      {/* Action Controls */}
      <div className="flex items-center gap-4">
        {/* Notifications Dropdown */}
        <DropdownMenu onOpenChange={setIsOpen}>
          <DropdownMenuTrigger
            className="relative flex h-10 w-10 items-center justify-center rounded-md border border-slate-850 bg-slate-900/50 hover:bg-slate-850 text-slate-300 hover:text-white cursor-pointer transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-slate-950 ring-2 ring-slate-950">
                {unreadCount}
              </span>
            )}
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" className="w-80 border-slate-800 bg-slate-900 p-0 text-white">
            <div className="flex items-center justify-between border-b border-slate-850 p-4">
              <span className="font-semibold text-sm">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllReadMutation.mutate()}
                  className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto custom-scrollbar p-2 space-y-1">
              {isNotificationsLoading ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-500 gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
                  <span className="text-xs">Loading notifications...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No notifications found
                </div>
              ) : (
                notifications.map((notif: any) => (
                  <div
                    key={notif._id || notif.id}
                    onClick={() => {
                      if (!notif.read && !notif.isRead) {
                        markReadMutation.mutate(notif._id || notif.id);
                      }
                    }}
                    className={`flex flex-col rounded-lg p-2.5 transition-colors cursor-pointer text-left ${
                      !(notif.read || notif.isRead)
                        ? 'bg-emerald-500/10 hover:bg-emerald-500/15 border-l-2 border-emerald-500'
                        : 'hover:bg-slate-850/50'
                    }`}
                  >
                    <span className="text-xs font-medium text-slate-250">{notif.title || 'System Alert'}</span>
                    <span className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{notif.message || notif.description}</span>
                    <span className="text-[9px] text-slate-500 mt-1.5">
                      {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() : 'Just now'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile Label */}
        <div
          className="flex items-center gap-2 border border-slate-850 bg-slate-900/50 px-3 py-1.5 rounded-md text-slate-350 text-xs font-medium select-none"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <User className="h-4.5 w-4.5" />
          </div>
          <span className="max-w-[100px] truncate">
            {user?.fullName || 'Administrator'}
          </span>
        </div>
      </div>
    </header>
  );
}

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api/notifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, Check, CheckCheck, Trash2, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import type { Notification } from '@/lib/types';

export function NotificationCenter() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Fetch unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch notifications when dropdown opens
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll({ per_page: 10 }),
    enabled: open,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationsApi.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (notificationId: string) => notificationsApi.delete(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read_at) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate based on notification type
    const data = notification.data;

    if (data.type === 'worker_assigned' && data.site_worker_id) {
      router.push('/dashboard/worker');
    } else if (data.type === 'assignment_responded' && data.site_id) {
      router.push(`/dashboard/sites/${data.site_id}?tab=squadra`);
    } else if (data.type === 'material_requested' && data.site_id) {
      router.push(`/dashboard/sites/${data.site_id}?tab=richieste`);
    } else if (data.type === 'material_request_approved' && data.site_id) {
      router.push('/dashboard/worker');
    } else if (data.type === 'material_request_rejected' && data.site_id) {
      router.push('/dashboard/worker');
    }

    setOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    // Return different icons based on notification type
    return '🔔';
  };

  const getNotificationTitle = (notification: Notification): string => {
    const data = notification.data;

    switch (data.type) {
      case 'worker_assigned':
        return data.requires_response
          ? 'Nuova Assegnazione - Richiede Conferma'
          : 'Nuova Assegnazione';
      case 'assignment_responded':
        return 'Risposta Assegnazione';
      case 'material_requested':
        return 'Richiesta Materiale';
      case 'material_request_approved':
        return 'Richiesta Approvata';
      case 'material_request_rejected':
        return 'Richiesta Rifiutata';
      default:
        return 'Notifica';
    }
  };

  const getNotificationMessage = (notification: Notification): string => {
    const data = notification.data;

    switch (data.type) {
      case 'worker_assigned':
        return `Sei stato assegnato al cantiere ${data.site_name}`;
      case 'assignment_responded':
        return `${data.worker_name} ha ${data.accepted ? 'accettato' : 'rifiutato'} l'assegnazione`;
      case 'material_requested':
        return `${data.worker_name} ha richiesto ${data.material_name} per ${data.site_name}`;
      case 'material_request_approved':
        return `La tua richiesta di ${data.material_name} è stata approvata`;
      case 'material_request_rejected':
        return `La tua richiesta di ${data.material_name} è stata rifiutata`;
      default:
        return 'Hai una nuova notifica';
    }
  };

  const notifications = notificationsData?.data || [];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[380px] p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold">Notifiche</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Nessuna notifica</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                    !notification.read_at ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                    </div>
                    <div className="flex-1 min-w-0" onClick={() => handleNotificationClick(notification)}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {getNotificationTitle(notification)}
                        </p>
                        {!notification.read_at && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {getNotificationMessage(notification)}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: it,
                        })}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <span className="sr-only">Azioni</span>
                            <span className="text-lg">⋮</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          {!notification.read_at && (
                            <button
                              className="flex w-full items-center px-2 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsReadMutation.mutate(notification.id);
                              }}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Segna come letta
                            </button>
                          )}
                          <button
                            className="flex w-full items-center px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMutation.mutate(notification.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Elimina
                          </button>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t px-4 py-3 text-center">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                router.push('/dashboard/notifications');
                setOpen(false);
              }}
            >
              Vedi tutte
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

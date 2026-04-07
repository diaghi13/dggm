"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/api/notifications";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/types";

// ---------------------------------------------------------------------------
// Icon / title / message helpers (mirrored from notification-center.tsx)
// ---------------------------------------------------------------------------

function getNotificationIcon(notification: Notification): string {
  const data = notification.data;
  if (data.icon) {
    const iconMap: Record<string, string> = {
      "check-circle": "✅",
      info: "ℹ️",
      warning: "⚠️",
      error: "❌",
      megaphone: "📢",
      bell: "🔔",
    };
    return iconMap[data.icon] ?? "🔔";
  }
  return "🔔";
}

function getNotificationTitle(notification: Notification): string {
  const data = notification.data;
  if (data.title) {
    return data.title as string;
  }
  switch (data.type) {
    case "worker_assigned":
      return data.requires_response
        ? "Nuova Assegnazione - Richiede Conferma"
        : "Nuova Assegnazione";
    case "assignment_responded":
      return "Risposta Assegnazione";
    case "material_requested":
      return "Richiesta Materiale";
    case "material_request_approved":
      return "Richiesta Approvata";
    case "material_request_rejected":
      return "Richiesta Rifiutata";
    default:
      return "Notifica";
  }
}

function getNotificationMessage(notification: Notification): string {
  const data = notification.data;
  if (data.message) {
    return data.message as string;
  }
  switch (data.type) {
    case "worker_assigned":
      return `Sei stato assegnato al cantiere ${data.site_name}`;
    case "assignment_responded":
      return `${data.worker_name} ha ${data.accepted ? "accettato" : "rifiutato"} l'assegnazione`;
    case "material_requested":
      return `${data.worker_name} ha richiesto ${data.material_name} per ${data.site_name}`;
    case "material_request_approved":
      return `La tua richiesta di ${data.material_name} è stata approvata`;
    case "material_request_rejected":
      return `La tua richiesta di ${data.material_name} è stata rifiutata`;
    default:
      return "Hai una nuova notifica";
  }
}

// ---------------------------------------------------------------------------
// Skeleton loader rows
// ---------------------------------------------------------------------------

function NotificationSkeleton() {
  return (
    <div className="flex gap-4 px-5 py-4">
      <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-72" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const perPage = 20;

  // Notifications list
  const {
    data: notificationsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["notifications", page, perPage, unreadOnly],
    queryFn: () =>
      notificationsApi.getAll({ page, per_page: perPage, unread_only: unreadOnly }),
  });

  // Unread count (shared with notification-center)
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: () => notificationsApi.getUnreadCount(),
    refetchInterval: 30000,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
  };

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: invalidateAll,
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: invalidateAll,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.delete(id),
    onSuccess: invalidateAll,
  });

  const deleteAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.deleteAllRead(),
    onSuccess: invalidateAll,
  });

  const notifications = notificationsData?.data ?? [];
  const meta = notificationsData?.meta;

  const hasReadNotifications = notifications.some((n) => n.read_at !== null);

  function handleNotificationClick(notification: Notification) {
    if (!notification.read_at) {
      markAsReadMutation.mutate(notification.id);
    }

    const data = notification.data;

    if (data.action) {
      router.push(data.action as string);
      return;
    }

    if (data.type === "worker_assigned") {
      router.push("/dashboard/worker");
    } else if (data.type === "assignment_responded" && data.site_id) {
      router.push(`/projects/${data.site_id}?tab=squadra`);
    } else if (data.type === "material_requested" && data.site_id) {
      router.push(`/projects/${data.site_id}?tab=richieste`);
    } else if (data.type === "material_request_approved") {
      router.push("/dashboard/worker");
    } else if (data.type === "material_request_rejected") {
      router.push("/dashboard/worker");
    }
  }

  function handleUnreadOnlyToggle() {
    setUnreadOnly((prev) => !prev);
    setPage(1);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50">
            <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Notifiche
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Tutte le tue notifiche
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Unread only toggle */}
          <button
            onClick={handleUnreadOnlyToggle}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
              unreadOnly
                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800",
            )}
          >
            <span
              className={cn(
                "inline-block h-2 w-2 rounded-full",
                unreadOnly ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600",
              )}
            />
            Solo non lette
          </button>

          {/* Mark all read */}
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="gap-1.5"
            >
              <CheckCheck className="h-4 w-4" />
              Segna tutte lette
            </Button>
          )}

          {/* Delete all read */}
          {notifications.length > 0 && hasReadNotifications && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => deleteAllReadMutation.mutate()}
              disabled={deleteAllReadMutation.isPending}
              className="gap-1.5 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <Trash2 className="h-4 w-4" />
              Elimina lette
            </Button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Summary bar                                                         */}
      {/* ------------------------------------------------------------------ */}
      {meta && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {meta.total} totali · {unreadCount} non lette
        </p>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Content                                                             */}
      {/* ------------------------------------------------------------------ */}
      {isError ? (
        /* Error state */
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-16 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-400 opacity-70" />
          <div>
            <p className="font-medium text-slate-700 dark:text-slate-300">
              Errore nel caricamento
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Non è stato possibile caricare le notifiche.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Riprova
          </Button>
        </div>
      ) : isLoading ? (
        /* Loading skeleton */
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
          {Array.from({ length: 5 }).map((_, i) => (
            <NotificationSkeleton key={i} />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-20 text-center">
          <Bell className="h-16 w-16 text-slate-300 dark:text-slate-700 opacity-20" />
          <p className="font-medium text-slate-700 dark:text-slate-300">
            Nessuna notifica
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Sei in pari con tutto! 🎉
          </p>
        </div>
      ) : (
        /* Notification list */
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
          {notifications.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onRowClick={handleNotificationClick}
              onMarkRead={(id) => markAsReadMutation.mutate(id)}
              onDelete={(id) => deleteMutation.mutate(id)}
              isMarkingRead={
                markAsReadMutation.isPending &&
                markAsReadMutation.variables === notification.id
              }
              isDeleting={
                deleteMutation.isPending &&
                deleteMutation.variables === notification.id
              }
            />
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Pagination                                                          */}
      {/* ------------------------------------------------------------------ */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Precedente
          </Button>

          <span className="text-sm text-slate-500 dark:text-slate-400">
            Pagina {page} di {meta.last_page}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
            disabled={page === meta.last_page}
            className="gap-1"
          >
            Successiva
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notification row sub-component
// ---------------------------------------------------------------------------

interface NotificationRowProps {
  notification: Notification;
  onRowClick: (notification: Notification) => void;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  isMarkingRead: boolean;
  isDeleting: boolean;
}

function NotificationRow({
  notification,
  onRowClick,
  onMarkRead,
  onDelete,
  isMarkingRead,
  isDeleting,
}: NotificationRowProps) {
  const isUnread = notification.read_at === null;

  return (
    <div
      className={cn(
        "group flex items-start gap-4 px-5 py-4 transition-colors",
        isUnread
          ? "bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          : "hover:bg-slate-50 dark:hover:bg-slate-800/40",
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        <span className="text-2xl leading-none" role="img" aria-hidden="true">
          {getNotificationIcon(notification)}
        </span>
      </div>

      {/* Body — clickable */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => onRowClick(notification)}
      >
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
            {getNotificationTitle(notification)}
          </p>
          {isUnread && (
            <span className="inline-block h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
          )}
        </div>
        <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
          {getNotificationMessage(notification)}
        </p>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          {formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
            locale: it,
          })}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isUnread && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead(notification.id);
            }}
            disabled={isMarkingRead}
            className="h-7 px-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            title="Segna come letta"
          >
            <Check className="h-3.5 w-3.5 mr-1" />
            Segna letta
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
          disabled={isDeleting}
          className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
          title="Elimina notifica"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

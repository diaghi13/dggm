"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { landlordApi, TenantMonitoringItem, TenantMonitoringAlert } from "@/lib/api/landlord";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  HardDrive,
  RefreshCw,
  Server,
  ShieldAlert,
  Users,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMb(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${mb.toFixed(1)} MB`;
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "Mai";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "Meno di 1h fa";
  if (diffHours < 24) return `${diffHours}h fa`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}g fa`;
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Badge helpers
// ---------------------------------------------------------------------------

function HealthBadge({ health }: { health: TenantMonitoringItem["health"] }) {
  const cfg = {
    healthy: {
      label: "Sano",
      className:
        "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400",
    },
    warning: {
      label: "Attenzione",
      className:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-400",
    },
    critical: {
      label: "Critico",
      className:
        "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
    },
  }[health];

  return (
    <Badge className={cn("font-medium border-0", cfg.className)}>
      {cfg.label}
    </Badge>
  );
}

function BackupBadge({
  status,
}: {
  status: TenantMonitoringItem["backup"]["status"];
}) {
  const cfg = {
    healthy: {
      label: "OK",
      className:
        "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400",
    },
    warning: {
      label: "Avviso",
      className:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-400",
    },
    missing: {
      label: "Mancante",
      className:
        "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
    },
  }[status];

  return (
    <Badge className={cn("font-medium border-0 text-xs", cfg.className)}>
      {cfg.label}
    </Badge>
  );
}

function SubscriptionBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    active: {
      label: "Attivo",
      className:
        "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400",
    },
    pending_payment: {
      label: "In attesa",
      className:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-400",
    },
    suspended: {
      label: "Sospeso",
      className:
        "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
    },
    cancelled: {
      label: "Cancellato",
      className:
        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    },
    trial: {
      label: "Trial",
      className:
        "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400",
    },
    none: {
      label: "Nessuno",
      className:
        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    },
  };

  const cfg = map[status] ?? {
    label: status,
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  };

  return (
    <Badge className={cn("font-medium border-0 text-xs", cfg.className)}>
      {cfg.label}
    </Badge>
  );
}

function SeverityBadge({ severity }: { severity: TenantMonitoringAlert["severity"] }) {
  return (
    <Badge
      className={cn(
        "font-medium border-0 text-xs",
        severity === "critical"
          ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400"
          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-400",
      )}
    >
      {severity === "critical" ? "Critico" : "Avviso"}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loaders
// ---------------------------------------------------------------------------

function SummarySkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2"
        >
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-16" />
        </div>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-lg" />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function MonitoringPage() {
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["landlord-monitoring"],
    queryFn: async () => {
      const result = await landlordApi.getMonitoring();
      setLastUpdated(new Date());
      return result;
    },
    refetchInterval: autoRefresh ? 60_000 : false,
  });

  const monitoring = data?.data;

  const diskPercent = monitoring?.system.disk_used_percent ?? 0;
  const diskColorClass =
    diskPercent > 85
      ? "bg-red-500"
      : diskPercent > 70
        ? "bg-yellow-500"
        : "bg-green-500";

  const tenantsWithAlerts =
    monitoring?.tenants.filter((t) => t.alerts.length > 0) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Monitoring Sistema
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Monitoraggio in tempo reale dei tenant, database e storage
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {lastUpdated && (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Aggiornato: {formatTime(lastUpdated.toISOString())}
            </p>
          )}
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 accent-blue-600"
            />
            Auto-refresh (60s)
          </label>
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RefreshCw
              className={cn("h-4 w-4", isFetching && "animate-spin")}
            />
            Aggiorna
          </Button>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-6 flex flex-col items-center gap-3">
          <XCircle className="h-8 w-8 text-red-500 dark:text-red-400" />
          <p className="text-sm font-medium text-red-700 dark:text-red-400">
            Impossibile caricare i dati di monitoring
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            className="border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40"
          >
            Riprova
          </Button>
        </div>
      )}

      {/* System Disk Card */}
      {isLoading ? (
        <Skeleton className="h-28 w-full rounded-xl" />
      ) : monitoring ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
              <HardDrive className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Disco di sistema
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {monitoring.system.disk_used_gb.toFixed(1)} GB usati di{" "}
                {monitoring.system.disk_total_gb.toFixed(1)} GB totali (
                {diskPercent.toFixed(1)}%)
              </p>
            </div>
            <div className="ml-auto">
              <span
                className={cn(
                  "text-sm font-semibold",
                  diskPercent > 85
                    ? "text-red-600 dark:text-red-400"
                    : diskPercent > 70
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-green-600 dark:text-green-400",
                )}
              >
                {diskPercent.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", diskColorClass)}
              style={{ width: `${Math.min(diskPercent, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-400 dark:text-slate-500">
            <span>0 GB</span>
            <span className="text-slate-500 dark:text-slate-400">
              {monitoring.system.disk_free_gb.toFixed(1)} GB liberi
            </span>
            <span>{monitoring.system.disk_total_gb.toFixed(1)} GB</span>
          </div>
        </div>
      ) : null}

      {/* Summary Cards */}
      {isLoading ? (
        <SummarySkeleton />
      ) : monitoring ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Tenant sani */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 dark:text-green-400 flex-shrink-0" />
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                Tenant sani
              </p>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {monitoring.summary.healthy_count}
              <span className="text-sm font-normal text-slate-400 dark:text-slate-500">
                /{monitoring.summary.total_tenants}
              </span>
            </p>
          </div>

          {/* Alert attivi */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert
                className={cn(
                  "h-4 w-4 flex-shrink-0",
                  monitoring.summary.alerts_count > 0
                    ? "text-red-500 dark:text-red-400"
                    : "text-slate-400 dark:text-slate-500",
                )}
              />
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                Alert attivi
              </p>
            </div>
            <p
              className={cn(
                "text-2xl font-bold",
                monitoring.summary.alerts_count > 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-slate-900 dark:text-slate-100",
              )}
            >
              {monitoring.summary.alerts_count}
            </p>
          </div>

          {/* DB totale */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                DB totale
              </p>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatMb(monitoring.summary.total_db_size_mb)}
            </p>
          </div>

          {/* Storage totale */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="h-4 w-4 text-purple-500 dark:text-purple-400 flex-shrink-0" />
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                Storage totale
              </p>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatMb(monitoring.summary.total_storage_size_mb)}
            </p>
          </div>

          {/* Tenant attivi */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                Tenant attivi
              </p>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {monitoring.summary.active_tenants}
            </p>
          </div>

          {/* Backup mancanti */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Server
                className={cn(
                  "h-4 w-4 flex-shrink-0",
                  monitoring.backup_summary.tenants_missing > 0
                    ? "text-red-500 dark:text-red-400"
                    : "text-slate-400 dark:text-slate-500",
                )}
              />
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                Backup mancanti
              </p>
            </div>
            <p
              className={cn(
                "text-2xl font-bold",
                monitoring.backup_summary.tenants_missing > 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-slate-900 dark:text-slate-100",
              )}
            >
              {monitoring.backup_summary.tenants_missing}
            </p>
          </div>
        </div>
      ) : null}

      {/* Alerts section */}
      {!isLoading && monitoring && tenantsWithAlerts.length > 0 && (
        <div className="rounded-xl border border-yellow-200 dark:border-yellow-900/50 bg-yellow-50 dark:bg-yellow-950/10">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-yellow-200 dark:border-yellow-900/40">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <h2 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
              Attenzione richiesta
            </h2>
            <Badge className="ml-auto bg-yellow-100 text-yellow-700 dark:bg-yellow-900/60 dark:text-yellow-400 border-0 font-medium">
              {monitoring.summary.alerts_count} alert
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-yellow-200 dark:border-yellow-900/40">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-yellow-700 dark:text-yellow-400 uppercase tracking-wide">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-yellow-700 dark:text-yellow-400 uppercase tracking-wide">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-yellow-700 dark:text-yellow-400 uppercase tracking-wide">
                    Messaggio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-yellow-700 dark:text-yellow-400 uppercase tracking-wide">
                    Gravità
                  </th>
                </tr>
              </thead>
              <tbody>
                {tenantsWithAlerts.flatMap((tenant) =>
                  tenant.alerts.map((alert, idx) => (
                    <tr
                      key={`${tenant.id}-${idx}`}
                      className="border-b border-yellow-100 dark:border-yellow-900/20 last:border-0"
                    >
                      <td className="px-6 py-3">
                        <Link
                          href={`/central/tenants/${tenant.id}`}
                          className="font-medium text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          {tenant.name}
                        </Link>
                      </td>
                      <td className="px-6 py-3">
                        <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-0 text-xs font-mono">
                          {alert.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-slate-600 dark:text-slate-400">
                        {alert.message}
                      </td>
                      <td className="px-6 py-3">
                        <SeverityBadge severity={alert.severity} />
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tenant Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Stato tenant
            </h2>
          </div>
          {monitoring && (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {monitoring.tenants.length} tenant
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="p-6">
            <TableSkeleton />
          </div>
        ) : monitoring && monitoring.tenants.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Salute
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Abbonamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    DB
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Storage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Backup
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Alert
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {monitoring.tenants.map((tenant) => (
                  <tr
                    key={tenant.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {/* Tenant name */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {tenant.name}
                        </p>
                        {tenant.slug && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                            {tenant.slug}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Health */}
                    <td className="px-6 py-4">
                      <HealthBadge health={tenant.health} />
                    </td>

                    {/* Subscription */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <SubscriptionBadge
                          status={tenant.subscription.status}
                        />
                        {tenant.subscription.plan_name && (
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            {tenant.subscription.plan_name}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* DB */}
                    <td className="px-6 py-4">
                      <p className="text-slate-700 dark:text-slate-300 font-medium tabular-nums">
                        {formatMb(tenant.db.size_mb)}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {tenant.db.table_count} tabelle
                      </p>
                    </td>

                    {/* Storage */}
                    <td className="px-6 py-4">
                      <p className="text-slate-700 dark:text-slate-300 font-medium tabular-nums">
                        {formatMb(tenant.storage.size_mb)}
                      </p>
                    </td>

                    {/* Backup */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <BackupBadge status={tenant.backup.status} />
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {formatRelativeTime(tenant.backup.last_backup_at)}
                        </p>
                      </div>
                    </td>

                    {/* Alerts count */}
                    <td className="px-6 py-4">
                      {tenant.alerts.length > 0 ? (
                        <Badge className="bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border-0 font-medium">
                          {tenant.alerts.length}
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          —
                        </span>
                      )}
                    </td>

                    {/* Link */}
                    <td className="px-6 py-4">
                      <Link
                        href={`/central/tenants/${tenant.id}`}
                        className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors whitespace-nowrap"
                      >
                        Dettaglio →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !isError && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
              <Activity className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">Nessun tenant trovato</p>
            </div>
          )
        )}
      </div>

      {/* Backup summary footer */}
      {!isLoading && monitoring && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Riepilogo backup
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                Tenant totali
              </p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {monitoring.backup_summary.total_tenants}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                Con backup
              </p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {monitoring.backup_summary.tenants_with_backup}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                Senza backup
              </p>
              <p
                className={cn(
                  "text-xl font-bold",
                  monitoring.backup_summary.tenants_missing > 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-slate-900 dark:text-slate-100",
                )}
              >
                {monitoring.backup_summary.tenants_missing}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                Ultimo backup
              </p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {formatRelativeTime(monitoring.backup_summary.last_backup_at)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                Dimensione totale
              </p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {formatMb(monitoring.backup_summary.total_size_mb)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

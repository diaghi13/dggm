"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  landlordApi,
  TenantErrorLogItem,
  LandlordTenantsParams,
} from "@/lib/api/landlord";
import {
  AlertCircle,
  Bug,
  CheckCircle,
  Cpu,
  Mail,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) return "Ora";
  if (diffMinutes < 60) return `${diffMinutes} min fa`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h fa`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}g fa`;
}

function formatFullTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "…";
}

// ---------------------------------------------------------------------------
// Badge components
// ---------------------------------------------------------------------------

function TypeBadge({ type }: { type: TenantErrorLogItem["type"] }) {
  if (type === "email") {
    return (
      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-0 font-medium text-xs gap-1">
        <Mail className="h-3 w-3" />
        Email
      </Badge>
    );
  }
  if (type === "system") {
    return (
      <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-0 font-medium text-xs gap-1">
        <Bug className="h-3 w-3" />
        Sistema
      </Badge>
    );
  }
  return (
    <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-0 font-medium text-xs gap-1">
      <Cpu className="h-3 w-3" />
      Job
    </Badge>
  );
}

function SeverityBadge({ severity }: { severity: TenantErrorLogItem["severity"] }) {
  if (severity === "critical") {
    return (
      <Badge className="bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-100 border-0 font-medium text-xs">
        Critico
      </Badge>
    );
  }
  if (severity === "error") {
    return (
      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-0 font-medium text-xs">
        Errore
      </Badge>
    );
  }
  return (
    <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-0 font-medium text-xs">
      Avviso
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Detail extraction
// ---------------------------------------------------------------------------

function renderDetails(item: TenantErrorLogItem): string {
  const d = item.details;
  if (item.type === "email") {
    const to = d.to ?? d.recipient ?? d.email;
    const subject = d.subject;
    if (to && subject) return `A: ${String(to)} · Oggetto: ${truncate(String(subject), 40)}`;
    if (to) return `A: ${String(to)}`;
  }
  if (item.type === "job") {
    const queue = d.queue ?? d.connection;
    const jobClass = d.job ?? d.class;
    if (queue && jobClass) return `Queue: ${String(queue)} · Job: ${truncate(String(jobClass).split("\\").pop() ?? "", 30)}`;
    if (queue) return `Queue: ${String(queue)}`;
    if (jobClass) return `Job: ${truncate(String(jobClass).split("\\").pop() ?? "", 40)}`;
  }
  if (item.type === "system") {
    const parts: string[] = [];
    if (d.exception_class) {
      const shortClass = String(d.exception_class).split("\\").pop() ?? String(d.exception_class);
      parts.push(shortClass);
    }
    if (d.method && d.url) {
      parts.push(`${String(d.method)} ${truncate(String(d.url), 40)}`);
    } else if (d.url) {
      parts.push(truncate(String(d.url), 50));
    }
    if (d.user_id) {
      parts.push(`user #${String(d.user_id)}`);
    }
    if (parts.length > 0) return parts.join(" · ");
  }
  const keys = Object.keys(d).slice(0, 2);
  return keys.map((k) => `${k}: ${truncate(String(d[k]), 20)}`).join(" · ");
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function TableSkeleton() {
  return (
    <div className="space-y-2 p-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-lg" />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filters state
// ---------------------------------------------------------------------------

interface Filters {
  tenant_id: string;
  type: "" | "email" | "job" | "system";
  date_from: string;
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ErrorLogsPage() {
  const [filters, setFilters] = useState<Filters>({
    tenant_id: "",
    type: "",
    date_from: "",
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const apiParams = {
    ...(filters.tenant_id ? { tenant_id: filters.tenant_id } : {}),
    ...(filters.type ? { type: filters.type as "email" | "job" | "system" } : {}),
    ...(filters.date_from ? { date_from: filters.date_from } : {}),
  };

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["central-error-logs", filters],
    queryFn: () => landlordApi.getErrorLogs(apiParams),
    staleTime: 30_000,
  });

  // Load tenants for the tenant filter select
  const { data: tenantsData } = useQuery({
    queryKey: ["central-tenants-simple"],
    queryFn: () => landlordApi.getTenants({ per_page: 200 } as LandlordTenantsParams),
    staleTime: 5 * 60_000,
  });

  const logs = data?.data?.items ?? [];
  const total = data?.data?.total ?? 0;
  const emailCount = data?.data?.types?.email ?? 0;
  const jobCount = data?.data?.types?.job ?? 0;
  const systemCount = data?.data?.types?.system ?? 0;

  const tenants = tenantsData?.data ?? [];

  function resetFilters() {
    setFilters({ tenant_id: "", type: "", date_from: "" });
  }

  const hasActiveFilters =
    filters.tenant_id !== "" || filters.type !== "" || filters.date_from !== "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30 flex-shrink-0 mt-0.5">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Log Errori Tenant
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Errori aggregati da tutti i tenant per assistenza
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {total > 0 && (
            <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-0 font-medium">
              {total} {total === 1 ? "errore" : "errori"}
            </Badge>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
            Aggiorna
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Tenant select */}
        <select
          value={filters.tenant_id}
          onChange={(e) =>
            setFilters((f) => ({ ...f, tenant_id: e.target.value }))
          }
          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tutti i tenant</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        {/* Type select */}
        <select
          value={filters.type}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              type: e.target.value as Filters["type"],
            }))
          }
          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tutti i tipi</option>
          <option value="email">Email</option>
          <option value="job">Job</option>
          <option value="system">Errori Sistema</option>
        </select>

        {/* Date from */}
        <input
          type="date"
          value={filters.date_from}
          onChange={(e) =>
            setFilters((f) => ({ ...f, date_from: e.target.value }))
          }
          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Da data"
        />

        {/* Reset */}
        {hasActiveFilters && (
          <Button
            size="sm"
            variant="ghost"
            onClick={resetFilters}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            Reset filtri
          </Button>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0",
                total > 0
                  ? "bg-red-100 dark:bg-red-900/30"
                  : "bg-slate-100 dark:bg-slate-800"
              )}
            >
              <AlertCircle
                className={cn(
                  "h-5 w-5",
                  total > 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-slate-400 dark:text-slate-500"
                )}
              />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Totale errori
            </p>
          </div>
          <p
            className={cn(
              "text-3xl font-bold tabular-nums",
              total > 0
                ? "text-red-600 dark:text-red-400"
                : "text-slate-900 dark:text-slate-100"
            )}
          >
            {isLoading ? (
              <Skeleton className="h-9 w-12 inline-block" />
            ) : (
              total
            )}
          </p>
        </div>

        {/* Email errors */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
              <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Errori email
            </p>
          </div>
          <p className="text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
            {isLoading ? (
              <Skeleton className="h-9 w-12 inline-block" />
            ) : (
              emailCount
            )}
          </p>
        </div>

        {/* Job errors */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30 flex-shrink-0">
              <Cpu className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Job falliti
            </p>
          </div>
          <p className="text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
            {isLoading ? (
              <Skeleton className="h-9 w-12 inline-block" />
            ) : (
              jobCount
            )}
          </p>
        </div>

        {/* System errors */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0",
                systemCount > 0
                  ? "bg-rose-100 dark:bg-rose-900/30"
                  : "bg-slate-100 dark:bg-slate-800"
              )}
            >
              <Bug
                className={cn(
                  "h-5 w-5",
                  systemCount > 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-slate-400 dark:text-slate-500"
                )}
              />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Errori Sistema
            </p>
          </div>
          <p
            className={cn(
              "text-3xl font-bold tabular-nums",
              systemCount > 0
                ? "text-rose-600 dark:text-rose-400"
                : "text-slate-900 dark:text-slate-100"
            )}
          >
            {isLoading ? (
              <Skeleton className="h-9 w-12 inline-block" />
            ) : (
              systemCount
            )}
          </p>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-6 flex flex-col items-center gap-3">
          <XCircle className="h-8 w-8 text-red-500 dark:text-red-400" />
          <p className="text-sm font-medium text-red-700 dark:text-red-400">
            Impossibile caricare i log degli errori
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

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Registro errori
            </h2>
          </div>
          {!isLoading && (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {logs.length} {logs.length === 1 ? "record" : "record"}
            </p>
          )}
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : logs.length === 0 && !isError ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 dark:text-slate-500">
            <CheckCircle className="h-12 w-12 text-green-500 dark:text-green-400 opacity-80" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Nessun errore rilevato
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {hasActiveFilters
                ? "Prova a rimuovere i filtri per vedere tutti i log"
                : "Tutto funziona correttamente"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">
                    Tipo
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">
                    Tenant
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Titolo
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Messaggio
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Dettagli
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">
                    Data
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">
                    Gravità
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {logs.map((item) => {
                  const isExpanded = expandedId === item.id;
                  const isErrorRow = item.severity === "error";
                  const details = renderDetails(item);

                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        "transition-colors",
                        isErrorRow
                          ? "bg-red-50/50 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/30"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      )}
                    >
                      {/* Tipo */}
                      <td className="px-5 py-3.5">
                        <TypeBadge type={item.type} />
                      </td>

                      {/* Tenant */}
                      <td className="px-5 py-3.5">
                        <span className="font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {item.tenant_name || "Sistema"}
                        </span>
                      </td>

                      {/* Titolo */}
                      <td className="px-5 py-3.5">
                        <span className="text-slate-800 dark:text-slate-200 font-medium">
                          {item.title}
                        </span>
                      </td>

                      {/* Messaggio — cliccabile per espandere */}
                      <td className="px-5 py-3.5 max-w-xs">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(isExpanded ? null : item.id)
                          }
                          className="text-left w-full group"
                          title={isExpanded ? "Clicca per ridurre" : "Clicca per espandere"}
                        >
                          <span
                            className={cn(
                              "font-mono text-xs text-slate-600 dark:text-slate-400 break-all",
                              !isExpanded && "line-clamp-2"
                            )}
                          >
                            {isExpanded ? item.message : truncate(item.message, 120)}
                          </span>
                          {item.message.length > 120 && (
                            <span className="text-xs text-blue-500 dark:text-blue-400 group-hover:underline ml-1">
                              {isExpanded ? "meno" : "altro"}
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Dettagli */}
                      <td className="px-5 py-3.5">
                        {details ? (
                          <span className="font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {details}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>

                      {/* Data */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          title={formatFullTime(item.occurred_at)}
                          className="text-slate-500 dark:text-slate-400 text-xs cursor-default"
                        >
                          {formatRelativeTime(item.occurred_at)}
                        </span>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          {formatFullTime(item.occurred_at).split(",")[0]}
                        </p>
                      </td>

                      {/* Gravità */}
                      <td className="px-5 py-3.5">
                        <SeverityBadge severity={item.severity} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { backupApi, type TenantBackupInfo, type BackupFile } from "@/lib/api/backup";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Archive,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  HardDrive,
  Clock,
  Database,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Status helpers ───────────────────────────────────────────────────────────

type StatusLevel = "healthy" | "warning" | "critical" | "no_backup" | "missing";

const StatusIcon = ({ status, className }: { status: StatusLevel; className?: string }) => {
  const props = { className: cn("h-4 w-4", className) };
  if (status === "healthy") return <CheckCircle2 {...props} className={cn(props.className, "text-emerald-500")} />;
  if (status === "warning") return <AlertTriangle {...props} className={cn(props.className, "text-amber-500")} />;
  return <XCircle {...props} className={cn(props.className, "text-red-500")} />;
};

const statusLabel: Record<StatusLevel, string> = {
  healthy: "Sano",
  warning: "Attenzione",
  critical: "Critico",
  no_backup: "Nessun backup",
  missing: "Mancante",
};

const statusBadgeClass: Record<StatusLevel, string> = {
  healthy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  no_backup: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  missing: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function StatusBadge({ status }: { status: StatusLevel }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", statusBadgeClass[status])}>
      <StatusIcon status={status} className="h-3 w-3" />
      {statusLabel[status]}
    </span>
  );
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSize(mb: number) {
  if (mb < 1) return `${Math.round(mb * 1024)} KB`;
  return `${mb.toFixed(1)} MB`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  status,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  status?: StatusLevel;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <Icon className="h-4 w-4" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        {status && <StatusBadge status={status} />}
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
    </div>
  );
}

function CentralBackupList({ backups }: { backups: BackupFile[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? backups : backups.slice(0, 5);

  if (backups.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-slate-500 dark:text-slate-400">
        Nessun backup trovato
      </p>
    );
  }

  return (
    <div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {visible.map((b) => (
          <div key={b.filename} className="flex items-center justify-between py-2.5 text-sm">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Archive className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="font-mono text-xs">{b.filename}</span>
            </div>
            <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
              <span>{formatSize(b.size_mb)}</span>
              <span>{formatDate(b.created_at)}</span>
            </div>
          </div>
        ))}
      </div>
      {backups.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 flex w-full items-center justify-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          {expanded ? (
            <><ChevronUp className="h-3.5 w-3.5" /> Mostra meno</>
          ) : (
            <><ChevronDown className="h-3.5 w-3.5" /> Mostra tutti ({backups.length})</>
          )}
        </button>
      )}
    </div>
  );
}

function TenantBackupTable({ tenants }: { tenants: TenantBackupInfo[] }) {
  if (tenants.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Nessun tenant trovato
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="pb-3 text-left font-medium text-slate-500 dark:text-slate-400">Tenant</th>
            <th className="pb-3 text-left font-medium text-slate-500 dark:text-slate-400">Stato</th>
            <th className="pb-3 text-right font-medium text-slate-500 dark:text-slate-400">Backup</th>
            <th className="pb-3 text-right font-medium text-slate-500 dark:text-slate-400">Dim.</th>
            <th className="pb-3 text-right font-medium text-slate-500 dark:text-slate-400">Ultimo backup</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {tenants.map((t) => (
            <tr key={t.tenant_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <td className="py-3">
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{t.tenant_name}</p>
                  <p className="text-xs text-slate-400">{t.tenant_slug}</p>
                </div>
              </td>
              <td className="py-3">
                <StatusBadge status={t.status} />
              </td>
              <td className="py-3 text-right text-slate-600 dark:text-slate-300">{t.backup_count}</td>
              <td className="py-3 text-right text-slate-600 dark:text-slate-300">{formatSize(t.total_size_mb)}</td>
              <td className="py-3 text-right text-slate-500 dark:text-slate-400">
                {formatDate(t.last_backup_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BackupPage() {
  const queryClient = useQueryClient();
  const [runType, setRunType] = useState<"all" | "central" | "tenants">("all");
  const [showRunMenu, setShowRunMenu] = useState(false);

  const { data, isLoading, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ["backup-status"],
    queryFn: backupApi.getStatus,
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

  const { mutate: runBackup, isPending: isRunning } = useMutation({
    mutationFn: (type: "all" | "central" | "tenants") => backupApi.runBackup(type),
    onSuccess: () => {
      toast.success("Backup avviato in background", {
        description: "Il backup verrà completato a breve.",
      });
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["backup-status"] }), 3000);
    },
    onError: () => {
      toast.error("Impossibile avviare il backup", {
        description: "Controlla i log del server.",
      });
    },
  });

  const lastRefresh = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString("it-IT") : null;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Monitoraggio Backup
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Stato dei backup del database centrale e dei tenant
          </p>
        </div>

        <div className="flex items-center gap-2">
          {lastRefresh && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              Aggiornato: {lastRefresh}
              {isFetching && <RefreshCw className="h-3 w-3 animate-spin" />}
            </span>
          )}

          {/* Run backup dropdown */}
          <div className="relative">
            <div className="flex overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
              <Button
                variant="default"
                size="sm"
                onClick={() => runBackup(runType)}
                disabled={isRunning}
                className="rounded-r-none border-r border-slate-300 dark:border-slate-600"
              >
                {isRunning ? (
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Archive className="mr-1.5 h-3.5 w-3.5" />
                )}
                {runType === "all" ? "Backup completo" : runType === "central" ? "Backup centrale" : "Backup tenant"}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowRunMenu(!showRunMenu)}
                className="rounded-l-none px-2"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </div>

            {showRunMenu && (
              <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                {(["all", "central", "tenants"] as const).map((type) => (
                  <button
                    key={type}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    onClick={() => {
                      setRunType(type);
                      setShowRunMenu(false);
                    }}
                  >
                    {type === "all" ? "Tutto (centrale + tenant)" : type === "central" ? "Solo centrale" : "Solo tenant"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Database}
            label="DB Centrale"
            value={`${data.central.backup_count} backup`}
            sub={`${formatSize(data.central.total_size_mb)} totali`}
            status={data.central.status as StatusLevel}
          />
          <StatCard
            icon={Clock}
            label="Ultimo backup centrale"
            value={data.central.last_backup_at ? formatDate(data.central.last_backup_at) : "Mai"}
            sub="Aggiornamento: 02:00"
          />
          <StatCard
            icon={HardDrive}
            label="Tenant con backup"
            value={`${data.tenants.summary.tenants_with_backup} / ${data.tenants.summary.total_tenants}`}
            sub={`${data.tenants.summary.tenants_missing} mancanti`}
            status={
              data.tenants.summary.tenants_missing === 0
                ? "healthy"
                : data.tenants.summary.tenants_missing < data.tenants.summary.total_tenants
                ? "warning"
                : "critical"
            }
          />
          <StatCard
            icon={Archive}
            label="Dimensione totale"
            value={formatSize(data.central.total_size_mb + data.tenants.summary.total_size_mb)}
            sub={`${data.tenants.pre_deletion_count} backup pre-cancellazione`}
          />
        </div>
      ) : null}

      {/* Central backups detail */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-slate-500" />
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Database Centrale</h2>
          </div>
          {data && <StatusBadge status={data.central.status as StatusLevel} />}
        </div>
        <div className="p-5">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8" />)}
            </div>
          ) : (
            <CentralBackupList backups={data?.central.backups ?? []} />
          )}
        </div>
      </div>

      {/* Tenant backups table */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-slate-500" />
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Backup Tenant</h2>
          </div>
          {data && (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span>{data.tenants.summary.total_tenants} tenant</span>
              {data.tenants.summary.tenants_missing > 0 && (
                <span className="text-red-500">· {data.tenants.summary.tenants_missing} mancanti</span>
              )}
            </div>
          )}
        </div>
        <div className="p-5">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : (
            <TenantBackupTable tenants={data?.tenants.per_tenant ?? []} />
          )}
        </div>
      </div>

      {/* Commands reference */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/50">
        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Comandi manuali
        </h3>
        <div className="space-y-1.5">
          {[
            { cmd: "php artisan backup:run --only-db", desc: "Backup DB centrale" },
            { cmd: "php artisan backup:tenants", desc: "Backup tutti i tenant" },
            { cmd: "php artisan backup:tenants --tenant=slug", desc: "Backup tenant specifico" },
            { cmd: "php artisan backup:restore-tenant slug", desc: "Restore tenant (interattivo)" },
            { cmd: "php artisan backup:clean", desc: "Pulizia backup vecchi" },
          ].map(({ cmd, desc }) => (
            <div key={cmd} className="flex items-center gap-3">
              <code className="rounded bg-slate-200 px-2 py-0.5 font-mono text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {cmd}
              </code>
              <span className="text-xs text-slate-500 dark:text-slate-400">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { landlordApi } from "@/lib/api/landlord";
import Link from "next/link";
import {
  Building2,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  description: string;
  href: string;
  colorClass: string;
  isLoading?: boolean;
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  href,
  colorClass,
  isLoading,
}: StatCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-600 group-hover:text-blue-500 transition-colors" />
      </div>
      <div>
        {isLoading ? (
          <Skeleton className="h-8 w-16 mb-1" />
        ) : (
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            {value}
          </p>
        )}
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">
          {title}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {description}
        </p>
      </div>
    </Link>
  );
}

export default function CentralDashboardPage() {
  const { data: tenantsData, isLoading: tenantsLoading } = useQuery({
    queryKey: ["landlord-tenants-all"],
    queryFn: () => landlordApi.getTenants({ per_page: 1 }),
  });

  const { data: activeData, isLoading: activeLoading } = useQuery({
    queryKey: ["landlord-tenants-active"],
    queryFn: () => landlordApi.getTenants({ status: "active", per_page: 1 }),
  });

  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ["landlord-tenants-pending"],
    queryFn: () =>
      landlordApi.getTenants({ status: "pending_payment", per_page: 1 }),
  });

  const { data: suspendedData, isLoading: suspendedLoading } = useQuery({
    queryKey: ["landlord-tenants-suspended"],
    queryFn: () =>
      landlordApi.getTenants({ status: "suspended", per_page: 1 }),
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["landlord-global-users-count"],
    queryFn: () => landlordApi.getGlobalUsers({ per_page: 1 }),
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Panoramica
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Statistiche generali del sistema multi-tenant DGGM ERP
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Tenant Totali"
          value={tenantsData?.meta?.total ?? "-"}
          icon={Building2}
          description="Organizzazioni registrate"
          href="/central/tenants"
          colorClass="bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400"
          isLoading={tenantsLoading}
        />
        <StatCard
          title="Tenant Attivi"
          value={activeData?.meta?.total ?? "-"}
          icon={CheckCircle2}
          description="Abbonamento attivo e pagato"
          href="/central/tenants?status=active"
          colorClass="bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400"
          isLoading={activeLoading}
        />
        <StatCard
          title="In Attesa Pagamento"
          value={pendingData?.meta?.total ?? "-"}
          icon={Clock}
          description="Richiedono attivazione manuale"
          href="/central/tenants?status=pending_payment"
          colorClass="bg-yellow-100 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-400"
          isLoading={pendingLoading}
        />
        <StatCard
          title="Tenant Sospesi"
          value={suspendedData?.meta?.total ?? "-"}
          icon={XCircle}
          description="Accesso temporaneamente disabilitato"
          href="/central/tenants?status=suspended"
          colorClass="bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400"
          isLoading={suspendedLoading}
        />
        <StatCard
          title="Utenti Globali"
          value={usersData?.meta?.total ?? "-"}
          icon={Users}
          description="Identità registrate nel sistema"
          href="/central/users"
          colorClass="bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400"
          isLoading={usersLoading}
        />
      </div>

      {/* Quick actions */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Azioni rapide
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/central/tenants?status=pending_payment"
            className="inline-flex items-center gap-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/50 px-4 py-2 text-sm font-medium hover:bg-yellow-100 dark:hover:bg-yellow-950/60 transition-colors"
          >
            <Clock className="h-4 w-4" />
            Gestisci tenant in attesa
          </Link>
          <Link
            href="/central/tenants"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Building2 className="h-4 w-4" />
            Lista tutti i tenant
          </Link>
          <Link
            href="/central/users"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Users className="h-4 w-4" />
            Utenti globali
          </Link>
        </div>
      </div>
    </div>
  );
}

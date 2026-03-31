"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import apiClient from "@/lib/api/client";
import { Building2, FolderOpen, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import type { ApiResponse } from "@/lib/types";

interface TenantOverviewItem {
  tenant_id: string;
  tenant_name: string;
  role: string;
  worker_id: number | null;
  projects_count: number;
}

const roleLabels: Record<string, string> = {
  SuperAdmin: "Super Admin",
  Admin: "Amministratore",
  ProjectManager: "Project Manager",
  Foreman: "Caposquadra",
  Worker: "Operaio",
  Accountant: "Contabile",
  WarehouseManager: "Magazziniere",
  Customer: "Cliente",
};

export default function MyOverviewPage() {
  const { globalUser, user } = useAuthStore();

  const { data: overview, isLoading } = useQuery({
    queryKey: ["my-overview"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<TenantOverviewItem[]>>("/my/overview");
      return response.data.data;
    },
    retry: 1,
    staleTime: 60_000,
  });

  const displayName = globalUser?.name ?? user?.name ?? "Utente";
  const displayEmail = globalUser?.email ?? user?.email ?? "";

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero */}
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-800 dark:bg-slate-700 text-white shrink-0">
          <User className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Ciao, {displayName}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {displayEmail}
          </p>
        </div>
      </div>

      {/* Tenant overview */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          Le tue aziende
        </h2>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-slate-200 dark:border-slate-800">
                <CardHeader className="pb-3">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-24 mt-1" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (overview ?? []).length === 0 ? (
          <Card className="border-slate-200 dark:border-slate-800 py-10 text-center">
            <CardContent>
              <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400">
                Nessuna azienda trovata
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {(overview ?? []).map((item) => (
              <Card
                key={item.tenant_id}
                className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-sm transition-shadow"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      {item.tenant_name}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {roleLabels[item.role] ?? item.role}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                    <FolderOpen className="h-4 w-4 shrink-0" />
                    <span>
                      {item.projects_count}{" "}
                      {item.projects_count === 1 ? "progetto" : "progetti"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Accesso rapido
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/my/profile"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <User className="h-4 w-4" />
            Il mio profilo
          </Link>
          <Link
            href="/select-tenant"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Building2 className="h-4 w-4" />
            Cambia azienda
          </Link>
        </div>
      </div>
    </div>
  );
}

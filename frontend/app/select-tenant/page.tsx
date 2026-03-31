"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, LogOut, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import type { TenantInfo } from "@/lib/types";

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

function getRoleLabel(role: string): string {
  return roleLabels[role] ?? role;
}

function getRoleBadgeVariant(role: string): "default" | "secondary" | "outline" {
  if (role === "SuperAdmin" || role === "Admin") return "default";
  if (role === "ProjectManager" || role === "Foreman") return "secondary";
  return "outline";
}

export default function SelectTenantPage() {
  const router = useRouter();
  const { availableTenants: allTenants, setCurrentTenant, refreshUser, logout, globalUser, isAuthenticated, hasHydrated } = useAuthStore();

  // Only show active/trial tenants in the switcher; pending/suspended are handled
  // by the pending-activation page.
  const availableTenants = allTenants.filter(
    (t) =>
      !t.subscription_status ||
      t.subscription_status === "active" ||
      t.subscription_status === "trial"
  );

  useEffect(() => {
    if (!hasHydrated) return;

    // If not authenticated at all, go back to login
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    // If only one tenant, auto-select and redirect
    if (availableTenants.length === 1) {
      handleSelectTenant(availableTenants[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, isAuthenticated, availableTenants]);

  const handleSelectTenant = async (tenant: TenantInfo) => {
    setCurrentTenant(tenant);
    try {
      await refreshUser();
      toast.success(`Accesso a ${tenant.name}`);
      router.push("/dashboard");
    } catch {
      toast.error("Impossibile accedere al tenant selezionato");
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="mx-auto w-14 h-14 bg-slate-900 dark:bg-slate-700 rounded-xl flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Seleziona Azienda
          </h1>
          {globalUser && (
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Accesso come{" "}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {globalUser.name}
              </span>
            </p>
          )}
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Hai accesso a {availableTenants.length}{" "}
            {availableTenants.length === 1 ? "azienda" : "aziende"}. Seleziona quella in cui vuoi lavorare.
          </p>
        </div>

        {/* Tenant grid */}
        {availableTenants.length === 0 ? (
          <Card className="border-slate-200 dark:border-slate-800 text-center py-12">
            <CardContent>
              <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                Nessuna azienda disponibile
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                Il tuo account non è associato ad alcuna azienda attiva.
              </p>
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => router.push("/pending-activation")}
              >
                Verifica stato abbonamento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {availableTenants.map((tenant) => (
              <button
                key={tenant.id}
                onClick={() => handleSelectTenant(tenant)}
                className="group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl"
              >
                <Card className="h-full border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200 bg-white dark:bg-slate-900 group-hover:bg-blue-50/30 dark:group-hover:bg-blue-950/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors shrink-0">
                        <Building2 className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all mt-1 shrink-0" />
                    </div>
                    <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-2">
                      {tenant.name}
                    </CardTitle>
                    {tenant.slug && (
                      <CardDescription className="text-xs text-slate-400 dark:text-slate-500">
                        {tenant.slug}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Badge variant={getRoleBadgeVariant(tenant.role)} className="text-xs">
                      {getRoleLabel(tenant.role)}
                    </Badge>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        )}

        {/* Footer logout */}
        <div className="mt-8 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Esci dall&apos;account
          </Button>
        </div>
      </div>
    </div>
  );
}

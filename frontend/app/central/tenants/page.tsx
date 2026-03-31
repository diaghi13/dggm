"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { landlordApi, CreateTenantPayload } from "@/lib/api/landlord";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Building2,
  Search,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  Circle,
  PlayCircle,
  PauseCircle,
  Plus,
  ChevronsUpDown,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Suspense } from "react";

type SubscriptionStatus =
  | "pending_payment"
  | "active"
  | "suspended"
  | "cancelled"
  | null;

interface StatusBadgeProps {
  status: string | null | undefined;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const map: Record<
    string,
    { label: string; className: string; icon: React.ElementType }
  > = {
    pending_payment: {
      label: "In attesa pagamento",
      className:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      icon: Clock,
    },
    pending: {
      label: "In attesa",
      className:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      icon: Clock,
    },
    trial: {
      label: "Trial",
      className:
        "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      icon: Clock,
    },
    active: {
      label: "Attivo",
      className:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      icon: CheckCircle2,
    },
    suspended: {
      label: "Sospeso",
      className:
        "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      icon: XCircle,
    },
    cancelled: {
      label: "Cancellato",
      className:
        "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
      icon: Circle,
    },
  };

  const config = status ? map[status] : null;
  if (!config) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
        <Circle className="h-3 w-3" />
        Nessuno
      </span>
    );
  }

  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

function BootstrapBadge({ status }: { status: App.Enums.BootstrapStatus | null | undefined }) {
  if (!status || status === 'ready') return null;

  const map: Record<string, { label: string; className: string; icon: React.ElementType; spin?: boolean }> = {
    pending: {
      label: "In coda",
      className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
      icon: Clock,
    },
    bootstrapping: {
      label: "Inizializzazione...",
      className: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
      icon: Loader2,
      spin: true,
    },
    failed: {
      label: "Init fallita",
      className: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
      icon: AlertCircle,
    },
  };

  const config = map[status];
  if (!config) return null;
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}
    >
      <Icon className={`h-3 w-3 ${config.spin ? "animate-spin" : ""}`} />
      {config.label}
    </span>
  );
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function TenantsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams.get("status") ?? "all",
  );
  const [page, setPage] = useState(1);
  const perPage = 15;

  const [confirmAction, setConfirmAction] = useState<{
    type: "activate" | "suspend";
    tenantId: string;
    tenantName: string;
  } | null>(null);

  // New Tenant dialog state
  const [isNewTenantOpen, setIsNewTenantOpen] = useState(false);
  const [newTenantForm, setNewTenantForm] = useState<{
    global_user_id: string;
    company_name: string;
    plan_id: string;
    billing_cycle: "monthly" | "yearly";
  }>({
    global_user_id: "",
    company_name: "",
    plan_id: "",
    billing_cycle: "monthly",
  });
  const [userSearch, setUserSearch] = useState("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["landlord-tenants", { status: statusFilter, page, perPage }],
    queryFn: () =>
      landlordApi.getTenants({
        status: statusFilter !== "all" ? statusFilter : undefined,
        page,
        per_page: perPage,
      }),
    refetchInterval: (query) => {
      const tenants = query.state.data?.data ?? [];
      const hasPending = tenants.some(
        (t) => t.bootstrap_status === "pending" || t.bootstrap_status === "bootstrapping",
      );
      return hasPending ? 4000 : false;
    },
  });

  const { data: globalUsersData } = useQuery({
    queryKey: ["landlord-global-users", userSearch],
    queryFn: () => landlordApi.getGlobalUsers({ per_page: 50 }),
    enabled: isNewTenantOpen,
  });

  const { data: adminPlans } = useQuery({
    queryKey: ["landlord-admin-plans"],
    queryFn: () => landlordApi.getAdminPlans(),
    enabled: isNewTenantOpen,
  });

  const createTenantMutation = useMutation({
    mutationFn: (data: CreateTenantPayload) => landlordApi.createTenant(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landlord-tenants"] });
      toast.success("Tenant creato", {
        description: "Il tenant è stato creato con successo.",
      });
      setIsNewTenantOpen(false);
      setNewTenantForm({
        global_user_id: "",
        company_name: "",
        plan_id: "",
        billing_cycle: "monthly",
      });
      setUserSearch("");
    },
    onError: () => {
      toast.error("Errore", {
        description: "Impossibile creare il tenant. Riprova.",
      });
    },
  });

  const globalUsers = globalUsersData?.data ?? [];
  const filteredUsers = userSearch
    ? globalUsers.filter(
        (u) =>
          u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
          u.email.toLowerCase().includes(userSearch.toLowerCase()),
      )
    : globalUsers;

  const selectedUser = globalUsers.find((u) => u.id === newTenantForm.global_user_id);

  const activateMutation = useMutation({
    mutationFn: (id: string) => landlordApi.activateTenant(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["landlord-tenants"] });
      queryClient.invalidateQueries({ queryKey: ["landlord-tenants-all"] });
      queryClient.invalidateQueries({ queryKey: ["landlord-tenants-active"] });
      queryClient.invalidateQueries({ queryKey: ["landlord-tenants-pending"] });
      toast.success("Tenant attivato", {
        description: response.message || "Il tenant è stato attivato con successo.",
      });
      setConfirmAction(null);
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ?? "Impossibile attivare il tenant. Riprova.";
      toast.error("Errore", { description: message });
    },
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => landlordApi.suspendTenant(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["landlord-tenants"] });
      queryClient.invalidateQueries({ queryKey: ["landlord-tenants-all"] });
      queryClient.invalidateQueries({ queryKey: ["landlord-tenants-active"] });
      queryClient.invalidateQueries({
        queryKey: ["landlord-tenants-suspended"],
      });
      toast.success("Tenant sospeso", {
        description: response.message || "Il tenant è stato sospeso.",
      });
      setConfirmAction(null);
    },
    onError: () => {
      toast.error("Errore", {
        description: "Impossibile sospendere il tenant. Riprova.",
      });
    },
  });

  const tenants = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Tenant
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Gestisci le organizzazioni registrate nel sistema
          </p>
        </div>
        <Button
          onClick={() => setIsNewTenantOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Tenant
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <Input
              placeholder="Cerca tenant per nome..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10 h-10 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-52 h-10 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700">
              <SelectValue placeholder="Filtra per stato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli stati</SelectItem>
              <SelectItem value="active">Attivi</SelectItem>
              <SelectItem value="pending_payment">In attesa pagamento</SelectItem>
              <SelectItem value="suspended">Sospesi</SelectItem>
              <SelectItem value="cancelled">Cancellati</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-8 w-20 rounded" />
              </div>
            ))}
          </div>
        ) : tenants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <Building2 className="h-8 w-8 text-slate-400 dark:text-slate-600" />
            </div>
            <p className="text-base font-medium text-slate-900 dark:text-slate-100">
              Nessun tenant trovato
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Prova a cambiare i filtri di ricerca
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Organizzazione
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">
                  Piano
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                  Prezzo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Stato
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                  Creato il
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tenants
                .filter(
                  (t) =>
                    !search ||
                    t.name.toLowerCase().includes(search.toLowerCase()) ||
                    (t.slug ?? "").toLowerCase().includes(search.toLowerCase()),
                )
                .map((tenant) => {
                  const subscriptionStatus =
                    tenant.subscription?.status ?? null;
                  return (
                    <tr
                      key={tenant.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                      onClick={() =>
                        router.push(`/central/tenants/${tenant.id}`)
                      }
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 font-semibold text-sm">
                            {tenant.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100">
                              {tenant.name}
                            </p>
                            {tenant.slug && (
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {tenant.slug}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <span className="text-slate-700 dark:text-slate-300">
                          {tenant.subscription?.plan?.name ?? (
                            <span className="text-slate-400 dark:text-slate-600 italic">
                              Nessun piano
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        {tenant.subscription?.total_price != null ? (
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            €{tenant.subscription.total_price.toFixed(2)}
                            <span className="text-xs text-slate-400 dark:text-slate-500 font-normal ml-1">
                              /{tenant.subscription.billing_cycle === "yearly" ? "anno" : "mese"}
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 italic text-xs">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          <StatusBadge status={subscriptionStatus} />
                          <BootstrapBadge status={tenant.bootstrap_status} />
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell text-slate-600 dark:text-slate-400">
                        {formatDate(tenant.created_at)}
                      </td>
                      <td
                        className="px-4 py-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-2">
                          {subscriptionStatus === "pending_payment" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700/50 dark:text-green-400 dark:hover:bg-green-950/30 h-8 disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={tenant.bootstrap_status !== "ready"}
                              title={
                                tenant.bootstrap_status !== "ready"
                                  ? "Il tenant non è ancora pronto"
                                  : undefined
                              }
                              onClick={() =>
                                setConfirmAction({
                                  type: "activate",
                                  tenantId: tenant.id!,
                                  tenantName: tenant.name,
                                })
                              }
                            >
                              {tenant.bootstrap_status === "bootstrapping" ? (
                                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                              ) : (
                                <PlayCircle className="h-3.5 w-3.5 mr-1" />
                              )}
                              Attiva
                            </Button>
                          )}
                          {subscriptionStatus === "active" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700/50 dark:text-red-400 dark:hover:bg-red-950/30 h-8"
                              onClick={() =>
                                setConfirmAction({
                                  type: "suspend",
                                  tenantId: tenant.id!,
                                  tenantName: tenant.name,
                                })
                              }
                            >
                              <PauseCircle className="h-3.5 w-3.5 mr-1" />
                              Sospendi
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 h-8 w-8 p-0"
                            onClick={() =>
                              router.push(`/central/tenants/${tenant.id}`)
                            }
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Mostrando{" "}
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {meta.from}
            </span>{" "}
            a{" "}
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {meta.to}
            </span>{" "}
            di{" "}
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {meta.total}
            </span>{" "}
            tenant
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="border-slate-300 dark:border-slate-700"
            >
              Precedente
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === meta.last_page}
              className="border-slate-300 dark:border-slate-700"
            >
              Successiva
            </Button>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {confirmAction?.type === "activate"
                ? "Attiva Tenant"
                : "Sospendi Tenant"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
              {confirmAction?.type === "activate" ? (
                <>
                  Sei sicuro di voler attivare{" "}
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {confirmAction.tenantName}
                  </span>
                  ?
                  <br />
                  L&apos;organizzazione potrà accedere al sistema.
                </>
              ) : (
                <>
                  Sei sicuro di voler sospendere{" "}
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {confirmAction?.tenantName}
                  </span>
                  ?
                  <br />
                  <span className="text-red-600 dark:text-red-400 font-medium">
                    Gli utenti non potranno più accedere al sistema.
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-300 dark:border-slate-700">
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!confirmAction) return;
                if (confirmAction.type === "activate") {
                  activateMutation.mutate(confirmAction.tenantId);
                } else {
                  suspendMutation.mutate(confirmAction.tenantId);
                }
              }}
              disabled={
                activateMutation.isPending || suspendMutation.isPending
              }
              className={
                confirmAction?.type === "activate"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }
            >
              {activateMutation.isPending || suspendMutation.isPending
                ? "Elaborazione..."
                : confirmAction?.type === "activate"
                  ? "Attiva Tenant"
                  : "Sospendi Tenant"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* New Tenant Dialog */}
      <Dialog open={isNewTenantOpen} onOpenChange={setIsNewTenantOpen}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Nuovo Tenant
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              Crea un nuovo tenant associato a un utente globale esistente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Global User selector */}
            <div className="space-y-1.5">
              <Label className="text-slate-700 dark:text-slate-300">
                Utente globale <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={userDropdownOpen}
                  className="w-full justify-between h-10 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-normal"
                  onClick={() => setUserDropdownOpen((o) => !o)}
                >
                  {selectedUser ? (
                    <span className="truncate">
                      {selectedUser.name}{" "}
                      <span className="text-slate-400 text-xs">
                        ({selectedUser.email})
                      </span>
                    </span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">
                      Seleziona utente...
                    </span>
                  )}
                  <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
                </Button>
                {userDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                      <Input
                        placeholder="Cerca per nome o email..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="h-8 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                      {filteredUsers.length === 0 ? (
                        <p className="px-3 py-4 text-sm text-center text-slate-500 dark:text-slate-400">
                          Nessun utente trovato
                        </p>
                      ) : (
                        filteredUsers.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100"
                            onClick={() => {
                              setNewTenantForm((f) => ({
                                ...f,
                                global_user_id: user.id ?? "",
                              }));
                              setUserDropdownOpen(false);
                              setUserSearch("");
                            }}
                          >
                            <Check
                              className={`h-4 w-4 shrink-0 ${newTenantForm.global_user_id === user.id ? "opacity-100 text-blue-600" : "opacity-0"}`}
                            />
                            <div className="min-w-0">
                              <p className="font-medium truncate">{user.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {user.email}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Company name */}
            <div className="space-y-1.5">
              <Label
                htmlFor="company-name"
                className="text-slate-700 dark:text-slate-300"
              >
                Nome azienda <span className="text-red-500">*</span>
              </Label>
              <Input
                id="company-name"
                placeholder="Es. Acme S.r.l."
                value={newTenantForm.company_name}
                onChange={(e) =>
                  setNewTenantForm((f) => ({
                    ...f,
                    company_name: e.target.value,
                  }))
                }
                className="h-10 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Plan selector */}
            <div className="space-y-1.5">
              <Label className="text-slate-700 dark:text-slate-300">
                Piano <span className="text-red-500">*</span>
              </Label>
              <Select
                value={newTenantForm.plan_id}
                onValueChange={(v) =>
                  setNewTenantForm((f) => ({ ...f, plan_id: v }))
                }
              >
                <SelectTrigger className="h-10 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                  <SelectValue placeholder="Seleziona piano..." />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                  {(adminPlans ?? []).map((plan) => (
                    <SelectItem
                      key={plan.id}
                      value={String(plan.id)}
                      className="text-slate-900 dark:text-slate-100"
                    >
                      {plan.name}
                      {plan.price != null && (
                        <span className="ml-2 text-slate-400 text-xs">
                          €{plan.price}/mese
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Billing cycle */}
            <div className="space-y-1.5">
              <Label className="text-slate-700 dark:text-slate-300">
                Ciclo di fatturazione
              </Label>
              <Select
                value={newTenantForm.billing_cycle}
                onValueChange={(v) =>
                  setNewTenantForm((f) => ({
                    ...f,
                    billing_cycle: v as "monthly" | "yearly",
                  }))
                }
              >
                <SelectTrigger className="h-10 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                  <SelectItem
                    value="monthly"
                    className="text-slate-900 dark:text-slate-100"
                  >
                    Mensile
                  </SelectItem>
                  <SelectItem
                    value="yearly"
                    className="text-slate-900 dark:text-slate-100"
                  >
                    Annuale
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsNewTenantOpen(false)}
              className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            >
              Annulla
            </Button>
            <Button
              onClick={() => {
                if (
                  !newTenantForm.global_user_id ||
                  !newTenantForm.company_name.trim() ||
                  !newTenantForm.plan_id
                ) {
                  toast.error("Compila tutti i campi obbligatori");
                  return;
                }
                createTenantMutation.mutate({
                  global_user_id: newTenantForm.global_user_id,
                  company_name: newTenantForm.company_name.trim(),
                  plan_id: Number(newTenantForm.plan_id),
                  billing_cycle: newTenantForm.billing_cycle,
                });
              }}
              disabled={createTenantMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {createTenantMutation.isPending ? "Creazione..." : "Crea Tenant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function TenantsPage() {
  return (
    <Suspense>
      <TenantsContent />
    </Suspense>
  );
}

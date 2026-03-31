"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { landlordApi } from "@/lib/api/landlord";
import { Button } from "@/components/ui/button";
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
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  CreditCard,
  Package,
  PauseCircle,
  PlayCircle,
  Users,
  XCircle,
} from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

type SubscriptionStatus =
  | "pending_payment"
  | "active"
  | "suspended"
  | "cancelled"
  | null;

function StatusBadge({ status }: { status: string | null | undefined }) {
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
      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
        <Circle className="h-3.5 w-3.5" />
        Nessuno
      </span>
    );
  }

  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${config.className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-sm text-slate-500 dark:text-slate-400 sm:w-40 flex-shrink-0">
        {label}
      </span>
      <span className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-0.5 sm:mt-0">
        {value}
      </span>
    </div>
  );
}

export default function TenantDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [confirmAction, setConfirmAction] = useState<
    "activate" | "suspend" | null
  >(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["landlord-tenant", id],
    queryFn: () => landlordApi.getTenant(id),
  });

  const tenant = data?.data;
  const subscription = tenant?.subscription;
  const subscriptionStatus = subscription?.status ?? null;

  const activateMutation = useMutation({
    mutationFn: () => landlordApi.activateTenant(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["landlord-tenant", id] });
      queryClient.invalidateQueries({ queryKey: ["landlord-tenants"] });
      queryClient.invalidateQueries({ queryKey: ["landlord-tenants-all"] });
      queryClient.invalidateQueries({ queryKey: ["landlord-tenants-active"] });
      queryClient.invalidateQueries({ queryKey: ["landlord-tenants-pending"] });
      toast.success("Tenant attivato", {
        description:
          response.message || "Il tenant è stato attivato con successo.",
      });
      setConfirmAction(null);
    },
    onError: () => {
      toast.error("Errore", {
        description: "Impossibile attivare il tenant. Riprova.",
      });
    },
  });

  const suspendMutation = useMutation({
    mutationFn: () => landlordApi.suspendTenant(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["landlord-tenant", id] });
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !tenant) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/30 mb-4">
          <XCircle className="h-8 w-8 text-red-500 dark:text-red-400" />
        </div>
        <p className="text-base font-medium text-slate-900 dark:text-slate-100">
          Tenant non trovato
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Il tenant richiesto non esiste o è stato eliminato.
        </p>
        <Button
          variant="outline"
          className="mt-6 border-slate-300 dark:border-slate-700"
          onClick={() => router.push("/central/tenants")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Torna alla lista
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link + Header */}
      <div>
        <Link
          href="/central/tenants"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna alla lista tenant
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 font-bold text-lg">
              {tenant.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {tenant.name}
              </h1>
              {tenant.slug && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {tenant.slug}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {subscriptionStatus === "pending_payment" && (
              <Button
                onClick={() => setConfirmAction("activate")}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                Attiva Tenant
              </Button>
            )}
            {subscriptionStatus === "active" && (
              <Button
                variant="outline"
                onClick={() => setConfirmAction("suspend")}
                className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700/50 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                <PauseCircle className="mr-2 h-4 w-4" />
                Sospendi Tenant
              </Button>
            )}
            {subscriptionStatus === "suspended" && (
              <Button
                onClick={() => setConfirmAction("activate")}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                Riattiva Tenant
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tenant info */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Informazioni Tenant
            </h2>
          </div>
          <div>
            <InfoRow label="Nome" value={tenant.name} />
            <InfoRow label="Slug" value={tenant.slug ?? "-"} />
            <InfoRow
              label="ID Tenant"
              value={
                <span className="font-mono text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {tenant.id}
                </span>
              }
            />
            <InfoRow
              label="Creato il"
              value={
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {formatDate(tenant.created_at)}
                </span>
              }
            />
          </div>
        </div>

        {/* Subscription */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Abbonamento
            </h2>
          </div>
          {subscription ? (
            <div>
              <InfoRow
                label="Stato"
                value={<StatusBadge status={subscription.status} />}
              />
              <InfoRow
                label="Piano"
                value={
                  subscription.plan ? (
                    <span className="font-medium">
                      {subscription.plan.name}
                      {subscription.plan.price != null && (
                        <span className="ml-2 text-slate-500 dark:text-slate-400 font-normal">
                          €{subscription.plan.price.toFixed(2)}/
                          {subscription.billing_cycle === "yearly" ? "anno" : "mese"}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-600 italic">
                      Nessun piano
                    </span>
                  )
                }
              />
              <InfoRow
                label="Ciclo"
                value={
                  <span className="capitalize">
                    {subscription.billing_cycle === "yearly" ? "Annuale" : "Mensile"}
                  </span>
                }
              />
              {subscription.total_price != null && (
                <InfoRow
                  label="Totale"
                  value={
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      €{subscription.total_price.toFixed(2)}/
                      {subscription.billing_cycle === "yearly" ? "anno" : "mese"}
                    </span>
                  }
                />
              )}
              <InfoRow
                label="Attivazione"
                value={
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {formatDate(subscription.starts_at)}
                  </span>
                }
              />
              {subscription.renews_at && (
                <InfoRow
                  label="Rinnovo"
                  value={
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {formatDate(subscription.renews_at)}
                    </span>
                  }
                />
              )}
              {subscription.trial_ends_at && (
                <InfoRow
                  label="Fine trial"
                  value={
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {formatDate(subscription.trial_ends_at)}
                    </span>
                  }
                />
              )}
              <InfoRow
                label="Scadenza"
                value={
                  subscription.ends_at ? (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {formatDate(subscription.ends_at)}
                    </span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-600 italic">
                      Nessuna scadenza
                    </span>
                  )
                }
              />
              {subscription.notes && (
                <InfoRow label="Note" value={subscription.notes} />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CreditCard className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Nessuna sottoscrizione attiva
              </p>
            </div>
          )}
        </div>

        {/* Subscription plan features (included in plan) */}
        {subscription?.plan?.features && subscription.plan.features.length > 0 && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Feature del Piano
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {subscription.plan.features.map((feature) => (
                <span
                  key={feature.id ?? feature.feature_key}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  {feature.feature_key}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Selected addons */}
        {subscription?.addons && subscription.addons.length > 0 && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Addon Selezionati
              </h2>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {subscription.addons.map((addon) => (
                <div
                  key={addon.feature_key}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                    <Package className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                    {addon.feature_key}
                  </span>
                  {addon.price_at_purchase != null ? (
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      €{addon.price_at_purchase.toFixed(2)}
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-normal ml-1">
                        /{subscription.billing_cycle === "yearly" ? "anno" : "mese"}
                      </span>
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                      Incluso
                    </span>
                  )}
                </div>
              ))}
            </div>
            {subscription.total_price != null && (
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Totale abbonamento
                </span>
                <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                  €{subscription.total_price.toFixed(2)}
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-normal ml-1">
                    /{subscription.billing_cycle === "yearly" ? "anno" : "mese"}
                  </span>
                </span>
              </div>
            )}
          </div>
        )}
      </div>

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
              {confirmAction === "activate"
                ? subscriptionStatus === "suspended"
                  ? "Riattiva Tenant"
                  : "Attiva Tenant"
                : "Sospendi Tenant"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
              {confirmAction === "activate" ? (
                <>
                  Sei sicuro di voler attivare{" "}
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {tenant.name}
                  </span>
                  ?
                  <br />
                  Gli utenti potranno accedere al sistema.
                </>
              ) : (
                <>
                  Sei sicuro di voler sospendere{" "}
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {tenant.name}
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
                if (confirmAction === "activate") {
                  activateMutation.mutate();
                } else if (confirmAction === "suspend") {
                  suspendMutation.mutate();
                }
              }}
              disabled={
                activateMutation.isPending || suspendMutation.isPending
              }
              className={
                confirmAction === "activate"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }
            >
              {activateMutation.isPending || suspendMutation.isPending
                ? "Elaborazione..."
                : confirmAction === "activate"
                  ? subscriptionStatus === "suspended"
                    ? "Riattiva Tenant"
                    : "Attiva Tenant"
                  : "Sospendi Tenant"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

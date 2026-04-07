"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import {
  CreditCard,
  Package,
  Clock,
  RefreshCw,
  CheckCircle2,
  Plus,
  Loader2,
  AlertTriangle,
  CalendarDays,
  Info,
  ArrowUpCircle,
  ArrowDownCircle,
  Layers,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/layout/page-header";
import {
  tenantSubscriptionApi,
  plansApi,
  type AvailableAddon,
  type SubscriptionRequest,
  type PlanSummary,
} from "@/lib/api/subscription";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "d MMMM yyyy", { locale: it });
  } catch {
    return iso;
  }
}

type StatusVariant = "active" | "trial" | "warning" | "suspended" | "expired" | "default";

function statusVariant(status: string): StatusVariant {
  if (status === "active") return "active";
  if (status === "trial") return "trial";
  if (status === "pending_payment") return "warning";
  if (status === "suspended") return "suspended";
  if (status === "expired") return "expired";
  return "default";
}

function StatusBadge({ status }: { status: string }) {
  const variant = statusVariant(status);
  const labels: Record<string, string> = {
    active: "Attivo",
    trial: "Periodo di prova",
    pending_payment: "In attesa di pagamento",
    suspended: "Sospeso",
    expired: "Scaduto",
    cancelled: "Cancellato",
  };
  const className = cn("text-xs font-semibold capitalize", {
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300":
      variant === "active",
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300":
      variant === "trial",
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300":
      variant === "warning",
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300":
      variant === "suspended" || variant === "expired",
    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400":
      variant === "default",
  });
  return <Badge className={className}>{labels[status] ?? status}</Badge>;
}

function RequestStatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    pending: "In attesa",
    approved: "Approvata",
    rejected: "Rifiutata",
    cancelled: "Cancellata",
  };
  const className = cn("text-xs", {
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300":
      status === "pending",
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300":
      status === "approved",
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300":
      status === "rejected" || status === "cancelled",
    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400": !(
      ["pending", "approved", "rejected", "cancelled"].includes(status)
    ),
  });
  return <Badge className={className}>{labels[status] ?? status}</Badge>;
}

function RequestTypeLabel({ type }: { type: string }) {
  const labels: Record<string, string> = {
    renewal: "Rinnovo",
    addon: "Add-on",
    upgrade: "Upgrade",
    downgrade: "Downgrade",
    cancellation: "Cancellazione",
  };
  return <span className="text-sm text-slate-700 dark:text-slate-300">{labels[type] ?? type}</span>;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SubscriptionStatusCardSkeleton() {
  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SubscriptionPage() {
  const queryClient = useQueryClient();

  // State for dialogs
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);
  const [renewNotes, setRenewNotes] = useState("");
  const [addonDialogOpen, setAddonDialogOpen] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState<AvailableAddon | null>(null);
  const [planChangeDialogOpen, setPlanChangeDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanSummary | null>(null);
  const [planChangeNotes, setPlanChangeNotes] = useState("");

  // ── Queries ──────────────────────────────────────────────────────────────────

  const {
    data: subscription,
    isLoading: subscriptionLoading,
    error: subscriptionError,
  } = useQuery({
    queryKey: ["tenant-subscription-status"],
    queryFn: () => tenantSubscriptionApi.getStatus(),
    refetchInterval: 5 * 60 * 1000,
    retry: 1,
    throwOnError: false,
  });

  const { data: requests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["tenant-subscription-requests"],
    queryFn: () => tenantSubscriptionApi.getRequests(),
    retry: 1,
    throwOnError: false,
  });

  const {
    data: availableAddons = [],
    isLoading: addonsLoading,
  } = useQuery({
    queryKey: ["tenant-available-addons"],
    queryFn: () => tenantSubscriptionApi.getAvailableAddons(),
    enabled: subscription?.status === "active",
    retry: 1,
    throwOnError: false,
  });

  const { data: availablePlans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["available-plans"],
    queryFn: () => plansApi.getAll(),
    retry: 1,
    throwOnError: false,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────────

  const renewMutation = useMutation({
    mutationFn: () => tenantSubscriptionApi.requestRenewal({ notes: renewNotes.trim() || undefined }),
    onSuccess: () => {
      toast.success("Richiesta di rinnovo inviata con successo!");
      setRenewDialogOpen(false);
      setRenewNotes("");
      void queryClient.invalidateQueries({ queryKey: ["tenant-subscription-status"] });
      void queryClient.invalidateQueries({ queryKey: ["tenant-subscription-requests"] });
    },
    onError: () => {
      toast.error("Errore nell'invio della richiesta. Riprova.");
    },
  });

  const addonMutation = useMutation({
    mutationFn: (featureKey: string) =>
      tenantSubscriptionApi.requestAddon({ addons: [featureKey] }),
    onSuccess: () => {
      toast.success("Add-on aggiunto con successo!");
      setAddonDialogOpen(false);
      setSelectedAddon(null);
      void queryClient.invalidateQueries({ queryKey: ["tenant-subscription-status"] });
      void queryClient.invalidateQueries({ queryKey: ["tenant-available-addons"] });
    },
    onError: () => {
      toast.error("Errore nell'aggiunta dell'add-on. Riprova.");
    },
  });

  const planChangeMutation = useMutation({
    mutationFn: (planId: number) =>
      tenantSubscriptionApi.changePlan({
        plan_id: planId,
        notes: planChangeNotes.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Richiesta di cambio piano inviata con successo!");
      setPlanChangeDialogOpen(false);
      setSelectedPlan(null);
      setPlanChangeNotes("");
      void queryClient.invalidateQueries({ queryKey: ["tenant-subscription-status"] });
      void queryClient.invalidateQueries({ queryKey: ["tenant-subscription-requests"] });
    },
    onError: () => {
      toast.error("Errore nell'invio della richiesta. Riprova.");
    },
  });

  // ── Derived values ────────────────────────────────────────────────────────────

  const hasPendingRenewal = subscription?.pending_renewal != null;
  const hasPendingPlanChange = subscription?.pending_plan_change != null;
  const isExpiredOrSuspended =
    subscription?.status === "expired" || subscription?.status === "suspended";
  const canChangePlan =
    !isExpiredOrSuspended &&
    (subscription?.status === "active" || subscription?.status === "trial");

  // Plans available to switch to (exclude current plan)
  const otherPlans = availablePlans.filter((p) => p.id !== subscription?.plan_id);
  const currentPlanFeatureCount =
    availablePlans.find((p) => p.id === subscription?.plan_id)?.features.length ?? 0;

  const daysProgress = (() => {
    if (!subscription?.days_remaining || !subscription.renews_at) return null;
    // Estimate a 30-day billing period for display
    const total = subscription.billing_cycle === "yearly" ? 365 : 30;
    const used = total - subscription.days_remaining;
    return Math.min(100, Math.max(0, Math.round((used / total) * 100)));
  })();

  const endDateLabel = subscription?.trial_ends_at
    ? subscription.trial_ends_at
    : subscription?.renews_at ?? subscription?.ends_at ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Abbonamento"
        description="Gestisci il tuo piano, add-on e richieste di rinnovo"
        icon={CreditCard}
      />

      {/* ── Status Card ── */}
      {subscriptionLoading ? (
        <SubscriptionStatusCardSkeleton />
      ) : subscriptionError || !subscription ? (
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="py-8 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-slate-400 mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Impossibile caricare i dati dell&apos;abbonamento.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-slate-500" />
                Stato Abbonamento
              </CardTitle>
              <StatusBadge status={subscription.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Plan + billing cycle */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Piano</p>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {subscription.plan_name ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Ciclo</p>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {subscription.billing_cycle === "yearly"
                    ? "Annuale"
                    : subscription.billing_cycle === "monthly"
                    ? "Mensile"
                    : "—"}
                </p>
              </div>
            </div>

            {/* Renewal / expiry date */}
            <div className="flex items-center justify-between py-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <CalendarDays className="h-4 w-4" />
                {subscription.status === "trial"
                  ? "Fine periodo di prova"
                  : "Prossimo rinnovo"}
              </div>
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {formatDate(endDateLabel)}
              </span>
            </div>

            {/* Days remaining + progress */}
            {subscription.days_remaining !== null && subscription.days_remaining > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Giorni rimanenti</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {subscription.days_remaining}
                  </span>
                </div>
                {daysProgress !== null && (
                  <Progress
                    value={daysProgress}
                    className="h-1.5"
                  />
                )}
              </div>
            )}

            {/* Pending renewal indicator */}
            {hasPendingRenewal && (
              <div className="flex items-start gap-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 px-3 py-2.5">
                <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  Richiesta di rinnovo inviata il{" "}
                  <strong>{formatDate(subscription.pending_renewal!.created_at)}</strong>{" "}
                  — In attesa di approvazione
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Active Features / Addons ── */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-slate-500" />
            Funzionalità Attive
          </CardTitle>
          <CardDescription>
            Funzionalità incluse nel piano e add-on acquistati
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptionLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !subscription?.addons.length ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-2">
              Nessuna funzionalità attiva.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {subscription.addons.map((addon) => (
                <div
                  key={addon.feature_key}
                  className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {addon.name}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {addon.is_included
                      ? "Incluso"
                      : addon.price_monthly
                      ? `€${addon.price_monthly.toFixed(2)}/mese`
                      : addon.price_yearly
                      ? `€${addon.price_yearly.toFixed(2)}/anno`
                      : "Add-on"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Available Addons (only when active and there are purchasable addons) ── */}
      {subscription?.status === "active" && (availableAddons.length > 0 || addonsLoading) && (
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4 text-slate-500" />
              Add-on Disponibili
            </CardTitle>
            <CardDescription>
              Aggiungi funzionalità extra al tuo abbonamento corrente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {addonsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : availableAddons.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-2">
                Nessun add-on disponibile al momento.
              </p>
            ) : (
              <div className="space-y-2">
                {availableAddons.map((addon) => (
                  <div
                    key={addon.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {addon.name}
                      </p>
                      {addon.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {addon.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        {addon.price_monthly && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            €{addon.price_monthly.toFixed(2)}/mese
                          </span>
                        )}
                        {addon.price_yearly && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            €{addon.price_yearly.toFixed(2)}/anno
                          </span>
                        )}
                        {addon.prorated_amount !== null && (
                          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                            Costo prorato: €{addon.prorated_amount.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedAddon(addon);
                        setAddonDialogOpen(true);
                      }}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Aggiungi
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Plan Change ── */}
      {canChangePlan && (
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-slate-500" />
              Cambia Piano
            </CardTitle>
            <CardDescription>
              Passa a un piano diverso per accedere a più o meno funzionalità
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasPendingPlanChange ? (
              <div className="flex items-start gap-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 px-3 py-3">
                <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Richiesta di cambio piano ({subscription!.pending_plan_change!.type === "upgrade" ? "Upgrade" : "Downgrade"}) inviata il{" "}
                  <strong>{formatDate(subscription!.pending_plan_change!.created_at)}</strong>{" "}
                  — In attesa di approvazione dal nostro team.
                </p>
              </div>
            ) : plansLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : otherPlans.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-2">
                Nessun altro piano disponibile al momento.
              </p>
            ) : (
              <div className="space-y-2">
                {otherPlans.map((plan) => {
                  const isUpgrade = plan.features.length >= currentPlanFeatureCount;
                  return (
                    <div
                      key={plan.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3"
                    >
                      <div className="flex items-start gap-3">
                        {isUpgrade ? (
                          <ArrowUpCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                        ) : (
                          <ArrowDownCircle className="h-5 w-5 text-orange-400 mt-0.5 shrink-0" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {plan.name}
                            </p>
                            <span
                              className={cn(
                                "text-xs px-1.5 py-0.5 rounded font-semibold",
                                isUpgrade
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                  : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                              )}
                            >
                              {isUpgrade ? "Upgrade" : "Downgrade"}
                            </span>
                          </div>
                          {plan.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {plan.description}
                            </p>
                          )}
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            {plan.features.length} funzionalità incluse
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedPlan(plan);
                          setPlanChangeDialogOpen(true);
                        }}
                        className="shrink-0"
                      >
                        Seleziona
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Renewal Card ── */}
      {!isExpiredOrSuspended && (
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-slate-500" />
              {subscription?.status === "trial" ? "Attiva Abbonamento" : "Rinnova Abbonamento"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasPendingRenewal ? (
              <div className="flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-3 py-3">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Richiesta inviata il{" "}
                  <strong>
                    {formatDate(subscription!.pending_renewal!.created_at)}
                  </strong>{" "}
                  — In attesa di conferma dal nostro team.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {subscription?.status === "trial"
                    ? "Attiva il tuo abbonamento per continuare ad usare tutte le funzionalità dopo il periodo di prova."
                    : "Invia una richiesta di rinnovo. Il nostro team ti contatterà per completare il processo."}
                </p>
                <Button
                  onClick={() => setRenewDialogOpen(true)}
                  disabled={subscriptionLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {subscription?.status === "trial"
                    ? "Attiva abbonamento"
                    : "Richiedi rinnovo"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Request History ── */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-500" />
            Storico Richieste
          </CardTitle>
          <CardDescription>Ultime 5 richieste di abbonamento</CardDescription>
        </CardHeader>
        <CardContent>
          {requestsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : requests.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-2">
              Nessuna richiesta inviata.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 pb-2 pr-4">
                      Data
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 pb-2 pr-4">
                      Tipo
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 pb-2 pr-4">
                      Stato
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 pb-2">
                      Importo
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {requests.slice(0, 5).map((req: SubscriptionRequest) => (
                    <tr key={req.id}>
                      <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(req.created_at)}
                      </td>
                      <td className="py-2.5 pr-4">
                        <RequestTypeLabel type={req.type} />
                      </td>
                      <td className="py-2.5 pr-4">
                        <RequestStatusBadge status={req.status} />
                      </td>
                      <td className="py-2.5 text-right text-slate-700 dark:text-slate-300">
                        {req.amount != null ? `€${req.amount.toFixed(2)}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Renew Dialog ── */}
      <Dialog open={renewDialogOpen} onOpenChange={setRenewDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">
              {subscription?.status === "trial"
                ? "Attiva abbonamento"
                : "Richiedi rinnovo"}
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              {subscription?.status === "trial"
                ? "Invia una richiesta per attivare il tuo abbonamento. Il nostro team ti contatterà."
                : "Invia una richiesta di rinnovo. Il nostro team ti contatterà per completare il processo."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                Note (opzionale)
              </label>
              <Textarea
                value={renewNotes}
                onChange={(e) => setRenewNotes(e.target.value)}
                placeholder="Aggiungi eventuali note per il team..."
                rows={3}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setRenewDialogOpen(false)}
              disabled={renewMutation.isPending}
              className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            >
              Annulla
            </Button>
            <Button
              onClick={() => renewMutation.mutate()}
              disabled={renewMutation.isPending}
            >
              {renewMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Invio...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Invia richiesta
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Plan Change Dialog ── */}
      <Dialog open={planChangeDialogOpen} onOpenChange={setPlanChangeDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">
              {selectedPlan &&
                (selectedPlan.features.length >= currentPlanFeatureCount
                  ? "Richiesta Upgrade"
                  : "Richiesta Downgrade")}
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              Richiedi il passaggio al piano{" "}
              <strong className="text-slate-800 dark:text-slate-200">{selectedPlan?.name}</strong>.
              Il nostro team elaborerà la richiesta e ti contatterà per confermare il cambio.
            </DialogDescription>
          </DialogHeader>
          {selectedPlan && (
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-4 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Funzionalità incluse</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {selectedPlan.features.length}
                </span>
              </div>
              {selectedPlan.price !== null && (
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Prezzo mensile</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    €{selectedPlan.price.toFixed(2)}/mese
                  </span>
                </div>
              )}
              {selectedPlan.price_yearly !== null && (
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Prezzo annuale</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    €{selectedPlan.price_yearly.toFixed(2)}/anno
                  </span>
                </div>
              )}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">
              Note (opzionale)
            </label>
            <Textarea
              value={planChangeNotes}
              onChange={(e) => setPlanChangeNotes(e.target.value)}
              placeholder="Aggiungi eventuali note per il team..."
              rows={3}
              className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setPlanChangeDialogOpen(false);
                setSelectedPlan(null);
                setPlanChangeNotes("");
              }}
              disabled={planChangeMutation.isPending}
              className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            >
              Annulla
            </Button>
            <Button
              onClick={() => selectedPlan && planChangeMutation.mutate(selectedPlan.id)}
              disabled={planChangeMutation.isPending || !selectedPlan}
            >
              {planChangeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Invio...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Invia richiesta
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Addon Confirm Dialog ── */}
      <Dialog open={addonDialogOpen} onOpenChange={setAddonDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">
              Aggiungi add-on
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              Conferma l&apos;aggiunta di{" "}
              <strong>{selectedAddon?.name}</strong> al tuo abbonamento.
            </DialogDescription>
          </DialogHeader>

          {selectedAddon && (
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-4 space-y-2 text-sm">
              {selectedAddon.price_monthly && (
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Prezzo mensile</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    €{selectedAddon.price_monthly.toFixed(2)}/mese
                  </span>
                </div>
              )}
              {selectedAddon.price_yearly && (
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Prezzo annuale</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    €{selectedAddon.price_yearly.toFixed(2)}/anno
                  </span>
                </div>
              )}
              {selectedAddon.prorated_amount !== null && (
                <>
                  <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">
                      Costo prorato
                      {selectedAddon.prorated_days_remaining != null && (
                        <span className="ml-1 text-xs">
                          ({selectedAddon.prorated_days_remaining} giorni rimanenti)
                        </span>
                      )}
                    </span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      €{selectedAddon.prorated_amount.toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setAddonDialogOpen(false);
                setSelectedAddon(null);
              }}
              disabled={addonMutation.isPending}
              className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            >
              Annulla
            </Button>
            <Button
              onClick={() => selectedAddon && addonMutation.mutate(selectedAddon.feature_key)}
              disabled={addonMutation.isPending || !selectedAddon}
            >
              {addonMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Aggiunta...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Conferma aggiunta
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

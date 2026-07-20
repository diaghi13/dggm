"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { handleMutationError } from "@/lib/utils/handle-mutation-error";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import {
  CheckCircle2,
  Clock,
  Loader2,
  Package,
  RefreshCw,
  RotateCcw,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  landlordRenewalApi,
  type RenewalRequest,
  type RenewalRequestStatus,
  type RenewalRequestType,
} from "@/lib/api/landlord-renewals";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ─── Helpers ──────────────────────────────────────────────────────────────────

type FilterTab = "all" | RenewalRequestStatus;

const FILTER_TABS: Array<{ id: FilterTab; label: string }> = [
  { id: "all", label: "Tutte" },
  { id: "pending", label: "In attesa" },
  { id: "approved", label: "Approvate" },
  { id: "rejected", label: "Rifiutate" },
];

function getTypeBadge(type: RenewalRequestType) {
  switch (type) {
    case "renewal":
      return (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800 gap-1">
          <RotateCcw className="h-3 w-3" />
          Rinnovo
        </Badge>
      );
    case "addon":
      return (
        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800 gap-1">
          <Package className="h-3 w-3" />
          Add-on
        </Badge>
      );
    case "renewal_addon":
      return (
        <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 gap-1">
          <RefreshCw className="h-3 w-3" />
          Rinnovo + Add-on
        </Badge>
      );
  }
}

function getStatusBadge(status: RenewalRequestStatus) {
  switch (status) {
    case "pending":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800">
          In attesa
        </Badge>
      );
    case "approved":
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800">
          Approvata
        </Badge>
      );
    case "rejected":
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800">
          Rifiutata
        </Badge>
      );
  }
}

function formatCurrency(amount: number | null): string {
  if (amount === null) return "—";
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

// ─── Approve Dialog ───────────────────────────────────────────────────────────

interface ApproveDialogProps {
  request: RenewalRequest | null;
  onClose: () => void;
  onConfirm: (id: number, notes: string) => void;
  isPending: boolean;
}

function ApproveDialog({ request, onClose, onConfirm, isPending }: ApproveDialogProps) {
  const [notes, setNotes] = useState("");

  return (
    <Dialog open={request !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-slate-100">
            Approva richiesta
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            Conferma l&apos;approvazione della richiesta di rinnovo.
          </DialogDescription>
        </DialogHeader>

        {request && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Tenant</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{request.tenant_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Tipo</span>
                <span>{getTypeBadge(request.type)}</span>
              </div>
              {request.plan_name && (
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Piano</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {request.target_plan_name
                      ? `${request.plan_name} → ${request.target_plan_name}`
                      : request.plan_name}
                  </span>
                </div>
              )}
              {(request.addons?.length ?? 0) > 0 && (
                <div className="flex justify-between items-start gap-4">
                  <span className="text-slate-500 dark:text-slate-400 shrink-0">Add-on</span>
                  <span className="text-right text-slate-700 dark:text-slate-300">
                    {(request.addons ?? []).map((a) => a.label).join(", ")}
                  </span>
                </div>
              )}
              {request.prorated_amount !== null && (
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                  <span className="text-slate-500 dark:text-slate-400">Importo prorato</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {formatCurrency(request.prorated_amount)}
                  </span>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Note (opzionale)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Note per il tenant o per uso interno..."
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none"
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            Annulla
          </Button>
          <Button
            onClick={() => request && onConfirm(request.id, notes)}
            disabled={isPending}
            className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500 text-white"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Approvazione...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approva
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Reject Dialog ────────────────────────────────────────────────────────────

interface RejectDialogProps {
  request: RenewalRequest | null;
  onClose: () => void;
  onConfirm: (id: number, notes: string) => void;
  isPending: boolean;
}

function RejectDialog({ request, onClose, onConfirm, isPending }: RejectDialogProps) {
  const [notes, setNotes] = useState("");

  return (
    <Dialog open={request !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-slate-100">
            Rifiuta richiesta
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            Indica il motivo del rifiuto (opzionale).
          </DialogDescription>
        </DialogHeader>

        {request && (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Tenant</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{request.tenant_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Tipo</span>
                <span>{getTypeBadge(request.type)}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Motivo del rifiuto (opzionale)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Es: Pagamento non ricevuto, dati mancanti..."
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none"
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            Annulla
          </Button>
          <Button
            onClick={() => request && onConfirm(request.id, notes)}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 text-white"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Rifiuto in corso...
              </>
            ) : (
              <>
                <X className="h-4 w-4 mr-2" />
                Rifiuta
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RenewalRequestsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [approveTarget, setApproveTarget] = useState<RenewalRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<RenewalRequest | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["landlord-renewal-requests", activeTab],
    queryFn: () =>
      landlordRenewalApi.getAll({
        status: activeTab === "all" ? undefined : activeTab,
        per_page: 50,
      }),
  });

  const { data: countData } = useQuery({
    queryKey: ["landlord-renewal-requests-pending-count"],
    queryFn: () => landlordRenewalApi.getPendingCount(),
    refetchInterval: 60_000,
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes: string }) =>
      landlordRenewalApi.approve(id, { admin_notes: notes || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landlord-renewal-requests"] });
      queryClient.invalidateQueries({ queryKey: ["landlord-renewal-requests-pending-count"] });
      setApproveTarget(null);
      toast.success("Richiesta approvata con successo");
    },
    onError: (error) => handleMutationError(error, "Errore durante l'approvazione"),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes: string }) =>
      landlordRenewalApi.reject(id, { admin_notes: notes || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landlord-renewal-requests"] });
      queryClient.invalidateQueries({ queryKey: ["landlord-renewal-requests-pending-count"] });
      setRejectTarget(null);
      toast.success("Richiesta rifiutata");
    },
    onError: (error) => handleMutationError(error, "Errore durante il rifiuto"),
  });

  const pendingCount = countData?.data?.count ?? 0;
  const requests = data?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/50">
            <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Richieste di Rinnovo
              </h1>
              {pendingCount > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 min-w-[1.25rem]">
                  {pendingCount}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Gestisci rinnovi abbonamenti e richieste add-on dei tenant
            </p>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab.id
                ? "border-blue-600 dark:border-blue-400 text-blue-700 dark:text-blue-400"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            {tab.label}
            {tab.id === "pending" && pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 text-xs font-semibold px-1.5 py-0.5 min-w-[1.25rem]">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-4 w-20 ml-auto" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Errore nel caricamento
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Ricarica la pagina per riprovare.
            </p>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <RefreshCw className="h-6 w-6 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Nessuna richiesta
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {activeTab === "all"
                ? "Non ci sono richieste di rinnovo."
                : `Non ci sono richieste con stato "${FILTER_TABS.find((t) => t.id === activeTab)?.label}".`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Data richiesta
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Tenant
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Tipo
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Piano
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Add-on
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Importo prorato
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Stato
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {requests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Data richiesta */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {req.created_at
                            ? formatDistanceToNow(new Date(req.created_at), {
                                addSuffix: true,
                                locale: it,
                              })
                            : "—"}
                        </span>
                      </div>
                    </td>

                    {/* Tenant */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {req.tenant_name}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                          {req.tenant_id}
                        </p>
                      </div>
                    </td>

                    {/* Tipo */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(req.type)}
                    </td>

                    {/* Piano */}
                    <td className="px-6 py-4">
                      {req.target_plan_name ? (
                        <span className="text-slate-700 dark:text-slate-300">
                          {req.plan_name} → <strong>{req.target_plan_name}</strong>
                        </span>
                      ) : (
                        <span className="text-slate-700 dark:text-slate-300">
                          {req.plan_name ?? "—"}
                        </span>
                      )}
                    </td>

                    {/* Add-on */}
                    <td className="px-6 py-4">
                      {!req.addons?.length ? (
                        <span className="text-slate-400 dark:text-slate-600">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {req.addons.map((addon) => (
                            <span
                              key={addon.feature_key}
                              className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 text-xs font-medium"
                            >
                              {addon.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Importo prorato */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {formatCurrency(req.prorated_amount)}
                      </span>
                    </td>

                    {/* Stato */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(req.status)}
                    </td>

                    {/* Azioni */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {req.status === "pending" ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => setApproveTarget(req)}
                            className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500 text-white h-7 text-xs px-2.5"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Approva
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setRejectTarget(req)}
                            className="border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 h-7 text-xs px-2.5"
                          >
                            <X className="h-3.5 w-3.5 mr-1" />
                            Rifiuta
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-600">
                          {req.processed_at
                            ? formatDistanceToNow(new Date(req.processed_at), {
                                addSuffix: true,
                                locale: it,
                              })
                            : "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ApproveDialog
        request={approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={(id, notes) => approveMutation.mutate({ id, notes })}
        isPending={approveMutation.isPending}
      />

      <RejectDialog
        request={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={(id, notes) => rejectMutation.mutate({ id, notes })}
        isPending={rejectMutation.isPending}
      />
    </div>
  );
}

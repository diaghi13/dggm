"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { repairOrdersApi } from "@/lib/api/repair-orders";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Wrench, ShieldAlert, ArrowRight, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { ProtectedRoute } from "@/components/features/auth/protected-route";
import type { RepairOrder, RepairOrderStatus, UpdateRepairOrderStatusInput } from "@/lib/types";

type StatusFilter =
  | "all"
  | "pending"
  | "sent_external"
  | "in_repair"
  | "completed"
  | "unrepairable";

const statusFilterLabels: Record<StatusFilter, string> = {
  all: "Tutti",
  pending: "In Attesa",
  sent_external: "Inviati",
  in_repair: "In Riparazione",
  completed: "Completati",
  unrepairable: "Irreparabili",
};

const statusBadgeVariant: Record<
  RepairOrderStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  sent_external: "outline",
  in_repair: "default",
  completed: "secondary",
  unrepairable: "destructive",
};

const statusBadgeLabel: Record<RepairOrderStatus, string> = {
  pending: "In Attesa",
  sent_external: "Inviato",
  in_repair: "In Riparazione",
  completed: "Completato",
  unrepairable: "Irreparabile",
};

const repairTypeLabel: Record<string, string> = {
  internal: "Interna",
  external: "Esterna",
};

interface TransitionDialogState {
  order: RepairOrder;
  targetStatus: "sent_external" | "in_repair" | "completed" | "unrepairable";
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("it-IT");
}

interface StatusTransitionDialogProps {
  state: TransitionDialogState | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function StatusTransitionDialog({
  state,
  open,
  onOpenChange,
}: StatusTransitionDialogProps) {
  const queryClient = useQueryClient();
  const [actualReturnDate, setActualReturnDate] = useState<string>("");
  const [repairCost, setRepairCost] = useState<string>("");
  const [repairNotes, setRepairNotes] = useState<string>("");

  React.useEffect(() => {
    if (open) {
      setActualReturnDate("");
      setRepairCost("");
      setRepairNotes("");
    }
  }, [open]);

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: UpdateRepairOrderStatusInput;
    }) => repairOrdersApi.updateStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repair-orders"] });
      queryClient.invalidateQueries({ queryKey: ["quarantined-inventory"] });
      toast.success("Stato aggiornato con successo");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message || "Impossibile aggiornare lo stato",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state) return;

    const payload: UpdateRepairOrderStatusInput = {
      status: state.targetStatus,
    };

    if (state.targetStatus === "completed") {
      if (actualReturnDate) payload.actual_return_date = actualReturnDate;
      if (repairCost) payload.repair_cost = Number(repairCost);
      if (repairNotes) payload.repair_notes = repairNotes;
    } else if (state.targetStatus === "unrepairable") {
      if (repairNotes) payload.repair_notes = repairNotes;
    }

    updateMutation.mutate({ id: state.order.id, data: payload });
  };

  const isCompleted = state?.targetStatus === "completed";
  const isUnrepairable = state?.targetStatus === "unrepairable";
  const needsForm = isCompleted || isUnrepairable;

  const titleMap: Record<string, string> = {
    sent_external: "Invia a Riparazione",
    in_repair: "Segna In Lavorazione",
    completed: "Registra Rientro",
    unrepairable: "Segna Irreparabile",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-slate-100">
            {state ? titleMap[state.targetStatus] : ""}
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            {state?.order.product_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isCompleted && (
            <>
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">
                  Data Rientro Effettiva
                </Label>
                <Input
                  type="date"
                  value={actualReturnDate}
                  onChange={(e) => setActualReturnDate(e.target.value)}
                  className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">
                  Costo Riparazione (€)
                </Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={repairCost}
                  onChange={(e) => setRepairCost(e.target.value)}
                  placeholder="0.00"
                  className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                />
              </div>
            </>
          )}

          {(isCompleted || isUnrepairable) && (
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">
                Note Riparazione
              </Label>
              <textarea
                value={repairNotes}
                onChange={(e) => setRepairNotes(e.target.value)}
                placeholder="Note aggiuntive..."
                rows={3}
                className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 resize-none"
              />
            </div>
          )}

          {!needsForm && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Confermi di voler aggiornare lo stato dell&apos;ordine?
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            >
              Annulla
            </Button>
            <Button
              type="submit"
              variant={isUnrepairable ? "destructive" : "default"}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Aggiornamento..." : "Conferma"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function RepairOrdersPage() {
  return (
    <ProtectedRoute permission="warehouse.view">
      <RepairOrdersPageContent />
    </ProtectedRoute>
  );
}

function RepairOrdersPageContent() {
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("all");
  const [transitionDialog, setTransitionDialog] =
    useState<TransitionDialogState | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["repair-orders", activeFilter],
    queryFn: () =>
      repairOrdersApi.getAll({
        status: activeFilter === "all" ? undefined : activeFilter,
      }),
  });

  const orders: RepairOrder[] = Array.isArray(data?.data) ? data.data : [];

  const openTransition = (
    order: RepairOrder,
    targetStatus: TransitionDialogState["targetStatus"]
  ) => {
    setTransitionDialog({ order, targetStatus });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Ordini di Riparazione
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Gestione e tracciamento delle riparazioni
          </p>
        </div>
        <Link href="/warehouse/quarantine">
          <Button
            variant="outline"
            className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            <ShieldAlert className="mr-2 h-4 w-4" />
            Vai a Quarantena
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(statusFilterLabels) as StatusFilter[]).map((filter) => (
          <Button
            key={filter}
            variant={activeFilter === filter ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter(filter)}
            className={
              activeFilter === filter
                ? ""
                : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }
          >
            {statusFilterLabels[filter]}
          </Button>
        ))}
      </div>

      {/* Table */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">
            {statusFilterLabels[activeFilter]}
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            {orders.length > 0
              ? `${orders.length} ordini`
              : "Nessun ordine trovato"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-slate-500 dark:text-slate-400">
                Caricamento...
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                Nessun ordine trovato
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {activeFilter === "all"
                  ? "Gli ordini di riparazione vengono creati dalla sezione Quarantena"
                  : "Nessun ordine con questo stato"}
              </p>
              {activeFilter === "all" && (
                <Link href="/warehouse/quarantine">
                  <Button className="mt-4">
                    <ShieldAlert className="mr-2 h-4 w-4" />
                    Vai a Quarantena
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 dark:border-slate-800">
                    <TableHead className="text-slate-700 dark:text-slate-300">
                      Prodotto
                    </TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">
                      Tipo
                    </TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">
                      Fornitore
                    </TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">
                      Qty
                    </TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">
                      Inviato il
                    </TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">
                      Rientro Previsto
                    </TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">
                      Stato
                    </TableHead>
                    <TableHead className="text-right text-slate-700 dark:text-slate-300">
                      Azioni
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                        {order.product_name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            order.repair_type === "internal"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            order.repair_type === "internal"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                              : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                          }
                        >
                          {repairTypeLabel[order.repair_type] ?? order.repair_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">
                        {order.supplier_name ?? (
                          <span className="text-slate-400 dark:text-slate-500">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-700 dark:text-slate-300">
                        {order.quantity}
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(order.sent_date)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span
                          className={
                            order.is_overdue
                              ? "font-semibold text-red-600 dark:text-red-400"
                              : "text-slate-600 dark:text-slate-400"
                          }
                        >
                          {formatDate(order.expected_return_date)}
                          {order.is_overdue && (
                            <span className="ml-1 text-xs">(scaduto)</span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant[order.status]}>
                          {statusBadgeLabel[order.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          {order.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
                              onClick={() =>
                                openTransition(order, "sent_external")
                              }
                            >
                              <ArrowRight className="h-3.5 w-3.5 mr-1" />
                              Invia
                            </Button>
                          )}
                          {order.status === "sent_external" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
                              onClick={() =>
                                openTransition(order, "in_repair")
                              }
                            >
                              <Wrench className="h-3.5 w-3.5 mr-1" />
                              In Lavorazione
                            </Button>
                          )}
                          {order.status === "in_repair" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
                                onClick={() =>
                                  openTransition(order, "completed")
                                }
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                Rientrato
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 whitespace-nowrap"
                                onClick={() =>
                                  openTransition(order, "unrepairable")
                                }
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                Irreparabile
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <StatusTransitionDialog
        state={transitionDialog}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}

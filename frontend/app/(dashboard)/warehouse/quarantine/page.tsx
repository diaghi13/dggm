"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { repairOrdersApi } from "@/lib/api/repair-orders";
import { suppliersApi } from "@/lib/api/suppliers";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ShieldAlert, Plus, AlertTriangle, Wrench } from "lucide-react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/features/auth/protected-route";
import type { QuarantinedInventoryItem, RepairType } from "@/lib/types";

const repairOrderStatusLabels: Record<string, string> = {
  pending: "In Attesa",
  sent_external: "Inviato",
  in_repair: "In Riparazione",
  completed: "Completato",
  unrepairable: "Irreparabile",
};

const repairOrderStatusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  sent_external: "outline",
  in_repair: "default",
  completed: "secondary",
  unrepairable: "destructive",
};

function getDaysClassName(days: number | null): string {
  if (days === null) return "";
  if (days > 60)
    return "font-semibold text-red-600 dark:text-red-400";
  if (days > 30)
    return "font-semibold text-orange-500 dark:text-orange-400";
  if (days > 7)
    return "font-semibold text-yellow-600 dark:text-yellow-400";
  return "text-slate-700 dark:text-slate-300";
}

interface CreateRepairOrderDialogProps {
  item: QuarantinedInventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CreateRepairOrderDialog({
  item,
  open,
  onOpenChange,
}: CreateRepairOrderDialogProps) {
  const queryClient = useQueryClient();
  const [repairType, setRepairType] = useState<RepairType>("internal");
  const [supplierId, setSupplierId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [expectedReturnDate, setExpectedReturnDate] = useState<string>("");
  const [quarantineReason, setQuarantineReason] = useState<string>("");

  React.useEffect(() => {
    if (item) {
      setQuantity(String(item.quantity_quarantine));
      setQuarantineReason(item.quarantine_reason ?? "");
      setRepairType("internal");
      setSupplierId("");
      setExpectedReturnDate("");
    }
  }, [item]);

  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers", { per_page: 100, is_active: true }],
    queryFn: () => suppliersApi.getAll({ per_page: 100, is_active: true }),
    enabled: repairType === "external",
  });
  const suppliers = Array.isArray(suppliersData?.data) ? suppliersData.data : [];

  const createMutation = useMutation({
    mutationFn: repairOrdersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quarantined-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["repair-orders"] });
      toast.success("Ordine di riparazione creato con successo");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message || "Impossibile creare l'ordine di riparazione",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    createMutation.mutate({
      product_id: item.product_id,
      inventory_id: item.inventory_id,
      quantity: Number(quantity),
      repair_type: repairType,
      supplier_id: repairType === "external" && supplierId ? Number(supplierId) : null,
      expected_return_date: expectedReturnDate || null,
      quarantine_reason: quarantineReason || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-slate-100">
            Crea Ordine di Riparazione
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            {item?.product_name} &mdash; {item?.product_code}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-slate-300">
              Tipo Riparazione
            </Label>
            <Select
              value={repairType}
              onValueChange={(v) => setRepairType(v as RepairType)}
            >
              <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="internal">Interna</SelectItem>
                <SelectItem value="external">Esterna</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {repairType === "external" && (
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">
                Fornitore
              </Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Seleziona fornitore..." />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-slate-300">
              Quantità
            </Label>
            <Input
              type="text"
              inputMode="numeric"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-slate-300">
              Data Rientro Prevista
            </Label>
            <Input
              type="date"
              value={expectedReturnDate}
              onChange={(e) => setExpectedReturnDate(e.target.value)}
              className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-slate-300">
              Motivo Quarantena
            </Label>
            <Input
              type="text"
              value={quarantineReason}
              onChange={(e) => setQuarantineReason(e.target.value)}
              placeholder="Descrizione del problema..."
              className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>

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
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creazione..." : "Crea Ordine"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function QuarantinePage() {
  return (
    <ProtectedRoute permission="warehouse.view">
      <QuarantinePageContent />
    </ProtectedRoute>
  );
}

function QuarantinePageContent() {
  const [dialogItem, setDialogItem] = useState<QuarantinedInventoryItem | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["quarantined-inventory"],
    queryFn: repairOrdersApi.getQuarantined,
  });

  const handleCreateOrder = (item: QuarantinedInventoryItem) => {
    setDialogItem(item);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Quarantena Magazzino
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Articoli in quarantena che richiedono ispezione o riparazione
          </p>
        </div>
      </div>

      {/* Summary Card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
              In Quarantena
            </CardTitle>
            <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {items.length}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              articoli in attesa
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Senza Ordine
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {items.filter((i) => !i.repair_order_id).length}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              senza ordine riparazione
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Critici (&gt;30 giorni)
            </CardTitle>
            <Wrench className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {items.filter((i) => (i.days_in_quarantine ?? 0) > 30).length}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              oltre 30 giorni in quarantena
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">
            Articoli in Quarantena
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            {items.length > 0
              ? `${items.length} articoli in quarantena`
              : "Nessun articolo in quarantena"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-slate-500 dark:text-slate-400">
                Caricamento...
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <ShieldAlert className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                Nessun articolo in quarantena
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Tutti gli articoli sono in buono stato
              </p>
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
                      Qty Quarantena
                    </TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">
                      Giorni in Quarantena
                    </TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">
                      Motivo
                    </TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">
                      Stato Riparazione
                    </TableHead>
                    <TableHead className="text-right text-slate-700 dark:text-slate-300">
                      Azioni
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow
                      key={item.inventory_id}
                      className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {item.product_name}
                          </p>
                          <Badge
                            variant="outline"
                            className="text-xs mt-1 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400"
                          >
                            {item.product_code}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-700 dark:text-slate-300 font-medium">
                        {item.quantity_quarantine}
                      </TableCell>
                      <TableCell>
                        <span className={getDaysClassName(item.days_in_quarantine)}>
                          {item.days_in_quarantine !== null
                            ? `${item.days_in_quarantine} gg`
                            : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[180px]">
                        <span
                          className="text-sm text-slate-600 dark:text-slate-400 truncate block"
                          title={item.quarantine_reason ?? undefined}
                        >
                          {item.quarantine_reason
                            ? item.quarantine_reason.length > 40
                              ? item.quarantine_reason.slice(0, 40) + "..."
                              : item.quarantine_reason
                            : "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {item.repair_order_status ? (
                          <Badge
                            variant={
                              repairOrderStatusVariant[item.repair_order_status] ??
                              "secondary"
                            }
                          >
                            {repairOrderStatusLabels[item.repair_order_status] ??
                              item.repair_order_status}
                          </Badge>
                        ) : (
                          <span className="text-sm text-slate-400 dark:text-slate-500 italic">
                            Senza ordine
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!item.repair_order_id && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            onClick={() => handleCreateOrder(item)}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                            Crea Ordine
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateRepairOrderDialog
        item={dialogItem}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}

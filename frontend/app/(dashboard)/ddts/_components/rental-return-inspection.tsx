"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inspectionsApi } from "@/lib/api/inspections";
import type {
  RentalReturnInspection,
  RentalReturnInspectionItem,
  ItemCondition,
  InspectionItemAction,
  CompleteInspectionItemInput,
} from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ClipboardCheck,
  ClipboardList,
  CheckCircle2,
  Loader2,
  Save,
  CheckSquare,
  Euro,
} from "lucide-react";

interface RentalReturnInspectionProps {
  ddtId: number;
  projectId?: number | null;
}

const conditionLabels: Record<ItemCondition, string> = {
  good: "Buono",
  minor_damage: "Danni Lievi",
  major_damage: "Danni Gravi",
  write_off: "Irreparabile",
};

const conditionColors: Record<ItemCondition, string> = {
  good: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  minor_damage:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  major_damage:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  write_off: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const actionLabels: Record<InspectionItemAction, string> = {
  return_to_stock: "Rientra in Stock",
  quarantine: "Quarantena",
  write_off: "Smaltimento",
};

interface ItemRowState {
  quantity_good: number;
  quantity_damaged: number;
  quantity_write_off: number;
  condition: ItemCondition | "";
  action: InspectionItemAction | "";
  damage_description: string;
  repair_estimate: string;
  saved: boolean;
}

function buildInitialRowState(
  item: RentalReturnInspectionItem,
): ItemRowState {
  return {
    quantity_good: item.quantity_good,
    quantity_damaged: item.quantity_damaged,
    quantity_write_off: item.quantity_write_off,
    condition: item.condition ?? "",
    action: item.action ?? "",
    damage_description: item.damage_description ?? "",
    repair_estimate:
      item.repair_estimate != null ? String(item.repair_estimate) : "",
    saved: item.condition !== null,
  };
}

function ItemRow({
  item,
  isEditable,
  ddtId,
}: {
  item: RentalReturnInspectionItem;
  isEditable: boolean;
  ddtId: number;
}) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<ItemRowState>(() =>
    buildInitialRowState(item),
  );

  const saveMutation = useMutation({
    mutationFn: (data: CompleteInspectionItemInput) =>
      inspectionsApi.completeItem(item.id, data),
    onSuccess: () => {
      setState((prev) => ({ ...prev, saved: true }));
      queryClient.invalidateQueries({ queryKey: ["inspection", ddtId] });
    },
  });

  const handleSave = () => {
    if (!state.condition || !state.action) return;
    const payload: CompleteInspectionItemInput = {
      condition: state.condition as ItemCondition,
      quantity_good: state.quantity_good,
      quantity_damaged: state.quantity_damaged,
      quantity_write_off: state.quantity_write_off,
      action: state.action as InspectionItemAction,
      warehouse_id: 1,
      damage_description: state.damage_description || null,
      repair_estimate:
        state.action === "quarantine" && state.repair_estimate
          ? parseFloat(state.repair_estimate)
          : null,
    };
    saveMutation.mutate(payload);
  };

  const showDamageFields =
    state.condition !== "" && state.condition !== "good";
  const showRepairEstimate = state.action === "quarantine";
  const canSave =
    state.condition !== "" &&
    state.action !== "" &&
    state.quantity_good + state.quantity_damaged + state.quantity_write_off ===
      item.total_quantity;

  if (!isEditable) {
    return (
      <TableRow>
        <TableCell>
          <div className="space-y-1">
            <p className="font-medium text-slate-900 dark:text-slate-100">
              {item.product_name}
            </p>
            <Badge
              variant="outline"
              className="font-mono text-xs text-slate-500 dark:text-slate-400"
            >
              {item.product_code}
            </Badge>
          </div>
        </TableCell>
        <TableCell className="text-center font-semibold text-slate-800 dark:text-slate-200">
          {item.total_quantity}
        </TableCell>
        <TableCell className="text-center text-green-700 dark:text-green-400 font-medium">
          {item.quantity_good}
        </TableCell>
        <TableCell className="text-center text-orange-700 dark:text-orange-400 font-medium">
          {item.quantity_damaged}
        </TableCell>
        <TableCell className="text-center text-red-700 dark:text-red-400 font-medium">
          {item.quantity_write_off}
        </TableCell>
        <TableCell>
          {item.condition && (
            <Badge className={conditionColors[item.condition]}>
              {conditionLabels[item.condition]}
            </Badge>
          )}
        </TableCell>
        <TableCell>
          {item.action && (
            <span className="text-sm text-slate-700 dark:text-slate-300">
              {actionLabels[item.action]}
            </span>
          )}
        </TableCell>
        <TableCell className="text-sm text-slate-600 dark:text-slate-400">
          {item.damage_description || "—"}
        </TableCell>
        <TableCell className="text-right text-sm text-slate-700 dark:text-slate-300">
          {item.repair_estimate != null ? (
            <span className="font-medium">
              € {item.repair_estimate.toFixed(2)}
            </span>
          ) : (
            "—"
          )}
        </TableCell>
        <TableCell>
          {item.condition !== null && (
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Salvato
            </Badge>
          )}
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell>
        <div className="space-y-1">
          <p className="font-medium text-slate-900 dark:text-slate-100">
            {item.product_name}
          </p>
          <Badge
            variant="outline"
            className="font-mono text-xs text-slate-500 dark:text-slate-400"
          >
            {item.product_code}
          </Badge>
        </div>
      </TableCell>
      <TableCell className="text-center font-semibold text-slate-800 dark:text-slate-200">
        {item.total_quantity}
      </TableCell>
      <TableCell>
        <Input
          type="text"
          inputMode="numeric"
          value={state.quantity_good}
          className="w-16 text-center"
          onChange={(e) => {
            const val = parseInt(e.target.value) || 0;
            setState((prev) => ({ ...prev, quantity_good: val, saved: false }));
          }}
        />
      </TableCell>
      <TableCell>
        <Input
          type="text"
          inputMode="numeric"
          value={state.quantity_damaged}
          className="w-16 text-center"
          onChange={(e) => {
            const val = parseInt(e.target.value) || 0;
            setState((prev) => ({
              ...prev,
              quantity_damaged: val,
              saved: false,
            }));
          }}
        />
      </TableCell>
      <TableCell>
        <Input
          type="text"
          inputMode="numeric"
          value={state.quantity_write_off}
          className="w-16 text-center"
          onChange={(e) => {
            const val = parseInt(e.target.value) || 0;
            setState((prev) => ({
              ...prev,
              quantity_write_off: val,
              saved: false,
            }));
          }}
        />
      </TableCell>
      <TableCell>
        <Select
          value={state.condition}
          onValueChange={(val) =>
            setState((prev) => ({
              ...prev,
              condition: val as ItemCondition,
              saved: false,
            }))
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Seleziona..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="good">Buono</SelectItem>
            <SelectItem value="minor_damage">Danni Lievi</SelectItem>
            <SelectItem value="major_damage">Danni Gravi</SelectItem>
            <SelectItem value="write_off">Irreparabile</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Select
          value={state.action}
          onValueChange={(val) =>
            setState((prev) => ({
              ...prev,
              action: val as InspectionItemAction,
              saved: false,
            }))
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Seleziona..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="return_to_stock">Rientra in Stock</SelectItem>
            <SelectItem value="quarantine">Quarantena</SelectItem>
            <SelectItem value="write_off">Smaltimento</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        {showDamageFields ? (
          <Input
            placeholder="Descrizione danno..."
            value={state.damage_description}
            className="w-48"
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                damage_description: e.target.value,
                saved: false,
              }))
            }
          />
        ) : (
          <span className="text-sm text-slate-400 dark:text-slate-600">—</span>
        )}
      </TableCell>
      <TableCell>
        {showRepairEstimate ? (
          <div className="relative w-28">
            <Euro className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={state.repair_estimate}
              className="pl-6 w-28"
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  repair_estimate: e.target.value,
                  saved: false,
                }))
              }
            />
          </div>
        ) : (
          <span className="text-sm text-slate-400 dark:text-slate-600">—</span>
        )}
      </TableCell>
      <TableCell>
        {state.saved ? (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <CheckSquare className="h-3 w-3 mr-1" />
            Salvato
          </Badge>
        ) : (
          <Button
            size="sm"
            variant="outline"
            disabled={!canSave || saveMutation.isPending}
            onClick={handleSave}
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1" />
            )}
            Salva
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

function InProgressView({
  inspection,
  ddtId,
}: {
  inspection: RentalReturnInspection;
  ddtId: number;
}) {
  const queryClient = useQueryClient();

  const finalizeMutation = useMutation({
    mutationFn: () => inspectionsApi.finalize(inspection.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspection", ddtId] });
    },
  });

  const allItemsHaveCondition = inspection.items.every(
    (item) => item.condition !== null,
  );

  return (
    <div className="space-y-4">
      <div className="rounded-md overflow-x-auto border border-slate-200 dark:border-slate-700">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800/50">
              <TableHead className="min-w-[160px]">Prodotto</TableHead>
              <TableHead className="text-center w-20">Qtà Totale</TableHead>
              <TableHead className="text-center w-20">Buone</TableHead>
              <TableHead className="text-center w-20">Danneggiate</TableHead>
              <TableHead className="text-center w-20">Fuori Uso</TableHead>
              <TableHead className="min-w-[160px]">Condizione</TableHead>
              <TableHead className="min-w-[176px]">Azione</TableHead>
              <TableHead className="min-w-[192px]">Descrizione Danno</TableHead>
              <TableHead className="min-w-[112px]">Stima Riparazione</TableHead>
              <TableHead className="w-24">Stato</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inspection.items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                isEditable={true}
                ddtId={ddtId}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {!allItemsHaveCondition && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          ⚠️ Tutti gli articoli devono essere ispezionati prima di poter
          finalizzare.
        </p>
      )}

      <div className="flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white"
              disabled={!allItemsHaveCondition || finalizeMutation.isPending}
            >
              {finalizeMutation.isPending ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-5 w-5 mr-2" />
              )}
              Finalizza Ispezione
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Conferma finalizzazione</AlertDialogTitle>
              <AlertDialogDescription>
                Stai per finalizzare l&apos;ispezione. Questa azione è
                irreversibile: i dati verranno consolidati e i movimenti di
                magazzino saranno generati automaticamente. Continuare?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => finalizeMutation.mutate()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Sì, finalizza
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function CompletedView({
  inspection,
  ddtId,
}: {
  inspection: RentalReturnInspection;
  ddtId: number;
}) {
  const totalGood = inspection.items.reduce(
    (sum, i) => sum + i.quantity_good,
    0,
  );
  const totalDamaged = inspection.items.reduce(
    (sum, i) => sum + i.quantity_damaged,
    0,
  );
  const totalWriteOff = inspection.items.reduce(
    (sum, i) => sum + i.quantity_write_off,
    0,
  );

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 p-4">
          <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">
            Buone
          </p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
            {totalGood}
          </p>
        </div>
        <div className="rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30 p-4">
          <p className="text-xs font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wide">
            Danneggiate
          </p>
          <p className="text-2xl font-bold text-orange-700 dark:text-orange-300 mt-1">
            {totalDamaged}
          </p>
        </div>
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4">
          <p className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide">
            Fuori Uso
          </p>
          <p className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">
            {totalWriteOff}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 p-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Valore Danni
          </p>
          <p className="text-2xl font-bold text-slate-700 dark:text-slate-200 mt-1">
            € {inspection.total_damage_value.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Read-only table */}
      <div className="rounded-md overflow-x-auto border border-slate-200 dark:border-slate-700">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800/50">
              <TableHead className="min-w-[160px]">Prodotto</TableHead>
              <TableHead className="text-center w-20">Qtà Totale</TableHead>
              <TableHead className="text-center w-20">Buone</TableHead>
              <TableHead className="text-center w-20">Danneggiate</TableHead>
              <TableHead className="text-center w-20">Fuori Uso</TableHead>
              <TableHead className="min-w-[160px]">Condizione</TableHead>
              <TableHead className="min-w-[160px]">Azione</TableHead>
              <TableHead className="min-w-[192px]">Descrizione Danno</TableHead>
              <TableHead className="text-right min-w-[112px]">
                Stima Riparazione
              </TableHead>
              <TableHead className="w-24">Stato</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inspection.items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                isEditable={false}
                ddtId={ddtId}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {inspection.overall_notes && (
        <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 p-4">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            Note generali
          </p>
          <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap">
            {inspection.overall_notes}
          </p>
        </div>
      )}
    </div>
  );
}

export function RentalReturnInspection({
  ddtId,
  projectId,
}: RentalReturnInspectionProps) {
  const queryClient = useQueryClient();

  const {
    data: inspection,
    isLoading,
    isError,
    error,
  } = useQuery<RentalReturnInspection | null>({
    queryKey: ["inspection", ddtId],
    queryFn: async () => {
      try {
        return await inspectionsApi.getByDdt(ddtId);
      } catch (err: unknown) {
        // 404 means no inspection yet
        if (
          err &&
          typeof err === "object" &&
          "response" in err &&
          (err as { response?: { status?: number } }).response?.status === 404
        ) {
          return null;
        }
        throw err;
      }
    },
    retry: false,
  });

  const startMutation = useMutation({
    mutationFn: () => inspectionsApi.start(ddtId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspection", ddtId] });
    },
  });

  return (
    <Card className="border-2 border-cyan-200 dark:border-cyan-800 bg-cyan-50/30 dark:bg-cyan-950/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {inspection?.status === "completed" ? (
              <ClipboardCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <ClipboardList className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            )}
            <CardTitle className="text-slate-900 dark:text-slate-100">
              Ispezione Rientro Noleggio
            </CardTitle>
          </div>
          {inspection?.status && (
            <Badge
              className={
                inspection.status === "completed"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400"
              }
            >
              {inspection.status === "completed"
                ? "Completata"
                : "In Corso"}
            </Badge>
          )}
        </div>
        <CardDescription className="text-slate-600 dark:text-slate-400">
          {inspection?.status === "completed"
            ? `Ispezione finalizzata il ${new Date(inspection.inspection_date).toLocaleDateString("it-IT")}`
            : inspection?.status === "in_progress"
              ? "Verifica lo stato di ogni articolo rientrato e salva i dati riga per riga."
              : "Avvia l'ispezione per verificare le condizioni del materiale rientrato dal noleggio."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Caricamento ispezione...</span>
          </div>
        )}

        {isError && (
          <div className="text-sm text-red-600 dark:text-red-400">
            Errore nel caricamento dell&apos;ispezione:{" "}
            {(error as Error)?.message}
          </div>
        )}

        {!isLoading && !isError && inspection === null && (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Nessuna ispezione ancora avviata per questo DDT. Clicca il pulsante
              per iniziare la verifica degli articoli rientrati.
            </p>
            <Button
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
              className="bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-700 dark:hover:bg-cyan-600 text-white"
            >
              {startMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ClipboardList className="h-4 w-4 mr-2" />
              )}
              Avvia Ispezione
            </Button>
          </div>
        )}

        {!isLoading && !isError && inspection?.status === "in_progress" && (
          <InProgressView inspection={inspection} ddtId={ddtId} />
        )}

        {!isLoading && !isError && inspection?.status === "completed" && (
          <CompletedView inspection={inspection} ddtId={ddtId} />
        )}
      </CardContent>
    </Card>
  );
}

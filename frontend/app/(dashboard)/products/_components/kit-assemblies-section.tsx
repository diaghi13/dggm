"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { kitAssembliesApi } from "@/lib/api/kit-assemblies";
import { productsApi } from "@/lib/api/products";
import { warehousesApi } from "@/lib/api/warehouses";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ComboboxSelect } from "@/components/combobox-select";
import {
  Plus,
  Trash2,
  Eye,
  Wrench,
  Boxes,
  ChevronRight,
  Pencil,
  ScanLine,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { BarcodeScanner } from "@/components/barcode-scanner";

interface KitAssembliesSectionProps {
  product: App.Data.ProductData;
}

// ---- Status helpers --------------------------------------------------------

const STATUS_LABELS: Record<App.Enums.KitAssemblyStatus, string> = {
  assembled: "Assemblato",
  in_use: "In Uso",
  returned: "Rientrato",
  disassembled: "Smontato",
};

const STATUS_COLORS: Record<App.Enums.KitAssemblyStatus, string> = {
  assembled:
    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  in_use: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  returned:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  disassembled:
    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

// Next logical status for quick-transition button
const NEXT_STATUS: Partial<
  Record<App.Enums.KitAssemblyStatus, App.Enums.KitAssemblyStatus>
> = {
  assembled: "in_use",
  in_use: "returned",
};

const NEXT_STATUS_LABELS: Partial<Record<App.Enums.KitAssemblyStatus, string>> =
  {
    assembled: "Segna In Uso",
    in_use: "Segna Rientrato",
  };

// ---- Item row for the create form ------------------------------------------

interface AssemblyItemRow {
  _key: number;
  product_id: number | null;
  quantity: string;
  serial_number: string;
  notes: string;
}

const makeItemRow = (key: number): AssemblyItemRow => ({
  _key: key,
  product_id: null,
  quantity: "1",
  serial_number: "",
  notes: "",
});

// ---- Main component --------------------------------------------------------

export function KitAssembliesSection({ product }: KitAssembliesSectionProps) {
  const queryClient = useQueryClient();

  // Dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [viewingAssembly, setViewingAssembly] =
    useState<App.Data.KitAssemblyData | null>(null);
  const [editingAssembly, setEditingAssembly] =
    useState<App.Data.KitAssemblyData | null>(null);
  const [disassemblingAssembly, setDisassemblingAssembly] =
    useState<App.Data.KitAssemblyData | null>(null);
  const [deletingAssemblyId, setDeletingAssemblyId] = useState<number | null>(
    null,
  );

  // Create form state
  const [createName, setCreateName] = useState("");
  const [createLocation, setCreateLocation] = useState("");
  const [createNotes, setCreateNotes] = useState("");
  const [createWarehouseId, setCreateWarehouseId] = useState<string>("");
  const [itemRows, setItemRows] = useState<AssemblyItemRow[]>([makeItemRow(0)]);
  const [itemKeyCounter, setItemKeyCounter] = useState(1);
  const [itemSearches, setItemSearches] = useState<Record<number, string>>({});

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editWarehouseId, setEditWarehouseId] = useState<string>("");

  // Edit items state (search is handled locally by ComboboxSelect)
  const [newItemProductId, setNewItemProductId] = useState<number | null>(null);
  const [newItemQuantity, setNewItemQuantity] = useState("1");
  const [newItemSerial, setNewItemSerial] = useState("");
  const [removingItemId, setRemovingItemId] = useState<number | null>(null);

  // Inline editing state for existing items
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingItemSerial, setEditingItemSerial] = useState("");
  const [editingItemQuantity, setEditingItemQuantity] = useState("");
  const [savingItemId, setSavingItemId] = useState<number | null>(null);

  // Barcode scanner state
  const [scannerOpenForNewItem, setScannerOpenForNewItem] = useState(false);
  const [scannerOpenForItemId, setScannerOpenForItemId] = useState<number | null>(null);
  const [scannerOpenForCreateRowKey, setScannerOpenForCreateRowKey] = useState<number | null>(null);

  // Disassemble form state
  const [disassembleWarehouseId, setDisassembleWarehouseId] =
    useState<string>("");

  const isAssembledKitType = product.kit_type === "assembled";

  // ---- Queries --------------------------------------------------------------

  const { data: assembliesData, isLoading } = useQuery({
    queryKey: ["kit-assemblies", product.id],
    queryFn: () => kitAssembliesApi.getByProduct(product.id ?? 0),
  });

  const assemblies: App.Data.KitAssemblyData[] = assembliesData?.data ?? [];

  const { data: warehousesData } = useQuery({
    queryKey: ["warehouses", { is_active: true }],
    queryFn: () => warehousesApi.getAll({ is_active: true, per_page: 100 }),
    enabled: isAssembledKitType,
  });

  const warehouses: App.Data.WarehouseData[] = warehousesData?.data ?? [];

  // Per-item product searches
  const productSearchValues = Object.values(itemSearches);
  const searchKey = productSearchValues.join(",");
  const { data: productsSearchData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products", { search: "", is_active: true, per_page: 50 }],
    queryFn: () =>
      productsApi.getAll({ is_active: true, per_page: 50, search: "" }),
  });

  const { data: componentOptionsData } = useQuery({
    queryKey: ["products-for-kit-items", searchKey],
    queryFn: () =>
      productsApi.getAll({
        is_active: true,
        per_page: 50,
        search: "",
      }),
    placeholderData: productsSearchData,
  });

  const componentOptions = (componentOptionsData?.data ?? []).map(
    (p: App.Data.ProductData) => ({
      label: `${p.code} - ${p.name}`,
      value: String(p.id ?? ""),
    }),
  );

  // ---- Mutations ------------------------------------------------------------

  const createMutation = useMutation({
    mutationFn: () =>
      kitAssembliesApi.create(product.id ?? 0, {
        name: createName,
        location: createLocation || null,
        notes: createNotes || null,
        warehouse_id: createWarehouseId
          ? Number(createWarehouseId)
          : undefined,
        items: itemRows
          .filter((row) => row.product_id !== null)
          .map((row) => ({
            product_id: row.product_id as number,
            quantity: Number(row.quantity),
            serial_number: row.serial_number || null,
            notes: row.notes || null,
          })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["kit-assemblies", product.id],
      });
      setShowCreateDialog(false);
      resetCreateForm();
      toast.success("Assembly creata", {
        description: "La nuova assembly è stata creata con successo",
      });
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message || "Impossibile creare l'assembly",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number;
      status: App.Enums.KitAssemblyStatus;
    }) => kitAssembliesApi.update(id, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["kit-assemblies", product.id],
      });
      // Keep dialog open with updated status
      setViewingAssembly((prev) =>
        prev ? { ...prev, status: variables.status } : prev,
      );
      toast.success("Stato aggiornato");
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message || "Impossibile aggiornare lo stato",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; location: string | null; notes: string | null; warehouse_id: number | null } }) =>
      kitAssembliesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["kit-assemblies", product.id],
      });
      setEditingAssembly(null);
      toast.success("Assembly aggiornata", {
        description: "Le modifiche sono state salvate con successo",
      });
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message || "Impossibile aggiornare l'assembly",
      });
    },
  });

  const disassembleMutation = useMutation({
    mutationFn: (assemblyId: number) =>
      kitAssembliesApi.disassemble(assemblyId, {
        warehouse_id: disassembleWarehouseId
          ? Number(disassembleWarehouseId)
          : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["kit-assemblies", product.id],
      });
      setDisassemblingAssembly(null);
      setDisassembleWarehouseId("");
      toast.success("Assembly smontata", {
        description: "I componenti sono stati restituiti al magazzino",
      });
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message || "Impossibile smontare l'assembly",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => kitAssembliesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["kit-assemblies", product.id],
      });
      setDeletingAssemblyId(null);
      toast.success("Assembly eliminata");
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message || "Impossibile eliminare l'assembly",
      });
    },
  });

  const addItemMutation = useMutation({
    mutationFn: ({
      assemblyId,
      item,
    }: {
      assemblyId: number;
      item: { product_id: number; quantity: number; serial_number: string | null };
    }) => kitAssembliesApi.addItem(assemblyId, item),
    onSuccess: (updatedAssembly) => {
      queryClient.invalidateQueries({ queryKey: ["kit-assemblies", product.id] });
      // Update local editingAssembly items from the returned assembly
      setEditingAssembly((prev) =>
        prev
          ? {
              ...prev,
              items: (updatedAssembly as unknown as App.Data.KitAssemblyData).items ?? prev.items,
            }
          : prev,
      );
      setNewItemProductId(null);
      setNewItemQuantity("1");
      setNewItemSerial("");
      toast.success("Componente aggiunto");
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message || "Impossibile aggiungere il componente",
      });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({
      assemblyId,
      itemId,
      data,
    }: {
      assemblyId: number;
      itemId: number;
      data: { quantity?: number; serial_number?: string | null };
    }) => kitAssembliesApi.updateItem(assemblyId, itemId, data),
    onSuccess: (updatedAssembly) => {
      queryClient.invalidateQueries({ queryKey: ["kit-assemblies", product.id] });
      setEditingAssembly((prev) =>
        prev
          ? {
              ...prev,
              items: (updatedAssembly as unknown as App.Data.KitAssemblyData).items ?? prev.items,
            }
          : prev,
      );
      setEditingItemId(null);
      setSavingItemId(null);
      toast.success("Componente aggiornato");
    },
    onError: (error: Error) => {
      setSavingItemId(null);
      toast.error("Errore", {
        description: error.message || "Impossibile aggiornare il componente",
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: ({
      assemblyId,
      itemId,
    }: {
      assemblyId: number;
      itemId: number;
    }) => kitAssembliesApi.removeItem(assemblyId, itemId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["kit-assemblies", product.id] });
      setEditingAssembly((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: (prev.items ?? []).filter((i) => i.id !== variables.itemId),
        };
      });
      setRemovingItemId(null);
      toast.success("Componente rimosso");
    },
    onError: (error: Error) => {
      setRemovingItemId(null);
      toast.error("Errore", {
        description: error.message || "Impossibile rimuovere il componente",
      });
    },
  });

  // ---- Helpers --------------------------------------------------------------

  const resetCreateForm = () => {
    setCreateName("");
    setCreateLocation("");
    setCreateNotes("");
    setCreateWarehouseId("");
    setItemRows([makeItemRow(0)]);
    setItemKeyCounter(1);
    setItemSearches({});
  };

  const addItemRow = () => {
    setItemRows((prev) => [...prev, makeItemRow(itemKeyCounter)]);
    setItemKeyCounter((c) => c + 1);
  };

  const removeItemRow = (key: number) => {
    setItemRows((prev) => prev.filter((r) => r._key !== key));
    setItemSearches((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const updateItemRow = (
    key: number,
    field: keyof Omit<AssemblyItemRow, "_key">,
    value: string | number | null,
  ) => {
    setItemRows((prev) =>
      prev.map((r) => (r._key === key ? { ...r, [field]: value } : r)),
    );
  };

  const isCreateValid =
    createName.trim().length > 0 &&
    itemRows.every(
      (r) => r.product_id !== null && Number(r.quantity) > 0,
    );

  const startEditingItem = (item: App.Data.KitAssemblyItemData) => {
    setEditingItemId(item.id as number);
    setEditingItemSerial(item.serial_number ?? "");
    setEditingItemQuantity(String(item.quantity));
  };

  const cancelEditingItem = () => {
    setEditingItemId(null);
    setEditingItemSerial("");
    setEditingItemQuantity("");
  };

  const saveEditingItem = () => {
    if (!editingAssembly?.id || !editingItemId) return;
    setSavingItemId(editingItemId);
    updateItemMutation.mutate({
      assemblyId: editingAssembly.id as number,
      itemId: editingItemId,
      data: {
        quantity: Number(editingItemQuantity),
        serial_number: editingItemSerial || null,
      },
    });
  };

  // ---- Render ---------------------------------------------------------------

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Caricamento assemblies...
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Kit Assemblies</CardTitle>
              <CardDescription>
                Istanze fisiche assemblate di questo kit ({assemblies.length}{" "}
                {assemblies.length === 1 ? "assembly" : "assemblies"})
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuova Assembly
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {assemblies.length === 0 ? (
            <div className="py-12 text-center">
              <Boxes className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                Nessuna assembly
              </h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Crea la prima istanza fisica assemblata di questo kit
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-slate-200 dark:border-slate-700">
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-slate-700">
                    <TableHead className="text-slate-700 dark:text-slate-300">
                      Nome
                    </TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">
                      Magazzino
                    </TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">
                      Posizione
                    </TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">
                      Assemblato il
                    </TableHead>
                    <TableHead className="text-right text-slate-700 dark:text-slate-300">
                      Componenti
                    </TableHead>
                    <TableHead className="text-right text-slate-700 dark:text-slate-300">
                      Azioni
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assemblies.map((assembly) => {
                    const canDisassemble =
                      assembly.status === "assembled" ||
                      assembly.status === "in_use";
                    const canDelete = assembly.status === "disassembled";

                    return (
                      <TableRow
                        key={assembly.id}
                        className="dark:border-slate-700"
                      >
                        <TableCell>
                          <button
                            className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                            onClick={() => setViewingAssembly(assembly)}
                          >
                            {assembly.name}
                          </button>
                          <div className="mt-1">
                            <Badge
                              className={
                                STATUS_COLORS[
                                  assembly.status as App.Enums.KitAssemblyStatus
                                ] ?? ""
                              }
                            >
                              {STATUS_LABELS[
                                assembly.status as App.Enums.KitAssemblyStatus
                              ] ?? assembly.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">
                          {assembly.warehouse?.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">
                          {assembly.location ?? "—"}
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">
                          {assembly.assembled_at
                            ? new Date(assembly.assembled_at).toLocaleDateString(
                                "it-IT",
                              )
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right text-slate-600 dark:text-slate-400">
                          {assembly.items?.length ?? 0}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {assembly.status !== "disassembled" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Modifica"
                                onClick={() => {
                                  setEditingAssembly(assembly);
                                  setEditName(assembly.name);
                                  setEditLocation(assembly.location ?? "");
                                  setEditNotes(assembly.notes ?? "");
                                  setEditWarehouseId(
                                    assembly.warehouse_id
                                      ? String(assembly.warehouse_id)
                                      : "",
                                  );
                                }}
                              >
                                <Pencil className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                              </Button>
                            )}

                            {canDisassemble && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Smonta"
                                className="text-amber-600 hover:text-amber-700 dark:text-amber-400"
                                onClick={() => {
                                  setDisassemblingAssembly(assembly);
                                  setDisassembleWarehouseId("");
                                }}
                              >
                                <Wrench className="h-4 w-4" />
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="icon"
                              title="Dettagli"
                              onClick={() => setViewingAssembly(assembly)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Elimina"
                                className="text-destructive hover:text-destructive"
                                onClick={() =>
                                  setDeletingAssemblyId(assembly.id as number)
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---- Create Assembly Dialog ---------------------------------------- */}
      <Dialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            resetCreateForm();
            setScannerOpenForCreateRowKey(null);
          }
        }}
      >
        <DialogContent className="flex flex-col border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 sm:max-w-2xl max-h-[90vh] p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
            <DialogTitle className="text-slate-900 dark:text-slate-100">
              Nuova Assembly
            </DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              Crea una nuova istanza fisica assemblata del kit{" "}
              <strong>{product.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Name + Location */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-slate-100">
                  Nome assembly <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Es. Kit Audio #001"
                  className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-slate-100">
                  Posizione / Ubicazione
                </Label>
                <Input
                  value={createLocation}
                  onChange={(e) => setCreateLocation(e.target.value)}
                  placeholder="Es. Cantiere Roma, Furgone A..."
                  className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Warehouse selector — only for assembled kit type */}
            {isAssembledKitType && (
              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-slate-100">
                  Magazzino di provenienza
                </Label>
                <Select
                  value={createWarehouseId}
                  onValueChange={setCreateWarehouseId}
                >
                  <SelectTrigger className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                    <SelectValue placeholder="Seleziona magazzino..." />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-900">
                    {warehouses.map((w) => (
                      <SelectItem
                        key={w.id}
                        value={String(w.id)}
                        className="dark:text-slate-100"
                      >
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-slate-900 dark:text-slate-100">Note</Label>
              <Textarea
                value={createNotes}
                onChange={(e) => setCreateNotes(e.target.value)}
                placeholder="Note opzionali sull'assembly..."
                rows={2}
                className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-slate-900 dark:text-slate-100">
                  Componenti inclusi{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItemRow}
                  className="border-slate-200 dark:border-slate-700 dark:text-slate-100"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Aggiungi riga
                </Button>
              </div>

              <div className="rounded-md border border-slate-200 dark:border-slate-700">
                <Table>
                  <TableHeader>
                    <TableRow className="dark:border-slate-700">
                      <TableHead className="text-xs text-slate-600 dark:text-slate-400">
                        Prodotto
                      </TableHead>
                      <TableHead className="w-24 text-xs text-slate-600 dark:text-slate-400">
                        Qtà
                      </TableHead>
                      <TableHead className="text-xs text-slate-600 dark:text-slate-400">
                        Seriale
                      </TableHead>
                      <TableHead className="w-8" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itemRows.map((row) => (
                      <TableRow key={row._key} className="dark:border-slate-700">
                        <TableCell>
                          <ComboboxSelect
                            value={
                              row.product_id ? String(row.product_id) : ""
                            }
                            onValueChange={(val) =>
                              updateItemRow(
                                row._key,
                                "product_id",
                                val ? Number(val) : null,
                              )
                            }
                            onSearchChange={(s) =>
                              setItemSearches((prev) => ({
                                ...prev,
                                [row._key]: s,
                              }))
                            }
                            placeholder="Cerca prodotto..."
                            emptyText="Nessun prodotto trovato"
                            loading={isLoadingProducts}
                            options={componentOptions}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={row.quantity}
                              onChange={(e) =>
                                updateItemRow(row._key, "quantity", e.target.value)
                              }
                              disabled={row.serial_number.trim() !== ""}
                              className="h-8 border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-60"
                            />
                            {row.serial_number.trim() !== "" && (
                              <p className="text-xs text-slate-400 dark:text-slate-500">
                                Seriale inserito → qty forzata a 1
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Input
                              value={row.serial_number}
                              onChange={(e) => {
                                const serial = e.target.value;
                                updateItemRow(row._key, "serial_number", serial);
                                if (serial.trim() !== "") {
                                  updateItemRow(row._key, "quantity", "1");
                                }
                              }}
                              placeholder="Seriale (opz.)"
                              className="h-8 border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              title="Scansiona barcode"
                              className="h-8 w-8 shrink-0"
                              onClick={() => setScannerOpenForCreateRowKey(row._key)}
                            >
                              <ScanLine className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          {itemRows.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => removeItemRow(row._key)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          {/* Barcode scanner for create form rows */}
          <BarcodeScanner
            open={scannerOpenForCreateRowKey !== null}
            onOpenChange={(open) => { if (!open) setScannerOpenForCreateRowKey(null); }}
            onScan={(code) => {
              if (scannerOpenForCreateRowKey !== null) {
                updateItemRow(scannerOpenForCreateRowKey, "serial_number", code);
                if (code.trim() !== "") {
                  updateItemRow(scannerOpenForCreateRowKey, "quantity", "1");
                }
              }
              setScannerOpenForCreateRowKey(null);
            }}
            title="Scansiona seriale"
            description="Posiziona il barcode/QR code del seriale davanti alla fotocamera"
          />
          </div>

          <DialogFooter className="px-6 pb-6 pt-4 shrink-0 border-t border-border">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                resetCreateForm();
              }}
              className="border-slate-200 dark:border-slate-700 dark:text-slate-100"
            >
              Annulla
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!isCreateValid || createMutation.isPending}
            >
              {createMutation.isPending ? "Creazione..." : "Crea Assembly"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- View Details Dialog ------------------------------------------- */}
      <Dialog
        open={!!viewingAssembly}
        onOpenChange={(open) => {
          if (!open) {
            setViewingAssembly(null);
          }
        }}
      >
        <DialogContent className="flex flex-col border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 sm:max-w-lg max-h-[90vh] p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
            <DialogTitle className="text-slate-900 dark:text-slate-100">
              {viewingAssembly?.name}
            </DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              Dettagli assembly e componenti
            </DialogDescription>
          </DialogHeader>

          {viewingAssembly && (
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Meta info */}
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/50">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Stato
                  </p>
                  <Badge
                    className={
                      STATUS_COLORS[
                        viewingAssembly.status as App.Enums.KitAssemblyStatus
                      ] ?? ""
                    }
                  >
                    {STATUS_LABELS[
                      viewingAssembly.status as App.Enums.KitAssemblyStatus
                    ] ?? viewingAssembly.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Magazzino
                  </p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {viewingAssembly.warehouse?.name ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Posizione
                  </p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {viewingAssembly.location ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Assemblato il
                  </p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {viewingAssembly.assembled_at
                      ? new Date(viewingAssembly.assembled_at).toLocaleDateString(
                          "it-IT",
                        )
                      : "—"}
                  </p>
                </div>
                {viewingAssembly.disassembled_at && (
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Smontato il
                    </p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {new Date(
                        viewingAssembly.disassembled_at,
                      ).toLocaleDateString("it-IT")}
                    </p>
                  </div>
                )}
              </div>

              {viewingAssembly.notes && (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {viewingAssembly.notes}
                </p>
              )}

              {/* Items table */}
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Componenti ({viewingAssembly.items?.length ?? 0})
                </p>
                {viewingAssembly.items && viewingAssembly.items.length > 0 ? (
                  <div className="rounded-md border border-slate-200 dark:border-slate-700">
                    <Table>
                      <TableHeader>
                        <TableRow className="dark:border-slate-700">
                          <TableHead className="text-xs dark:text-slate-400">
                            Prodotto
                          </TableHead>
                          <TableHead className="text-right text-xs dark:text-slate-400">
                            Qtà
                          </TableHead>
                          <TableHead className="text-xs dark:text-slate-400">
                            Seriale
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewingAssembly.items.map((item) => (
                          <TableRow
                            key={item.id}
                            className="dark:border-slate-700"
                          >
                            <TableCell className="text-sm text-slate-900 dark:text-slate-100">
                              {item.product
                                ? `${item.product.code} - ${item.product.name}`
                                : `Prodotto #${item.product_id}`}
                            </TableCell>
                            <TableCell className="text-right text-sm text-slate-600 dark:text-slate-400">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">
                              {item.serial_number ?? "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Nessun componente registrato.
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex-wrap gap-2 px-6 pb-6 pt-4 shrink-0 border-t border-border">
            {viewingAssembly &&
              NEXT_STATUS[
                viewingAssembly.status as App.Enums.KitAssemblyStatus
              ] && (
                <Button
                  variant="outline"
                  disabled={updateStatusMutation.isPending}
                  className="border-slate-200 dark:border-slate-700 dark:text-slate-100"
                  onClick={() => {
                    const nextStatus =
                      NEXT_STATUS[
                        viewingAssembly.status as App.Enums.KitAssemblyStatus
                      ];
                    if (nextStatus) {
                      updateStatusMutation.mutate({
                        id: viewingAssembly.id as number,
                        status: nextStatus,
                      });
                    }
                  }}
                >
                  <ChevronRight className="mr-1 h-4 w-4" />
                  {NEXT_STATUS_LABELS[
                    viewingAssembly.status as App.Enums.KitAssemblyStatus
                  ]}
                </Button>
              )}
            <Button
              variant="outline"
              onClick={() => setViewingAssembly(null)}
              className="border-slate-200 dark:border-slate-700 dark:text-slate-100"
            >
              Chiudi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Edit Assembly Dialog ------------------------------------------ */}
      <Dialog
        open={!!editingAssembly}
        onOpenChange={(open) => {
          if (!open) {
            setEditingAssembly(null);
            setNewItemProductId(null);
            setNewItemQuantity("1");
            setNewItemSerial("");
            setRemovingItemId(null);
            setEditingItemId(null);
            setEditingItemSerial("");
            setEditingItemQuantity("");
            setScannerOpenForNewItem(false);
            setScannerOpenForItemId(null);
          }
        }}
      >
        <DialogContent className="flex flex-col border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 sm:max-w-2xl max-h-[90vh] p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
            <DialogTitle className="text-slate-900 dark:text-slate-100">
              Modifica Assembly
            </DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              Modifica i dati dell&apos;assembly{" "}
              <strong>{editingAssembly?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label className="text-slate-900 dark:text-slate-100">
                Nome assembly <span className="text-red-500">*</span>
              </Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Es. Kit Audio #001"
                className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Warehouse selector */}
            <div className="space-y-2">
              <Label className="text-slate-900 dark:text-slate-100">
                Magazzino
              </Label>
              <Select
                value={editWarehouseId || "none"}
                onValueChange={(v) =>
                  setEditWarehouseId(v === "none" ? "" : v)
                }
              >
                <SelectTrigger className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                  <SelectValue placeholder="Seleziona magazzino..." />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900">
                  <SelectItem value="none" className="dark:text-slate-100">
                    Nessun magazzino
                  </SelectItem>
                  {warehouses.map((w) => (
                    <SelectItem
                      key={w.id}
                      value={String(w.id)}
                      className="dark:text-slate-100"
                    >
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label className="text-slate-900 dark:text-slate-100">
                Posizione / Ubicazione
              </Label>
              <Input
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                placeholder="Es. Cantiere Roma, Furgone A..."
                className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-slate-900 dark:text-slate-100">Note</Label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Note opzionali sull'assembly..."
                rows={2}
                className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Components */}
            <div className="space-y-2">
              <Label className="text-slate-900 dark:text-slate-100">
                Componenti inclusi
              </Label>

              {/* Existing items */}
              {editingAssembly?.items && editingAssembly.items.length > 0 ? (
                <div className="rounded-md border border-slate-200 dark:border-slate-700">
                  <Table>
                    <TableHeader>
                      <TableRow className="dark:border-slate-700">
                        <TableHead className="text-xs text-slate-600 dark:text-slate-400">
                          Prodotto
                        </TableHead>
                        <TableHead className="w-24 text-xs text-slate-600 dark:text-slate-400">
                          Qtà
                        </TableHead>
                        <TableHead className="text-xs text-slate-600 dark:text-slate-400">
                          Seriale
                        </TableHead>
                        <TableHead className="w-20" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {editingAssembly.items.map((item) => {
                        const isEditing = editingItemId === (item.id as number);
                        const isSaving = savingItemId === (item.id as number);
                        return (
                          <TableRow key={item.id} className="dark:border-slate-700">
                            <TableCell className="text-sm text-slate-900 dark:text-slate-100">
                              {item.product
                                ? `${item.product.code} - ${item.product.name}`
                                : `Prodotto #${item.product_id}`}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <div className="space-y-1">
                                  <Input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={editingItemQuantity}
                                    onChange={(e) => setEditingItemQuantity(e.target.value)}
                                    disabled={editingItemSerial.trim() !== ""}
                                    className="h-7 w-20 border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-60"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") saveEditingItem();
                                      if (e.key === "Escape") cancelEditingItem();
                                    }}
                                  />
                                  {editingItemSerial.trim() !== "" && (
                                    <p className="text-xs text-slate-400 dark:text-slate-500">
                                      Seriale inserito → qty forzata a 1
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                  {item.quantity}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <div className="flex items-center gap-1">
                                  <Input
                                    value={editingItemSerial}
                                    onChange={(e) => {
                                      setEditingItemSerial(e.target.value);
                                      if (e.target.value.trim() !== "") setEditingItemQuantity("1");
                                    }}
                                    placeholder="Seriale..."
                                    className="h-7 border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") saveEditingItem();
                                      if (e.key === "Escape") cancelEditingItem();
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    title="Scansiona barcode"
                                    className="h-7 w-7 shrink-0"
                                    onClick={() => setScannerOpenForItemId(item.id as number)}
                                  >
                                    <ScanLine className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  title="Clicca per modificare"
                                  className="flex items-center gap-1 group"
                                  onClick={() => startEditingItem(item)}
                                >
                                  <span className="font-mono text-xs text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200">
                                    {item.serial_number ?? "—"}
                                  </span>
                                  <Pencil className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 dark:text-slate-600" />
                                </button>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-1">
                                {isEditing ? (
                                  <>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      disabled={isSaving}
                                      title="Salva"
                                      className="h-7 w-7 text-green-600 hover:text-green-700 dark:text-green-400"
                                      onClick={saveEditingItem}
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      disabled={isSaving}
                                      title="Annulla"
                                      className="h-7 w-7 text-slate-500 hover:text-slate-700 dark:text-slate-400"
                                      onClick={cancelEditingItem}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      title="Modifica seriale/quantità"
                                      className="h-7 w-7 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                      onClick={() => startEditingItem(item)}
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      disabled={removingItemId === item.id || removeItemMutation.isPending}
                                      title="Rimuovi componente"
                                      className="text-destructive hover:text-destructive"
                                      onClick={() => {
                                        if (editingAssembly?.id && item.id) {
                                          setRemovingItemId(item.id as number);
                                          removeItemMutation.mutate({
                                            assemblyId: editingAssembly.id as number,
                                            itemId: item.id as number,
                                          });
                                        }
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Nessun componente. Aggiungine uno qui sotto.
                </p>
              )}

              {/* Barcode scanner for inline item editing */}
              <BarcodeScanner
                open={scannerOpenForItemId !== null}
                onOpenChange={(open) => { if (!open) setScannerOpenForItemId(null); }}
                onScan={(code) => {
                  setEditingItemSerial(code);
                  if (code.trim() !== "") setEditingItemQuantity("1");
                  setScannerOpenForItemId(null);
                }}
                title="Scansiona seriale"
                description="Posiziona il barcode/QR code del seriale davanti alla fotocamera"
              />

              {/* Add new item row */}
              <div className="rounded-md border border-slate-200 p-3 dark:border-slate-700">
                <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                  Aggiungi componente
                </p>
                <div className="space-y-2">
                  {/* Row 1: Product + Scanner */}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <ComboboxSelect
                        value={newItemProductId ? String(newItemProductId) : ""}
                        onValueChange={(val) =>
                          setNewItemProductId(val ? Number(val) : null)
                        }
                        placeholder="Cerca prodotto..."
                        emptyText="Nessun prodotto trovato"
                        loading={isLoadingProducts}
                        options={componentOptions}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      title="Scansiona barcode seriale"
                      className="h-9 w-9 shrink-0"
                      onClick={() => setScannerOpenForNewItem(true)}
                    >
                      <ScanLine className="h-4 w-4" />
                    </Button>
                  </div>
                  {/* Row 2: Quantity + Serial + Add */}
                  <div className="flex gap-2">
                    <div className="space-y-1">
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={newItemQuantity}
                        onChange={(e) => setNewItemQuantity(e.target.value)}
                        placeholder="Qtà"
                        disabled={newItemSerial.trim() !== ""}
                        className="w-20 border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-60"
                      />
                      {newItemSerial.trim() !== "" && (
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          Seriale inserito → qty forzata a 1
                        </p>
                      )}
                    </div>
                    <Input
                      value={newItemSerial}
                      onChange={(e) => {
                        setNewItemSerial(e.target.value);
                        if (e.target.value.trim() !== "") setNewItemQuantity("1");
                      }}
                      placeholder="Seriale (opz.)"
                      className="flex-1 border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={
                        !newItemProductId ||
                        Number(newItemQuantity) <= 0 ||
                        addItemMutation.isPending
                      }
                      title="Aggiungi componente"
                      onClick={() => {
                        if (editingAssembly?.id && newItemProductId) {
                          addItemMutation.mutate({
                            assemblyId: editingAssembly.id as number,
                            item: {
                              product_id: newItemProductId,
                              quantity: Number(newItemQuantity),
                              serial_number: newItemSerial || null,
                            },
                          });
                        }
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Barcode scanner for new item serial */}
                <BarcodeScanner
                  open={scannerOpenForNewItem}
                  onOpenChange={setScannerOpenForNewItem}
                  onScan={(code) => {
                    setNewItemSerial(code);
                    if (code.trim() !== "") setNewItemQuantity("1");
                    setScannerOpenForNewItem(false);
                  }}
                  title="Scansiona seriale"
                  description="Posiziona il barcode/QR code del seriale davanti alla fotocamera"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 pb-6 pt-4 shrink-0 border-t border-border">
            <Button
              variant="outline"
              onClick={() => {
                setEditingAssembly(null);
                setNewItemProductId(null);
                setNewItemQuantity("1");
                setNewItemSerial("");
                setRemovingItemId(null);
              }}
              className="border-slate-200 dark:border-slate-700 dark:text-slate-100"
            >
              Annulla
            </Button>
            <Button
              onClick={() => {
                if (editingAssembly?.id) {
                  updateMutation.mutate({
                    id: editingAssembly.id as number,
                    data: {
                      name: editName,
                      location: editLocation || null,
                      notes: editNotes || null,
                      warehouse_id: editWarehouseId
                        ? Number(editWarehouseId)
                        : null,
                    },
                  });
                }
              }}
              disabled={!editName.trim() || updateMutation.isPending}
            >
              {updateMutation.isPending ? "Salvataggio..." : "Salva modifiche"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Disassemble Dialog -------------------------------------------- */}
      <Dialog
        open={!!disassemblingAssembly}
        onOpenChange={(open) => {
          if (!open) {
            setDisassemblingAssembly(null);
            setDisassembleWarehouseId("");
          }
        }}
      >
        <DialogContent className="flex flex-col border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 sm:max-w-md max-h-[90vh] p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
            <DialogTitle className="text-slate-900 dark:text-slate-100">
              Smonta Assembly
            </DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              Stai per smontare{" "}
              <strong>{disassemblingAssembly?.name}</strong>. I componenti
              verranno restituiti al magazzino.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {isAssembledKitType && (
              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-slate-100">
                  Magazzino di destinazione
                </Label>
                <Select
                  value={disassembleWarehouseId}
                  onValueChange={setDisassembleWarehouseId}
                >
                  <SelectTrigger className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                    <SelectValue placeholder="Seleziona magazzino..." />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-900">
                    {warehouses.map((w) => (
                      <SelectItem
                        key={w.id}
                        value={String(w.id)}
                        className="dark:text-slate-100"
                      >
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="px-6 pb-6 pt-4 shrink-0 border-t border-border">
            <Button
              variant="outline"
              onClick={() => {
                setDisassemblingAssembly(null);
                setDisassembleWarehouseId("");
              }}
              className="border-slate-200 dark:border-slate-700 dark:text-slate-100"
            >
              Annulla
            </Button>
            <Button
              variant="destructive"
              disabled={disassembleMutation.isPending}
              onClick={() => {
                if (disassemblingAssembly?.id) {
                  disassembleMutation.mutate(disassemblingAssembly.id as number);
                }
              }}
            >
              {disassembleMutation.isPending ? "Smontaggio..." : "Smonta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Delete Confirm Dialog ----------------------------------------- */}
      <Dialog
        open={deletingAssemblyId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingAssemblyId(null);
          }
        }}
      >
        <DialogContent className="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">
              Elimina Assembly
            </DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              Questa azione è irreversibile. L&apos;assembly verrà eliminata
              definitivamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingAssemblyId(null)}
              className="border-slate-200 dark:border-slate-700 dark:text-slate-100"
            >
              Annulla
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deletingAssemblyId !== null) {
                  deleteMutation.mutate(deletingAssemblyId);
                }
              }}
            >
              {deleteMutation.isPending ? "Eliminazione..." : "Elimina"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

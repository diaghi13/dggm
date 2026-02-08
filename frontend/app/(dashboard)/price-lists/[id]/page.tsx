"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { priceListsApi } from "@/lib/api/price-lists";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/shared/data-table/data-table";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  DollarSign,
  Edit,
  RefreshCw,
  Calendar,
  Package,
  Settings,
  Info,
  Save,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";
import React, { useState, useMemo, useCallback } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import {
  PriceListItemForm,
  PriceListItemFormData,
  createPriceListItemsColumns,
  AddProductToListDialog,
  PriceListItemsFilters,
} from "../_components";
import type { PriceListItem } from "@/lib/types";

export default function PriceListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);
  const queryClient = useQueryClient();

  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PriceListItem | null>(null);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [itemsPage, setItemsPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [itemsSearch, setItemsSearch] = useState("");
  const [itemsActiveFilter, setItemsActiveFilter] = useState("all");
  const [itemsManualPriceFilter, setItemsManualPriceFilter] = useState("all");
  const [itemsProductTypeFilter, setItemsProductTypeFilter] = useState("all");

  const { data: priceList, isLoading } = useQuery({
    queryKey: ["price-list", id],
    queryFn: () => priceListsApi.getById(id),
    enabled: !!id,
  });

  // Query separata per gli items paginati
  const { data: itemsData, isLoading: isLoadingItems } = useQuery({
    queryKey: [
      "price-list-items",
      id,
      {
        search: itemsSearch,
        page: itemsPage,
        per_page: itemsPerPage,
        is_active: itemsActiveFilter,
        is_manual_price: itemsManualPriceFilter,
        product_type: itemsProductTypeFilter,
      },
    ],
    queryFn: () =>
      priceListsApi.getItems(id, {
        search: itemsSearch || undefined,
        page: itemsPage,
        per_page: itemsPerPage,
        is_active:
          itemsActiveFilter === "active"
            ? true
            : itemsActiveFilter === "inactive"
              ? false
              : undefined,
        is_manual_price:
          itemsManualPriceFilter === "manual"
            ? true
            : itemsManualPriceFilter === "automatic"
              ? false
              : undefined,
        product_type:
          itemsProductTypeFilter !== "all"
            ? (itemsProductTypeFilter as "article" | "service" | "composite")
            : undefined,
      }),
    enabled: !!id,
  });

  // Estrae gli items e i metadata
  const items = Array.isArray(itemsData?.data) ? itemsData.data : [];
  const itemsMeta = itemsData?.meta;

  // Sync itemsPerPage con localStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPageSize = localStorage.getItem("price-list-items-pageSize");
      if (savedPageSize) {
        const parsedSize = parseInt(savedPageSize, 10);
        if (parsedSize !== itemsPerPage) {
          setItemsPerPage(parsedSize);
        }
      }
    }
  }, [itemsPerPage]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "price-list-items-pageSize",
        itemsPerPage.toString(),
      );
    }
  }, [itemsPerPage]);

  const regenerateMutation = useMutation({
    mutationFn: priceListsApi.regenerate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-list", id] });
      queryClient.invalidateQueries({ queryKey: ["price-list-items", id] });
      queryClient.invalidateQueries({ queryKey: ["price-lists"] });
      setIsRegenerateDialogOpen(false);
      toast.success("Listino rigenerato con successo");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message || "Errore durante la rigenerazione",
      );
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({
      itemId,
      data,
    }: {
      itemId: number;
      data: PriceListItemFormData;
    }) => priceListsApi.updateItem(id, itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-list", id] });
      queryClient.invalidateQueries({ queryKey: ["price-list-items", id] });
      queryClient.invalidateQueries({ queryKey: ["price-lists"] });
      setEditingItem(null);
      toast.success("Prodotto aggiornato con successo");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message || "Errore durante l'aggiornamento",
      );
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: number) => priceListsApi.deleteItem(id, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-list", id] });
      queryClient.invalidateQueries({ queryKey: ["price-list-items", id] });
      queryClient.invalidateQueries({ queryKey: ["price-lists"] });
      toast.success("Prodotto rimosso dal listino");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Errore durante la rimozione");
    },
  });

  const recalculateItemMutation = useMutation({
    mutationFn: (itemId: number) => priceListsApi.recalculateItem(id, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-list", id] });
      queryClient.invalidateQueries({ queryKey: ["price-list-items", id] });
      toast.success("Prezzi ricalcolati con successo");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Errore durante il ricalcolo");
    },
  });

  const addItemMutation = useMutation({
    mutationFn: (data: PriceListItemFormData & { product_id: number }) =>
      priceListsApi.addItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-list", id] });
      queryClient.invalidateQueries({ queryKey: ["price-list-items", id] });
      queryClient.invalidateQueries({ queryKey: ["price-lists"] });
      setIsAddItemDialogOpen(false);
      toast.success("Prodotto aggiunto al listino");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Errore durante l'aggiunta");
    },
  });

  const handleRegenerateConfirm = () => {
    regenerateMutation.mutate(id);
  };

  const handleUpdateItem = (data: PriceListItemFormData) => {
    if (!editingItem?.id) return;
    updateItemMutation.mutate({ itemId: editingItem.id, data });
  };

  const handleEditItem = useCallback((item: PriceListItem) => {
    setEditingItem(item);
  }, []);

  const handleDeleteItem = useCallback(
    (item: PriceListItem) => {
      if (!item.id) return;
      if (
        confirm(
          `Vuoi rimuovere ${item.product?.name || "questo prodotto"} dal listino?`,
        )
      ) {
        deleteItemMutation.mutate(item.id);
      }
    },
    [deleteItemMutation],
  );

  const handleRecalculateItem = useCallback(
    (item: PriceListItem) => {
      if (!item.id) return;
      recalculateItemMutation.mutate(item.id);
    },
    [recalculateItemMutation],
  );

  // Colonne DataTable
  const itemsColumns = useMemo(
    () =>
      createPriceListItemsColumns(
        handleEditItem,
        handleDeleteItem,
        handleRecalculateItem,
        priceList?.applies_to || "both",
      ),
    [
      handleEditItem,
      handleDeleteItem,
      handleRecalculateItem,
      priceList?.applies_to,
    ],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-center">
          <DollarSign className="h-12 w-12 mx-auto mb-4 text-slate-400 dark:text-slate-600 animate-pulse" />
          <p className="text-slate-600 dark:text-slate-400">
            Caricamento listino...
          </p>
        </div>
      </div>
    );
  }

  if (!priceList) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-center">
          <DollarSign className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <p className="text-slate-600 dark:text-slate-400">
            Listino non trovato
          </p>
          <Button asChild className="mt-4">
            <Link href="/price-lists">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna alla lista
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const getAppliesToConfig = () => {
    switch (priceList.applies_to) {
      case "sale":
        return {
          label: "Vendita",
          className:
            "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        };
      case "rental":
        return {
          label: "Noleggio",
          className:
            "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        };
      case "both":
        return {
          label: "Entrambi",
          className:
            "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
        };
      default:
        return {
          label: "-",
          className:
            "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
        };
    }
  };

  const appliesToConfig = getAppliesToConfig();

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/price-lists")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {priceList.name}
              </h1>
              <Badge variant="outline" className="font-mono text-xs">
                {priceList.code}
              </Badge>
              {priceList.is_default && (
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  Default
                </Badge>
              )}
              {priceList.is_active ? (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Attivo
                </Badge>
              ) : (
                <Badge variant="secondary">Inattivo</Badge>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {priceList.description || "Nessuna descrizione"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {priceList?.calculation_mode === "automatic" && (
            <Button
              variant="outline"
              onClick={() => setIsRegenerateDialogOpen(true)}
              disabled={regenerateMutation.isPending}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Rigenera
            </Button>
          )}
          <Button asChild>
            <Link href={`/price-lists/${id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Modifica
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Dettagli</TabsTrigger>
          <TabsTrigger value="products">
            Prodotti ({itemsMeta?.total || 0})
          </TabsTrigger>
        </TabsList>

        {/* Tab Dettagli */}
        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Informazioni Base */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Informazioni Base
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Nome
                  </p>
                  <p className="font-medium">{priceList.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Codice
                  </p>
                  <p className="font-mono font-medium">{priceList.code}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Descrizione
                  </p>
                  <p className="text-slate-900 dark:text-slate-100">
                    {priceList.description || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Applica A
                  </p>
                  <Badge className={appliesToConfig.className}>
                    {appliesToConfig.label}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Configurazione */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configurazione
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Modalità Calcolo
                  </p>
                  <Badge
                    variant={
                      priceList.calculation_mode === "automatic"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {priceList.calculation_mode === "automatic"
                      ? "Automatico"
                      : "Manuale"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Tipo Aggiustamento
                  </p>
                  <p className="font-medium">
                    {priceList.adjustment_type === "percentage"
                      ? "Percentuale"
                      : priceList.adjustment_type === "fixed"
                        ? "Valore Fisso"
                        : "Nessuno"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Valore Aggiustamento
                  </p>
                  <p className="font-medium">
                    {priceList.adjustment_value
                      ? `${priceList.adjustment_value}${priceList.adjustment_type === "percentage" ? "%" : "€"}`
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Priorità
                  </p>
                  <Badge variant="outline" className="font-mono">
                    {priceList.priority}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Validità */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Periodo di Validità
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Valido Dal
                  </p>
                  <p className="font-medium">
                    {priceList.valid_from
                      ? format(new Date(priceList.valid_from), "dd MMMM yyyy", {
                          locale: it,
                        })
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Valido Al
                  </p>
                  <p className="font-medium">
                    {priceList.valid_to
                      ? format(new Date(priceList.valid_to), "dd MMMM yyyy", {
                          locale: it,
                        })
                      : "Illimitato"}
                  </p>
                </div>
                {priceList.valid_to &&
                  new Date(priceList.valid_to) < new Date() && (
                    <Badge
                      variant="destructive"
                      className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    >
                      Scaduto
                    </Badge>
                  )}
              </CardContent>
            </Card>

            {/* Metadati */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Metadati
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Prodotti
                  </p>
                  <p className="font-medium">{priceList.items?.length || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Categoria
                  </p>
                  <p className="font-medium">
                    {priceList.category?.name || "Tutte"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Prodotti */}
        <TabsContent value="products">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>Prodotti nel Listino</CardTitle>
              <Button onClick={() => setIsAddItemDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi Prodotto
              </Button>
            </CardHeader>
            <CardContent>
              <PriceListItemsFilters
                search={itemsSearch}
                onSearchChange={(value) => {
                  setItemsSearch(value);
                  setItemsPage(1);
                }}
                activeFilter={itemsActiveFilter}
                onActiveFilterChange={(value) => {
                  setItemsActiveFilter(value);
                  setItemsPage(1);
                }}
                manualPriceFilter={itemsManualPriceFilter}
                onManualPriceFilterChange={(value) => {
                  setItemsManualPriceFilter(value);
                  setItemsPage(1);
                }}
                productTypeFilter={itemsProductTypeFilter}
                onProductTypeFilterChange={(value) => {
                  setItemsProductTypeFilter(value);
                  setItemsPage(1);
                }}
              />
              {isLoadingItems ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Package className="h-12 w-12 mx-auto mb-4 text-slate-400 dark:text-slate-600 animate-pulse" />
                    <p className="text-slate-600 dark:text-slate-400">
                      Caricamento prodotti...
                    </p>
                  </div>
                </div>
              ) : !items || items.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="Nessun prodotto"
                  description="Questo listino non contiene ancora prodotti"
                />
              ) : (
                <DataTable
                  columns={itemsColumns}
                  data={items}
                  storageKey="price-list-items"
                  searchKey="product.name"
                  searchPlaceholder="Cerca prodotto..."
                  pagination={{
                    page: itemsPage,
                    perPage: itemsPerPage,
                    total: itemsMeta?.total || 0,
                    onPageChange: setItemsPage,
                    onPerPageChange: setItemsPerPage,
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Item Dialog */}
      {editingItem && (
        <Dialog
          open={!!editingItem}
          onOpenChange={(open) => !open && setEditingItem(null)}
        >
          <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-800">
              <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Modifica Prezzi Prodotto
              </DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-400">
                Aggiorna i prezzi per questo prodotto nel listino
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 px-6 py-6">
              <PriceListItemForm
                id="edit-item-form"
                item={editingItem}
                onSubmit={handleUpdateItem}
                isLoading={updateItemMutation.isPending}
                showSale={
                  priceList?.applies_to === "sale" ||
                  priceList?.applies_to === "both"
                }
                showRental={
                  priceList?.applies_to === "rental" ||
                  priceList?.applies_to === "both"
                }
              />
            </div>
            <DialogFooter className="border-t border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingItem(null)}
                disabled={updateItemMutation.isPending}
              >
                Annulla
              </Button>
              <Button
                type="submit"
                form="edit-item-form"
                disabled={updateItemMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {updateItemMutation.isPending
                  ? "Salvataggio..."
                  : "Salva Modifiche"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Regenerate Dialog */}
      <AlertDialog
        open={isRegenerateDialogOpen}
        onOpenChange={setIsRegenerateDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Rigenera Listino
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
              Vuoi rigenerare tutti i prezzi del listino{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {priceList.name}
              </span>
              ?
              <br />
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                I prezzi esistenti verranno ricalcolati in base alle regole del
                listino.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={regenerateMutation.isPending}>
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRegenerateConfirm}
              disabled={regenerateMutation.isPending}
            >
              {regenerateMutation.isPending ? "Rigenerazione..." : "Rigenera"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Item Dialog */}
      <AddProductToListDialog
        open={isAddItemDialogOpen}
        onOpenChange={setIsAddItemDialogOpen}
        onAdd={(data) => addItemMutation.mutate(data)}
        appliesTo={priceList?.applies_to || "both"}
        isLoading={addItemMutation.isPending}
      />
    </div>
  );
}

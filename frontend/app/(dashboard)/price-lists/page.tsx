"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { priceListsApi } from "@/lib/api/price-lists";
import { PriceList } from "@/lib/types";
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
import { Plus, DollarSign } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/data-table/data-table";
import { createPriceListsColumns } from "./_components/price-lists-columns";
import { PriceListFilters } from "./_components/price-list-filters";
import { useRouter } from "next/navigation";

export default function PriceListsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [appliesToFilter, setAppliesToFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);
  const [selectedPriceList, setSelectedPriceList] = useState<PriceList | null>(
    null,
  );

  const queryClient = useQueryClient();

  const columns = useMemo(
    () =>
      createPriceListsColumns(
        (priceList) => {
          router.push(`/price-lists/${priceList.id}`);
        },
        (priceList) => {
          setSelectedPriceList(priceList);
          setIsDeleteDialogOpen(true);
        },
        (priceList) => {
          router.push(`/price-lists/${priceList.id}`);
        },
        (priceList) => {
          setSelectedPriceList(priceList);
          setIsRegenerateDialogOpen(true);
        },
      ),
    [router],
  );

  const { data, isLoading } = useQuery({
    queryKey: ["price-lists", { page, search, appliesToFilter, activeFilter }],
    queryFn: () =>
      priceListsApi.getAll({
        page,
        search: search || undefined,
        applies_to:
          appliesToFilter !== "all"
            ? (appliesToFilter as "sale" | "rental" | "both")
            : undefined,
        is_active:
          activeFilter !== "all" ? activeFilter === "active" : undefined,
        per_page: 15,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: priceListsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-lists"] });
      setIsDeleteDialogOpen(false);
      setSelectedPriceList(null);
      toast.success("Listino eliminato con successo");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message || "Errore durante l'eliminazione",
      );
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: priceListsApi.regenerate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-lists"] });
      setIsRegenerateDialogOpen(false);
      setSelectedPriceList(null);
      toast.success("Listino rigenerato con successo");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message || "Errore durante la rigenerazione",
      );
    },
  });

  const handleDeleteConfirm = () => {
    if (selectedPriceList?.id) {
      deleteMutation.mutate(selectedPriceList.id);
    }
  };

  const handleRegenerateConfirm = () => {
    if (selectedPriceList?.id) {
      regenerateMutation.mutate(selectedPriceList.id);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Listini Prezzi"
        description="Gestisci i listini prezzi per prodotti e servizi"
        icon={DollarSign}
        actions={
          <Button onClick={() => router.push("/price-lists/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Nuovo Listino
          </Button>
        }
      />

      {/* Filtri */}
      <PriceListFilters
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        appliesToFilter={appliesToFilter}
        onAppliesToChange={(value) => {
          setAppliesToFilter(value);
          setPage(1);
        }}
        activeFilter={activeFilter}
        onActiveFilterChange={(value) => {
          setActiveFilter(value);
          setPage(1);
        }}
      />

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        storageKey="price-lists-table"
        onRowClick={(priceList) => router.push(`/price-lists/${priceList.id}`)}
        emptyState={
          <EmptyState
            icon={DollarSign}
            title="Nessun listino trovato"
            description="Inizia creando il tuo primo listino prezzi"
            actionLabel="Nuovo Listino"
            onAction={() => router.push("/price-lists/new")}
          />
        }
      />

      {data?.meta && data.meta.last_page > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Mostrando <span className="font-medium">{data.meta.from}</span> a{" "}
            <span className="font-medium">{data.meta.to}</span> di{" "}
            <span className="font-medium">{data.meta.total}</span> listini
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Precedente
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === data.meta.last_page}
            >
              Successiva
            </Button>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Elimina Listino
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
              Confermi l&apos;eliminazione del listino{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {selectedPriceList?.name}
              </span>
              ?
              <br />
              <span className="text-red-600 dark:text-red-400 font-medium">
                Questa azione non può essere annullata.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-900 dark:hover:bg-red-800"
            >
              {deleteMutation.isPending ? "Eliminazione..." : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                {selectedPriceList?.name}
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
    </div>
  );
}

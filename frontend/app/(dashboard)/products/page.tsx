"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "@/lib/api/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  DollarSign,
  Archive,
  Scan,
} from "lucide-react";
import { DataTable } from "@/components/shared/data-table/data-table";
import { createProductsColumns } from "@/app/(dashboard)/products/_components/products-columns";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { ProductImportDialog } from "@/components/products/product-import-dialog";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/features/auth/protected-route";
import { Can } from "@/components/features/auth/can";
import { CurrencyDisplay } from "@/components/ui/currency-input";
import type { Product } from "@/lib/types";

const categoryLabels: Record<string, string> = {
  construction: "Edilizia",
  electrical: "Elettrico",
  plumbing: "Idraulica",
  tools: "Attrezzi",
  equipment: "Attrezzatura",
  general: "Generale",
};

export default function ProductsPage() {
  return (
    <ProtectedRoute permission="materials.view">
      <ProductsPageContent />
    </ProtectedRoute>
  );
}

function ProductsPageContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [showInactive, setShowInactive] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // Sync perPage with localStorage on mount (for products-table)
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPageSize = localStorage.getItem("products-table-pageSize");
      if (savedPageSize) {
        const parsedSize = parseInt(savedPageSize, 10);
        if (parsedSize !== perPage) {
          setPerPage(parsedSize);
        }
      }
    }
  }, [perPage]);

  // Save perPage to localStorage when it changes
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("products-table-pageSize", perPage.toString());
    }
  }, [perPage]);

  const { data: productsData, isLoading } = useQuery({
    queryKey: [
      "products",
      {
        search,
        category,
        is_active: !showInactive ? true : undefined,
        page,
        per_page: perPage,
      },
    ],
    queryFn: () =>
      productsApi.getAll({
        search,
        category: category || undefined,
        is_active: !showInactive ? true : undefined,
        page,
        per_page: perPage,
      }),
  });

  // Extract products array and metadata from response
  const products = Array.isArray(productsData?.data) ? productsData.data : [];
  const meta = productsData?.meta;

  // Debug pagination
  console.log("Pagination debug:", {
    productsData,
    hasMeta: !!meta,
    metaKeys: meta ? Object.keys(meta) : [],
    total: meta?.total,
    currentPage: meta?.current_page,
    lastPage: meta?.last_page,
    perPageFromMeta: meta?.per_page,
    perPageFromState: perPage,
    shouldShowPagination: meta?.total && meta.total > perPage,
    productsLength: products.length,
    pageCalc: meta?.total ? Math.ceil(meta.total / perPage) : 0,
    isNextDisabled: page >= Math.ceil((meta?.total || 0) / perPage),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Prodotto eliminato", {
        description: "Il prodotto è stato eliminato con successo",
      });
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message || "Impossibile eliminare il prodotto",
      });
    },
  });

  const handleDelete = useCallback(
    (id: number, name: string) => {
      if (confirm(`Sei sicuro di voler eliminare il prodotto "${name}"?`)) {
        deleteMutation.mutate(id);
      }
    },
    [deleteMutation],
  );

  const handleBarcodeScan = useCallback(
    async (barcode: string) => {
      try {
        const response = await productsApi.getAll({
          barcode,
          is_active: true,
          per_page: 1,
        });

        const foundProducts = Array.isArray(response.data) ? response.data : [];
        if (foundProducts && foundProducts.length > 0) {
          const product = foundProducts[0];
          // Naviga alla pagina del prodotto
          router.push(`/products/${product.id}`);
          toast.success("Prodotto trovato", {
            description: `${product.code} - ${product.name}`,
          });
        } else {
          toast.error("Prodotto non trovato", {
            description: `Nessun prodotto con barcode: ${barcode}`,
          });
        }
      } catch (error) {
        console.error("Errore ricerca barcode:", error);
        toast.error("Errore ricerca", {
          description: "Impossibile cercare il prodotto",
        });
      }
    },
    [router],
  );

  // Define columns
  const columns = useMemo(
    () =>
      createProductsColumns(
        (product: Product) => {
          router.push(`/products/${product.id}`);
        },
        (product: Product) => {
          handleDelete(product.id!, product.name);
        },
      ),
    [handleDelete, router],
  );

  // Calcola statistiche sui prodotti della pagina corrente
  const stats = {
    total: meta?.total || 0,
    active: products.filter((p: Product) => p.is_active).length,
    inactive: products.filter((p: Product) => !p.is_active).length,
    totalValue: products.reduce(
      (sum: number, p: Product) =>
        sum + Number(p.total_stock || 0) * Number(p.standard_cost || 0),
      0,
    ),
  };

  const handleImportComplete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["products"] });
    toast.success("Prodotti importati", {
      description: "I prodotti sono stati importati con successo",
    });
  }, [queryClient]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Catalogo Prodotti
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Gestione completa del catalogo prodotti e materiali
          </p>
        </div>
        <div className="flex gap-2">
          <Can permission="materials.create">
            <Link href="/products/new">
              <Button className="shadow-md">
                <Plus className="mr-2 h-4 w-4" />
                Nuovo Prodotto
              </Button>
            </Link>
          </Can>
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            Importa Excel
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Totale Prodotti
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} attivi, {stats.inactive} inattivi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valore Magazzino
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay value={stats.totalValue} />
            </div>
            <p className="text-xs text-muted-foreground">Valore totale stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorie</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(categoryLabels).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Categorie disponibili
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alert Scorte</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">0</div>
            <p className="text-xs text-muted-foreground">Sotto scorta minima</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtri</CardTitle>
          <CardDescription>
            Filtra e cerca prodotti nel catalogo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cerca per codice o nome..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10 h-11"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 shrink-0"
                onClick={() => setScannerOpen(true)}
                title="Scansiona barcode"
              >
                <Scan className="h-5 w-5" />
              </Button>
            </div>
            <Select
              value={category || "all"}
              onValueChange={(value) => {
                setCategory(value === "all" ? "" : value);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Tutte le categorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le categorie</SelectItem>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="show-inactive"
                checked={showInactive}
                onChange={(e) => {
                  setShowInactive(e.target.checked);
                  setPage(1);
                }}
                className="w-4 h-4 rounded border-slate-300"
              />
              <label
                htmlFor="show-inactive"
                className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Mostra prodotti inattivi
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Prodotti ({products.length})</CardTitle>
          <CardDescription>
            {meta?.total
              ? `${meta.total} prodotti totali`
              : "Elenco di tutti i prodotti"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={products}
            isLoading={isLoading}
            storageKey="products-table"
            onRowClick={(product: Product) =>
              router.push(`/products/${product.id}`)
            }
            pagination={{
              page,
              perPage: meta?.per_page || perPage, // Use meta.per_page if backend returns it
              total: meta?.total || products.length,
              onPageChange: setPage,
              onPerPageChange: setPerPage,
            }}
            emptyState={
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Nessun prodotto trovato
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {search || category
                    ? "Prova a modificare i filtri di ricerca"
                    : "Inizia creando il tuo primo prodotto"}
                </p>
                {!search && !category && (
                  <Can permission="materials.create">
                    <Link href="/products/new">
                      <Button className="mt-4">
                        <Plus className="mr-2 h-4 w-4" />
                        Crea Primo Prodotto
                      </Button>
                    </Link>
                  </Can>
                )}
              </div>
            }
          />
        </CardContent>
      </Card>

      {/* Barcode Scanner */}
      <BarcodeScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={handleBarcodeScan}
        title="Scansiona Barcode Prodotto"
        description="Scansiona il barcode per cercare e aprire la pagina del prodotto"
      />

      {/* Product Import Dialog */}
      <ProductImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}

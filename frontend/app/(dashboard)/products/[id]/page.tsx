"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "@/lib/api/products";
import { inventoryApi } from "@/lib/api/inventory";
import { stockMovementsApi } from "@/lib/api/stock-movements";
import { ProductRelations } from "@/app/(dashboard)/products/_components/product-relations";
import { ProductRelationsTree } from "@/app/(dashboard)/products/_components/product-relations-tree";
import { ProductPriceCalculator } from "@/app/(dashboard)/products/_components/product-price-calculator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/shared/data-table/data-table";
import { createInventoryColumns } from "@/components/inventory-columns";
import { createStockMovementsColumns } from "@/components/stock-movements-columns";
import {
  ArrowLeft,
  Edit,
  Warehouse as WarehouseIcon,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { ProductListsPreview } from "@/app/(dashboard)/products/_components/product-lists-preview";
import { ProductMediaSection } from "@/components/products/product-media-section";

export default function ProductDetailPage() {
  const params = useParams();
  const productId = parseInt(params.id as string);

  // Define columns for DataTables
  const inventoryColumns = useMemo(() => createInventoryColumns(), []);
  const movementsColumns = useMemo(() => createStockMovementsColumns(), []);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => productsApi.getById(productId),
    enabled: !!productId,
  });

  // Fetch inventory data for this product
  const { data: inventoryData, isLoading: isLoadingInventory } = useQuery({
    queryKey: ["product-inventory", productId],
    queryFn: () =>
      inventoryApi.getAll({ product_id: productId, per_page: 100 }),
    enabled: !!productId,
  });

  const inventory = inventoryData?.data ?? [];

  // Fetch movements data for this product
  const { data: movementsData, isLoading: isLoadingMovements } = useQuery({
    queryKey: ["product-movements", productId],
    queryFn: () =>
      stockMovementsApi.getAll({ product_id: productId, per_page: 50 }),
    enabled: !!productId,
  });

  const movements = movementsData?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
            Caricamento prodotto...
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Prodotto non trovato
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Il prodotto richiesto non esiste
          </p>
          <Link href="/products">
            <Button className="mt-4">Torna al catalogo</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/products">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {product.code}
              </h1>
              <Badge variant={product.is_active ? "default" : "secondary"}>
                {product.is_active ? "Attivo" : "Inattivo"}
              </Badge>
              {product.category && (
                <Badge variant="outline">{product.category.name}</Badge>
              )}
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              {product.name}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link href={`/products/${productId}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Modifica
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Dettagli</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="relations">Relazioni</TabsTrigger>
          <TabsTrigger value="inventory">Inventario</TabsTrigger>
          <TabsTrigger value="movements">Movimenti</TabsTrigger>
          <TabsTrigger value="usage">Utilizzo</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          {/* Informazioni di Base */}
          <Card>
            <CardHeader>
              <CardTitle>Informazioni di Base</CardTitle>
              <CardDescription>Dati principali del prodotto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Nome Prodotto
                  </label>
                  <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {product.name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Codice
                  </label>
                  <p className="mt-1 text-slate-900 dark:text-slate-100 font-mono">
                    {product.code}
                  </p>
                </div>
              </div>

              {product.description && (
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Descrizione
                  </label>
                  <p className="mt-2 text-slate-700 dark:text-slate-300 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Categoria
                  </label>
                  <p className="mt-2">
                    {product.category ? (
                      <Badge variant="outline" className="text-sm">
                        {product.category.name}
                      </Badge>
                    ) : (
                      <span className="text-slate-500">Non specificata</span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Brand
                  </label>
                  <p className="mt-2">
                    {product.brand ? (
                      <Badge variant="outline" className="text-sm">
                        {product.brand.name}
                      </Badge>
                    ) : (
                      <span className="text-slate-500">Non specificato</span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Tipo Prodotto
                  </label>
                  <p className="mt-2">
                    <Badge variant="secondary" className="text-sm">
                      {product.product_type === "article"
                        ? "Articolo"
                        : product.product_type === "service"
                          ? "Servizio"
                          : "Composto"}
                    </Badge>
                  </p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Unità di Misura
                  </label>
                  <p className="mt-1 text-slate-900 dark:text-slate-100">
                    {product.unit || "pz"}
                  </p>
                </div>
                {product.location && (
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Ubicazione Magazzino
                    </label>
                    <p className="mt-1 text-slate-900 dark:text-slate-100">
                      📍 {product.location}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 block">
                  Stato e Caratteristiche
                </label>
                <div className="flex flex-wrap gap-3">
                  <div
                    className={`px-4 py-2 rounded-lg border ${
                      product.is_active
                        ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${
                        product.is_active
                          ? "text-green-900 dark:text-green-100"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {product.is_active ? "✓ Attivo" : "✗ Inattivo"}
                    </span>
                  </div>
                  {product.is_package && (
                    <div className="px-4 py-2 rounded-lg border bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        📦 Package/Contenitore
                      </span>
                    </div>
                  )}
                  {product.is_rentable && (
                    <div className="px-4 py-2 rounded-lg border bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
                      <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                        🔄 Noleggiabile
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Codici di Identificazione */}
          <Card>
            <CardHeader>
              <CardTitle>Codici di Identificazione</CardTitle>
              <CardDescription>
                Barcode, EAN e altri codici di tracciamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {product.barcode && (
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Barcode
                    </label>
                    <p className="mt-1 text-slate-900 dark:text-slate-100 font-mono text-lg">
                      {product.barcode}
                    </p>
                  </div>
                )}
                {product.qr_code && (
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      QR Code
                    </label>
                    <p className="mt-1 text-slate-900 dark:text-slate-100 font-mono">
                      {product.qr_code}
                    </p>
                  </div>
                )}
                {product.internal_code && (
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Codice Interno
                    </label>
                    <p className="mt-1 text-slate-900 dark:text-slate-100 font-mono">
                      {product.internal_code}
                    </p>
                  </div>
                )}
                {product.ean && (
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      EAN / GTIN
                    </label>
                    <p className="mt-1 text-slate-900 dark:text-slate-100 font-mono">
                      {product.ean}
                    </p>
                  </div>
                )}
                {product.etim_code && (
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Codice ETIM
                    </label>
                    <p className="mt-1 text-slate-900 dark:text-slate-100 font-mono">
                      {product.etim_code}
                    </p>
                  </div>
                )}
              </div>
              {!product.barcode &&
                !product.qr_code &&
                !product.internal_code &&
                !product.ean &&
                !product.etim_code && (
                  <p className="text-slate-500 text-sm">
                    Nessun codice di identificazione configurato
                  </p>
                )}
            </CardContent>
          </Card>

          {/* Stock e Disponibilità */}
          {(product.total_stock !== undefined ||
            product.available_stock !== undefined) && (
            <Card>
              <CardHeader>
                <CardTitle>Stock e Disponibilità</CardTitle>
                <CardDescription>
                  Giacenze attuali nei magazzini
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Stock Totale
                    </label>
                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {Number(product.total_stock || 0).toFixed(2)}{" "}
                      <span className="text-lg font-normal text-slate-600 dark:text-slate-400">
                        {product.unit}
                      </span>
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                    <label className="text-sm font-medium text-green-700 dark:text-green-300">
                      Stock Disponibile
                    </label>
                    <p className="mt-2 text-2xl font-bold text-green-900 dark:text-green-100">
                      {Number(product.available_stock || 0).toFixed(2)}{" "}
                      <span className="text-lg font-normal text-green-600 dark:text-green-400">
                        {product.unit}
                      </span>
                    </p>
                  </div>
                  {product.quantity_out_on_rental !== undefined &&
                    product.quantity_out_on_rental > 0 && (
                      <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                        <label className="text-sm font-medium text-purple-700 dark:text-purple-300">
                          In Noleggio
                        </label>
                        <p className="mt-2 text-2xl font-bold text-purple-900 dark:text-purple-100">
                          {Number(product.quantity_out_on_rental).toFixed(2)}{" "}
                          <span className="text-lg font-normal text-purple-600 dark:text-purple-400">
                            {product.unit}
                          </span>
                        </p>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dettagli Imballaggio */}
          {product.is_package &&
            (product.package_weight ||
              product.package_volume ||
              product.package_dimensions) && (
              <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/20">
                <CardHeader>
                  <CardTitle className="text-blue-900 dark:text-blue-100">
                    Dettagli Imballaggio
                  </CardTitle>
                  <CardDescription>
                    Caratteristiche fisiche del contenitore
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-3">
                    {product.package_weight && (
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Peso
                        </label>
                        <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                          {product.package_weight} kg
                        </p>
                      </div>
                    )}
                    {product.package_volume && (
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Volume
                        </label>
                        <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                          {product.package_volume} m³
                        </p>
                      </div>
                    )}
                    {product.package_dimensions && (
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Dimensioni
                        </label>
                        <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                          {product.package_dimensions} cm
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Prezzi e Margini */}
          <Card>
            <CardHeader>
              <CardTitle>Prezzi e Margini</CardTitle>
              <CardDescription>
                Costi, prezzi di vendita e marginalità
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {product.standard_cost !== null && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                    <label className="text-sm font-medium text-amber-700 dark:text-amber-300">
                      Costo Standard
                    </label>
                    <p className="mt-2 text-xl font-bold text-amber-900 dark:text-amber-100">
                      €{" "}
                      {Number(product.standard_cost || 0).toLocaleString(
                        "it-IT",
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                      )}
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      Calcolato dal backend
                    </p>
                  </div>
                )}
                {product.manufacturer_cost_price !== null && (
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Costo Produttore
                    </label>
                    <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
                      €{" "}
                      {Number(
                        product.manufacturer_cost_price || 0,
                      ).toLocaleString("it-IT", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                )}
                {product.manufacturer_retail_price !== null && (
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Prezzo Retail
                    </label>
                    <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
                      €{" "}
                      {Number(
                        product.manufacturer_retail_price || 0,
                      ).toLocaleString("it-IT", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                )}
                {product.sale_markup_percent !== null && (
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Margine Vendita
                    </label>
                    <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
                      {Number(product.sale_markup_percent || 0).toFixed(2)} %
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Gestione Scorte */}
          <Card>
            <CardHeader>
              <CardTitle>Gestione Scorte</CardTitle>
              <CardDescription>
                Fornitore predefinito e parametri di riordino
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {product.defaultSupplier && (
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Fornitore Predefinito
                  </label>
                  <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {product.defaultSupplier.company_name}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {product.defaultSupplier.code}
                    </p>
                  </div>
                </div>
              )}
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Scorta Minima
                  </label>
                  <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {Number(product.reorder_level || 0).toFixed(2)}{" "}
                    <span className="text-sm font-normal text-slate-600 dark:text-slate-400">
                      {product.unit}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Quantità Riordino
                  </label>
                  <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {Number(product.reorder_quantity || 0).toFixed(2)}{" "}
                    <span className="text-sm font-normal text-slate-600 dark:text-slate-400">
                      {product.unit}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Tempo Consegna
                  </label>
                  <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {product.lead_time_days || 0}{" "}
                    <span className="text-sm font-normal text-slate-600 dark:text-slate-400">
                      giorni
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Costo Composto */}
          {product.product_type === "composite" &&
            product.composite_total_cost !== undefined && (
              <Card className="border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/20">
                <CardHeader>
                  <CardTitle className="text-indigo-900 dark:text-indigo-100">
                    Costo Composto
                  </CardTitle>
                  <CardDescription>
                    Costo totale calcolato dalle relazioni
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                      €{" "}
                      {Number(product.composite_total_cost).toLocaleString(
                        "it-IT",
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                      )}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Vedi tab "Relazioni" per i dettagli
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Note */}
          {product.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Note</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {product.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="media" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Allegati e Media</CardTitle>
              <CardDescription>
                Immagini, schede tecniche, certificazioni e altri documenti
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductMediaSection
                productId={productId}
                media={{
                  images:
                    product.media?.filter(
                      (m: App.Data.ProductMediaData) =>
                        m.collection_name === "images",
                    ) || [],
                  technical_sheets:
                    product.media?.filter(
                      (m: App.Data.ProductMediaData) =>
                        m.collection_name === "technical_sheets",
                    ) || [],
                  certifications:
                    product.media?.filter(
                      (m: App.Data.ProductMediaData) =>
                        m.collection_name === "certifications",
                    ) || [],
                  manuals:
                    product.media?.filter(
                      (m: App.Data.ProductMediaData) =>
                        m.collection_name === "manuals",
                    ) || [],
                  drawings:
                    product.media?.filter(
                      (m: App.Data.ProductMediaData) =>
                        m.collection_name === "drawings",
                    ) || [],
                  documents:
                    product.media?.filter(
                      (m: App.Data.ProductMediaData) =>
                        m.collection_name === "documents",
                    ) || [],
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relations" className="space-y-6">
          <ProductRelations product={product} />
          <ProductRelationsTree product={product} />
          <ProductPriceCalculator product={product} />
          <ProductListsPreview product={product} />
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Inventario per Magazzino</CardTitle>
              <CardDescription>
                Stock disponibile nei vari magazzini ({inventory.length}{" "}
                magazzini)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={inventoryColumns}
                data={inventory}
                isLoading={isLoadingInventory}
                storageKey={`material-${productId}-inventory-table`}
                emptyState={
                  <div className="text-center py-12">
                    <WarehouseIcon className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
                    <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Nessuno stock
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                      Questo prodotto non è presente in nessun magazzino
                    </p>
                  </div>
                }
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <CardTitle>Storico Movimenti</CardTitle>
              <CardDescription>
                Movimentazioni di carico e scarico ({movements.length}{" "}
                movimenti)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={movementsColumns}
                data={movements}
                isLoading={isLoadingMovements}
                storageKey={`material-${productId}-movements-table`}
                emptyState={
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
                    <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Nessun movimento
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                      Non ci sono ancora movimenti per questo prodotto
                    </p>
                  </div>
                }
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle>Utilizzo nei Cantieri</CardTitle>
              <CardDescription>
                Cantieri che utilizzano questo prodotto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  Funzionalità in sviluppo
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  La visualizzazione dell'utilizzo del prodotto nei cantieri
                  sarà disponibile a breve
                </p>
                <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200 max-w-md mx-auto">
                  <p className="text-sm text-slate-700 font-medium mb-2">
                    Features in arrivo:
                  </p>
                  <ul className="list-disc list-inside text-sm text-slate-600 text-left space-y-1">
                    <li>Cantieri che usano questo prodotto</li>
                    <li>Quantità pianificate vs utilizzate</li>
                    <li>Varianze di costo per cantiere</li>
                    <li>Trend di consumo nel tempo</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

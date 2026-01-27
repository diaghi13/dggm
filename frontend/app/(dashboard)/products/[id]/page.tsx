'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/products';
import { inventoryApi } from '@/lib/api/inventory';
import { stockMovementsApi } from '@/lib/api/stock-movements';
import { ProductRelations } from '@/app/(dashboard)/products/_components/product-relations';
import { ProductRelationsTree } from '@/app/(dashboard)/products/_components/product-relations-tree';
import { ProductPriceCalculator } from '@/app/(dashboard)/products/_components/product-price-calculator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/shared/data-table/data-table';
import { createInventoryColumns } from '@/components/inventory-columns';
import { createStockMovementsColumns } from '@/components/stock-movements-columns';
import { ArrowLeft, Edit, Warehouse as WarehouseIcon, FileText } from 'lucide-react';
import Link from 'next/link';
import {ProductListsPreview} from "@/app/(dashboard)/products/_components/product-lists-preview";

export default function ProductDetailPage() {
  const params = useParams();
  const productId = parseInt(params.id as string);


  // Define columns for DataTables
  const inventoryColumns = useMemo(() => createInventoryColumns(), []);
  const movementsColumns = useMemo(() => createStockMovementsColumns(), []);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productsApi.getById(productId),
    enabled: !!productId,
  });

  // Fetch inventory data for this product
  const { data: inventoryData, isLoading: isLoadingInventory } = useQuery({
    queryKey: ['product-inventory', productId],
    queryFn: () => inventoryApi.getAll({ product_id: productId, per_page: 100 }),
    enabled: !!productId,
  });

  const inventory = inventoryData?.data ?? [];

  // Fetch movements data for this product
  const { data: movementsData, isLoading: isLoadingMovements } = useQuery({
    queryKey: ['product-movements', productId],
    queryFn: () => stockMovementsApi.getAll({ product_id: productId, per_page: 50 }),
    enabled: !!productId,
  });

  const movements = movementsData?.data ?? [];


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Caricamento prodotto...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Prodotto non trovato</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Il prodotto richiesto non esiste</p>
          <Link href="/frontend/app/(dashboard)/products">
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
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{product.code}</h1>
              <Badge variant={product.is_active ? 'default' : 'secondary'}>
                {product.is_active ? 'Attivo' : 'Inattivo'}
              </Badge>
              {product.category && (
                <Badge variant="outline">
                  {product.category.name}
                </Badge>
              )}
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-1">{product.name}</p>
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
            <TabsTrigger value="relations">Relazioni</TabsTrigger>
            <TabsTrigger value="inventory">Inventario</TabsTrigger>
            <TabsTrigger value="movements">Movimenti</TabsTrigger>
            <TabsTrigger value="usage">Utilizzo</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            {/* Informazioni Generali */}
            <Card>
              <CardHeader>
                <CardTitle>Informazioni Generali</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Codice</label>
                    <p className="mt-1 text-slate-900 dark:text-slate-100">{product.code}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome</label>
                    <p className="mt-1 text-slate-900 dark:text-slate-100">{product.name}</p>
                  </div>
                  {product.description && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Descrizione</label>
                      <p className="mt-1 text-slate-900 dark:text-slate-100">{product.description}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Categoria</label>
                    <p className="mt-1">
                      {product.category ? (
                        <Badge variant="outline">
                          {product.category.name}
                        </Badge>
                      ) : (
                        <span className="text-slate-500">N/A</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Unità di Misura</label>
                    <p className="mt-1 text-slate-900 dark:text-slate-100">{product.unit}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Costo Standard</label>
                    <p className="mt-1 text-slate-900 dark:text-slate-100 font-semibold">
                      € {Number(product.standard_cost || 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Stato</label>
                    <p className="mt-1">
                      <Badge variant={product.is_active ? 'default' : 'secondary'}>
                        {product.is_active ? 'Attivo' : 'Inattivo'}
                      </Badge>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Codici e Tracciamento */}
            {(product.barcode || product.qr_code || product.location) && (
              <Card>
                <CardHeader>
                  <CardTitle>Codici e Tracciamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-6 md:grid-cols-3">
                    {product.barcode && (
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Barcode</label>
                        <p className="mt-1 text-slate-900 dark:text-slate-100 font-mono">{product.barcode}</p>
                      </div>
                    )}
                    {product.qr_code && (
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">QR Code</label>
                        <p className="mt-1 text-slate-900 dark:text-slate-100 font-mono">{product.qr_code}</p>
                      </div>
                    )}
                    {product.location && (
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ubicazione</label>
                        <p className="mt-1 text-slate-900 dark:text-slate-100">📍 {product.location}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Gestione Scorte */}
            <Card>
              <CardHeader>
                <CardTitle>Gestione Scorte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-6 md:grid-cols-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Scorta Minima</label>
                    <p className="mt-1 text-slate-900 dark:text-slate-100">
                      {Number(product.reorder_level || 0).toFixed(2)} {product.unit}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Quantità Riordino</label>
                    <p className="mt-1 text-slate-900 dark:text-slate-100">
                      {Number(product.reorder_quantity || 0).toFixed(2)} {product.unit}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tempo Consegna</label>
                    <p className="mt-1 text-slate-900 dark:text-slate-100">
                      {product.lead_time_days} giorni
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Note */}
            {product.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Note</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-900 dark:text-slate-100 whitespace-pre-wrap">{product.notes}</p>
                </CardContent>
              </Card>
            )}
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
                      Stock disponibile nei vari magazzini ({inventory.length} magazzini)
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
                      <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Nessuno stock</h3>
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
                  Movimentazioni di carico e scarico ({movements.length} movimenti)
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
                      <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Nessun movimento</h3>
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
                <CardDescription>Cantieri che utilizzano questo prodotto</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-slate-300" />
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">Funzionalità in sviluppo</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    La visualizzazione dell'utilizzo del prodotto nei cantieri sarà disponibile a breve
                  </p>
                  <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200 max-w-md mx-auto">
                    <p className="text-sm text-slate-700 font-medium mb-2">Features in arrivo:</p>
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

'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Package, Warehouse, AlertTriangle, TrendingUp } from 'lucide-react';
import { useInventoryById, useInventoryHistory } from '@/hooks/use-inventory';
import { DataTable } from '@/components/shared/data-table/data-table';
import { createStockMovementsColumns } from '@/components/stock-movements-columns';
import { useMemo } from 'react';

export default function InventoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const { data: inventory, isLoading } = useInventoryById(id);
  const { data: historyData } = useInventoryHistory(id);

  const movements = historyData?.data ?? [];
  const columns = useMemo(() => createStockMovementsColumns(), []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
            Caricamento dettagli inventario...
          </p>
        </div>
      </div>
    );
  }

  if (!inventory) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
          <h3 className="mt-4 text-lg font-semibold">Inventario non trovato</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            L&apos;inventario richiesto non esiste o è stato eliminato
          </p>
          <Button onClick={() => router.push('/inventory')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Torna all&apos;inventario
          </Button>
        </div>
      </div>
    );
  }

  const stockLevel = inventory.quantity_available / (inventory.minimum_stock || 1);
  const isLowStock = inventory.quantity_available <= inventory.minimum_stock;
  const isOutOfStock = inventory.quantity_available === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/inventory')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {inventory.product?.name || 'N/A'}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Codice: {inventory.product?.code || 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isOutOfStock && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              Esaurito
            </Badge>
          )}
          {!isOutOfStock && isLowStock && (
            <Badge variant="outline" className="gap-1 border-orange-300 text-orange-700 bg-orange-50">
              <AlertTriangle className="h-3 w-3" />
              Scorta Bassa
            </Badge>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Disponibile
            </CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {inventory.quantity_available} {inventory.product?.unit}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Pronto per l&apos;uso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Riservato
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {inventory.quantity_reserved} {inventory.product?.unit}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              In uso o prenotato
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Scorta Minima
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {inventory.minimum_stock} {inventory.product?.unit}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Soglia riordino
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Magazzino
            </CardTitle>
            <Warehouse className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inventory.warehouse?.name || 'N/A'}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Ubicazione principale
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dettagli Prodotto */}
      <Card>
        <CardHeader>
          <CardTitle>Dettagli Prodotto</CardTitle>
          <CardDescription>Informazioni sul prodotto e inventario</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Categoria
              </div>
              <div className="mt-1 text-sm">
                {inventory.product?.category?.name || '-'}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Tipo Prodotto
              </div>
              <div className="mt-1">
                <Badge variant="outline">
                  {inventory.product?.product_type || '-'}
                </Badge>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Prezzo Acquisto
              </div>
              <div className="mt-1 text-sm">
                € {Number(inventory.product?.purchase_price || 0).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Valore Inventario
              </div>
              <div className="mt-1 text-sm font-bold text-green-600">
                € {(inventory.quantity_available * Number(inventory.product?.purchase_price || 0)).toFixed(2)}
              </div>
            </div>
          </div>

          {inventory.product?.description && (
            <>
              <Separator />
              <div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Descrizione
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {inventory.product.description}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Storico Movimenti */}
      <Card>
        <CardHeader>
          <CardTitle>Storico Movimenti ({movements.length})</CardTitle>
          <CardDescription>
            Cronologia completa dei movimenti per questo prodotto in questo magazzino
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={movements}
            storageKey={`inventory-${id}-movements-table`}
            emptyState={
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
                <h3 className="mt-4 text-lg font-semibold">
                  Nessun movimento registrato
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Non ci sono ancora movimenti per questo articolo
                </p>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

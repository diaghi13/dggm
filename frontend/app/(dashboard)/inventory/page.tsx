'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '@/lib/api/inventory';
import { warehousesApi } from '@/lib/api/warehouses';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, AlertTriangle, TrendingUp, DollarSign, Search } from 'lucide-react';
import { DataTable } from '@/components/shared/data-table/data-table';
import { createInventoryColumns } from '@/components/inventory-columns';

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('');
  const [showLowStock, setShowLowStock] = useState(false);

  // Define columns
  const columns = useMemo(() => createInventoryColumns(), []);

  // Fetch warehouses for filter
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses', { is_active: true, per_page: 100 }],
    queryFn: () => warehousesApi.getAll({ is_active: true, per_page: 100 }),
  });

  const warehouses = warehousesData?.data ?? [];

  // Fetch inventory data
  const { data: inventoryData, isLoading } = useQuery({
    queryKey: [
      'inventory',
      {
        search,
        warehouse_id: warehouseFilter || undefined,
        low_stock: showLowStock || undefined,
      },
    ],
    queryFn: () =>
      inventoryApi.getAll({
        search,
        warehouse_id: warehouseFilter ? parseInt(warehouseFilter) : undefined,
        low_stock: showLowStock || undefined,
        per_page: 100,
      }),
  });

  const inventory = inventoryData?.data ?? [];

  // Fetch valuation
  const { data: valuationData } = useQuery({
    queryKey: ['inventory-valuation', { warehouse_id: warehouseFilter || undefined }],
    queryFn: () =>
      inventoryApi.getValuation({
        warehouse_id: warehouseFilter ? parseInt(warehouseFilter) : undefined,
      }),
  });

  const valuation = valuationData ?? { total_value: 0, total_quantity: 0 };

  // Calculate statistics
  const stats = {
    totalItems: inventory.length,
    totalValue: valuation.total_value || 0,
    lowStockItems: inventory.filter((item: any) => item.is_low_stock).length,
    totalStock: inventory.reduce((sum: number, item: any) => sum + Number(item.quantity_available), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Inventario</h1>
          <p className="text-slate-600 mt-1">Vista globale stock e valutazione magazzino</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Totale</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground">Materiali diversi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valore Inventario</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€ {stats.totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Valutazione totale</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scorte Basse</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">Materiali sotto soglia</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quantità Totale</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStock.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Unità in stock</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtri</CardTitle>
          <CardDescription>Filtra e cerca nell'inventario</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cerca materiale..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <Select
              value={warehouseFilter || 'all'}
              onValueChange={(value) => setWarehouseFilter(value === 'all' ? '' : value)}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Tutti i magazzini" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i magazzini</SelectItem>
                {warehouses.map((warehouse: any) => (
                  <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="show-low-stock"
                checked={showLowStock}
                onChange={(e) => setShowLowStock(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300"
              />
              <label htmlFor="show-low-stock" className="text-sm text-slate-700 cursor-pointer">
                Solo scorte basse
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Dettagliato ({inventory.length})</CardTitle>
          <CardDescription>Visualizzazione completa inventario per materiale</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={inventory}
            isLoading={isLoading}
            storageKey="inventory-table"
            emptyState={
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Nessun materiale trovato
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {search || warehouseFilter || showLowStock
                    ? 'Prova a modificare i filtri di ricerca'
                    : 'Nessun materiale in inventario'}
                </p>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

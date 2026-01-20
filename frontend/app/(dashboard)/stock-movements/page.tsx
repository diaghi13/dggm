'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { stockMovementsApi } from '@/lib/api/stock-movements';
import { warehousesApi } from '@/lib/api/warehouses';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Settings2 } from 'lucide-react';
import { DataTable } from '@/components/shared/data-table/data-table';
import { createStockMovementsColumns } from '@/components/stock-movements-columns';
import { StockMovement } from '@/lib/types';

export default function StockMovementsPage() {
  const [warehouseFilter, setWarehouseFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Define columns
  const columns = useMemo(() => createStockMovementsColumns(), []);

  // Fetch warehouses for filter
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses', { is_active: true, per_page: 100 }],
    queryFn: () => warehousesApi.getAll({ is_active: true, per_page: 100 }),
  });

  const warehouses = warehousesData?.data ?? [];

  // Fetch movements data
  const { data: movementsData, isLoading } = useQuery({
    queryKey: [
      'stock-movements',
      {
        warehouse_id: warehouseFilter || undefined,
        type: typeFilter || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      },
    ],
    queryFn: () =>
      stockMovementsApi.getAll({
        warehouse_id: warehouseFilter ? parseInt(warehouseFilter) : undefined,
        type: typeFilter || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        per_page: 100,
      }),
  });

  const movements = movementsData?.data ?? [];

  // Calculate statistics
  const stats = {
    total: movements.length,
    intake: movements.filter((m: StockMovement) => m.type === 'intake').length,
    output: movements.filter((m: StockMovement) => m.type === 'output').length,
    transfer: movements.filter((m: StockMovement) => m.type === 'transfer').length,
    adjustment: movements.filter((m: StockMovement) => m.type === 'adjustment').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Movimenti Magazzino</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Storico completo dei movimenti di magazzino</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale</CardTitle>
            <Settings2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Movimenti registrati</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Carichi</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.intake}</div>
            <p className="text-xs text-muted-foreground">Entrate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scarichi</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.output}</div>
            <p className="text-xs text-muted-foreground">Uscite</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trasferimenti</CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.transfer}</div>
            <p className="text-xs text-muted-foreground">Interni</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rettifiche</CardTitle>
            <Settings2 className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.adjustment}</div>
            <p className="text-xs text-muted-foreground">Aggiustamenti</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtri</CardTitle>
          <CardDescription>Filtra i movimenti di magazzino</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
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

            <Select
              value={typeFilter || 'all'}
              onValueChange={(value) => setTypeFilter(value === 'all' ? '' : value)}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Tutti i tipi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i tipi</SelectItem>
                <SelectItem value="intake">Carico</SelectItem>
                <SelectItem value="output">Scarico</SelectItem>
                <SelectItem value="transfer">Trasferimento</SelectItem>
                <SelectItem value="adjustment">Rettifica</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="Data inizio"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-11"
            />

            <Input
              type="date"
              placeholder="Data fine"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-11"
            />
          </div>
        </CardContent>
      </Card>

      {/* Movements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Storico Movimenti ({movements.length})</CardTitle>
          <CardDescription>Elenco cronologico di tutti i movimenti di magazzino</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={movements}
            isLoading={isLoading}
            storageKey="stock-movements-table"
            emptyState={
              <div className="text-center py-12">
                <Settings2 className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Nessun movimento trovato
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {warehouseFilter || typeFilter || startDate || endDate
                    ? 'Prova a modificare i filtri di ricerca'
                    : 'Nessun movimento registrato'}
                </p>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}


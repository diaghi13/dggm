'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Settings2, Plus } from 'lucide-react';
import { DataTable } from '@/components/shared/data-table/data-table';
import { createStockMovementsColumns } from '@/components/stock-movements-columns';
import { StockMovementFilters } from '@/components/warehouse/stock-movement-filters';
import { CreateStockMovementDialog } from '@/components/create-stock-movement-dialog';
import { BulkIntakeDialog } from '@/components/warehouse/bulk-intake-dialog';
import { useStockMovements } from "@/hooks/use-stock-movements";

export default function StockMovementsPage() {
  const [filters, setFilters] = useState<{
    type?: string;
    warehouse_id?: number;
    product_id?: number;
    from_date?: string;
    to_date?: string;
  }>({});
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // Sync perPage with localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPageSize = localStorage.getItem("stock-movements-table-pageSize");
      if (savedPageSize) {
        const parsedSize = parseInt(savedPageSize, 10);
        if (parsedSize !== perPage) {
          setPerPage(parsedSize);
        }
      }
    }
  }, []);

  // Save perPage to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("stock-movements-table-pageSize", perPage.toString());
    }
  }, [perPage]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  // Define columns
  const columns = useMemo(() => createStockMovementsColumns(), []);

  // Fetch movements data using new hook
  const { data: movementsData, isLoading } = useStockMovements({
    warehouse_id: filters.warehouse_id,
    type: filters.type,
    date_from: filters.from_date,
    date_to: filters.to_date,
    page,
    per_page: perPage,
  });

  const movements = movementsData?.data ?? [];
  const meta = movementsData?.meta;

  // Calculate statistics
  const stats = {
    total: movements.length,
    intake: movements.filter((m: App.Data.StockMovementData) => m.type === 'intake').length,
    output: movements.filter((m: App.Data.StockMovementData) => m.type === 'output').length,
    transfer: movements.filter((m: App.Data.StockMovementData) => m.type === 'transfer').length,
    adjustment: movements.filter((m: App.Data.StockMovementData) => m.type === 'adjustment').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Movimenti Magazzino</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Storico completo dei movimenti di magazzino</p>
        </div>
        <div className="flex gap-2">
          <BulkIntakeDialog />
          <CreateStockMovementDialog
            trigger={
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Movimento Singolo
              </Button>
            }
          />
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
          <StockMovementFilters
            filters={filters}
            onFiltersChange={setFilters}
          />
        </CardContent>
      </Card>

      {/* Movements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Storico Movimenti ({meta?.total || movements.length})</CardTitle>
          <CardDescription>Elenco cronologico di tutti i movimenti di magazzino</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={movements}
            isLoading={isLoading}
            storageKey="stock-movements-table"
            pagination={{
              page,
              perPage: meta?.per_page || perPage,
              total: meta?.total || movements.length,
              onPageChange: setPage,
              onPerPageChange: setPerPage,
            }}
            emptyState={
              <div className="text-center py-12">
                <Settings2 className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Nessun movimento trovato
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {Object.keys(filters).length > 0
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


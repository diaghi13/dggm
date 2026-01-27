'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';

interface InventoryStatsProps {
  totalItems: number;
  lowStockItems: number;
  totalValue: number;
  warehouses: number;
}

export function InventoryStats({
  totalItems,
  lowStockItems,
  totalValue,
  warehouses,
}: InventoryStatsProps) {
  const lowStockPercentage = totalItems > 0
    ? ((lowStockItems / totalItems) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Totale Articoli */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Articoli Totali
          </CardTitle>
          <Package className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalItems.toLocaleString()}</div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            In {warehouses} {warehouses === 1 ? 'magazzino' : 'magazzini'}
          </p>
        </CardContent>
      </Card>

      {/* Scorte Basse */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Scorte Basse
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {lowStockItems.toLocaleString()}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {lowStockPercentage}% del totale
          </p>
        </CardContent>
      </Card>

      {/* Valore Magazzino */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Valore Totale
          </CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            € {totalValue.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Valorizzazione corrente
          </p>
        </CardContent>
      </Card>

      {/* Trend */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Magazzini Attivi
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {warehouses}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Operativi
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { projectStockApi } from '@/lib/api/project-stock';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RefreshCw, Package, DollarSign, AlertTriangle } from 'lucide-react';
import { CurrencyDisplay } from '@/components/ui/currency-input';

interface Props {
  projectId: number;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('it-IT');
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

export function ProjectStockTab({ projectId }: Props) {
  const {
    data: stockItems = [],
    isLoading: isLoadingStock,
    refetch: refetchStock,
    isFetching,
  } = useQuery({
    queryKey: ['project-stock', projectId],
    queryFn: () => projectStockApi.getStock(projectId),
    enabled: !!projectId,
  });

  const { data: summary, refetch: refetchSummary } = useQuery({
    queryKey: ['project-stock-summary', projectId],
    queryFn: () => projectStockApi.getStockSummary(projectId),
    enabled: !!projectId,
  });

  const handleRefresh = () => {
    refetchStock();
    refetchSummary();
  };

  if (isLoadingStock) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-500 dark:text-slate-400">
        Caricamento stock cantiere...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Stock in Cantiere
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Materiali attualmente presenti in cantiere
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isFetching}
          className="gap-2 border-slate-200 dark:border-slate-700 dark:text-slate-100"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Aggiorna
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-slate-200 dark:border-slate-700">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/40">
                  <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Articoli in Cantiere</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {summary.total_items_on_site}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-700">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/40">
                  <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Valore Stimato</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    <CurrencyDisplay value={summary.total_value_on_site} />
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-700">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 ${summary.overdue_rental_items_count > 0 ? 'bg-red-100 dark:bg-red-900/40' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  <AlertTriangle className={`h-5 w-5 ${summary.overdue_rental_items_count > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Noleggi Scaduti</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {summary.overdue_rental_items_count}
                    </p>
                    {summary.overdue_rental_items_count > 0 && (
                      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                        Scaduti
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stock Table */}
      {stockItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Nessun materiale presente in cantiere
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 dark:border-slate-700">
                <TableHead className="text-slate-700 dark:text-slate-300">Prodotto</TableHead>
                <TableHead className="text-slate-700 dark:text-slate-300">Tipo</TableHead>
                <TableHead className="text-right text-slate-700 dark:text-slate-300">Consegnato</TableHead>
                <TableHead className="text-right text-slate-700 dark:text-slate-300">Usato</TableHead>
                <TableHead className="text-right text-slate-700 dark:text-slate-300">Restituito</TableHead>
                <TableHead className="text-right text-slate-700 dark:text-slate-300">In Cantiere</TableHead>
                <TableHead className="text-slate-700 dark:text-slate-300">Da Restituire</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockItems.map((item) => (
                <TableRow
                  key={item.project_material_id}
                  className="border-slate-100 dark:border-slate-800"
                >
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {item.product_name}
                      </p>
                      <Badge
                        variant="outline"
                        className="mt-0.5 text-xs border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                      >
                        {item.product_code}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {item.is_rentable && (
                        <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 w-fit">
                          Noleggio
                        </Badge>
                      )}
                      {item.is_consumable && (
                        <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 w-fit">
                          Consumabile
                        </Badge>
                      )}
                      {!item.is_rentable && !item.is_consumable && (
                        <Badge
                          variant="outline"
                          className="border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 w-fit"
                        >
                          Materiale
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-slate-700 dark:text-slate-300">
                    {item.delivered_quantity} {item.unit}
                  </TableCell>
                  <TableCell className="text-right text-slate-700 dark:text-slate-300">
                    {item.used_quantity > 0 ? (
                      <span>{item.used_quantity} {item.unit}</span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-slate-700 dark:text-slate-300">
                    {item.returned_quantity > 0 ? (
                      <span className="text-blue-600 dark:text-blue-400">
                        {item.returned_quantity} {item.unit}
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`font-bold ${
                        item.project_stock > 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {item.project_stock} {item.unit}
                    </span>
                  </TableCell>
                  <TableCell>
                    {item.is_rentable && item.required_return_date ? (
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-sm ${
                            isOverdue(item.required_return_date)
                              ? 'text-red-600 dark:text-red-400 font-medium'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {formatDate(item.required_return_date)}
                        </span>
                        {isOverdue(item.required_return_date) && (
                          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 text-xs">
                            Scaduto
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

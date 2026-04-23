// Project Summary — read-only P&L view. The editable Final Balance document is in project-final-balance-section.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api/projects';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FinalBalance } from '@/lib/types';
import { CurrencyDisplay, formatCurrency } from '@/components/ui/currency-input';
import { RefreshCw, Loader2 } from 'lucide-react';

interface Props {
  projectId: number;
}

function MetricRow({
  label,
  value,
  highlight = false,
  indent = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  indent?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-2 ${highlight ? 'border-t border-slate-200 dark:border-slate-700 mt-1 pt-3' : ''}`}
    >
      <span
        className={`text-sm ${indent ? 'pl-4 text-slate-400 dark:text-slate-500' : highlight ? 'font-semibold text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}
      >
        {label}
      </span>
      <span
        className={`text-sm ${highlight ? 'font-bold text-slate-900 dark:text-slate-100' : indent ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}
      >
        {value}
      </span>
    </div>
  );
}

function fmt(n: number | undefined | null) {
  return `€\u202f${formatCurrency(Number(n) || 0)}`;
}

export function ProjectSummaryTab({ projectId }: Props) {
  const {
    data: balance,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery<FinalBalance>({
    queryKey: ['project-pnl', projectId],
    queryFn: () => projectsApi.getFinalBalance(projectId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const grossMargin = Number(balance?.gross_margin ?? 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Riepilogo P&L
        </h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          )}
          Aggiorna
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12 text-sm text-slate-400">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Calcolo in corso...
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
          Impossibile calcolare il riepilogo P&L. Riprova più tardi.
        </div>
      )}

      {!isLoading && balance && balance.total_revenue === 0 && balance.total_cost === 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-800/30">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Nessun dato finanziario disponibile</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            I dati P&L appariranno quando saranno registrate ore lavoro, materiali o spese.
          </p>
        </div>
      )}

      {!isLoading && balance && (balance.total_revenue > 0 || balance.total_cost > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Revenue */}
          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Ricavi
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100 dark:divide-slate-800 pt-0">
              <MetricRow label="Preventivo approvato" value={fmt(balance.quote_total)} />
              <MetricRow label="di cui manodopera" value={fmt(balance.quote_labor_total)} indent />
              <MetricRow label="di cui materiali" value={fmt(balance.quote_material_total)} indent />
              <MetricRow label="Ore extra (oltre stima)" value={fmt(balance.extra_labor_revenue)} />
              <MetricRow
                label="Spese fatturabili"
                value={fmt(balance.billable_expenses_revenue)}
              />
              <MetricRow label="Totale ricavi" value={fmt(balance.total_revenue)} highlight />
            </CardContent>
          </Card>

          {/* Costs */}
          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Costi
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100 dark:divide-slate-800 pt-0">
              <MetricRow label="Manodopera interna" value={fmt(balance.internal_labor_cost)} />
              <MetricRow label="Manodopera esterna" value={fmt(balance.external_labor_cost)} />
              <MetricRow label="Materiali" value={fmt(balance.material_cost_total)} />
              <MetricRow label="Spese approvate" value={fmt(balance.approved_expenses_total)} />
              <MetricRow label="Totale costi" value={fmt(balance.total_cost)} highlight />
            </CardContent>
          </Card>

          {/* Margin */}
          <Card
            className={`md:col-span-2 border-2 ${grossMargin >= 0 ? 'border-green-200 dark:border-green-800/50' : 'border-red-200 dark:border-red-800/50'}`}
          >
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Margine Lordo</p>
                  <p
                    className={`text-2xl font-bold ${grossMargin >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}
                  >
                    <CurrencyDisplay value={balance.gross_margin} />
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Margine %</p>
                  <p
                    className={`text-2xl font-bold ${grossMargin >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}
                  >
                    {(Number(balance.gross_margin_percent) || 0).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

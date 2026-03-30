'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api/projects';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FinalBalance } from '@/lib/types';
import { CurrencyDisplay, formatCurrency } from '@/components/ui/currency-input';

interface Props {
  projectId: number;
}

function MetricRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-2 ${highlight ? 'border-t border-slate-200 dark:border-slate-700 mt-1 pt-3' : ''}`}
    >
      <span
        className={`text-sm ${highlight ? 'font-semibold text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}
      >
        {label}
      </span>
      <span
        className={`text-sm ${highlight ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-900 dark:text-slate-100'}`}
      >
        {value}
      </span>
    </div>
  );
}

function fmt(n: number | undefined | null) {
  return `€\u202f${formatCurrency(Number(n) || 0)}`;
}

export function ProjectFinalBalanceTab({ projectId }: Props) {
  const [enabled, setEnabled] = useState(false);

  const {
    data: balance,
    isLoading,
    refetch,
  } = useQuery<FinalBalance>({
    queryKey: ['final-balance', projectId],
    queryFn: () => projectsApi.getFinalBalance(projectId),
    enabled,
  });

  const handleLoad = () => {
    if (!enabled) {
      setEnabled(true);
    } else {
      refetch();
    }
  };

  const grossMargin = Number(balance?.gross_margin ?? 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Final Balance
        </h3>
        <Button
          size="sm"
          onClick={handleLoad}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isLoading ? 'Calcolando...' : balance ? 'Aggiorna' : 'Calcola Final Balance'}
        </Button>
      </div>

      {balance && (
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
              <MetricRow label="  di cui manodopera" value={fmt(balance.quote_labor_total)} />
              <MetricRow label="  di cui materiali" value={fmt(balance.quote_material_total)} />
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

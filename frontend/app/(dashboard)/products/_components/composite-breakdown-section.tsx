'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/products';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ChevronDown,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  Package2,
} from 'lucide-react';
import type { Product } from '@/lib/types';

// ─────────────────────────────────────────────────────────────────────────────
// Types mirroring the /composite-breakdown API response
// ─────────────────────────────────────────────────────────────────────────────
interface CompositeComponentBreakdown {
  relation_id: number;
  component_product_id: number;
  component_code: string;
  component_name: string;
  quantity: number;
  quantity_type: string;
  quantity_value: string;
  unit_standard_cost: number;
  unit_sale_price: number;
  unit_rental_daily: number;
  unit_estimated_base_day: number;
  line_standard_cost: number;
  line_sale_price: number;
  price_source: 'price_list' | 'calculated';
}

interface CompositeBreakdownTotals {
  standard_cost: number;
  sale_price: number;
  rental_hourly: number;
  rental_half_day: number;
  rental_daily: number;
  rental_weekly: number;
  rental_monthly: number;
  rental_seasonal: number;
  estimated_base_day: number;
  components_count: number;
}

interface CompositeBreakdownData {
  product_id: number;
  product_code: string;
  product_name: string;
  components: CompositeComponentBreakdown[];
  totals: CompositeBreakdownTotals;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function fmtCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function CalcBadge() {
  return (
    <Badge className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700 hover:bg-green-100 text-xs font-normal px-1.5 py-0">
      calcolato
    </Badge>
  );
}

function ManualBadge() {
  return (
    <Badge className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700 hover:bg-amber-100 text-xs font-normal px-1.5 py-0">
      manuale
    </Badge>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Price row helper
// ─────────────────────────────────────────────────────────────────────────────
function PriceRow({
  label,
  value,
  isManual,
  highlight = false,
}: {
  label: string;
  value: number | null | undefined;
  isManual?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 py-2 ${highlight ? 'border-t border-slate-200 dark:border-slate-700 mt-1 pt-3' : ''}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
        {isManual !== undefined && (isManual ? <ManualBadge /> : <CalcBadge />)}
      </div>
      <span className={`text-sm font-semibold ${highlight ? 'text-base text-slate-900 dark:text-slate-100' : 'text-slate-800 dark:text-slate-200'}`}>
        € {fmtCurrency(value)}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
interface CompositeBreakdownSectionProps {
  product: Product;
}

export function CompositeBreakdownSection({ product }: CompositeBreakdownSectionProps) {
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  const {
    data: breakdown,
    isLoading,
    isError,
  } = useQuery<CompositeBreakdownData>({
    queryKey: ['composite-breakdown', product.id],
    queryFn: () => productsApi.getCompositeBreakdown(product.id!),
    enabled: !!product.id && product.product_type === 'composite',
  });

  if (product.product_type !== 'composite') {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Prezzi Derivati dai Componenti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 py-4 text-sm text-slate-500 dark:text-slate-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent" />
            Calcolo prezzi dai componenti...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Impossibile caricare il breakdown dei prezzi. Ricarica la pagina.
        </AlertDescription>
      </Alert>
    );
  }

  if (!breakdown) {
    return null;
  }

  const totals = breakdown.totals;
  const hasComponents = breakdown.components.length > 0;
  const hasRental = product.is_rentable;

  // Determine if the product's saved standard_cost is a manual override
  const savedCost = Number(product.standard_cost ?? 0);
  const calculatedCost = totals.standard_cost;
  const isCostManual = hasComponents && Math.abs(savedCost - calculatedCost) > 0.005;

  return (
    <Card className="border-indigo-200 dark:border-indigo-800">
      <CardHeader className="bg-indigo-50/50 dark:bg-indigo-950/20 rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
          <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          Prezzi Derivati dai Componenti
        </CardTitle>
        <CardDescription>
          Prezzi aggregati calcolati automaticamente dalla somma dei{' '}
          {totals.components_count} componenti
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {!hasComponents && (
          <Alert>
            <Package2 className="h-4 w-4" />
            <AlertDescription>
              Questo prodotto composito non ha ancora componenti. Aggiungi
              componenti tramite il pannello &ldquo;Relazioni&rdquo; per vedere i
              prezzi aggregati.
            </AlertDescription>
          </Alert>
        )}

        {hasComponents && (
          <>
            {/* ─── SUMMARY PRICES ─────────────────────────────────────────── */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Costi */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-4 space-y-0.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Costi
                </p>
                <PriceRow
                  label="Costo Standard Componenti"
                  value={totals.standard_cost}
                  isManual={false}
                />
                <PriceRow
                  label="Costo Standard Prodotto"
                  value={product.standard_cost}
                  isManual={isCostManual}
                />
              </div>

              {/* Vendita */}
              <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 space-y-0.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3">
                  Prezzo Vendita
                </p>
                <PriceRow
                  label="Vendita Calcolata"
                  value={totals.sale_price}
                  isManual={false}
                />
              </div>
            </div>

            {/* Noleggio */}
            {hasRental && (
              <div className="rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-950/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-3">
                  Prezzi Noleggio (aggregati componenti)
                </p>
                <div className="grid gap-0.5 sm:grid-cols-2">
                  <PriceRow label="Orario" value={totals.rental_hourly} />
                  <PriceRow label="Mezza Giornata" value={totals.rental_half_day} />
                  <PriceRow label="Giornaliero" value={totals.rental_daily} />
                  <PriceRow label="Settimanale" value={totals.rental_weekly} />
                  <PriceRow label="Mensile" value={totals.rental_monthly} />
                  <PriceRow label="Stagionale" value={totals.rental_seasonal} />
                </div>
                {totals.estimated_base_day > 0 && (
                  <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
                    <PriceRow
                      label="Prezzo Giornaliero Base Stimato"
                      value={totals.estimated_base_day}
                      isManual={false}
                    />
                  </div>
                )}
              </div>
            )}

            {/* ─── BREAKDOWN PER COMPONENTE ─────────────────────────────── */}
            <Collapsible open={breakdownOpen} onOpenChange={setBreakdownOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 w-auto px-0"
                >
                  {breakdownOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  {breakdownOpen ? 'Nascondi' : 'Mostra'} breakdown per componente (
                  {breakdown.components.length})
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-3 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                        <TableHead className="text-xs">Codice</TableHead>
                        <TableHead className="text-xs">Componente</TableHead>
                        <TableHead className="text-right text-xs">Qtà</TableHead>
                        <TableHead className="text-right text-xs">Costo Unit.</TableHead>
                        <TableHead className="text-right text-xs">Costo Totale</TableHead>
                        <TableHead className="text-right text-xs">Vendita Unit.</TableHead>
                        <TableHead className="text-right text-xs">Vendita Tot.</TableHead>
                        {hasRental && (
                          <TableHead className="text-right text-xs">Nol. Giorn. Unit.</TableHead>
                        )}
                        <TableHead className="text-xs">Fonte</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {breakdown.components.map((comp) => (
                        <TableRow key={comp.relation_id}>
                          <TableCell className="font-mono text-xs text-slate-600 dark:text-slate-400">
                            {comp.component_code}
                          </TableCell>
                          <TableCell className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {comp.component_name}
                          </TableCell>
                          <TableCell className="text-right text-sm text-slate-700 dark:text-slate-300">
                            {Number(comp.quantity).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-sm text-slate-700 dark:text-slate-300">
                            € {fmtCurrency(comp.unit_standard_cost)}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium text-amber-700 dark:text-amber-300">
                            € {fmtCurrency(comp.line_standard_cost)}
                          </TableCell>
                          <TableCell className="text-right text-sm text-slate-700 dark:text-slate-300">
                            € {fmtCurrency(comp.unit_sale_price)}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium text-emerald-700 dark:text-emerald-300">
                            € {fmtCurrency(comp.line_sale_price)}
                          </TableCell>
                          {hasRental && (
                            <TableCell className="text-right text-sm text-purple-700 dark:text-purple-300">
                              € {fmtCurrency(comp.unit_rental_daily)}
                            </TableCell>
                          )}
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                comp.price_source === 'price_list'
                                  ? 'text-xs border-green-300 dark:border-green-700 text-green-700 dark:text-green-400'
                                  : 'text-xs border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400'
                              }
                            >
                              {comp.price_source === 'price_list' ? 'Listino' : 'Calcolato'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Totals row */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between gap-6 flex-wrap">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Totali
                      </span>
                      <div className="flex items-center gap-6 flex-wrap">
                        <div className="text-right">
                          <p className="text-xs text-slate-500 dark:text-slate-400">Costo Totale</p>
                          <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
                            € {fmtCurrency(totals.standard_cost)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500 dark:text-slate-400">Vendita Totale</p>
                          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                            € {fmtCurrency(totals.sale_price)}
                          </p>
                        </div>
                        {hasRental && (
                          <div className="text-right">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Nol. Giorn. Tot.</p>
                            <p className="text-sm font-bold text-purple-700 dark:text-purple-300">
                              € {fmtCurrency(totals.rental_daily)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </CardContent>
    </Card>
  );
}

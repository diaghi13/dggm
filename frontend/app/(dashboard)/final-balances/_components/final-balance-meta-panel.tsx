'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { finalBalancesApi } from '@/lib/api/final-balances';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Building2,
  FileText,
  User,
  Calculator,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { CurrencyDisplay, CurrencyInput, formatCurrency } from '@/components/ui/currency-input';
import type { FinalBalanceDoc, UpdateFinalBalanceInput } from '@/lib/types';

interface FinalBalanceMetaPanelProps {
  finalBalance: FinalBalanceDoc;
  onUpdate: (data: UpdateFinalBalanceInput) => void;
  isReadOnly: boolean;
}

function useDebounce(fn: (...args: unknown[]) => void, delay: number) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(
    (...args: unknown[]) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
  );
}

export function FinalBalanceMetaPanel({
  finalBalance,
  onUpdate,
  isReadOnly,
}: FinalBalanceMetaPanelProps) {
  const [localTitle, setLocalTitle] = useState(finalBalance.title);
  const [localIssueDate, setLocalIssueDate] = useState(finalBalance.issue_date ?? '');
  const [localNotes, setLocalNotes] = useState(finalBalance.notes ?? '');
  const [localDiscountPct, setLocalDiscountPct] = useState(
    String(finalBalance.discount_percentage)
  );
  const [localTaxPct, setLocalTaxPct] = useState(String(finalBalance.tax_percentage));
  const [localIsManualOverride, setLocalIsManualOverride] = useState(
    finalBalance.is_manual_override
  );
  const [localIsPartial, setLocalIsPartial] = useState(finalBalance.is_partial);

  const mutation = useMutation({
    mutationFn: (data: UpdateFinalBalanceInput) =>
      finalBalancesApi.update(finalBalance.id, data),
    onSuccess: () => {
      onUpdate({});
    },
    onError: () => toast.error('Errore durante il salvataggio'),
  });

  const save = useCallback(
    (data: UpdateFinalBalanceInput) => {
      mutation.mutate(data);
    },
    [mutation]
  );

  const debouncedSave = useDebounce(
    useCallback(
      (data: unknown) => {
        mutation.mutate(data as UpdateFinalBalanceInput);
      },
      [mutation]
    ),
    600
  );

  const handleTitleBlur = () => {
    if (localTitle !== finalBalance.title) {
      save({ title: localTitle });
    }
  };

  const handleIssueDateBlur = () => {
    if (localIssueDate !== (finalBalance.issue_date ?? '')) {
      save({ issue_date: localIssueDate || null });
    }
  };

  const handleNotesBlur = () => {
    if (localNotes !== (finalBalance.notes ?? '')) {
      save({ notes: localNotes || null });
    }
  };

  const handleRecalculate = () => {
    save({
      discount_percentage: parseFloat(localDiscountPct) || 0,
      tax_percentage: parseFloat(localTaxPct) || 0,
      is_manual_override: localIsManualOverride,
    });
    toast.info('Ricalcolo avviato...');
  };

  const handleIsPartialChange = (checked: boolean) => {
    setLocalIsPartial(checked);
    save({ is_partial: checked });
  };

  const handleManualOverrideChange = (checked: boolean) => {
    setLocalIsManualOverride(checked);
    save({ is_manual_override: checked });
  };

  const taxableAmount = finalBalance.subtotal - finalBalance.discount_amount;

  return (
    <div className="space-y-4">
      {/* Document Details */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            Dettagli Documento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600 dark:text-slate-400">Titolo</Label>
            {isReadOnly ? (
              <p className="text-sm text-slate-900 dark:text-slate-100">{finalBalance.title}</p>
            ) : (
              <Input
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                onBlur={handleTitleBlur}
                className="h-8 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            )}
          </div>

          {/* Issue date */}
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600 dark:text-slate-400">Data Emissione</Label>
            {isReadOnly ? (
              <p className="text-sm text-slate-900 dark:text-slate-100">
                {finalBalance.issue_date
                  ? new Date(finalBalance.issue_date).toLocaleDateString('it-IT')
                  : '—'}
              </p>
            ) : (
              <Input
                type="date"
                value={localIssueDate}
                onChange={(e) => setLocalIssueDate(e.target.value)}
                onBlur={handleIssueDateBlur}
                className="h-8 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            )}
          </div>

          {/* Partial toggle */}
          {!isReadOnly && (
            <div className="flex items-center justify-between">
              <Label className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                Consuntivo Parziale
              </Label>
              <Switch
                checked={localIsPartial}
                onCheckedChange={handleIsPartialChange}
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600 dark:text-slate-400">Note</Label>
            {isReadOnly ? (
              <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                {finalBalance.notes ?? '—'}
              </p>
            ) : (
              <Textarea
                value={localNotes}
                onChange={(e) => setLocalNotes(e.target.value)}
                onBlur={handleNotesBlur}
                placeholder="Note interne..."
                className="text-sm min-h-[80px] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Links */}
      {(finalBalance.project_id || finalBalance.quote_id || finalBalance.customer_name) && (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              Collegamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {finalBalance.project_id && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Progetto</span>
                <Link
                  href={`/projects/${finalBalance.project_id}`}
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  {finalBalance.project_name ?? `#${finalBalance.project_id}`}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            )}
            {finalBalance.quote_id && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Preventivo</span>
                <Link
                  href={`/quotes/${finalBalance.quote_id}`}
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  Preventivo #{finalBalance.quote_id}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            )}
            {finalBalance.customer_name && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Cliente</span>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <User className="h-3 w-3 text-slate-400" />
                  {finalBalance.customer_name}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Totals */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calculator className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            Totali
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-slate-500 dark:text-slate-400">Subtotale</span>
            <span className="text-sm text-slate-700 dark:text-slate-300">
              <CurrencyDisplay value={finalBalance.subtotal} />
            </span>
          </div>
          {finalBalance.discount_amount > 0 && (
            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Sconto ({finalBalance.discount_percentage}%)
              </span>
              <span className="text-sm text-red-600 dark:text-red-400">
                −<CurrencyDisplay value={finalBalance.discount_amount} />
              </span>
            </div>
          )}
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-slate-500 dark:text-slate-400">Imponibile</span>
            <span className="text-sm text-slate-700 dark:text-slate-300">
              <CurrencyDisplay value={taxableAmount} />
            </span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              IVA ({finalBalance.tax_percentage}%)
            </span>
            <span className="text-sm text-slate-700 dark:text-slate-300">
              +<CurrencyDisplay value={finalBalance.tax_amount} />
            </span>
          </div>
          <Separator className="bg-slate-200 dark:bg-slate-700" />
          <div className="flex items-center justify-between py-1.5">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Totale
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
              <CurrencyDisplay value={finalBalance.total_amount} />
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Calculation settings */}
      {!isReadOnly && (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              Impostazioni Calcolo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Discount % */}
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600 dark:text-slate-400">Sconto %</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={localDiscountPct}
                onChange={(e) => setLocalDiscountPct(e.target.value)}
                placeholder="0"
                className="h-8 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Tax % */}
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600 dark:text-slate-400">IVA %</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={localTaxPct}
                onChange={(e) => setLocalTaxPct(e.target.value)}
                placeholder="22"
                className="h-8 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Manual override */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer block">
                  Override Manuale
                </Label>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Blocca il ricalcolo automatico
                </p>
              </div>
              <Switch
                checked={localIsManualOverride}
                onCheckedChange={handleManualOverrideChange}
              />
            </div>

            {/* Recalculate button */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleRecalculate}
              disabled={mutation.isPending}
              className="w-full border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              {mutation.isPending ? 'Ricalcolando...' : 'Ricalcola Totali'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

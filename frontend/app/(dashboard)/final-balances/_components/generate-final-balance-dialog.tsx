'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { finalBalancesApi } from '@/lib/api/final-balances';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Loader2, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import type { GenerateFinalBalanceInput } from '@/lib/types';

interface GenerateFinalBalanceDialogProps {
  projectId: number;
  hasQuote?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: (id: number) => void;
}

interface FormState {
  title: string;
  include_quote_reference: boolean;
  include_extra_materials: boolean;
  include_services: boolean;
  include_expenses: boolean;
  include_damages: boolean;
  include_overtime: boolean;
  is_partial: boolean;
  tax_percentage: string;
  discount_percentage: string;
  notes: string;
}

export function GenerateFinalBalanceDialog({
  projectId,
  hasQuote = false,
  open,
  onOpenChange,
  onGenerated,
}: GenerateFinalBalanceDialogProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    title: '',
    include_quote_reference: hasQuote,
    include_extra_materials: true,
    include_services: true,
    include_expenses: true,
    include_damages: true,
    include_overtime: true,
    is_partial: false,
    tax_percentage: '22',
    discount_percentage: '0',
    notes: '',
  });

  const mutation = useMutation({
    mutationFn: (data: GenerateFinalBalanceInput) =>
      finalBalancesApi.generate(projectId, data),
    onSuccess: (result) => {
      toast.success('Final Balance generato con successo');
      onOpenChange(false);
      onGenerated(result.id);
    },
    onError: () => toast.error('Errore durante la generazione'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: GenerateFinalBalanceInput = {
      title: form.title.trim() || undefined,
      include_quote_reference: form.include_quote_reference,
      include_extra_materials: form.include_extra_materials,
      include_services: form.include_services,
      include_expenses: form.include_expenses,
      include_damages: form.include_damages,
      include_overtime: form.include_overtime,
      is_partial: form.is_partial,
      tax_percentage: parseFloat(form.tax_percentage) || 22,
      discount_percentage: parseFloat(form.discount_percentage) || 0,
      notes: form.notes.trim() || null,
    };
    mutation.mutate(payload);
  }

  function setCheck(key: keyof FormState, value: boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Genera Final Balance
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            Crea automaticamente un consuntivo a partire dai dati del progetto.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-slate-700 dark:text-slate-300">
              Titolo
              <span className="ml-1 text-xs text-slate-400 dark:text-slate-500">
                (opzionale)
              </span>
            </Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Final Balance Progetto..."
              className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>

          <Separator className="bg-slate-200 dark:bg-slate-700" />

          {/* Inclusions */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Elementi da includere
            </p>

            {hasQuote && (
              <div className="flex items-center gap-3">
                <Checkbox
                  id="include_quote_reference"
                  checked={form.include_quote_reference}
                  onCheckedChange={(c) =>
                    setCheck('include_quote_reference', c as boolean)
                  }
                />
                <Label
                  htmlFor="include_quote_reference"
                  className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Riferimento preventivo
                </Label>
              </div>
            )}

            {[
              { key: 'include_extra_materials' as const, label: 'Materiali extra' },
              { key: 'include_services' as const, label: 'Servizi' },
              { key: 'include_expenses' as const, label: 'Spese fatturabili' },
              { key: 'include_damages' as const, label: 'Danni addebitabili' },
              { key: 'include_overtime' as const, label: 'Ore extra fatturabili' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <Checkbox
                  id={key}
                  checked={form[key] as boolean}
                  onCheckedChange={(c) => setCheck(key, c as boolean)}
                />
                <Label
                  htmlFor={key}
                  className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  {label}
                </Label>
              </div>
            ))}
          </div>

          <Separator className="bg-slate-200 dark:bg-slate-700" />

          {/* Tax & discount */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600 dark:text-slate-400">IVA %</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={form.tax_percentage}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tax_percentage: e.target.value }))
                }
                placeholder="22"
                className="h-8 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600 dark:text-slate-400">Sconto %</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={form.discount_percentage}
                onChange={(e) =>
                  setForm((f) => ({ ...f, discount_percentage: e.target.value }))
                }
                placeholder="0"
                className="h-8 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Partial toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer block">
                Consuntivo Parziale
              </Label>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Indica che il progetto non è ancora completato
              </p>
            </div>
            <Switch
              checked={form.is_partial}
              onCheckedChange={(c) => setForm((f) => ({ ...f, is_partial: c }))}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600 dark:text-slate-400">Note</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Note opzionali..."
              className="text-sm min-h-[60px] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generazione...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Genera
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

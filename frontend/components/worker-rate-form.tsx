'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { WorkerRate, RateType, RateContext } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DollarSign, Calendar, Percent } from 'lucide-react';

const workerRateSchema = z.object({
  rate_type: z.enum(['hourly', 'daily', 'weekly', 'monthly', 'fixed_project']),
  context: z.enum(['internal_cost', 'customer_billing', 'payroll']),
  rate_amount: z.number().min(0, 'Importo deve essere positivo'),
  currency: z.string().optional().nullable(),
  project_type: z.string().optional().nullable(),
  overtime_multiplier: z.number().min(1).max(3).optional(),
  holiday_multiplier: z.number().min(1).max(3).optional(),
  overtime_starts_after_hours: z.number().min(0).optional().nullable(),
  overtime_starts_after_time: z.string().optional().nullable(),
  recognizes_overtime: z.boolean().optional(),
  is_forfait: z.boolean().optional(),
  valid_from: z.string().min(1, 'Data inizio obbligatoria'),
  notes: z.string().optional().nullable(),
});

type WorkerRateFormValues = z.infer<typeof workerRateSchema>;

interface WorkerRateFormProps {
  rate?: WorkerRate;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function WorkerRateForm({ rate, onSubmit, onCancel, isLoading }: WorkerRateFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<WorkerRateFormValues>({
    resolver: zodResolver(workerRateSchema),
    defaultValues: rate
      ? {
          rate_type: rate.rate_type,
          context: rate.context,
          rate_amount: parseFloat(rate.rate_amount.toString()),
          currency: rate.currency || 'EUR',
          project_type: rate.project_type,
          overtime_multiplier: rate.overtime_multiplier,
          holiday_multiplier: rate.holiday_multiplier,
          overtime_starts_after_hours: rate.overtime_starts_after_hours,
          overtime_starts_after_time: rate.overtime_starts_after_time,
          recognizes_overtime: rate.recognizes_overtime,
          is_forfait: rate.is_forfait,
          valid_from: rate.valid_from,
          notes: rate.notes,
        }
      : {
          rate_type: 'hourly' as RateType,
          context: 'internal_cost' as RateContext,
          currency: 'EUR',
          overtime_multiplier: 1.5,
          holiday_multiplier: 2.0,
          recognizes_overtime: true,
          is_forfait: false,
          valid_from: new Date().toISOString().split('T')[0],
        },
  });

  const rateType = watch('rate_type');
  const context = watch('context');
  const recognizesOvertime = watch('recognizes_overtime');

  const handleFormSubmit = (data: WorkerRateFormValues) => {
    const formData = {
      rate_type: data.rate_type,
      context: data.context,
      rate_amount: data.rate_amount,
      currency: data.currency || 'EUR',
      project_type: data.project_type || null,
      overtime_multiplier: data.overtime_multiplier || 1.0,
      holiday_multiplier: data.holiday_multiplier || 1.0,
      overtime_starts_after_hours: data.overtime_starts_after_hours || null,
      overtime_starts_after_time: data.overtime_starts_after_time || null,
      recognizes_overtime: data.recognizes_overtime || false,
      is_forfait: data.is_forfait || false,
      valid_from: data.valid_from,
      notes: data.notes || null,
    };
    onSubmit(formData);
  };

  return (
    <form id="worker-rate-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Rate Type & Context */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200 dark:border-slate-700">
          <div className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Tipo Tariffa</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="context" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Contesto <span className="text-red-500">*</span>
            </Label>
            <Select
              value={context}
              onValueChange={(value) => setValue('context', value as RateContext)}
              disabled={isLoading}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Seleziona contesto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="internal_cost">Costo Interno</SelectItem>
                <SelectItem value="customer_billing">Fatturazione Cliente</SelectItem>
                <SelectItem value="payroll">Busta Paga</SelectItem>
              </SelectContent>
            </Select>
            {errors.context && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <span className="text-red-500">!</span> {errors.context.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="rate_type" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Tipo Tariffa <span className="text-red-500">*</span>
            </Label>
            <Select
              value={rateType}
              onValueChange={(value) => setValue('rate_type', value as RateType)}
              disabled={isLoading}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Seleziona tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Oraria</SelectItem>
                <SelectItem value="daily">Giornaliera</SelectItem>
                <SelectItem value="weekly">Settimanale</SelectItem>
                <SelectItem value="monthly">Mensile</SelectItem>
                <SelectItem value="fixed_project">Progetto Fisso</SelectItem>
              </SelectContent>
            </Select>
            {errors.rate_type && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <span className="text-red-500">!</span> {errors.rate_type.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Amount & Currency */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-2">
            <Label htmlFor="rate_amount" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Importo <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none z-10" />
              <Input
                id="rate_amount"
                type="number"
                step="0.01"
                {...register('rate_amount', { valueAsNumber: true })}
                disabled={isLoading}
                placeholder="25.00"
                className="h-11 pl-10"
              />
            </div>
            {errors.rate_amount && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <span className="text-red-500">!</span> {errors.rate_amount.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Valuta
            </Label>
            <Input
              id="currency"
              {...register('currency')}
              disabled={isLoading}
              placeholder="EUR"
              className="h-11 uppercase"
              maxLength={3}
            />
          </div>
        </div>

        {rateType === 'fixed_project' && (
          <div className="space-y-2">
            <Label htmlFor="project_type" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Tipo Progetto
            </Label>
            <Input
              id="project_type"
              {...register('project_type')}
              disabled={isLoading}
              placeholder="Es: Ristrutturazione completa, Nuova costruzione..."
              className="h-11"
            />
          </div>
        )}
      </div>

      {/* Validity Period */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200 dark:border-slate-700">
          <div className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Periodo Validita</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="valid_from" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Valida Dal <span className="text-red-500">*</span>
          </Label>
          <Input
            id="valid_from"
            type="date"
            {...register('valid_from')}
            disabled={isLoading}
            className="h-11"
          />
          {errors.valid_from && (
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <span className="text-red-500">!</span> {errors.valid_from.message}
            </p>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            La tariffa sara valida da questa data. Le tariffe precedenti verranno chiuse automaticamente.
          </p>
        </div>
      </div>

      {/* Overtime & Multipliers */}
      {(rateType === 'hourly' || rateType === 'daily') && (
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200 dark:border-slate-700">
            <div className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Percent className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Straordinari e Maggiorazioni</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Riconosce Straordinari
                </Label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Applica maggiorazioni per ore straordinarie
                </p>
              </div>
              <Switch
                checked={recognizesOvertime}
                onCheckedChange={(checked) => setValue('recognizes_overtime', checked)}
                disabled={isLoading}
              />
            </div>

            {recognizesOvertime && (
              <div className="space-y-4 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="overtime_multiplier" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Moltiplicatore Straordinario
                    </Label>
                    <Input
                      id="overtime_multiplier"
                      type="number"
                      step="0.1"
                      min="1"
                      max="3"
                      {...register('overtime_multiplier', { valueAsNumber: true })}
                      disabled={isLoading}
                      placeholder="1.5"
                      className="h-11"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Es: 1.5 = +50%, 2.0 = +100%
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="holiday_multiplier" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Moltiplicatore Festivi
                    </Label>
                    <Input
                      id="holiday_multiplier"
                      type="number"
                      step="0.1"
                      min="1"
                      max="3"
                      {...register('holiday_multiplier', { valueAsNumber: true })}
                      disabled={isLoading}
                      placeholder="2.0"
                      className="h-11"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Es: 2.0 = +100%, 2.5 = +150%
                    </p>
                  </div>
                </div>

                {rateType === 'hourly' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="overtime_starts_after_hours" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Straordinario Dopo (ore)
                      </Label>
                      <Input
                        id="overtime_starts_after_hours"
                        type="number"
                        step="0.5"
                        min="0"
                        {...register('overtime_starts_after_hours', { valueAsNumber: true })}
                        disabled={isLoading}
                        placeholder="8"
                        className="h-11"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Ore oltre le quali scatta lo straordinario
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="overtime_starts_after_time" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Straordinario Dopo (orario)
                      </Label>
                      <Input
                        id="overtime_starts_after_time"
                        type="time"
                        {...register('overtime_starts_after_time')}
                        disabled={isLoading}
                        className="h-11"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Es: 18:00 per straordinario serale
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Tariffa a Forfait
                </Label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Importo fisso indipendentemente dalle ore effettive
                </p>
              </div>
              <Switch
                checked={watch('is_forfait')}
                onCheckedChange={(checked) => setValue('is_forfait', checked)}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Note
          </Label>
          <Textarea
            id="notes"
            {...register('notes')}
            disabled={isLoading}
            placeholder="Note aggiuntive sulla tariffa..."
            rows={3}
            className="resize-none"
          />
        </div>
      </div>
    </form>
  );
}

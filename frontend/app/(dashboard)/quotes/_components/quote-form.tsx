'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Quote, QuoteFormData } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { customersApi } from '@/lib/api/customers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Calendar, Percent, FileText } from 'lucide-react';

const quoteSchema = z.object({
  title: z.string().min(1, 'Titolo obbligatorio'),
  customer_id: z.number(),
  project_manager_id: z.number().optional().nullable(),
  status: z.enum(['draft', 'sent', 'approved', 'rejected', 'expired', 'converted']).optional(),
  issue_date: z.string().min(1, 'Data emissione obbligatoria'),
  expiry_date: z.string().optional().nullable(),
  discount_percentage: z.number().min(0).max(100).optional(),
  tax_percentage: z.number().min(0).max(100).optional(),
  notes: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

type QuoteFormValues = z.infer<typeof quoteSchema>;

interface QuoteFormProps {
  quote?: Quote;
  onSubmit: (data: QuoteFormData) => void;
  onCancel: () => void;
}

export function QuoteForm({ quote, onSubmit, onCancel }: QuoteFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: quote
      ? {
          title: quote.title,
          customer_id: quote.customer_id,
          project_manager_id: quote.project_manager_id ?? undefined,
          status: quote.status,
          issue_date: quote.issue_date,
          expiry_date: quote.expiry_date || undefined,
          discount_percentage: parseFloat(quote.discount_percentage.toString()),
          tax_percentage: parseFloat(quote.tax_percentage.toString()),
          notes: quote.notes || undefined,
          is_active: quote.is_active,
        }
      : {
          issue_date: new Date().toISOString().split('T')[0],
          tax_percentage: 22,
          discount_percentage: 0,
          is_active: true,
          status: 'draft',
        },
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers', { is_active: true }],
    queryFn: () => customersApi.getAll({ is_active: true, per_page: 100 }),
  });

  const customerId = watch('customer_id');

  const handleFormSubmit = (data: QuoteFormValues) => {
    const formData: QuoteFormData = {
      title: data.title,
      customer_id: data.customer_id,
      issue_date: data.issue_date,
      project_manager_id: data.project_manager_id ?? undefined,
      status: data.status,
      expiry_date: data.expiry_date ?? undefined,
      discount_percentage: data.discount_percentage,
      tax_percentage: data.tax_percentage,
      notes: data.notes ?? undefined,
      is_active: data.is_active,
    };
    onSubmit(formData);
  };

  return (
    <form id="quote-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Main Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
          <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center">
            <FileText className="w-4 h-4 text-slate-600" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Informazioni Principali</h3>
        </div>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-slate-700">
              Titolo Preventivo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              {...register('title')}
              className="h-11"
              placeholder="es. Ristrutturazione Appartamento Via Roma"
            />
            {errors.title && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <span className="text-red-500">⚠</span> {errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer_id" className="text-sm font-medium text-slate-700">
              Cliente <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
              <Select
                value={customerId?.toString()}
                onValueChange={(value) => setValue('customer_id', parseInt(value))}
              >
                <SelectTrigger className="h-11 pl-10">
                  <SelectValue placeholder="Seleziona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customersData?.data.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {errors.customer_id && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <span className="text-red-500">⚠</span> {errors.customer_id.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Dates Section */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
          <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-slate-600" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Date</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="issue_date" className="text-sm font-medium text-slate-700">
              Data Emissione <span className="text-red-500">*</span>
            </Label>
            <Input
              id="issue_date"
              type="date"
              {...register('issue_date')}
              className="h-11"
            />
            {errors.issue_date && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <span className="text-red-500">⚠</span> {errors.issue_date.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry_date" className="text-sm font-medium text-slate-700">
              Data Scadenza
            </Label>
            <Input
              id="expiry_date"
              type="date"
              {...register('expiry_date')}
              className="h-11"
            />
          </div>
        </div>
      </div>

      {/* Financial Section */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
          <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center">
            <Percent className="w-4 h-4 text-slate-600" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Informazioni Finanziarie</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="discount_percentage" className="text-sm font-medium text-slate-700">
              Sconto (%)
            </Label>
            <div className="relative">
              <Input
                id="discount_percentage"
                type="number"
                step="0.01"
                {...register('discount_percentage', { valueAsNumber: true })}
                className="h-11 pr-10"
                placeholder="0.00"
              />
              <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tax_percentage" className="text-sm font-medium text-slate-700">
              IVA (%)
            </Label>
            <div className="relative">
              <Input
                id="tax_percentage"
                type="number"
                step="0.01"
                {...register('tax_percentage', { valueAsNumber: true })}
                className="h-11 pr-10"
                placeholder="22.00"
              />
              <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Notes Section */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-medium text-slate-700">
            Note
          </Label>
          <Textarea
            id="notes"
            {...register('notes')}
            rows={4}
            className="resize-none"
            placeholder="Aggiungi note o dettagli aggiuntivi..."
          />
        </div>
      </div>
    </form>
  );
}

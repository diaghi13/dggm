'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Site, SiteFormData } from '@/lib/types';
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
import { Building2, User, MapPin, MapPinned, Calendar, Euro, FileText } from 'lucide-react';

const siteSchema = z.object({
  code: z.string().optional().nullable(),
  name: z.string().min(1, 'Site name is required'),
  customer_id: z.number(),
  description: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  postal_code: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  gps_radius: z.number().min(0).optional().nullable(),
  project_manager_id: z.number().optional().nullable(),
  status: z.enum(['draft', 'planned', 'in_progress', 'on_hold', 'completed', 'cancelled']),
  start_date: z.string().optional().nullable(),
  estimated_end_date: z.string().optional().nullable(),
  actual_end_date: z.string().optional().nullable(),
  estimated_amount: z.number().min(0).optional().nullable(),
  actual_cost: z.number().min(0).optional().nullable(),
  invoiced_amount: z.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
  is_active: z.boolean(),
});

type SiteFormValues = z.infer<typeof siteSchema>;

interface SiteFormProps {
  site?: Site;
  onSubmit: (data: SiteFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function SiteForm({ site, onSubmit, onCancel, isLoading }: SiteFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SiteFormValues>({
    resolver: zodResolver(siteSchema),
    defaultValues: site
      ? {
          code: site.code,
          name: site.name,
          customer_id: site.customer_id,
          description: site.description,
          address: site.address,
          city: site.city,
          province: site.province,
          postal_code: site.postal_code,
          latitude: site.latitude,
          longitude: site.longitude,
          gps_radius: site.gps_radius,
          project_manager_id: site.project_manager_id,
          status: site.status,
          start_date: site.start_date,
          estimated_end_date: site.estimated_end_date,
          actual_end_date: site.actual_end_date,
          estimated_amount: parseFloat(site.estimated_amount),
          actual_cost: parseFloat(site.actual_cost),
          invoiced_amount: parseFloat(site.invoiced_amount),
          notes: site.notes,
          is_active: site.is_active,
        }
      : {
          name: '',
          customer_id: 0,
          status: 'draft' as const,
          gps_radius: 100,
          is_active: true,
        },
  });

  // Fetch customers for select
  const { data: customersData } = useQuery({
    queryKey: ['customers', 'all'],
    queryFn: () => customersApi.getAll({ per_page: 1000 }),
  });

  const customers = customersData?.data || [];

  const handleFormSubmit = (data: SiteFormValues) => {
    const formData: SiteFormData = {
      code: data.code || undefined,
      name: data.name,
      customer_id: data.customer_id,
      description: data.description || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      province: data.province || undefined,
      postal_code: data.postal_code || undefined,
      latitude: data.latitude || undefined,
      longitude: data.longitude || undefined,
      gps_radius: data.gps_radius || undefined,
      project_manager_id: data.project_manager_id || undefined,
      status: data.status,
      start_date: data.start_date || undefined,
      estimated_end_date: data.estimated_end_date || undefined,
      actual_end_date: data.actual_end_date || undefined,
      estimated_amount: data.estimated_amount || undefined,
      actual_cost: data.actual_cost || undefined,
      invoiced_amount: data.invoiced_amount || undefined,
      notes: data.notes || undefined,
      is_active: data.is_active,
    };
    onSubmit(formData);
  };

  const selectedStatus = watch('status');
  const selectedCustomerId = watch('customer_id');

  return (
    <form id="site-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-green-600" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Informazioni Base</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="code" className="text-sm font-medium text-slate-700">Codice Cantiere</Label>
            <Input
              id="code"
              {...register('code')}
              disabled={isLoading}
              placeholder="Auto-generato se vuoto"
              className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.code && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <span className="text-red-500">⚠</span> {errors.code.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-slate-700">
              Nome Cantiere <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register('name')}
              disabled={isLoading}
              placeholder="Nome del cantiere"
              className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.name && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <span className="text-red-500">⚠</span> {errors.name.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customer_id" className="text-sm font-medium text-slate-700">
              Cliente <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
              <Select
                value={selectedCustomerId?.toString()}
                onValueChange={(value) => setValue('customer_id', parseInt(value))}
                disabled={isLoading}
              >
                <SelectTrigger className="h-11 pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Seleziona cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
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
          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium text-slate-700">Stato</Label>
            <Select
              value={selectedStatus}
              onValueChange={(value) => setValue('status', value as any)}
              disabled={isLoading}
            >
              <SelectTrigger className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Seleziona stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Bozza</SelectItem>
                <SelectItem value="planned">Pianificato</SelectItem>
                <SelectItem value="in_progress">In Corso</SelectItem>
                <SelectItem value="on_hold">In Pausa</SelectItem>
                <SelectItem value="completed">Completato</SelectItem>
                <SelectItem value="cancelled">Annullato</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium text-slate-700">Descrizione</Label>
          <Textarea
            id="description"
            {...register('description')}
            disabled={isLoading}
            placeholder="Descrizione del cantiere..."
            rows={3}
            className="resize-none border-slate-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Location */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-orange-600" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Indirizzo</h3>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address" className="text-sm font-medium text-slate-700">Via</Label>
          <Input
            id="address"
            {...register('address')}
            disabled={isLoading}
            placeholder="Via Roma 123"
            className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city" className="text-sm font-medium text-slate-700">Città</Label>
            <Input
              id="city"
              {...register('city')}
              disabled={isLoading}
              placeholder="Milano"
              className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="province" className="text-sm font-medium text-slate-700">Provincia</Label>
            <Input
              id="province"
              {...register('province')}
              disabled={isLoading}
              placeholder="MI"
              className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postal_code" className="text-sm font-medium text-slate-700">CAP</Label>
            <Input
              id="postal_code"
              {...register('postal_code')}
              disabled={isLoading}
              placeholder="20100"
              className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* GPS Coordinates */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center">
            <MapPinned className="w-4 h-4 text-slate-600" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Coordinate GPS</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="latitude" className="text-sm font-medium text-slate-700">Latitudine</Label>
            <Input
              id="latitude"
              type="number"
              step="any"
              {...register('latitude', { valueAsNumber: true })}
              disabled={isLoading}
              placeholder="45.4642"
              className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="longitude" className="text-sm font-medium text-slate-700">Longitudine</Label>
            <Input
              id="longitude"
              type="number"
              step="any"
              {...register('longitude', { valueAsNumber: true })}
              disabled={isLoading}
              placeholder="9.1900"
              className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gps_radius" className="text-sm font-medium text-slate-700">Raggio GPS (m)</Label>
            <Input
              id="gps_radius"
              type="number"
              {...register('gps_radius', { valueAsNumber: true })}
              disabled={isLoading}
              placeholder="100"
              className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-purple-600" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Tempistiche</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start_date" className="text-sm font-medium text-slate-700">Data Inizio</Label>
            <Input
              id="start_date"
              type="date"
              {...register('start_date')}
              disabled={isLoading}
              className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estimated_end_date" className="text-sm font-medium text-slate-700">Data Fine Prevista</Label>
            <Input
              id="estimated_end_date"
              type="date"
              {...register('estimated_end_date')}
              disabled={isLoading}
              className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="actual_end_date" className="text-sm font-medium text-slate-700">Data Fine Effettiva</Label>
            <Input
              id="actual_end_date"
              type="date"
              {...register('actual_end_date')}
              disabled={isLoading}
              className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Financial */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
            <Euro className="w-4 h-4 text-green-600" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Dati Finanziari</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="estimated_amount" className="text-sm font-medium text-slate-700">Importo Stimato (€)</Label>
            <Input
              id="estimated_amount"
              type="number"
              step="0.01"
              {...register('estimated_amount', { valueAsNumber: true })}
              disabled={isLoading}
              placeholder="0.00"
              className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="actual_cost" className="text-sm font-medium text-slate-700">Costo Effettivo (€)</Label>
            <Input
              id="actual_cost"
              type="number"
              step="0.01"
              {...register('actual_cost', { valueAsNumber: true })}
              disabled={isLoading}
              placeholder="0.00"
              className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invoiced_amount" className="text-sm font-medium text-slate-700">Importo Fatturato (€)</Label>
            <Input
              id="invoiced_amount"
              type="number"
              step="0.01"
              {...register('invoiced_amount', { valueAsNumber: true })}
              disabled={isLoading}
              placeholder="0.00"
              className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
            <FileText className="w-4 h-4 text-slate-600" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Note</h3>
        </div>
        <div className="space-y-2">
          <Textarea
            id="notes"
            {...register('notes')}
            disabled={isLoading}
            placeholder="Note aggiuntive..."
            rows={4}
            className="resize-none border-slate-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center space-x-3 pt-4 border-t border-slate-200">
        <input
          type="checkbox"
          id="is_active"
          {...register('is_active')}
          disabled={isLoading}
          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <Label htmlFor="is_active" className="cursor-pointer text-sm font-medium text-slate-700">
          Cantiere attivo
        </Label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-200 dark:border-slate-800 bg-white -mx-6 -mb-6 px-6 pb-6 rounded-b-lg">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="border-slate-300 hover:bg-slate-50"
        >
          Annulla
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Salvataggio...' : site ? 'Aggiorna Cantiere' : 'Crea Cantiere'}
        </Button>
      </div>
    </form>
  );
}

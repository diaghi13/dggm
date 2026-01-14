'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Worker, WorkerFormData } from '@/lib/types';
import { suppliersApi } from '@/lib/api/suppliers';
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
import { UserCheck, Mail, Phone, MapPin, Briefcase, Calendar, FileText } from 'lucide-react';

const workerSchema = z.object({
  worker_type: z.enum(['employee', 'freelancer', 'external']),
  contract_type: z.enum(['permanent', 'fixed_term', 'seasonal', 'project_based', 'internship']).optional().nullable(),
  first_name: z.string().min(1, 'Nome è obbligatorio'),
  last_name: z.string().min(1, 'Cognome è obbligatorio'),
  tax_code: z.string().optional().nullable(),
  vat_number: z.string().optional().nullable(),
  birth_date: z.string().optional().nullable(),
  birth_place: z.string().optional().nullable(),
  email: z.string().email('Email non valida').optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  postal_code: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  job_title: z.string().optional().nullable(),
  job_level: z.string().optional().nullable(),
  hire_date: z.string().optional().nullable(),
  contract_end_date: z.string().optional().nullable(),
  supplier_id: z.number().optional().nullable(),
  payment_notes: z.string().optional().nullable(),
  has_safety_training: z.boolean().optional(),
  safety_training_expires_at: z.string().optional().nullable(),
  can_drive_company_vehicles: z.boolean().optional(),
  notes: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
}).refine(
  (data) => {
    if (data.worker_type === 'external') {
      return !!data.supplier_id;
    }
    return true;
  },
  {
    message: 'Fornitore obbligatorio per lavoratori esterni',
    path: ['supplier_id'],
  }
);

type WorkerFormValues = z.infer<typeof workerSchema>;

interface WorkerFormProps {
  worker?: Worker;
  onSubmit: (data: WorkerFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function WorkerForm({ worker, onSubmit, onCancel, isLoading }: WorkerFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<WorkerFormValues>({
    resolver: zodResolver(workerSchema),
    defaultValues: worker
      ? {
          worker_type: worker.worker_type,
          contract_type: worker.contract_type,
          first_name: worker.first_name,
          last_name: worker.last_name,
          tax_code: worker.tax_code,
          vat_number: worker.vat_number,
          birth_date: worker.birth_date || null,
          birth_place: worker.birth_place,
          email: worker.email,
          phone: worker.phone,
          mobile: worker.mobile,
          address: worker.address,
          city: worker.city,
          province: worker.province,
          postal_code: worker.postal_code,
          country: worker.country || 'Italia',
          job_title: worker.job_title,
          job_level: worker.job_level,
          hire_date: worker.hire_date || null,
          contract_end_date: worker.contract_end_date || null,
          supplier_id: worker.supplier?.id,
          payment_notes: worker.payment_notes,
          has_safety_training: worker.has_safety_training,
          safety_training_expires_at: worker.safety_training_expires_at || null,
          can_drive_company_vehicles: worker.can_drive_company_vehicles,
          notes: worker.notes,
          is_active: worker.is_active,
        }
      : {
          worker_type: 'employee' as const,
          country: 'Italia',
          is_active: true,
          has_safety_training: false,
          can_drive_company_vehicles: false,
        },
  });

  const workerType = watch('worker_type');

  // Fetch suppliers for external workers (only personnel providers)
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers', { supplier_type: 'personnel' }],
    queryFn: () => suppliersApi.getAll({ supplier_type: 'personnel', per_page: 999 }),
    enabled: workerType === 'external',
  });

  const suppliers = suppliersData?.data || [];

  const handleFormSubmit = (data: WorkerFormValues) => {
    const formData: any = {
      worker_type: data.worker_type,
      contract_type: data.contract_type || null,
      first_name: data.first_name,
      last_name: data.last_name,
      tax_code: data.tax_code || null,
      vat_number: data.vat_number || null,
      birth_date: data.birth_date || null,
      birth_place: data.birth_place || null,
      email: data.email || null,
      phone: data.phone || null,
      mobile: data.mobile || null,
      address: data.address || null,
      city: data.city || null,
      province: data.province || null,
      postal_code: data.postal_code || null,
      country: data.country || null,
      job_title: data.job_title || null,
      job_level: data.job_level || null,
      hire_date: data.hire_date || null,
      contract_end_date: data.contract_end_date || null,
      supplier_id: data.supplier_id || null,
      payment_notes: data.payment_notes || null,
      has_safety_training: data.has_safety_training,
      safety_training_expires_at: data.safety_training_expires_at || null,
      can_drive_company_vehicles: data.can_drive_company_vehicles,
      notes: data.notes || null,
      is_active: data.is_active,
    };
    onSubmit(formData);
  };

  return (
    <form id="worker-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Worker Type */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <UserCheck className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Tipo Collaboratore</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="worker_type" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Tipo <span className="text-red-500">*</span>
            </Label>
            <Select
              value={workerType}
              onValueChange={(value) => setValue('worker_type', value as any)}
              disabled={isLoading}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Seleziona tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Dipendente</SelectItem>
                <SelectItem value="freelancer">Freelance</SelectItem>
                <SelectItem value="external">Esterno (Fornitore)</SelectItem>
              </SelectContent>
            </Select>
            {errors.worker_type && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <span className="text-red-500">⚠</span> {errors.worker_type.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="contract_type" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Tipo Contratto
            </Label>
            <Select
              value={watch('contract_type') || ''}
              onValueChange={(value) => setValue('contract_type', value as any)}
              disabled={isLoading}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Seleziona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="permanent">Indeterminato</SelectItem>
                <SelectItem value="fixed_term">Determinato</SelectItem>
                <SelectItem value="seasonal">Stagionale</SelectItem>
                <SelectItem value="project_based">A Progetto</SelectItem>
                <SelectItem value="internship">Stage</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Supplier Selector - Only for external workers */}
        {workerType === 'external' && (
          <div className="space-y-2">
            <Label htmlFor="supplier_id" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Fornitore <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watch('supplier_id')?.toString() || ''}
              onValueChange={(value) => setValue('supplier_id', parseInt(value))}
              disabled={isLoading}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Seleziona fornitore" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier: any) => (
                  <SelectItem key={supplier.id} value={supplier.id.toString()}>
                    {supplier.company_name} ({supplier.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.supplier_id && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <span className="text-red-500">⚠</span> {errors.supplier_id.message}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Personal Data */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <UserCheck className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Dati Anagrafici</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Nome <span className="text-red-500">*</span>
            </Label>
            <Input
              id="first_name"
              {...register('first_name')}
              disabled={isLoading}
              placeholder="Mario"
              className="h-11 border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.first_name && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <span className="text-red-500">⚠</span> {errors.first_name.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Cognome <span className="text-red-500">*</span>
            </Label>
            <Input
              id="last_name"
              {...register('last_name')}
              disabled={isLoading}
              placeholder="Rossi"
              className="h-11 border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.last_name && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <span className="text-red-500">⚠</span> {errors.last_name.message}
              </p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tax_code" className="text-sm font-medium text-slate-700 dark:text-slate-300">Codice Fiscale</Label>
            <Input
              id="tax_code"
              {...register('tax_code')}
              disabled={isLoading}
              placeholder="RSSMRA80A01H501A"
              className="h-11 border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500 font-mono"
            />
          </div>
          {workerType === 'freelancer' && (
            <div className="space-y-2">
              <Label htmlFor="vat_number" className="text-sm font-medium text-slate-700 dark:text-slate-300">Partita IVA</Label>
              <Input
                id="vat_number"
                {...register('vat_number')}
                disabled={isLoading}
                placeholder="IT12345678901"
                className="h-11 border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500 font-mono"
              />
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="birth_date" className="text-sm font-medium text-slate-700 dark:text-slate-300">Data di Nascita</Label>
            <Input
              id="birth_date"
              type="date"
              {...register('birth_date')}
              disabled={isLoading}
              className="h-11 border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="birth_place" className="text-sm font-medium text-slate-700 dark:text-slate-300">Luogo di Nascita</Label>
            <Input
              id="birth_place"
              {...register('birth_place')}
              disabled={isLoading}
              placeholder="Milano"
              className="h-11 border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Contract Info */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Informazioni Contratto</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="job_title" className="text-sm font-medium text-slate-700 dark:text-slate-300">Ruolo</Label>
            <Input
              id="job_title"
              {...register('job_title')}
              disabled={isLoading}
              placeholder="Operaio Specializzato"
              className="h-11 border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="job_level" className="text-sm font-medium text-slate-700 dark:text-slate-300">Livello</Label>
            <Input
              id="job_level"
              {...register('job_level')}
              disabled={isLoading}
              placeholder="3"
              className="h-11 border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hire_date" className="text-sm font-medium text-slate-700 dark:text-slate-300">Data Assunzione</Label>
            <Input
              id="hire_date"
              type="date"
              {...register('hire_date')}
              disabled={isLoading}
              className="h-11 border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          {watch('contract_type') === 'fixed_term' && (
            <div className="space-y-2">
              <Label htmlFor="contract_end_date" className="text-sm font-medium text-slate-700 dark:text-slate-300">Fine Contratto</Label>
              <Input
                id="contract_end_date"
                type="date"
                {...register('contract_end_date')}
                disabled={isLoading}
                className="h-11 border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Mail className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Contatti</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none z-10" />
              <Input
                id="email"
                type="email"
                {...register('email')}
                disabled={isLoading}
                placeholder="email@esempio.it"
                className="h-11 pl-10 border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <span className="text-red-500">⚠</span> {errors.email.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium text-slate-700 dark:text-slate-300">Telefono</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none z-10" />
              <Input
                id="phone"
                {...register('phone')}
                disabled={isLoading}
                placeholder="+39 02 1234567"
                className="h-11 pl-10 border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="mobile" className="text-sm font-medium text-slate-700 dark:text-slate-300">Cellulare</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none z-10" />
            <Input
              id="mobile"
              {...register('mobile')}
              disabled={isLoading}
              placeholder="+39 333 1234567"
              className="h-11 pl-10 border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Indirizzo</h3>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address" className="text-sm font-medium text-slate-700 dark:text-slate-300">Via</Label>
          <Input
            id="address"
            {...register('address')}
            disabled={isLoading}
            placeholder="Via Roma 123"
            className="h-11 border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city" className="text-sm font-medium text-slate-700 dark:text-slate-300">Città</Label>
            <Input
              id="city"
              {...register('city')}
              disabled={isLoading}
              placeholder="Milano"
              className="h-11 border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="province" className="text-sm font-medium text-slate-700 dark:text-slate-300">Provincia</Label>
            <Input
              id="province"
              {...register('province')}
              disabled={isLoading}
              placeholder="MI"
              className="h-11 border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postal_code" className="text-sm font-medium text-slate-700 dark:text-slate-300">CAP</Label>
            <Input
              id="postal_code"
              {...register('postal_code')}
              disabled={isLoading}
              placeholder="20100"
              className="h-11 border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Note</h3>
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Note
          </Label>
          <Textarea
            id="notes"
            {...register('notes')}
            disabled={isLoading}
            placeholder="Note aggiuntive..."
            rows={4}
            className="resize-none border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="payment_notes" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Note Pagamento
          </Label>
          <Textarea
            id="payment_notes"
            {...register('payment_notes')}
            disabled={isLoading}
            placeholder="Es: 50% busta paga, 50% contanti..."
            rows={3}
            className="resize-none border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Annotazioni su accordi di pagamento personalizzati (busta/contanti, bonifico, etc.)
          </p>
        </div>
      </div>

      {/* Status & Safety */}
      <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="is_active"
            {...register('is_active')}
            disabled={isLoading}
            className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
          />
          <Label htmlFor="is_active" className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
            Collaboratore attivo
          </Label>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="has_safety_training"
            {...register('has_safety_training')}
            disabled={isLoading}
            className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
          />
          <Label htmlFor="has_safety_training" className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
            Formazione sicurezza completata
          </Label>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="can_drive_company_vehicles"
            {...register('can_drive_company_vehicles')}
            disabled={isLoading}
            className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
          />
          <Label htmlFor="can_drive_company_vehicles" className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
            Autorizzato alla guida mezzi aziendali
          </Label>
        </div>
      </div>
    </form>
  );
}

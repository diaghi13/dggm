'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Contractor, ContractorFormData } from '@/lib/types';
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
import { Briefcase, Mail, Phone, MapPin, Building2, DollarSign, FileText, User } from 'lucide-react';

const contractorSchema = z.object({
  company_name: z.string().min(1, 'Ragione sociale è obbligatoria'),
  contractor_type: z.enum(['cooperative', 'subcontractor', 'temporary_agency']),
  vat_number: z.string().min(1, 'Partita IVA è obbligatoria'),
  tax_code: z.string().optional().nullable(),
  email: z.string().email('Email non valida').optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  postal_code: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  contact_person: z.string().optional().nullable(),
  contact_email: z.string().email('Email non valida').optional().nullable().or(z.literal('')),
  contact_phone: z.string().optional().nullable(),
  iban: z.string().optional().nullable(),
  bank_name: z.string().optional().nullable(),
  payment_terms: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

type ContractorFormValues = z.infer<typeof contractorSchema>;

interface ContractorFormProps {
  contractor?: Contractor;
  onSubmit: (data: ContractorFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ContractorForm({ contractor, onSubmit, onCancel, isLoading }: ContractorFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ContractorFormValues>({
    resolver: zodResolver(contractorSchema),
    defaultValues: contractor
      ? {
          company_name: contractor.company_name,
          contractor_type: contractor.contractor_type,
          vat_number: contractor.vat_number || undefined,
          tax_code: contractor.tax_code || undefined,
          email: contractor.email || undefined,
          phone: contractor.phone || undefined,
          website: contractor.website || undefined,
          address: contractor.address || undefined,
          city: contractor.city || undefined,
          province: contractor.province || undefined,
          postal_code: contractor.postal_code || undefined,
          country: contractor.country || 'Italia',
          contact_person: contractor.contact_person || undefined,
          contact_email: contractor.contact_email || undefined,
          contact_phone: contractor.contact_phone || undefined,
          iban: contractor.iban || undefined,
          bank_name: contractor.bank_name || undefined,
          payment_terms: contractor.payment_terms || undefined,
          notes: contractor.notes || undefined,
          is_active: contractor.is_active,
        }
      : {
          contractor_type: 'cooperative' as const,
          country: 'Italia',
          is_active: true,
        },
  });

  const contractorType = watch('contractor_type');

  const handleFormSubmit = (data: ContractorFormValues) => {
    const formData: any = {
      company_name: data.company_name,
      contractor_type: data.contractor_type,
      vat_number: data.vat_number,
      tax_code: data.tax_code || null,
      email: data.email || null,
      phone: data.phone || null,
      website: data.website || null,
      address: data.address || null,
      city: data.city || null,
      province: data.province || null,
      postal_code: data.postal_code || null,
      country: data.country || null,
      contact_person: data.contact_person || null,
      contact_email: data.contact_email || null,
      contact_phone: data.contact_phone || null,
      iban: data.iban || null,
      bank_name: data.bank_name || null,
      payment_terms: data.payment_terms || null,
      notes: data.notes || null,
      is_active: data.is_active,
    };
    onSubmit(formData);
  };

  return (
    <form id="contractor-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Company Type */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Tipo Azienda</h3>
        </div>
        <div className="space-y-2">
          <Label htmlFor="contractor_type" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Tipo <span className="text-red-500">*</span>
          </Label>
          <Select
            value={contractorType}
            onValueChange={(value) => setValue('contractor_type', value as any)}
            disabled={isLoading}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Seleziona tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cooperative">Cooperativa</SelectItem>
              <SelectItem value="subcontractor">Subappaltatore</SelectItem>
              <SelectItem value="temporary_agency">Agenzia Interinale</SelectItem>
            </SelectContent>
          </Select>
          {errors.contractor_type && (
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <span className="text-red-500">⚠</span> {errors.contractor_type.message}
            </p>
          )}
        </div>
      </div>

      {/* Company Data */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Dati Aziendali</h3>
        </div>
        <div className="space-y-2">
          <Label htmlFor="company_name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Ragione Sociale <span className="text-red-500">*</span>
          </Label>
          <Input
            id="company_name"
            {...register('company_name')}
            disabled={isLoading}
            placeholder="Cooperativa Edile S.r.l."
            className="h-11 border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.company_name && (
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <span className="text-red-500">⚠</span> {errors.company_name.message}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="vat_number" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Partita IVA <span className="text-red-500">*</span>
            </Label>
            <Input
              id="vat_number"
              {...register('vat_number')}
              disabled={isLoading}
              placeholder="IT12345678901"
              className="h-11 border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500 font-mono"
            />
            {errors.vat_number && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <span className="text-red-500">⚠</span> {errors.vat_number.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="tax_code" className="text-sm font-medium text-slate-700 dark:text-slate-300">Codice Fiscale</Label>
            <Input
              id="tax_code"
              {...register('tax_code')}
              disabled={isLoading}
              placeholder="12345678901"
              className="h-11 border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500 font-mono"
            />
          </div>
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
                placeholder="info@cooperativa.it"
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
          <Label htmlFor="website" className="text-sm font-medium text-slate-700 dark:text-slate-300">Sito Web</Label>
          <Input
            id="website"
            {...register('website')}
            disabled={isLoading}
            placeholder="https://www.cooperativa.it"
            className="h-11 border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Contact Person */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Persona di Riferimento</h3>
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact_person" className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome Completo</Label>
          <Input
            id="contact_person"
            {...register('contact_person')}
            disabled={isLoading}
            placeholder="Mario Rossi"
            className="h-11 border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contact_email" className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Referente</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none z-10" />
              <Input
                id="contact_email"
                type="email"
                {...register('contact_email')}
                disabled={isLoading}
                placeholder="mario.rossi@cooperativa.it"
                className="h-11 pl-10 border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            {errors.contact_email && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <span className="text-red-500">⚠</span> {errors.contact_email.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_phone" className="text-sm font-medium text-slate-700 dark:text-slate-300">Telefono Referente</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none z-10" />
              <Input
                id="contact_phone"
                {...register('contact_phone')}
                disabled={isLoading}
                placeholder="+39 333 1234567"
                className="h-11 pl-10 border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
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

      {/* Banking Information */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Dati Bancari e Pagamento</h3>
        </div>
        <div className="space-y-2">
          <Label htmlFor="iban" className="text-sm font-medium text-slate-700 dark:text-slate-300">IBAN</Label>
          <Input
            id="iban"
            {...register('iban')}
            disabled={isLoading}
            placeholder="IT60 X054 2811 1010 0000 0123 456"
            className="h-11 border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500 font-mono"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bank_name" className="text-sm font-medium text-slate-700 dark:text-slate-300">Banca</Label>
            <Input
              id="bank_name"
              {...register('bank_name')}
              disabled={isLoading}
              placeholder="Intesa Sanpaolo"
              className="h-11 border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment_terms" className="text-sm font-medium text-slate-700 dark:text-slate-300">Termini di Pagamento</Label>
            <Input
              id="payment_terms"
              {...register('payment_terms')}
              disabled={isLoading}
              placeholder="30 giorni DF FM"
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
          <Textarea
            id="notes"
            {...register('notes')}
            disabled={isLoading}
            placeholder="Note aggiuntive..."
            rows={4}
            className="resize-none border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <input
          type="checkbox"
          id="is_active"
          {...register('is_active')}
          disabled={isLoading}
          className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
        />
        <Label htmlFor="is_active" className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
          Cooperativa attiva
        </Label>
      </div>
    </form>
  );
}

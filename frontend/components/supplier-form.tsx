'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Supplier, SupplierFormData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Factory, Mail, Phone, MapPin, Banknote, CreditCard, User, FileText, Globe } from 'lucide-react';

const supplierSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  vat_number: z.string().optional().nullable(),
  tax_code: z.string().optional().nullable(),
  email: z.string().email('Invalid email').optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  website: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  postal_code: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  payment_terms: z.string().optional().nullable(),
  delivery_terms: z.string().optional().nullable(),
  discount_percentage: z.number().min(0).max(100).optional().nullable(),
  iban: z.string().optional().nullable(),
  bank_name: z.string().optional().nullable(),
  contact_person: z.string().optional().nullable(),
  contact_email: z.string().email('Invalid email').optional().nullable().or(z.literal('')),
  contact_phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

interface SupplierFormProps {
  supplier?: Supplier;
  onSubmit: (data: SupplierFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function SupplierForm({ supplier, onSubmit, onCancel, isLoading }: SupplierFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: supplier
      ? {
          company_name: supplier.company_name,
          vat_number: supplier.vat_number,
          tax_code: supplier.tax_code,
          email: supplier.email,
          phone: supplier.phone,
          mobile: supplier.mobile,
          website: supplier.website,
          address: supplier.address,
          city: supplier.city,
          province: supplier.province,
          postal_code: supplier.postal_code,
          country: supplier.country || 'Italy',
          payment_terms: supplier.payment_terms,
          delivery_terms: supplier.delivery_terms,
          discount_percentage: supplier.discount_percentage ? parseFloat(supplier.discount_percentage) : undefined,
          iban: supplier.iban,
          bank_name: supplier.bank_name,
          contact_person: supplier.contact_person,
          contact_email: supplier.contact_email,
          contact_phone: supplier.contact_phone,
          notes: supplier.notes,
          is_active: supplier.is_active,
        }
      : {
          country: 'Italy',
          is_active: true,
        },
  });

  const handleFormSubmit = (data: SupplierFormValues) => {
    onSubmit(data as SupplierFormData);
  };

  return (
    <form id="supplier-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Company Info */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
          <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center">
            <Factory className="w-4 h-4 text-slate-600" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Informazioni Azienda</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="company_name" className="text-sm font-medium text-slate-700">
            Ragione Sociale <span className="text-red-500">*</span>
          </Label>
          <Input
            id="company_name"
            {...register('company_name')}
            disabled={isLoading}
            placeholder="Acme S.r.l."
            className="h-11 "
          />
          {errors.company_name && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <span className="text-red-500">⚠</span> {errors.company_name.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="vat_number" className="text-sm font-medium text-slate-700">Partita IVA</Label>
            <Input
              id="vat_number"
              {...register('vat_number')}
              disabled={isLoading}
              placeholder="IT12345678901"
              className="h-11 "
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tax_code" className="text-sm font-medium text-slate-700">Codice Fiscale</Label>
            <Input
              id="tax_code"
              {...register('tax_code')}
              disabled={isLoading}
              placeholder="12345678901"
              className="h-11 "
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
          <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center">
            <Mail className="w-4 h-4 text-slate-600" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Contatti</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
              <Input
                id="email"
                type="email"
                {...register('email')}
                disabled={isLoading}
                placeholder="info@azienda.it"
                className="h-11 pl-10 "
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <span className="text-red-500">⚠</span> {errors.email.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="website" className="text-sm font-medium text-slate-700">Sito Web</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
              <Input
                id="website"
                {...register('website')}
                disabled={isLoading}
                placeholder="https://azienda.it"
                className="h-11 pl-10 "
              />
            </div>
            {errors.website && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <span className="text-red-500">⚠</span> {errors.website.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium text-slate-700">Telefono</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
              <Input
                id="phone"
                {...register('phone')}
                disabled={isLoading}
                placeholder="+39 02 1234567"
                className="h-11 pl-10 "
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mobile" className="text-sm font-medium text-slate-700">Cellulare</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
              <Input
                id="mobile"
                {...register('mobile')}
                disabled={isLoading}
                placeholder="+39 333 1234567"
                className="h-11 pl-10 "
              />
            </div>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
          <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-slate-600" />
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
            className="h-11 "
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
              className="h-11 "
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="province" className="text-sm font-medium text-slate-700">Provincia</Label>
            <Input
              id="province"
              {...register('province')}
              disabled={isLoading}
              placeholder="MI"
              className="h-11 "
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postal_code" className="text-sm font-medium text-slate-700">CAP</Label>
            <Input
              id="postal_code"
              {...register('postal_code')}
              disabled={isLoading}
              placeholder="20100"
              className="h-11 "
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="country" className="text-sm font-medium text-slate-700">Nazione</Label>
          <Input
            id="country"
            {...register('country')}
            disabled={isLoading}
            placeholder="Italia"
            className="h-11 "
          />
        </div>
      </div>

      {/* Business Terms */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
          <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center">
            <Banknote className="w-4 h-4 text-slate-600" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Condizioni Commerciali</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="payment_terms" className="text-sm font-medium text-slate-700">Termini di Pagamento</Label>
            <Input
              id="payment_terms"
              {...register('payment_terms')}
              disabled={isLoading}
              placeholder="30 giorni"
              className="h-11 "
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="delivery_terms" className="text-sm font-medium text-slate-700">Termini di Consegna</Label>
            <Input
              id="delivery_terms"
              {...register('delivery_terms')}
              disabled={isLoading}
              placeholder="Consegna gratuita sopra 500 EUR"
              className="h-11 "
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="discount_percentage" className="text-sm font-medium text-slate-700">Sconto %</Label>
          <Input
            id="discount_percentage"
            type="number"
            step="0.01"
            {...register('discount_percentage', { valueAsNumber: true })}
            disabled={isLoading}
            placeholder="0.00"
            className="h-11 "
          />
        </div>
      </div>

      {/* Bank Details */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
          <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-slate-600" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Dati Bancari</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="iban" className="text-sm font-medium text-slate-700">IBAN</Label>
            <Input
              id="iban"
              {...register('iban')}
              disabled={isLoading}
              placeholder="IT60X0542811101000000123456"
              className="h-11 "
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bank_name" className="text-sm font-medium text-slate-700">Nome Banca</Label>
            <Input
              id="bank_name"
              {...register('bank_name')}
              disabled={isLoading}
              placeholder="Banca Intesa"
              className="h-11 "
            />
          </div>
        </div>
      </div>

      {/* Contact Person */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
          <div className="w-7 h-7 rounded bg-indigo-50 flex items-center justify-center">
            <User className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Referente</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_person" className="text-sm font-medium text-slate-700">Nome Referente</Label>
          <Input
            id="contact_person"
            {...register('contact_person')}
            disabled={isLoading}
            placeholder="Mario Rossi"
            className="h-11 "
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contact_email" className="text-sm font-medium text-slate-700">Email Referente</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
              <Input
                id="contact_email"
                type="email"
                {...register('contact_email')}
                disabled={isLoading}
                placeholder="mario@azienda.it"
                className="h-11 pl-10 "
              />
            </div>
            {errors.contact_email && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <span className="text-red-500">⚠</span> {errors.contact_email.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_phone" className="text-sm font-medium text-slate-700">Telefono Referente</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
              <Input
                id="contact_phone"
                {...register('contact_phone')}
                disabled={isLoading}
                placeholder="+39 335 1234567"
                className="h-11 pl-10 "
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
          <div className="w-7 h-7 rounded bg-slate-50 flex items-center justify-center">
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
            className="resize-none "
          />
        </div>
      </div>

      {/* Active Status */}
      <div className="flex items-center space-x-3 pt-4 border-t border-slate-200">
        <input
          type="checkbox"
          id="is_active"
          {...register('is_active')}
          disabled={isLoading}
          className="w-4 h-4 rounded border-slate-300 text-slate-600 dark:text-slate-400 focus:ring-slate-500"
        />
        <Label htmlFor="is_active" className="cursor-pointer text-sm font-medium text-slate-700">
          Fornitore attivo
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
          {isLoading ? 'Salvataggio...' : supplier ? 'Aggiorna Fornitore' : 'Crea Fornitore'}
        </Button>
      </div>
    </form>
  );
}

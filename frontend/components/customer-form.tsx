'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Customer, CustomerFormData } from '@/lib/types';
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
import { Users, Mail, Phone, MapPin, Building2, User, Banknote, FileText } from 'lucide-react';

const customerSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('individual'),
    first_name: z.string().min(1, 'Il nome è obbligatorio'),
    last_name: z.string().min(1, 'Il cognome è obbligatorio'),
    company_name: z.string().optional().nullable(),
    vat_number: z.string().optional().nullable(),
    tax_code: z.string().min(1, 'Il codice fiscale è obbligatorio'),
    email: z.string().email('Email non valida').optional().nullable().or(z.literal('')),
    phone: z.string().optional().nullable(),
    mobile: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    province: z.string()
      .refine(val => !val || val.length === 2, 'La provincia deve essere di 2 caratteri (es. MI)')
      .optional().nullable(),
    postal_code: z.string().optional().nullable(),
    country: z.string()
      .refine(val => !val || val.length === 2, 'Il paese deve essere un codice ISO di 2 caratteri (es. IT)')
      .optional().nullable(),
    payment_terms: z.string().optional().nullable(),
    discount_percentage: z.union([
      z.number().min(0, 'Lo sconto deve essere almeno 0').max(100, 'Lo sconto non può superare 100'),
      z.nan(),
      z.undefined(),
      z.null()
    ]).optional().nullable(),
    notes: z.string().optional().nullable(),
    is_active: z.boolean().optional(),
  }),
  z.object({
    type: z.literal('company'),
    first_name: z.string().optional().nullable(),
    last_name: z.string().optional().nullable(),
    company_name: z.string().min(1, 'La ragione sociale è obbligatoria'),
    vat_number: z.string().min(1, 'La partita IVA è obbligatoria'),
    tax_code: z.string().optional().nullable(),
    email: z.string().email('Email non valida').optional().nullable().or(z.literal('')),
    phone: z.string().optional().nullable(),
    mobile: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    province: z.string()
      .refine(val => !val || val.length === 2, 'La provincia deve essere di 2 caratteri (es. MI)')
      .optional().nullable(),
    postal_code: z.string().optional().nullable(),
    country: z.string()
      .refine(val => !val || val.length === 2, 'Il paese deve essere un codice ISO di 2 caratteri (es. IT)')
      .optional().nullable(),
    payment_terms: z.string().optional().nullable(),
    discount_percentage: z.union([
      z.number().min(0, 'Lo sconto deve essere almeno 0').max(100, 'Lo sconto non può superare 100'),
      z.nan(),
      z.undefined(),
      z.null()
    ]).optional().nullable(),
    notes: z.string().optional().nullable(),
    is_active: z.boolean().optional(),
  }),
]);

type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  id?: string;
  customer?: Customer;
  onSubmit: (data: CustomerFormData) => void;
  isLoading?: boolean;
}

export function CustomerForm({ id, customer, onSubmit, isLoading }: CustomerFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer
      ? ({
          type: customer.type,
          first_name: customer.first_name || undefined,
          last_name: customer.last_name || undefined,
          company_name: customer.company_name || undefined,
          vat_number: customer.vat_number || undefined,
          tax_code: customer.tax_code || undefined,
          email: customer.email || undefined,
          phone: customer.phone || undefined,
          mobile: customer.mobile || undefined,
          address: customer.address || undefined,
          city: customer.city || undefined,
          province: customer.province || undefined,
          postal_code: customer.postal_code || undefined,
          country: customer.country || 'IT',
          payment_terms: customer.payment_terms || undefined,
          discount_percentage: customer.discount_percentage ? parseFloat(customer.discount_percentage) : undefined,
          notes: customer.notes || undefined,
          is_active: customer.is_active,
        } as CustomerFormValues)
      : ({
          type: 'individual' as const,
          first_name: '',
          last_name: '',
          country: 'IT',
          is_active: true,
        } as CustomerFormValues),
  });

  const customerType = watch('type');

  const handleFormSubmit = (data: CustomerFormValues) => {
    // Handle discount_percentage: convert NaN, undefined, null to null, keep valid numbers
    let discountValue = null;
    if (data.discount_percentage !== undefined &&
        data.discount_percentage !== null &&
        !isNaN(data.discount_percentage)) {
      discountValue = data.discount_percentage;
    }

    // Base data common to both types
    const formData: CustomerFormData = {
      type: data.type,
      vat_number: data.vat_number || null,
      tax_code: data.tax_code || null,
      email: data.email || null,
      phone: data.phone || null,
      mobile: data.mobile || null,
      address: data.address || null,
      city: data.city || null,
      province: data.province || null,
      postal_code: data.postal_code || null,
      country: data.country || null,
      payment_terms: data.payment_terms || null,
      discount_percentage: discountValue,
      notes: data.notes || null,
      is_active: data.is_active,
    };

    // Add type-specific fields
    if (data.type === 'individual') {
      formData.first_name = data.first_name || null;
      formData.last_name = data.last_name || null;
      formData.company_name = null;
    } else if (data.type === 'company') {
      formData.company_name = data.company_name || null;
      formData.first_name = null;
      formData.last_name = null;
    }

    onSubmit(formData);
  };

  return (
    <form id={id || "customer-form"} onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Customer Type */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
          <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center">
            <Users className="w-4 h-4 text-slate-600" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Tipo Cliente</h3>
        </div>
        <div className="space-y-2">
          <Label htmlFor="type" className="text-sm font-medium text-slate-700">
            Tipo <span className="text-red-500">*</span>
          </Label>
          <Select
            value={customerType}
            onValueChange={(value) => setValue('type', value as 'individual' | 'company')}
            disabled={isLoading}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Seleziona tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">Privato</SelectItem>
              <SelectItem value="company">Azienda</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <span className="text-red-500">⚠</span> {errors.type.message}
            </p>
          )}
        </div>
      </div>

      {/* Individual Fields */}
      {customerType === 'individual' && (
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
            <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center">
              <User className="w-4 h-4 text-slate-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Dati Personali</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name" className="text-sm font-medium text-slate-700">
                Nome <span className="text-red-500">*</span>
              </Label>
              <Input
                id="first_name"
                {...register('first_name')}
                disabled={isLoading}
                placeholder="Mario"
                className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.first_name && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <span className="text-red-500">⚠</span> {errors.first_name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name" className="text-sm font-medium text-slate-700">
                Cognome <span className="text-red-500">*</span>
              </Label>
              <Input
                id="last_name"
                {...register('last_name')}
                disabled={isLoading}
                placeholder="Rossi"
                className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.last_name && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <span className="text-red-500">⚠</span> {errors.last_name.message}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="vat_number" className="text-sm font-medium text-slate-700">
                Partita IVA
              </Label>
              <Input
                id="vat_number"
                {...register('vat_number')}
                disabled={isLoading}
                placeholder="IT12345678901"
                className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.vat_number && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <span className="text-red-500">⚠</span> {errors.vat_number.message}
                </p>
              )}
              <p className="text-xs text-slate-500">Opzionale per privati</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax_code" className="text-sm font-medium text-slate-700">
                Codice Fiscale <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tax_code"
                {...register('tax_code')}
                disabled={isLoading}
                placeholder="RSSMRA80A01H501U"
                className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.tax_code && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <span className="text-red-500">⚠</span> {errors.tax_code.message}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Company Fields */}
      {customerType === 'company' && (
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
            <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-slate-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Dati Azienda</h3>
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
              className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.company_name && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <span className="text-red-500">⚠</span> {errors.company_name.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vat_number" className="text-sm font-medium text-slate-700">
                Partita IVA <span className="text-red-500">*</span>
              </Label>
              <Input
                id="vat_number"
                {...register('vat_number')}
                disabled={isLoading}
                placeholder="IT12345678901"
                className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.vat_number && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <span className="text-red-500">⚠</span> {errors.vat_number.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax_code" className="text-sm font-medium text-slate-700">
                Codice Fiscale
              </Label>
              <Input
                id="tax_code"
                {...register('tax_code')}
                disabled={isLoading}
                placeholder="12345678901"
                className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.tax_code && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <span className="text-red-500">⚠</span> {errors.tax_code.message}
                </p>
              )}
              <p className="text-xs text-slate-500">Opzionale per aziende</p>
            </div>
          </div>
        </div>
      )}

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
                placeholder="email@esempio.it"
                className="h-11 pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <span className="text-red-500">⚠</span> {errors.email.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium text-slate-700">Telefono</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
              <Input
                id="phone"
                {...register('phone')}
                disabled={isLoading}
                placeholder="+39 02 1234567"
                className="h-11 pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
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
              className="h-11 pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            />
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
              maxLength={2}
              className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500 uppercase"
            />
            {errors.province && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <span className="text-red-500">⚠</span> {errors.province.message}
              </p>
            )}
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
        <div className="space-y-2">
          <Label htmlFor="country" className="text-sm font-medium text-slate-700">Nazione</Label>
          <Input
            id="country"
            {...register('country')}
            disabled={isLoading}
            placeholder="IT"
            maxLength={2}
            className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500 uppercase"
          />
          {errors.country && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <span className="text-red-500">⚠</span> {errors.country.message}
            </p>
          )}
          <p className="text-xs text-slate-500">Codice ISO a 2 caratteri (es. IT, FR, DE)</p>
        </div>
      </div>

      {/* Billing Information */}
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
              className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            />
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
              className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            />
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
          className="w-4 h-4 rounded border-slate-300 text-slate-600 dark:text-slate-400 focus:ring-slate-500"
        />
        <Label htmlFor="is_active" className="cursor-pointer text-sm font-medium text-slate-700">
          Cliente attivo
        </Label>
      </div>
    </form>
  );
}

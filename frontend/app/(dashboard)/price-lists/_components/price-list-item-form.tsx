"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PriceListItem } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FormSection } from "@/components/form-section";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Package, Settings, Wrench } from "lucide-react";

const priceListItemSchema = z.object({
  sale_price: z
    .union([z.number().min(0), z.nan(), z.undefined(), z.null()])
    .optional()
    .nullable(),
  is_manual_price: z.boolean().optional().nullable(),
  rental_daily: z
    .union([z.number().min(0), z.nan(), z.undefined(), z.null()])
    .optional()
    .nullable(),
  rental_weekly: z
    .union([z.number().min(0), z.nan(), z.undefined(), z.null()])
    .optional()
    .nullable(),
  rental_monthly: z
    .union([z.number().min(0), z.nan(), z.undefined(), z.null()])
    .optional()
    .nullable(),
  is_manual_rental: z.boolean().optional().nullable(),
  is_active: z.boolean().optional(),
  notes: z.string().optional().nullable(),
});

type PriceListItemFormValues = z.infer<typeof priceListItemSchema>;

export interface PriceListItemFormData {
  sale_price?: number | null;
  is_manual_price?: boolean | null;
  rental_daily?: number | null;
  rental_weekly?: number | null;
  rental_monthly?: number | null;
  is_manual_rental?: boolean | null;
  is_active?: boolean;
  notes?: string | null;
}

interface PriceListItemFormProps {
  id?: string;
  item: PriceListItem;
  onSubmit: (data: PriceListItemFormData) => void;
  isLoading?: boolean;
  showSale?: boolean;
  showRental?: boolean;
  onRecalculate?: () => void;
}

export function PriceListItemForm({
  id = "price-list-item-form",
  item,
  onSubmit,
  isLoading,
  showSale = true,
  showRental = true,
  onRecalculate,
}: PriceListItemFormProps) {
  // Determina quali campi mostrare in base al tipo di prodotto
  const productType = item.product?.product_type;
  const isService = productType === 'service';
  const isComposite = productType === 'composite';
  const isArticle = productType === 'article';
  const isRentable = item.product?.is_rentable ?? true;
  
  // I servizi tipicamente non hanno noleggio, e solo gli articoli noleggiabili possono essere noleggiati
  const canRent = !isService && isRentable && showRental;
  const canSell = showSale;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
  } = useForm<PriceListItemFormValues>({
    resolver: zodResolver(priceListItemSchema),
    defaultValues: {
      sale_price: item.sale_price || undefined,
      is_manual_price: item.is_manual_price || false,
      rental_daily: item.rental_daily || undefined,
      rental_weekly: item.rental_weekly || undefined,
      rental_monthly: item.rental_monthly || undefined,
      is_manual_rental: item.is_manual_rental || false,
      is_active: item.is_active !== null ? item.is_active : true,
      notes: item.notes || undefined,
    },
  });

  const isManualPrice = watch("is_manual_price");
  const isManualRental = watch("is_manual_rental");
  const isActive = watch("is_active");

  const handleFormSubmit = (data: PriceListItemFormValues) => {
    const formData: PriceListItemFormData = {
      sale_price: data.sale_price || null,
      is_manual_price: data.is_manual_price || null,
      rental_daily: data.rental_daily || null,
      rental_weekly: data.rental_weekly || null,
      rental_monthly: data.rental_monthly || null,
      is_manual_rental: data.is_manual_rental || null,
      is_active: data.is_active,
      notes: data.notes || null,
    };

    onSubmit(formData);
  };

  return (
    <form id={id} onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Informazioni Prodotto */}
      <FormSection title="Prodotto" icon={Package}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              {item.product?.name}
            </p>
            {productType === 'service' && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
                Servizio
              </Badge>
            )}
            {productType === 'composite' && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800">
                Composito
              </Badge>
            )}
            {productType === 'article' && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                Articolo
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Codice: <span className="font-mono">{item.product?.code}</span>
          </p>
          {item.product?.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {item.product.description}
            </p>
          )}
          {isService && (
            <p className="text-xs text-blue-600 dark:text-blue-400 italic">
              I servizi non possono essere noleggiati
            </p>
          )}
          {!isService && !isRentable && (
            <p className="text-xs text-amber-600 dark:text-amber-400 italic">
              Questo prodotto non è configurato per il noleggio
            </p>
          )}
        </div>
      </FormSection>

      {/* Prezzi Vendita */}
      {canSell && (
        <FormSection title="Prezzi Vendita" icon={DollarSign}>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="is_manual_price" className="text-base font-medium">
                  Prezzo Manuale
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Usa un prezzo personalizzato invece del calcolo automatico
                </p>
              </div>
              <Switch
                id="is_manual_price"
                checked={isManualPrice ?? false}
                onCheckedChange={(checked) => setValue("is_manual_price", checked)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sale_price">Prezzo di Vendita</Label>
              <div className="relative">
                <Input
                  id="sale_price"
                  type="number"
                  step="0.01"
                  {...register("sale_price", { valueAsNumber: true })}
                  placeholder="0.00"
                  disabled={isLoading}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                  €
                </span>
              </div>
              {item.final_sale_price && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Prezzo calcolato: €{item.final_sale_price.toFixed(2)}
                </p>
              )}
            </div>
          </div>
        </FormSection>
      )}

      {/* Prezzi Noleggio */}
      {canRent && (
        <FormSection title="Prezzi Noleggio" icon={DollarSign}>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="is_manual_rental" className="text-base font-medium">
                  Prezzi Manuali
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Usa prezzi personalizzati invece del calcolo automatico
                </p>
              </div>
              <Switch
                id="is_manual_rental"
                checked={isManualRental ?? false}
                onCheckedChange={(checked) => setValue("is_manual_rental", checked)}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rental_daily">Giornaliero</Label>
                <div className="relative">
                  <Input
                    id="rental_daily"
                    type="number"
                    step="0.01"
                    {...register("rental_daily", { valueAsNumber: true })}
                    placeholder="0.00"
                    disabled={isLoading}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                    €
                  </span>
                </div>
                {item.final_rental_daily && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Calcolato: €{item.final_rental_daily.toFixed(2)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rental_weekly">Settimanale</Label>
                <div className="relative">
                  <Input
                    id="rental_weekly"
                    type="number"
                    step="0.01"
                    {...register("rental_weekly", { valueAsNumber: true })}
                    placeholder="0.00"
                    disabled={isLoading}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                    €
                  </span>
                </div>
                {item.final_rental_weekly && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Calcolato: €{item.final_rental_weekly.toFixed(2)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rental_monthly">Mensile</Label>
                <div className="relative">
                  <Input
                    id="rental_monthly"
                    type="number"
                    step="0.01"
                    {...register("rental_monthly", { valueAsNumber: true })}
                    placeholder="0.00"
                    disabled={isLoading}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                    €
                  </span>
                </div>
                {item.final_rental_monthly && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Calcolato: €{item.final_rental_monthly.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </FormSection>
      )}

      {/* Note e Stato */}
      <FormSection title="Opzioni" icon={Package}>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="is_active" className="text-base font-medium">
                Prodotto Attivo
              </Label>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Disattiva per escludere temporaneamente questo prodotto dal listino
              </p>
            </div>
            <Switch
              id="is_active"
              checked={isActive ?? true}
              onCheckedChange={(checked) => setValue("is_active", checked)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Note</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Note aggiuntive per questo prodotto nel listino..."
              rows={3}
              disabled={isLoading}
            />
          </div>
        </div>
      </FormSection>
    </form>
  );
}

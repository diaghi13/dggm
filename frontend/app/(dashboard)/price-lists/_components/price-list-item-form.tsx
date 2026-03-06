"use client";

import { useRef } from "react";
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
import { DollarSign, Package } from "lucide-react";

const priceListItemSchema = z.object({
  sale_price: z
    .union([z.number().min(0), z.nan(), z.undefined(), z.null()])
    .optional()
    .nullable(),
  is_manual_price: z.boolean().optional().nullable(),
  rental_hourly: z
    .union([z.number().min(0), z.nan(), z.undefined(), z.null()])
    .optional()
    .nullable(),
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
  rental_half_day: z
    .union([z.number().min(0), z.nan(), z.undefined(), z.null()])
    .optional()
    .nullable(),
  rental_seasonal: z
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
  rental_hourly?: number | null;
  rental_daily?: number | null;
  rental_weekly?: number | null;
  rental_monthly?: number | null;
  rental_half_day?: number | null;
  rental_seasonal?: number | null;
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

function PriceInput({
  id,
  label,
  sublabel,
  disabled,
  calculated,
  register,
}: {
  id: string;
  label: string;
  sublabel?: string;
  disabled: boolean;
  calculated?: number | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
}) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className={disabled ? "text-slate-400 dark:text-slate-600" : ""}
      >
        {label}
        {sublabel && (
          <span className="ml-1 text-xs font-normal text-slate-400">
            {sublabel}
          </span>
        )}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          step="0.01"
          {...register(id, { valueAsNumber: true })}
          placeholder="0.00"
          disabled={disabled}
          className={
            disabled ? "bg-slate-50 dark:bg-slate-900/50 text-slate-400" : ""
          }
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
          €
        </span>
      </div>
      {calculated != null && (
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Auto: €{calculated.toFixed(2)}
        </p>
      )}
    </div>
  );
}

export function PriceListItemForm({
  id = "price-list-item-form",
  item,
  onSubmit,
  isLoading,
  showSale = true,
  showRental = true,
}: PriceListItemFormProps) {
  const productType = item.product?.product_type;
  const isService = productType === "service";
  const isRentable = item.product?.is_rentable ?? true;

  // Services always show sale price (fixed fee), even in rental-only lists
  const canSell = showSale || isService;
  const canRent = !isService && isRentable && showRental;

  // Preserve both auto and manual values across toggles without losing them
  const autoSaleRef = useRef<number | undefined>(
    !item.is_manual_price ? (item.sale_price ?? undefined) : undefined,
  );
  const manualSaleRef = useRef<number | undefined>(
    item.is_manual_price ? (item.sale_price ?? undefined) : undefined,
  );

  const rentalFields = [
    "rental_hourly",
    "rental_half_day",
    "rental_daily",
    "rental_weekly",
    "rental_monthly",
    "rental_seasonal",
  ] as const;

  const autoRentalRef = useRef<Partial<Record<(typeof rentalFields)[number], number | undefined>>>(
    Object.fromEntries(
      rentalFields.map((f) => [
        f,
        !item.is_manual_rental ? ((item[f] as number | null) ?? undefined) : undefined,
      ]),
    ),
  );
  const manualRentalRef = useRef<Partial<Record<(typeof rentalFields)[number], number | undefined>>>(
    Object.fromEntries(
      rentalFields.map((f) => [
        f,
        item.is_manual_rental ? ((item[f] as number | null) ?? undefined) : undefined,
      ]),
    ),
  );

  const { register, handleSubmit, watch, setValue, getValues } =
    useForm<PriceListItemFormValues>({
      resolver: zodResolver(priceListItemSchema),
      defaultValues: {
        sale_price: item.sale_price ?? undefined,
        is_manual_price: item.is_manual_price ?? false,
        rental_hourly: item.rental_hourly ?? undefined,
        rental_daily: item.rental_daily ?? undefined,
        rental_weekly: item.rental_weekly ?? undefined,
        rental_monthly: item.rental_monthly ?? undefined,
        rental_half_day: item.rental_half_day ?? undefined,
        rental_seasonal: item.rental_seasonal ?? undefined,
        is_manual_rental: item.is_manual_rental ?? false,
        is_active: item.is_active !== null ? item.is_active : true,
        notes: item.notes ?? undefined,
      },
    });

  const isManualPrice = watch("is_manual_price");
  const isManualRental = watch("is_manual_rental");
  const isActive = watch("is_active");

  const handleFormSubmit = (data: PriceListItemFormValues) => {
    const formData: PriceListItemFormData = {
      sale_price: data.sale_price ?? null,
      // Use ?? false to avoid sending null for NOT NULL boolean DB columns
      is_manual_price: data.is_manual_price ?? false,
      rental_hourly: data.rental_hourly ?? null,
      rental_daily: data.rental_daily ?? null,
      rental_weekly: data.rental_weekly ?? null,
      rental_monthly: data.rental_monthly ?? null,
      rental_half_day: data.rental_half_day ?? null,
      rental_seasonal: data.rental_seasonal ?? null,
      is_manual_rental: data.is_manual_rental ?? false,
      is_active: data.is_active,
      notes: data.notes ?? null,
    };

    onSubmit(formData);
  };

  return (
    <form
      id={id}
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-6"
    >
      {/* Informazioni Prodotto */}
      <FormSection title="Prodotto" icon={Package}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              {item.product?.name}
            </p>
            {isService && (
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
              >
                Servizio
              </Badge>
            )}
            {productType === "composite" && (
              <Badge
                variant="outline"
                className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800"
              >
                Composito
              </Badge>
            )}
            {productType === "article" && (
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
              >
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
              I servizi vengono fatturati a tariffa fissa (es. trasporto,
              facchinaggio)
            </p>
          )}
          {!isService && !isRentable && (
            <p className="text-xs text-amber-600 dark:text-amber-400 italic">
              Questo prodotto non è configurato per il noleggio
            </p>
          )}
        </div>
      </FormSection>

      {/* Prezzi Vendita / Tariffa Servizio */}
      {canSell && (
        <FormSection
          title={isService ? "Tariffa Servizio" : "Prezzo di Vendita"}
          icon={DollarSign}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div className="space-y-0.5">
                <Label
                  htmlFor="is_manual_price"
                  className="text-base font-medium"
                >
                  {isService ? "Tariffa manuale" : "Prezzo manuale"}
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {isService
                    ? "Imposta manualmente la tariffa del servizio"
                    : "Usa un prezzo personalizzato invece del calcolo automatico"}
                </p>
              </div>
              <Switch
                id="is_manual_price"
                checked={isManualPrice ?? false}
                onCheckedChange={(checked) => {
                  const current = getValues("sale_price") ?? undefined;
                  if (checked) {
                    // Switching TO manual: save current auto value, restore manual value
                    autoSaleRef.current = current;
                    setValue("sale_price", manualSaleRef.current ?? current);
                  } else {
                    // Switching TO auto: save current manual value, restore auto value
                    manualSaleRef.current = current;
                    setValue("sale_price", autoSaleRef.current);
                  }
                  setValue("is_manual_price", checked);
                }}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="sale_price"
                className={
                  !isManualPrice ? "text-slate-400 dark:text-slate-600" : ""
                }
              >
                {isService ? "Tariffa (€)" : "Prezzo di vendita (€)"}
              </Label>
              <div className="relative">
                <Input
                  id="sale_price"
                  type="number"
                  step="0.01"
                  {...register("sale_price", { valueAsNumber: true })}
                  placeholder="0.00"
                  disabled={isLoading || !isManualPrice}
                  className={
                    !isManualPrice
                      ? "bg-slate-50 dark:bg-slate-900/50 text-slate-400"
                      : ""
                  }
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                  €
                </span>
              </div>
              {!isManualPrice && autoSaleRef.current == null && (
                <p className="text-xs text-amber-500 dark:text-amber-400">
                  Prezzo ricalcolato automaticamente al salvataggio
                </p>
              )}
            </div>
          </div>
        </FormSection>
      )}

      {/* Prezzi Noleggio */}
      {canRent && (
        <FormSection title="Prezzi Noleggio" icon={DollarSign}>
          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div className="space-y-0.5">
                <Label
                  htmlFor="is_manual_rental"
                  className="text-base font-medium"
                >
                  Prezzi manuali
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Sovrascrive il calcolo automatico del motore noleggio
                </p>
              </div>
              <Switch
                id="is_manual_rental"
                checked={isManualRental ?? false}
                onCheckedChange={(checked) => {
                  if (checked) {
                    // Switching TO manual: save auto values, restore manual values
                    rentalFields.forEach((f) => {
                      const current = getValues(f) ?? undefined;
                      autoRentalRef.current[f] = current;
                      setValue(f, manualRentalRef.current[f] ?? current);
                    });
                  } else {
                    // Switching TO auto: save manual values, restore auto values
                    rentalFields.forEach((f) => {
                      manualRentalRef.current[f] = getValues(f) ?? undefined;
                      setValue(f, autoRentalRef.current[f]);
                    });
                  }
                  setValue("is_manual_rental", checked);
                }}
                disabled={isLoading}
              />
            </div>

            {/* Tariffe brevi */}
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Tariffe brevi
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <PriceInput
                  id="rental_hourly"
                  label="Oraria"
                  sublabel="/h"
                  disabled={isLoading || !isManualRental}
                  calculated={item.final_rental_hourly}
                  register={register}
                />
                <PriceInput
                  id="rental_half_day"
                  label="Mezza giornata"
                  sublabel="½gg"
                  disabled={isLoading || !isManualRental}
                  calculated={item.final_rental_half_day}
                  register={register}
                />
                <PriceInput
                  id="rental_daily"
                  label="Giornaliero"
                  sublabel="/gg"
                  disabled={isLoading || !isManualRental}
                  calculated={item.final_rental_daily}
                  register={register}
                />
              </div>
            </div>

            {/* Tariffe estese */}
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Tariffe estese
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <PriceInput
                  id="rental_weekly"
                  label="Settimanale"
                  sublabel="/sett"
                  disabled={isLoading || !isManualRental}
                  calculated={item.final_rental_weekly}
                  register={register}
                />
                <PriceInput
                  id="rental_monthly"
                  label="Mensile"
                  sublabel="/mese"
                  disabled={isLoading || !isManualRental}
                  calculated={item.final_rental_monthly}
                  register={register}
                />
                <PriceInput
                  id="rental_seasonal"
                  label="Stagionale"
                  sublabel="/stag"
                  disabled={isLoading || !isManualRental}
                  calculated={item.final_rental_seasonal}
                  register={register}
                />
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
                Prodotto attivo
              </Label>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Disattiva per escludere temporaneamente questo prodotto dal
                listino
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

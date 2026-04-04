"use client";

import { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PriceListItem } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormSection } from "@/components/form-section";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Package } from "lucide-react";
import { CurrencyInput, CurrencyDisplay } from "@/components/ui/currency-input";

const priceListItemSchema = z.object({
  name: z.string().min(1, "Nome obbligatorio").optional().nullable(),
  code: z.string().min(1, "Codice obbligatorio").optional().nullable(),
  unit: z.string().optional().nullable(),
  vat_rate: z.number().optional().nullable(),
  item_type: z.enum(["article", "service", "composite", "kit"]).optional().nullable(),
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
  name?: string | null;
  code?: string | null;
  unit?: string | null;
  vat_rate?: number | null;
  item_type?: "article" | "service" | "composite" | "kit" | null;
  product_id?: number | null;
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
  value,
  onChange,
}: {
  id: string;
  label: string;
  sublabel?: string;
  disabled: boolean;
  calculated?: number | null;
  value: number | null | undefined;
  onChange: (v: number | null) => void;
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
      <CurrencyInput
        id={id}
        value={value ?? null}
        onChange={onChange}
        placeholder="0,00"
        disabled={disabled}
        className={
          disabled ? "bg-slate-50 dark:bg-slate-900/50 text-slate-400" : ""
        }
      />
      {calculated != null && (
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Auto: <CurrencyDisplay value={calculated} />
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
  const isRentable = item.product?.is_rentable ?? true;

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
        name: item.product?.name ?? item.name ?? "",
        code: item.product?.code ?? item.code ?? "",
        unit: item.product?.unit ?? item.unit ?? "",
        vat_rate: item.vat_rate ?? null,
        item_type: (item.item_type ?? item.product?.product_type ?? "article") as "article" | "service" | "composite" | "kit",
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
  const salePriceValue = watch("sale_price");
  const itemTypeValue = watch("item_type");
  const rentalHourlyValue = watch("rental_hourly");
  const rentalHalfDayValue = watch("rental_half_day");
  const rentalDailyValue = watch("rental_daily");
  const rentalWeeklyValue = watch("rental_weekly");
  const rentalMonthlyValue = watch("rental_monthly");
  const rentalSeasonalValue = watch("rental_seasonal");
  const vatRateValue = watch("vat_rate");

  // For manual items (no product), the type is controlled by the form field
  const effectiveType = productType ?? itemTypeValue ?? "article";
  const isService = effectiveType === "service";

  // Services always show sale price (fixed fee), even in rental-only lists
  const canSell = showSale || isService;
  // For manual items (no product), rental is controlled solely by the price list's applies_to (showRental)
  const canRent = !isService && showRental && (item.product ? isRentable : true);

  const handleFormSubmit = (data: PriceListItemFormValues) => {
    const formData: PriceListItemFormData = {
      name: data.name ?? null,
      code: data.code ?? null,
      unit: data.unit ?? null,
      vat_rate: data.vat_rate ?? null,
      item_type: data.item_type ?? null,
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
        <div className="space-y-4">
          {/* Se c'è un prodotto: mostra badge e info read-only */}
          {item.product && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {item.product.name}
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
                Codice: <span className="font-mono">{item.product.code}</span>
              </p>
              {item.product.description && (
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
          )}

          {/* Tipologia — solo per voci manuali (senza prodotto) */}
          {!item.product && (
            <div className="space-y-2">
              <Label htmlFor="item_type">Tipologia</Label>
              <Select
                value={itemTypeValue ?? "article"}
                onValueChange={(v) =>
                  setValue("item_type", v as "article" | "service" | "composite")
                }
                disabled={isLoading}
              >
                <SelectTrigger id="item_type">
                  <SelectValue placeholder="Seleziona tipologia..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="article">Articolo</SelectItem>
                  <SelectItem value="service">Servizio</SelectItem>
                  <SelectItem value="composite">Composito</SelectItem>
                  <SelectItem value="kit">Kit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Campi codice/nome: read-only se c'è prodotto, editabili altrimenti */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item_code">Codice *</Label>
              <Input
                id="item_code"
                {...register("code")}
                placeholder="Es. PROD-001"
                disabled={!!item.product || isLoading}
                className={
                  item.product ? "bg-slate-50 dark:bg-slate-900/50" : ""
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item_name">Nome *</Label>
              <Input
                id="item_name"
                {...register("name")}
                placeholder="Es. Ponteggio modulare"
                disabled={!!item.product || isLoading}
                className={
                  item.product ? "bg-slate-50 dark:bg-slate-900/50" : ""
                }
              />
            </div>
          </div>

          {/* Unità e IVA sempre editabili */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item_unit">Unità di misura</Label>
              <Input
                id="item_unit"
                {...register("unit")}
                placeholder="Es. pz, h, m², kg"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item_vat_rate">Aliquota IVA</Label>
              <Select
                value={vatRateValue != null ? vatRateValue.toString() : "__default__"}
                onValueChange={(v) =>
                  setValue("vat_rate", v && v !== "__default__" ? parseFloat(v) : null)
                }
                disabled={isLoading}
              >
                <SelectTrigger id="item_vat_rate">
                  <SelectValue placeholder="Default (22%)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__default__">Default (22%)</SelectItem>
                  <SelectItem value="22">22%</SelectItem>
                  <SelectItem value="10">10%</SelectItem>
                  <SelectItem value="4">4%</SelectItem>
                  <SelectItem value="0">0% (Esente)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
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
              <CurrencyInput
                id="sale_price"
                value={salePriceValue ?? null}
                onChange={(v) => setValue("sale_price", v ?? undefined)}
                placeholder="0,00"
                disabled={isLoading || !isManualPrice}
                className={
                  !isManualPrice
                    ? "bg-slate-50 dark:bg-slate-900/50 text-slate-400"
                    : ""
                }
              />
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
                  value={rentalHourlyValue}
                  onChange={(v) => setValue("rental_hourly", v ?? undefined)}
                />
                <PriceInput
                  id="rental_half_day"
                  label="Mezza giornata"
                  sublabel="½gg"
                  disabled={isLoading || !isManualRental}
                  calculated={item.final_rental_half_day}
                  value={rentalHalfDayValue}
                  onChange={(v) => setValue("rental_half_day", v ?? undefined)}
                />
                <PriceInput
                  id="rental_daily"
                  label="Giornaliero"
                  sublabel="/gg"
                  disabled={isLoading || !isManualRental}
                  calculated={item.final_rental_daily}
                  value={rentalDailyValue}
                  onChange={(v) => setValue("rental_daily", v ?? undefined)}
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
                  value={rentalWeeklyValue}
                  onChange={(v) => setValue("rental_weekly", v ?? undefined)}
                />
                <PriceInput
                  id="rental_monthly"
                  label="Mensile"
                  sublabel="/mese"
                  disabled={isLoading || !isManualRental}
                  calculated={item.final_rental_monthly}
                  value={rentalMonthlyValue}
                  onChange={(v) => setValue("rental_monthly", v ?? undefined)}
                />
                <PriceInput
                  id="rental_seasonal"
                  label="Stagionale"
                  sublabel="/stag"
                  disabled={isLoading || !isManualRental}
                  calculated={item.final_rental_seasonal}
                  value={rentalSeasonalValue}
                  onChange={(v) => setValue("rental_seasonal", v ?? undefined)}
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

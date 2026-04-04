"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Folder,
  FileText,
  ShoppingCart,
  Wrench,
  Calendar,
  Tag,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProductAutocomplete } from "@/app/(dashboard)/products/_components/product-autocomplete";
import { PriceListItemAutocomplete } from "./price-list-item-autocomplete";
import { productsApi } from "@/lib/api/products";
import { QuoteItem, ItemFormData } from "./types";
import { calculateTotals, calculateDurationMultiplier } from "./utils";
import { MediaSelector } from "./media-selector";
import {
  CurrencyInput,
  CurrencyDisplay,
  formatCurrency,
} from "@/components/ui/currency-input";

type EffectivePrice = {
  sale_price?: number | string | null;
  rental_hourly?: number | string | null;
  rental_half_day?: number | string | null;
  rental_daily?: number | string | null;
  rental_weekly?: number | string | null;
  rental_monthly?: number | string | null;
  rental_seasonal?: number | string | null;
  price_list_item_id?: number | null;
  source?: "price_list" | "calculated" | "manufacturer_msrp" | null;
  price_list_name?: string | null;
};

function PriceSourceBadge({
  source,
  priceListName,
}: {
  source?: string | null;
  priceListName?: string | null;
}) {
  if (!source) return null;
  if (source === "price_list") {
    return (
      <Badge
        variant="outline"
        className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800 gap-1"
      >
        <Tag className="w-3 h-3" />
        {priceListName ?? "Listino"}
      </Badge>
    );
  }
  if (source === "calculated") {
    return (
      <Badge
        variant="outline"
        className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800"
      >
        Calcolato
      </Badge>
    );
  }
  if (source === "manufacturer_msrp") {
    return (
      <Badge
        variant="outline"
        className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
      >
        Prezzo consigliato
      </Badge>
    );
  }
  return null;
}

const BILLING_UNIT_LABELS: Record<string, string> = {
  unit: "Unità",
  hour: "Ora",
  day: "Giorno",
  week: "Settimana",
  month: "Mese",
  flat: "Costo Fisso",
};

const DURATION_LABELS: Record<string, string> = {
  hour: "N. Ore",
  day: "N. Giorni",
  week: "N. Settimane",
  month: "N. Mesi",
};

const QUOTE_TYPE_CONFIG: Record<
  string,
  { label: string; description: string; color: string; icon: React.ReactNode }
> = {
  rental: {
    label: "Preventivo Noleggio",
    description: "Il prezzo viene calcolato per periodo (gg/ore/sett/mesi).",
    color:
      "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300",
    icon: <Wrench className="w-4 h-4" />,
  },
  event: {
    label: "Preventivo Evento",
    description: "La durata viene ereditata dal periodo evento del preventivo.",
    color:
      "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300",
    icon: <Calendar className="w-4 h-4" />,
  },
  sale: {
    label: "Preventivo Vendita",
    description: "",
    color: "",
    icon: <ShoppingCart className="w-4 h-4" />,
  },
};

function getPriceForBillingUnit(
  effectivePrice: EffectivePrice,
  billingUnit: string,
): number {
  switch (billingUnit) {
    case "hour":
      return Number(effectivePrice.rental_hourly || 0);
    case "day":
      return Number(effectivePrice.rental_daily || 0);
    case "week":
      return Number(effectivePrice.rental_weekly || 0);
    case "month":
      return Number(effectivePrice.rental_monthly || 0);
    default:
      return Number(effectivePrice.sale_price || 0);
  }
}

function getPriceForBillingUnitFromItem(
  item: App.Data.PriceListItemData,
  billingUnit: string,
): number {
  switch (billingUnit) {
    case "hour":
      return Number(item.rental_hourly ?? item.sale_price ?? 0);
    case "day":
      return Number(item.rental_daily ?? item.sale_price ?? 0);
    case "week":
      return Number(item.rental_weekly ?? item.sale_price ?? 0);
    case "month":
      return Number(item.rental_monthly ?? item.sale_price ?? 0);
    default:
      return Number(item.sale_price ?? 0);
  }
}

function buildFormulaPreview(item: ItemFormData): string | null {
  if (item.type === "section") {
    return null;
  }
  const billingUnit = item.billing_unit ?? "unit";
  const qty = Number(item.quantity) || 0;
  const price = Number(item.unit_price) || 0;
  const duration = Number(item.duration) || 1;
  const unitLabel = BILLING_UNIT_LABELS[billingUnit] ?? billingUnit;
  const totals = calculateTotals(item);
  const fmt = (n: number) => `€\u00a0${formatCurrency(n)}`;

  if (billingUnit === "flat") {
    return `Costo fisso: ${fmt(price)}`;
  }
  if (billingUnit === "unit") {
    return `${qty} × ${fmt(price)} = ${fmt(totals.subtotal)}`;
  }
  if (billingUnit === "day") {
    const coeff = calculateDurationMultiplier(duration);
    return `${qty} × ${fmt(price)}/gg × curva(${duration}gg) = ×${coeff.toFixed(3)} → ${fmt(totals.subtotal)}`;
  }
  return `${qty} × ${fmt(price)}/${unitLabel.toLowerCase()} × ${duration} = ${fmt(totals.subtotal)}`;
}

interface ItemFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  formData: ItemFormData;
  setFormData: (data: ItemFormData) => void;
  editingItem: QuoteItem | null;
  localItems: QuoteItem[];
  priceListId?: number | null;
  quoteType?: string | null;
  effectiveEventDays?: number | null;
}

/** Auto-deriva billing_unit da tipo prodotto + tipologia preventivo */
function getAutoBillingUnit(
  productUnit: string | null | undefined,
  quoteType: string | null | undefined,
  productType?: string | null,
  isLaborRole?: boolean,
): string {
  if (!quoteType || quoteType === "sale") return "unit";
  // Servizi normali sempre per unità, ma i ruoli personale seguono la durata
  if (productType === "service" && !isLaborRole) return "unit";
  if (productUnit?.toLowerCase() === "h") return "hour";
  return "day";
}

export function ItemFormDialog({
  isOpen,
  onClose,
  onSave,
  formData,
  setFormData,
  editingItem,
  localItems,
  priceListId,
  quoteType,
  effectiveEventDays,
}: ItemFormDialogProps) {
  // Persist the last fetched pricing data so we can re-price on billing_unit change
  const pricingRef = useRef<EffectivePrice | null>(null);
  const [selectedProductType, setSelectedProductType] = useState<string | null>(
    null,
  );
  const [selectedIsLaborRole, setSelectedIsLaborRole] = useState(false);
  const [pricingInfo, setPricingInfo] = useState<{
    source?: string | null;
    priceListName?: string | null;
  } | null>(null);
  const [mediaOpen, setMediaOpen] = useState(false);

  // When dialog opens: init product type from editing item; reset pricing info
  useEffect(() => {
    if (isOpen) {
      setSelectedProductType(editingItem?.product?.product_type ?? null); // eslint-disable-line react-hooks/set-state-in-effect
      setSelectedIsLaborRole(editingItem?.product?.is_labor_role ?? false); // eslint-disable-line react-hooks/set-state-in-effect
      setPricingInfo(null);
      setMediaOpen(false);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBillingUnitChange = useCallback(
    (newUnit: string) => {
      const updates: Partial<ItemFormData> = {
        billing_unit: newUnit as ItemFormData["billing_unit"],
      };
      // "flat" = forfait personalizzato: mantieni il prezzo corrente senza sovrascriverlo
      if (newUnit !== "flat" && pricingRef.current) {
        const newPrice = getPriceForBillingUnit(pricingRef.current, newUnit);
        if (newPrice > 0) {
          updates.unit_price = newPrice;
        }
      }
      // Flat/unit don't use duration
      if (newUnit === "flat" || newUnit === "unit") {
        updates.duration = null;
      }
      setFormData({ ...formData, ...updates });
    },
    [formData, setFormData],
  );

  const handlePriceListItemSelect = useCallback(
    (item: App.Data.PriceListItemData | null) => {
      if (!item) {
        setFormData({
          ...formData,
          product_id: null,
          price_list_item_id: null,
          code: "",
          description: "",
        });
        pricingRef.current = null;
        return;
      }

      const autoBillingUnit = getAutoBillingUnit(
        item.unit ?? undefined,
        quoteType,
        item.item_type ?? "article",
        false,
      );

      const pricingData: EffectivePrice = {
        sale_price: item.sale_price,
        rental_hourly: item.rental_hourly,
        rental_half_day: item.rental_half_day,
        rental_daily: item.rental_daily,
        rental_weekly: item.rental_weekly,
        rental_monthly: item.rental_monthly,
        rental_seasonal: item.rental_seasonal,
        price_list_item_id: item.id,
        source: "price_list",
        price_list_name: null,
      };
      pricingRef.current = pricingData;

      const unitPrice = getPriceForBillingUnitFromItem(item, autoBillingUnit);

      setFormData({
        ...formData,
        product_id: item.product_id ?? null,
        price_list_item_id: item.id ?? null,
        code: item.code ?? "",
        description: item.name ?? "",
        unit: item.unit ?? "",
        unit_price: unitPrice,
        billing_unit: autoBillingUnit as ItemFormData["billing_unit"],
        vat_rate: item.vat_rate ?? 22,
      });
    },
    [formData, quoteType, setFormData],
  );

  const isRentalOrEvent = quoteType === "rental" || quoteType === "event";
  // Labor-role services behave like articles (support day/hour billing), not plain services
  const isServiceProduct =
    (selectedProductType === "service" && !selectedIsLaborRole) ||
    (editingItem?.product?.product_type === "service" &&
      !(editingItem?.product?.is_labor_role ?? false));
  const quoteTypeConfig = quoteType ? QUOTE_TYPE_CONFIG[quoteType] : null;

  const totals = calculateTotals(formData);
  const isRentalMode =
    isRentalOrEvent &&
    !isServiceProduct &&
    !!formData.billing_unit &&
    formData.billing_unit !== "unit" &&
    formData.billing_unit !== "flat";
  const formulaPreview = buildFormulaPreview(formData);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden p-0 gap-0">
        {/* Header fisso */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {editingItem ? "Modifica Voce" : "Nuova Voce"}
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400 sr-only">
              {editingItem
                ? "Modifica i dettagli della voce"
                : "Inserisci i dettagli della nuova voce"}
            </DialogDescription>
          </DialogHeader>

          {/* Quote type context banner — compact border-left style */}
          {isRentalOrEvent && quoteTypeConfig && (
            <div
              className={`mt-3 flex items-center gap-2 px-3 py-2 rounded border-l-4 text-xs ${quoteTypeConfig.color}`}
            >
              {quoteTypeConfig.icon}
              <span className="font-medium">{quoteTypeConfig.label}</span>
              <span className="text-slate-500 dark:text-slate-400">—</span>
              <span>{quoteTypeConfig.description}</span>
              {quoteType === "event" && effectiveEventDays && (
                <span className="font-medium ml-1">
                  Periodo: {effectiveEventDays} gg.
                </span>
              )}
            </div>
          )}
        </div>

        {/* Body scrollabile */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 min-w-0">
          <div className="space-y-3">
            {/* ROW 1: Tipo + Sezione — inline */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  Tipo
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "section" | "item") =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger className="h-9 border-slate-300 dark:border-slate-600 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="item">Voce</SelectItem>
                    <SelectItem value="section">Sezione</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.type === "item" && (
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Sezione
                  </Label>
                  <Select
                    value={formData.parent_id?.toString() ?? "none"}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        parent_id: value === "none" ? null : parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger className="h-9 border-slate-300 dark:border-slate-600 text-sm">
                      <SelectValue placeholder="Nessuna" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span>Nessuna (livello root)</span>
                        </div>
                      </SelectItem>
                      {localItems
                        .filter(
                          (item) => item.type === "section" && !item.parent_id,
                        )
                        .map((section) => (
                          <SelectItem
                            key={section.id!}
                            value={section.id!.toString()}
                          >
                            <div className="flex items-center gap-2">
                              <Folder className="w-3.5 h-3.5 text-blue-600" />
                              <span>{section.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Placeholder when type=section so grid stays stable */}
              {formData.type === "section" && <div />}
            </div>

            {/* ROW 2: Prodotto dal catalogo (solo type=item) */}
            {formData.type === "item" && (
              <div className="space-y-1">
                {priceListId ? (
                  <>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                      Cerca nel listino *
                    </Label>
                    <PriceListItemAutocomplete
                      priceListId={priceListId}
                      onSelect={handlePriceListItemSelect}
                      value={formData.description || null}
                      quoteType={quoteType}
                      placeholder="Cerca per nome o codice..."
                    />
                  </>
                ) : (
                  <>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                      Prodotto dal Catalogo
                    </Label>
                    <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
                      <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                        ⚠ Nessun listino selezionato
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                        {quoteType === "rental" || quoteType === "event"
                          ? "I prezzi di noleggio potrebbero non essere corretti. Configura un listino nel preventivo."
                          : "I prezzi verranno calcolati dal costo prodotto."}
                      </p>
                    </div>
                    <ProductAutocomplete
                      value={formData.product_id}
                      priceListId={priceListId}
                      quoteType={quoteType}
                      onSelect={async (product) => {
                        if (product) {
                          const productType = product.product_type ?? null;
                          const isLaborRole = product.is_labor_role ?? false;
                          setSelectedProductType(productType);
                          setSelectedIsLaborRole(isLaborRole);
                          // Auto-deriva billing_unit da tipo prodotto + tipologia preventivo
                          const autoBillingUnit = getAutoBillingUnit(
                            product.unit,
                            quoteType,
                            productType,
                            isLaborRole,
                          );
                          try {
                            const pricingData = await productsApi.getPricing(
                              product.id!,
                              priceListId != null
                                ? { price_list_id: priceListId }
                                : undefined,
                            );

                            const ep: EffectivePrice =
                              pricingData.effective_price ?? {};
                            pricingRef.current = ep;
                            setPricingInfo({
                              source: ep.source,
                              priceListName: ep.price_list_name,
                            });

                            const priceFromBillingUnit = getPriceForBillingUnit(
                              ep,
                              autoBillingUnit,
                            );
                            const fallbackPrice =
                              quoteType === "rental" || quoteType === "event"
                                ? Number(
                                    ep.rental_daily ||
                                      ep.rental_hourly ||
                                      ep.sale_price ||
                                      0,
                                  )
                                : Number(
                                    ep.sale_price || product.standard_cost || 0,
                                  );
                            const unitPrice =
                              priceFromBillingUnit || fallbackPrice;

                            setFormData({
                              ...formData,
                              product_id: product.id,
                              price_list_item_id:
                                ep.price_list_item_id ?? null,
                              code: product.code || "",
                              description: product.name || "",
                              unit: product.unit || "",
                              unit_price: unitPrice,
                              billing_unit:
                                autoBillingUnit as ItemFormData["billing_unit"],
                              vat_rate: formData.vat_rate || 22,
                            });
                          } catch {
                            pricingRef.current = null;
                            setPricingInfo(null);
                            setFormData({
                              ...formData,
                              product_id: product.id,
                              price_list_item_id: null,
                              code: product.code || "",
                              description: product.name || "",
                              unit: product.unit || "",
                              unit_price: Number(product.standard_cost || 0),
                              billing_unit:
                                autoBillingUnit as ItemFormData["billing_unit"],
                              vat_rate: formData.vat_rate || 22,
                            });
                          }
                        } else {
                          pricingRef.current = null;
                          setSelectedProductType(null);
                          setSelectedIsLaborRole(false);
                          setPricingInfo(null);
                          setFormData({
                            ...formData,
                            product_id: null,
                            price_list_item_id: null,
                          });
                        }
                      }}
                      placeholder="Cerca prodotto nel catalogo..."
                    />
                    {selectedIsLaborRole && (
                      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
                        <Users className="w-3.5 h-3.5 shrink-0" />
                        Ruolo personale — verrà creato uno slot da assegnare
                        quando il preventivo è convertito in progetto
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ROW 3: Codice */}
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                Codice
              </Label>
              <Input
                value={formData.code ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="ART-001"
                className="h-9 text-sm border-slate-300 dark:border-slate-600 focus:border-blue-500"
              />
            </div>

            {/* ROW 4: Descrizione (textarea) */}
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                Descrizione *
              </Label>
              <Textarea
                value={formData.description ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descrizione della voce"
                rows={2}
                className="text-sm border-slate-300 dark:border-slate-600 focus:border-blue-500 resize-none"
              />
            </div>

            {/* ROWS 4+: Solo per type=item */}
            {formData.type === "item" && (
              <>
                {/* ROW 4: Pricing — QTÀ | UM | PREZZO | SCONTO% | IVA% | TOTALE */}
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-3 space-y-2 overflow-hidden">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Prezzi
                  </p>

                  {/* Service notice in rental/event quotes */}
                  {isRentalOrEvent && isServiceProduct && (
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
                      <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                      Servizio — fatturato a prezzo fisso (vendita)
                    </div>
                  )}

                  {/* Main pricing grid */}
                  <div className="flex flex-wrap gap-2 items-end">
                    {/* QTÀ */}
                    <div className="w-[72px] shrink-0 space-y-1">
                      <Label className="text-xs text-slate-500 dark:text-slate-400">
                        Qtà *
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.quantity ?? 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            quantity: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="h-9 text-sm border-slate-300 dark:border-slate-600 focus:border-blue-500"
                      />
                    </div>

                    {/* UM */}
                    <div className="w-[70px] shrink-0 space-y-1">
                      <Label className="text-xs text-slate-500 dark:text-slate-400">
                        U.M.
                      </Label>
                      <Input
                        value={formData.unit ?? ""}
                        onChange={(e) =>
                          setFormData({ ...formData, unit: e.target.value })
                        }
                        placeholder="pz"
                        className="h-9 text-sm border-slate-300 dark:border-slate-600 focus:border-blue-500"
                      />
                    </div>

                    {/* Prezzo */}
                    <div className="flex-1 min-w-[120px] space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Label className="text-xs text-slate-500 dark:text-slate-400">
                          Prezzo *
                        </Label>
                        <PriceSourceBadge
                          source={pricingInfo?.source}
                          priceListName={pricingInfo?.priceListName}
                        />
                      </div>
                      <CurrencyInput
                        value={formData.unit_price ?? null}
                        onChange={(v) =>
                          setFormData({
                            ...formData,
                            unit_price: v ?? 0,
                          })
                        }
                        className="border-slate-300 dark:border-slate-600"
                      />
                    </div>

                    {/* Sconto% */}
                    <div className="w-[80px] shrink-0 space-y-1">
                      <Label className="text-xs text-slate-500 dark:text-slate-400">
                        Sconto %
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.discount_percentage ?? 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discount_percentage:
                              parseFloat(e.target.value) || 0,
                          })
                        }
                        className="h-9 text-sm border-slate-300 dark:border-slate-600 focus:border-blue-500"
                      />
                    </div>

                    {/* IVA% */}
                    <div className="w-[100px] shrink-0 space-y-1">
                      <Label className="text-xs text-slate-500 dark:text-slate-400">
                        IVA %
                      </Label>
                      <Select
                        value={formData.vat_rate?.toString() ?? "22"}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            vat_rate: parseFloat(value),
                          })
                        }
                      >
                        <SelectTrigger className="h-9 text-sm border-slate-300 dark:border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0%</SelectItem>
                          <SelectItem value="4">4%</SelectItem>
                          <SelectItem value="5">5%</SelectItem>
                          <SelectItem value="10">10%</SelectItem>
                          <SelectItem value="22">22%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Totale summary bar */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
                    <span>
                      Subtotale:{" "}
                      <CurrencyDisplay
                        value={totals.subtotal}
                        bold
                        className="text-slate-800 dark:text-slate-200"
                      />
                    </span>
                    {(formData.discount_percentage ?? 0) > 0 && (
                      <span>
                        Sconto:{" "}
                        <CurrencyDisplay
                          value={totals.discount_amount}
                          bold
                          className="text-red-600 dark:text-red-400"
                        />
                      </span>
                    )}
                    <span>
                      Imponibile:{" "}
                      <CurrencyDisplay
                        value={totals.total}
                        bold
                        className="text-slate-800 dark:text-slate-200"
                      />
                    </span>
                    {(formData.vat_rate ?? 0) > 0 && (
                      <span>
                        IVA:{" "}
                        <CurrencyDisplay
                          value={totals.vat_amount}
                          bold
                          className="text-slate-800 dark:text-slate-200"
                        />
                      </span>
                    )}
                    <span className="ml-auto font-bold text-sm text-blue-600 dark:text-blue-400">
                      Totale:{" "}
                      <CurrencyDisplay
                        value={totals.total_with_vat}
                        bold
                        className="text-blue-600 dark:text-blue-400"
                      />
                    </span>
                  </div>
                </div>

                {/* ROW 5: Rental controls (solo rental/event, non-service) */}
                {isRentalOrEvent && !isServiceProduct && (
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-3 space-y-2 overflow-hidden">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Modalità Noleggio
                    </p>

                    <div className="space-y-3">
                      {/* Riga 1: Toggle Vendita/Noleggio */}
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-500 dark:text-slate-400">
                          Modalità
                        </Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={
                              !formData.billing_unit ||
                              formData.billing_unit === "unit"
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            className={
                              !formData.billing_unit ||
                              formData.billing_unit === "unit"
                                ? "h-9 gap-1.5 text-xs px-3"
                                : "h-9 gap-1.5 text-xs px-3 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                            }
                            onClick={() => handleBillingUnitChange("unit")}
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            Vendita
                          </Button>
                          <Button
                            type="button"
                            variant={
                              !!formData.billing_unit &&
                              formData.billing_unit !== "unit"
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            className={
                              !!formData.billing_unit &&
                              formData.billing_unit !== "unit"
                                ? "h-9 gap-1.5 text-xs px-3"
                                : "h-9 gap-1.5 text-xs px-3 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                            }
                            onClick={() => {
                              const currentUnit = formData.billing_unit;
                              if (!currentUnit || currentUnit === "unit") {
                                handleBillingUnitChange("day");
                              }
                            }}
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            Noleggio
                          </Button>
                        </div>
                      </div>

                      {/* Riga 2: Unità fatturazione + Durata (solo in rental mode) */}
                      {isRentalMode && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-slate-500 dark:text-slate-400">
                              Unità fatturazione
                            </Label>
                            <Select
                              value={formData.billing_unit ?? "day"}
                              onValueChange={handleBillingUnitChange}
                            >
                              <SelectTrigger className="h-9 text-sm border-slate-300 dark:border-slate-600">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="hour">Ora</SelectItem>
                                <SelectItem value="day">Giorno</SelectItem>
                                <SelectItem value="week">Settimana</SelectItem>
                                <SelectItem value="month">Mese</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-slate-500 dark:text-slate-400">
                              {DURATION_LABELS[
                                formData.billing_unit ?? "day"
                              ] ?? "Durata"}
                            </Label>
                            <Input
                              type="number"
                              step="0.5"
                              min="0"
                              value={formData.duration ?? ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  duration: parseFloat(e.target.value) || null,
                                })
                              }
                              placeholder={
                                effectiveEventDays &&
                                formData.billing_unit === "day"
                                  ? `${effectiveEventDays}`
                                  : "5"
                              }
                              className="h-9 text-sm border-slate-300 dark:border-slate-600 focus:border-blue-500"
                            />
                            {effectiveEventDays &&
                              formData.billing_unit === "day" &&
                              !formData.duration && (
                                <p className="text-xs text-slate-400 dark:text-slate-500 leading-tight">
                                  Eredita {effectiveEventDays} gg
                                </p>
                              )}
                          </div>
                        </div>
                      )}

                      {/* Riga 3: Formula preview (solo in rental mode) */}
                      {isRentalMode && formulaPreview && (
                        <div className="px-3 py-2 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                            {formulaPreview}
                          </span>
                        </div>
                      )}

                      {/* Checkbox Costo Fisso */}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="billing-flat"
                          checked={formData.billing_unit === "flat"}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleBillingUnitChange("flat");
                            } else {
                              // Torna a noleggio giornaliero, non a vendita
                              handleBillingUnitChange("day");
                            }
                          }}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label
                          htmlFor="billing-flat"
                          className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer"
                        >
                          Costo Fisso (ignora quantità e durata)
                        </Label>
                      </div>
                    </div>
                  </div>
                )}

                {/* ROW 6: Note */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Note interne (opzionale)
                  </Label>
                  <Textarea
                    value={formData.notes ?? ""}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Note aggiuntive..."
                    rows={2}
                    className="text-sm border-slate-300 dark:border-slate-600 focus:border-blue-500 resize-none"
                  />
                </div>

                {/* ROW 7: Nascondi prezzo unitario */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <input
                    type="checkbox"
                    id="hide-price"
                    checked={formData.hide_unit_price ?? false}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hide_unit_price: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <Label
                      htmlFor="hide-price"
                      className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer font-medium"
                    >
                      Nascondi prezzo unitario nel preventivo
                    </Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Il totale riga rimane visibile, ma il prezzo unitario non
                      viene stampato
                    </p>
                  </div>
                </div>

                {/* ROW 8: Media (collassato, espandibile) */}
                {formData.product_id && (
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setMediaOpen((v) => !v)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      {mediaOpen ? "▲" : "▼"} Allega media al PDF
                      {(formData.included_media_ids ?? []).length > 0 && (
                        <Badge variant="secondary" className="text-xs ml-1">
                          {(formData.included_media_ids ?? []).length}
                        </Badge>
                      )}
                    </button>
                    {mediaOpen && (
                      <MediaSelector
                        productId={formData.product_id}
                        value={formData.included_media_ids ?? []}
                        onChange={(ids) =>
                          setFormData({ ...formData, included_media_ids: ids })
                        }
                      />
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer fisso */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 shrink-0">
          <DialogFooter>
            <Button
              variant="outline"
              onClick={onClose}
              className="border-slate-300 dark:border-slate-600"
            >
              Annulla
            </Button>
            <Button
              onClick={onSave}
              disabled={!formData.description}
              className="shadow-md"
            >
              {editingItem ? "Salva Modifiche" : "Aggiungi Voce"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

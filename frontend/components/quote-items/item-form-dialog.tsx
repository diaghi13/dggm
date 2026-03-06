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
import { Folder, FileText, ShoppingCart, Wrench, Calendar, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProductAutocomplete } from "@/app/(dashboard)/products/_components/product-autocomplete";
import { productsApi } from "@/lib/api/products";
import { QuoteItem, ItemFormData } from "./types";
import { calculateTotals, calculateDurationMultiplier } from "./utils";
import { MediaSelector } from "./media-selector";

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

function PriceSourceBadge({ source, priceListName }: { source?: string | null; priceListName?: string | null }) {
  if (!source) return null;
  if (source === "price_list") {
    return (
      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800 gap-1">
        <Tag className="w-3 h-3" />
        {priceListName ?? "Listino"}
      </Badge>
    );
  }
  if (source === "calculated") {
    return (
      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800">
        Calcolato
      </Badge>
    );
  }
  if (source === "manufacturer_msrp") {
    return (
      <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
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

const QUOTE_TYPE_CONFIG: Record<string, { label: string; description: string; color: string; icon: React.ReactNode }> = {
  rental: {
    label: "Preventivo Noleggio",
    description: "Il prezzo viene calcolato per periodo (gg/ore/sett/mesi).",
    color: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300",
    icon: <Wrench className="w-4 h-4" />,
  },
  event: {
    label: "Preventivo Evento",
    description: "La durata viene ereditata dal periodo evento del preventivo.",
    color: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300",
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

  if (billingUnit === "flat") {
    return `Costo fisso: €\u00a0${price.toFixed(2)}`;
  }
  if (billingUnit === "unit") {
    return `${qty} × €\u00a0${price.toFixed(2)} = €\u00a0${totals.subtotal.toFixed(2)}`;
  }
  if (billingUnit === "day") {
    const coeff = calculateDurationMultiplier(duration);
    return `${qty} × €\u00a0${price.toFixed(2)}/gg × curva(${duration}gg) = ×${coeff.toFixed(3)} → €\u00a0${totals.subtotal.toFixed(2)}`;
  }
  return `${qty} × €\u00a0${price.toFixed(2)}/${unitLabel.toLowerCase()} × ${duration} = €\u00a0${totals.subtotal.toFixed(2)}`;
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
): string {
  if (!quoteType || quoteType === "sale") return "unit";
  if (productType === "service") return "unit"; // Servizi sempre per unità anche in noleggio
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
  const [selectedProductType, setSelectedProductType] = useState<string | null>(null);
  const [pricingInfo, setPricingInfo] = useState<{ source?: string | null; priceListName?: string | null } | null>(null);

  // When dialog opens: init product type from editing item; reset pricing info
  useEffect(() => {
    if (isOpen) {
      setSelectedProductType(editingItem?.product?.product_type ?? null); // eslint-disable-line react-hooks/set-state-in-effect
      setPricingInfo(null);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBillingUnitChange = useCallback(
    (newUnit: string) => {
      const updates: Partial<ItemFormData> = { billing_unit: newUnit as ItemFormData["billing_unit"] };
      if (pricingRef.current) {
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

  const isRentalOrEvent = quoteType === "rental" || quoteType === "event";
  const isServiceProduct =
    selectedProductType === "service" ||
    editingItem?.product?.product_type === "service";
  const quoteTypeConfig = quoteType ? QUOTE_TYPE_CONFIG[quoteType] : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {editingItem ? "Modifica Voce" : "Nuova Voce"}
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            {editingItem
              ? "Modifica i dettagli della voce"
              : "Inserisci i dettagli della nuova voce"}
          </DialogDescription>
        </DialogHeader>

        {/* Quote type context banner */}
        {isRentalOrEvent && quoteTypeConfig && (
          <div className={`flex items-start gap-2 p-3 rounded-lg border text-sm ${quoteTypeConfig.color}`}>
            {quoteTypeConfig.icon}
            <div>
              <span className="font-medium">{quoteTypeConfig.label}</span>
              {" — "}
              <span>{quoteTypeConfig.description}</span>
              {quoteType === "event" && effectiveEventDays && (
                <span className="ml-1 font-medium">Periodo: {effectiveEventDays} gg.</span>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4 py-4">
          {/* Type Selection */}
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium">Tipo</Label>
            <Select
              value={formData.type}
              onValueChange={(value: "section" | "item") =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger className="h-11 border-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="item">Voce</SelectItem>
                <SelectItem value="section">Sezione</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Parent Section Selection */}
          {formData.type === "item" && (
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">
                Sezione (opzionale)
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
                <SelectTrigger className="h-11 border-slate-300">
                  <SelectValue placeholder="Nessuna sezione (root level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span>Nessuna sezione (root level)</span>
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
                          <Folder className="w-4 h-4 text-blue-600" />
                          <span>{section.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Seleziona una sezione per organizzare la voce, o lascia vuoto
                per il livello principale
              </p>
            </div>
          )}

          {/* Price List Item Selection */}
          {formData.type === "item" && (
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">
                Articolo dal Catalogo (opzionale)
              </Label>
              {!priceListId && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  💡 Seleziona un listino prezzi nel preventivo per utilizzare i
                  prezzi configurati
                </div>
              )}
              <ProductAutocomplete
                value={formData.product_id}
                priceListId={priceListId}
                quoteType={quoteType}
                onSelect={async (product) => {
                  if (product) {
                    const productType = product.product_type ?? null;
                    setSelectedProductType(productType);
                    // Auto-deriva billing_unit da tipo prodotto + tipologia preventivo
                    const autoBillingUnit = getAutoBillingUnit(product.unit, quoteType, productType);
                    try {
                      const pricingData = await productsApi.getPricing(
                        product.id!,
                        priceListId ?? undefined,
                      );

                      const ep: EffectivePrice = pricingData.effective_price ?? {};
                      pricingRef.current = ep;
                      setPricingInfo({ source: ep.source, priceListName: ep.price_list_name });

                      const unitPrice =
                        getPriceForBillingUnit(ep, autoBillingUnit) ||
                        Number(ep.sale_price || product.standard_cost || 0);

                      setFormData({
                        ...formData,
                        product_id: product.id,
                        price_list_item_id: ep.price_list_item_id ?? null,
                        code: product.code || "",
                        description: product.name || "",
                        unit: product.unit || "",
                        unit_price: unitPrice,
                        billing_unit: autoBillingUnit as ItemFormData["billing_unit"],
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
                        billing_unit: autoBillingUnit as ItemFormData["billing_unit"],
                        vat_rate: formData.vat_rate || 22,
                      });
                    }
                  } else {
                    pricingRef.current = null;
                    setSelectedProductType(null);
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
              <p className="text-xs text-slate-500">
                {priceListId
                  ? "Il prezzo verrà preso dal listino selezionato nel preventivo"
                  : "Verrà usato il costo standard del prodotto"}
              </p>
            </div>
          )}

          {/* Code */}
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium">
              Codice (opzionale)
            </Label>
            <Input
              value={formData.code ?? ""}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
              placeholder="Es: ART-001"
              className="h-11 border-slate-300 focus:border-blue-500"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium">Descrizione *</Label>
            <Input
              value={formData.description ?? ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Descrizione della voce"
              className="h-11 border-slate-300 focus:border-blue-500"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium">
              Note (opzionale)
            </Label>
            <Textarea
              value={formData.notes ?? ""}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Note aggiuntive..."
              rows={3}
              className="border-slate-300 focus:border-blue-500"
            />
          </div>

          {/* Show Subtotal for Sections */}
          {/* {formData.type === "section" && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <input
                type="checkbox"
                id="show-subtotal"
                checked={formData.show_subtotal ?? true}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    show_subtotal: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <Label
                htmlFor="show-subtotal"
                className="text-sm text-slate-700 cursor-pointer flex-1"
              >
                Mostra subtotale della sezione
              </Label>
            </div>
          )} */}

          {formData.type === "item" && (
            <>
              {/* Quantity & Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">
                    Quantità *
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
                    className="h-11 border-slate-300 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">
                    Unità di Misura
                  </Label>
                  <Input
                    value={formData.unit ?? ""}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    placeholder="Es: pz, m, kg"
                    className="h-11 border-slate-300 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Service notice in rental/event quotes */}
              {isRentalOrEvent && isServiceProduct && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
                  <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                  Servizio — fatturato a prezzo fisso (vendita)
                </div>
              )}

              {/* Billing Unit — hidden for sale quotes and services (always "unit") */}
              {isRentalOrEvent && !isServiceProduct ? (
                <div className="space-y-3">
                  {/* Vendita / Noleggio toggle */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-medium">
                      Modalità Prezzo
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={
                          !formData.billing_unit || formData.billing_unit === "unit" || formData.billing_unit === "flat"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        className={
                          !formData.billing_unit || formData.billing_unit === "unit" || formData.billing_unit === "flat"
                            ? "flex-1 gap-2"
                            : "flex-1 gap-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                        }
                        onClick={() => handleBillingUnitChange("unit")}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Vendita
                      </Button>
                      <Button
                        type="button"
                        variant={
                          !!formData.billing_unit && formData.billing_unit !== "unit" && formData.billing_unit !== "flat"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        className={
                          !!formData.billing_unit && formData.billing_unit !== "unit" && formData.billing_unit !== "flat"
                            ? "flex-1 gap-2"
                            : "flex-1 gap-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                        }
                        onClick={() => {
                          const currentUnit = formData.billing_unit;
                          // Switch to rental mode — use "day" if currently in sale mode or unset
                          if (!currentUnit || currentUnit === "unit" || currentUnit === "flat") {
                            handleBillingUnitChange("day");
                          }
                          // Otherwise already in rental mode — no-op
                        }}
                      >
                        <Wrench className="w-4 h-4" />
                        Noleggio
                      </Button>
                    </div>
                  </div>

                  {/* Billing unit selector — only shown in rental mode */}
                  {!!formData.billing_unit && formData.billing_unit !== "unit" && formData.billing_unit !== "flat" && (
                    <div className="space-y-2">
                      <Label className="text-slate-700 dark:text-slate-300 font-medium">
                        Unità di Fatturazione
                      </Label>
                      <Select
                        value={formData.billing_unit ?? "day"}
                        onValueChange={handleBillingUnitChange}
                      >
                        <SelectTrigger className="h-11 border-slate-300 dark:border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hour">Ora (qty × prezzo × ore)</SelectItem>
                          <SelectItem value="day">Giorno (qty × prezzo × giorni^0.70)</SelectItem>
                          <SelectItem value="week">Settimana (qty × prezzo × settimane)</SelectItem>
                          <SelectItem value="month">Mese (qty × prezzo × mesi)</SelectItem>
                        </SelectContent>
                      </Select>
                      {formData.product_id && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Auto-derivato dal tipo prodotto — modifica se necessario
                        </p>
                      )}
                    </div>
                  )}

                  {/* Flat cost option — available in both modes */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="billing-flat"
                      checked={formData.billing_unit === "flat"}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleBillingUnitChange("flat");
                        } else {
                          // Restore to previous non-flat mode
                          handleBillingUnitChange("unit");
                        }
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label
                      htmlFor="billing-flat"
                      className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      Costo Fisso (prezzo fisso, ignora quantità e durata)
                    </Label>
                  </div>
                </div>
              ) : null}

              {/* Duration — visible for rental/event (non-service) when billing_unit is not 'unit' or 'flat' */}
              {isRentalOrEvent &&
                !isServiceProduct &&
                formData.billing_unit &&
                formData.billing_unit !== "unit" &&
                formData.billing_unit !== "flat" && (
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-medium">
                      {DURATION_LABELS[formData.billing_unit] ?? "Durata"}
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
                        effectiveEventDays && formData.billing_unit === "day"
                          ? `${effectiveEventDays} (da preventivo)`
                          : "Es: 5"
                      }
                      className="h-11 border-slate-300 dark:border-slate-600 focus:border-blue-500"
                    />
                    {effectiveEventDays &&
                      formData.billing_unit === "day" &&
                      !formData.duration && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Lascia vuoto per ereditare {effectiveEventDays} gg dal preventivo
                        </p>
                      )}
                  </div>
                )}

              {/* Unit Price & Discount */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Label className="text-slate-700 dark:text-slate-300 font-medium">
                      Prezzo Unitario *
                    </Label>
                    <PriceSourceBadge source={pricingInfo?.source} priceListName={pricingInfo?.priceListName} />
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.unit_price ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        unit_price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="h-11 border-slate-300 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Sconto %</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.discount_percentage ?? 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_percentage: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="h-11 border-slate-300 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* VAT Rate */}
              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">
                  Aliquota IVA %
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
                  <SelectTrigger className="h-11 border-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Esente (0%)</SelectItem>
                    <SelectItem value="4">Ridotta 4%</SelectItem>
                    <SelectItem value="5">Ridotta 5%</SelectItem>
                    <SelectItem value="10">Ridotta 10%</SelectItem>
                    <SelectItem value="22">Ordinaria 22%</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Hide Unit Price */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  id="hide-price"
                  checked={formData.hide_unit_price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hide_unit_price: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <Label
                  htmlFor="hide-price"
                  className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Nascondi prezzo unitario nel preventivo
                </Label>
              </div>

              {/* Media selector — shown only when a product is linked */}
              {formData.product_id && (
                <MediaSelector
                  productId={formData.product_id}
                  value={formData.included_media_ids ?? []}
                  onChange={(ids) =>
                    setFormData({ ...formData, included_media_ids: ids })
                  }
                />
              )}

              {/* Calculated Total */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 space-y-2">
                {/* Formula preview */}
                {(() => {
                  const preview = buildFormulaPreview(formData);
                  return preview ? (
                    <div className="text-xs text-blue-700 dark:text-blue-400 font-mono pb-1 border-b border-blue-200 dark:border-blue-800">
                      {preview}
                    </div>
                  ) : null;
                })()}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Subtotale:</span>
                  <span className="font-medium">
                    € {calculateTotals(formData).subtotal.toFixed(2)}
                  </span>
                </div>
                {(formData.discount_percentage ?? 0) > 0 && (
                  <div className="flex justify-between items-center text-sm text-red-600">
                    <span>Sconto ({formData.discount_percentage}%):</span>
                    <span className="font-medium">
                      - € {calculateTotals(formData).discount_amount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm border-t pt-2">
                  <span className="text-slate-600">Imponibile:</span>
                  <span className="font-medium">
                    € {calculateTotals(formData).total.toFixed(2)}
                  </span>
                </div>
                {(formData.vat_rate ?? 0) > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">
                      IVA ({formData.vat_rate}%):
                    </span>
                    <span className="font-medium">
                      € {calculateTotals(formData).vat_amount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-sm font-medium text-slate-700">
                    Totale con IVA:
                  </span>
                  <span className="text-2xl font-bold text-blue-600">
                    € {calculateTotals(formData).total_with_vat.toFixed(2)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-300"
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
      </DialogContent>
    </Dialog>
  );
}

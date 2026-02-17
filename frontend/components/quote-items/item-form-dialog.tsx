"use client";

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
import { Folder, FileText } from "lucide-react";
import { ProductAutocomplete } from "@/app/(dashboard)/products/_components/product-autocomplete";
import { productsApi } from "@/lib/api/products";
import { QuoteItem, ItemFormData } from "./types";
import { calculateTotals } from "./utils";

interface ItemFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  formData: ItemFormData;
  setFormData: (data: ItemFormData) => void;
  editingItem: QuoteItem | null;
  localItems: QuoteItem[];
  priceListId?: number | null;
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
}: ItemFormDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900">
            {editingItem ? "Modifica Voce" : "Nuova Voce"}
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            {editingItem
              ? "Modifica i dettagli della voce"
              : "Inserisci i dettagli della nuova voce"}
          </DialogDescription>
        </DialogHeader>

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
                onSelect={async (product) => {
                  if (product) {
                    try {
                      // Fetch pricing from API if price list is selected
                      if (priceListId && product.id) {
                        const pricingData = await productsApi.getPricing(
                          product.id,
                          priceListId,
                        );

                        // effective_price is an object with sale_price, rental_daily, etc.
                        const effectivePrice = Number(
                          pricingData.effective_price?.sale_price ||
                            product.standard_cost ||
                            0,
                        );

                        setFormData({
                          ...formData,
                          product_id: product.id,
                          price_list_item_id:
                            pricingData.effective_price?.price_list_item_id ??
                            null,
                          code: product.code || "",
                          description: product.name || "",
                          unit: product.unit || "",
                          unit_price: effectivePrice,
                          vat_rate: formData.vat_rate || 22,
                        });
                      } else {
                        // Use standard cost if no price list
                        const standardCost = Number(product.standard_cost || 0);

                        setFormData({
                          ...formData,
                          product_id: product.id,
                          price_list_item_id: null,
                          code: product.code || "",
                          description: product.name || "",
                          unit: product.unit || "",
                          unit_price: standardCost,
                          vat_rate: formData.vat_rate || 22,
                        });
                      }
                    } catch (error) {
                      console.error("Error fetching product pricing:", error);
                      // Fallback to standard cost on error
                      const fallbackCost = Number(product.standard_cost || 0);

                      setFormData({
                        ...formData,
                        product_id: product.id,
                        price_list_item_id: null,
                        code: product.code || "",
                        description: product.name || "",
                        unit: product.unit || "",
                        unit_price: fallbackCost,
                        vat_rate: formData.vat_rate || 22,
                      });
                    }
                  } else {
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

              {/* Unit Price & Discount */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">
                    Prezzo Unitario *
                  </Label>
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

              {/* Hide Unit Price & Include Image */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
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
                    className="text-sm text-slate-700 cursor-pointer"
                  >
                    Nascondi prezzo unitario nel preventivo
                  </Label>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <input
                    type="checkbox"
                    id="include-image"
                    checked={formData.include_image}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        include_image: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label
                    htmlFor="include-image"
                    className="text-sm text-slate-700 cursor-pointer"
                  >
                    Includi immagine prodotto nel preventivo
                  </Label>
                </div>
              </div>

              {/* Calculated Total */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-2">
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

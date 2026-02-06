"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ComboboxSelect } from "@/components/combobox-select";
import { productsApi } from "@/lib/api/products";
import { PriceListItemForm, PriceListItemFormData } from "./price-list-item-form";
import type { Product } from "@/lib/types";
import { Save } from "lucide-react";

interface AddProductToListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: PriceListItemFormData & { product_id: number }) => void;
  appliesTo: "sale" | "rental" | "both";
  isLoading?: boolean;
}

export function AddProductToListDialog({
  open,
  onOpenChange,
  onAdd,
  appliesTo,
  isLoading,
}: AddProductToListDialogProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: () => productsApi.getAll(),
    enabled: open,
  });

  const handleAdd = (data: PriceListItemFormData) => {
    if (!selectedProduct?.id) return;
    onAdd({ ...data, product_id: selectedProduct.id });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedProduct(null);
    }
    onOpenChange(newOpen);
  };

  const productOptions =
    products?.data
      .filter((product: Product) => product.id !== undefined)
      .map((product: Product) => ({
        value: product.id!.toString(),
        label: `${product.code} - ${product.name}`,
      })) || [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-800">
          <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Aggiungi Prodotto al Listino
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            Seleziona un prodotto e imposta i prezzi per questo listino
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-6 py-6">
          <div className="space-y-6">
            {/* Selezione Prodotto */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Prodotto *
              </label>
              <ComboboxSelect
                options={productOptions}
                value={selectedProduct?.id?.toString() || ""}
                onValueChange={(value) => {
                  const product = products?.data.find(
                    (p: Product) => p.id?.toString() === value
                  );
                  setSelectedProduct(product || null);
                }}
                placeholder="Seleziona un prodotto..."
                emptyText="Nessun prodotto trovato"
              />
              {selectedProduct && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {selectedProduct.description || "Nessuna descrizione"}
                </p>
              )}
              {selectedProduct && selectedProduct.product_type === 'service' && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <span className="text-blue-600 dark:text-blue-400 text-xs">ℹ️</span>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Questo è un servizio. I servizi possono essere solo venduti, non noleggiati.
                  </p>
                </div>
              )}
              {selectedProduct && selectedProduct.product_type === 'composite' && (
                <div className="flex items-start gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <span className="text-purple-600 dark:text-purple-400 text-xs">📦</span>
                  <p className="text-xs text-purple-700 dark:text-purple-300">
                    Questo è un prodotto composito. Il prezzo può essere calcolato dalla somma dei componenti.
                  </p>
                </div>
              )}
            </div>

            {/* Form Prezzi */}
            {selectedProduct && (
              <PriceListItemForm
                id="add-item-form"
                item={{
                  id: 0,
                  price_list_id: 0,
                  product_id: selectedProduct.id || 0,
                  product: selectedProduct,
                  sale_price: 0,
                  is_manual_price: false,
                  rental_daily: null,
                  rental_weekly: null,
                  rental_monthly: null,
                  is_manual_rental: false,
                  final_sale_price: null,
                  final_rental_daily: null,
                  final_rental_weekly: null,
                  final_rental_monthly: null,
                  is_active: true,
                  notes: null,
                }}
                onSubmit={handleAdd}
                showSale={appliesTo === "sale" || appliesTo === "both"}
                showRental={appliesTo === "rental" || appliesTo === "both"}
              />
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Annulla
          </Button>
          <Button
            type="submit"
            form="add-item-form"
            disabled={!selectedProduct || isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Aggiunta..." : "Aggiungi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

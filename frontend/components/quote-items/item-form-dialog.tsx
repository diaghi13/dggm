'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Folder, FileText } from 'lucide-react';
import { ProductAutocomplete } from '@/app/(dashboard)/products/_components/product-autocomplete';
import { QuoteItem, ItemFormData } from './types';
import { calculateTotals } from './utils';

interface ItemFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  formData: ItemFormData;
  setFormData: (data: ItemFormData) => void;
  editingItem: QuoteItem | null;
  localItems: QuoteItem[];
}

export function ItemFormDialog({
  isOpen,
  onClose,
  onSave,
  formData,
  setFormData,
  editingItem,
  localItems,
}: ItemFormDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900">
            {editingItem ? 'Modifica Voce' : 'Nuova Voce'}
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            {editingItem ? 'Modifica i dettagli della voce' : 'Inserisci i dettagli della nuova voce'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Type Selection */}
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium">Tipo</Label>
            <Select
              value={formData.type}
              onValueChange={(value: 'section' | 'item') =>
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
          {formData.type === 'item' && (
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">
                Sezione (opzionale)
              </Label>
              <Select
                value={formData.parent_id?.toString() ?? 'none'}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    parent_id: value === 'none' ? null : parseInt(value)
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
                    .filter((item) => item.type === 'section' && !item.parent_id)
                    .map((section) => (
                      <SelectItem key={section.id} value={section.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Folder className="w-4 h-4 text-blue-600" />
                          <span>{section.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Seleziona una sezione per organizzare la voce, o lascia vuoto per il livello principale
              </p>
            </div>
          )}

          {/* Material Selection */}
          {formData.type === 'item' && (
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">
                Prodotto dal Magazzino (opzionale)
              </Label>
              <ProductAutocomplete
                value={formData.material_id}
                onSelect={(material) => {
                  if (material) {
                    setFormData({
                      ...formData,
                      material_id: material.id,
                      code: material.code,
                      description: material.name,
                      unit: material.unit,
                      unit_price: Number(material.standard_cost || 0),
                    });
                  } else {
                    setFormData({
                      ...formData,
                      material_id: null,
                    });
                  }
                }}
                placeholder="Cerca nel catalogo materiali..."
              />
              <p className="text-xs text-slate-500">
                Seleziona un materiale dal catalogo per pre-compilare i campi
              </p>
            </div>
          )}

          {/* Code */}
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium">Codice (opzionale)</Label>
            <Input
              value={formData.code ?? ''}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="Es: ART-001"
              className="h-11 border-slate-300 focus:border-blue-500"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium">Descrizione *</Label>
            <Input
              value={formData.description ?? ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrizione della voce"
              className="h-11 border-slate-300 focus:border-blue-500"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium">Note (opzionale)</Label>
            <Textarea
              value={formData.notes ?? ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Note aggiuntive..."
              rows={3}
              className="border-slate-300 focus:border-blue-500"
            />
          </div>

          {formData.type === 'item' && (
            <>
              {/* Quantity & Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Quantità *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.quantity ?? 0}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                    className="h-11 border-slate-300 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Unità di Misura</Label>
                  <Input
                    value={formData.unit ?? ''}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="Es: pz, m, kg"
                    className="h-11 border-slate-300 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Unit Price & Discount */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Prezzo Unitario *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.unit_price ?? 0}
                    onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
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
                    onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) || 0 })}
                    className="h-11 border-slate-300 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Hide Unit Price */}
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  id="hide-price"
                  checked={formData.hide_unit_price}
                  onChange={(e) => setFormData({ ...formData, hide_unit_price: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="hide-price" className="text-sm text-slate-700 cursor-pointer">
                  Nascondi prezzo unitario nel preventivo
                </Label>
              </div>

              {/* Calculated Total */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700">Totale Calcolato:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    € {calculateTotals(formData).total.toFixed(2)}
                  </span>
                </div>
                {formData.discount_percentage > 0 && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Subtotale: € {calculateTotals(formData).subtotal.toFixed(2)} -{' '}
                    Sconto: € {calculateTotals(formData).discount_amount.toFixed(2)}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Show Subtotal for Sections */}
          {formData.type === 'section' && (
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                id="show-subtotal"
                checked={formData.show_subtotal ?? false}
                onChange={(e) => setFormData({ ...formData, show_subtotal: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="show-subtotal" className="text-sm text-slate-700 cursor-pointer">
                Mostra subtotale parziale per questa sezione
              </Label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-slate-300">
            Annulla
          </Button>
          <Button
            onClick={onSave}
            disabled={!formData.description}
            className="shadow-md"
          >
            {editingItem ? 'Salva Modifiche' : 'Aggiungi Voce'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


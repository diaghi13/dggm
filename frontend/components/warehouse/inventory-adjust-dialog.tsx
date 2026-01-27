'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAdjustStock } from '@/hooks/use-inventory';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Minus } from 'lucide-react';

interface InventoryAdjustDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventory: {
    id: number;
    product_id: number;
    warehouse_id: number;
    product?: {
      code: string;
      name: string;
      unit: string;
    };
    warehouse?: {
      name: string;
    };
    quantity_available: number;
  };
}

interface AdjustFormData {
  quantity: number;
  notes?: string;
}

export function InventoryAdjustDialog({
  open,
  onOpenChange,
  inventory,
}: InventoryAdjustDialogProps) {
  const [adjustType, setAdjustType] = useState<'add' | 'remove'>('add');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AdjustFormData>({
    defaultValues: {
      quantity: 0,
      notes: '',
    },
  });

  const adjustMutation = useAdjustStock();

  const onSubmit = (data: AdjustFormData) => {
    const finalQuantity = adjustType === 'add' ? data.quantity : -data.quantity;

    // Crea oggetto con tutti i campi necessari per l'API
    const adjustData = {
      product_id: inventory.product_id,
      warehouse_id: inventory.warehouse_id,
      adjustment_quantity: finalQuantity, // Campo specifico per l'aggiustamento
      notes: data.notes,
    } as any; // Temporary any fino a che l'API non è verificata

    adjustMutation.mutate(
      adjustData,
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      }
    );
  };

  const currentQuantity = watch('quantity') || 0;
  const newQuantity = adjustType === 'add'
    ? inventory.quantity_available + Number(currentQuantity)
    : inventory.quantity_available - Number(currentQuantity);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Aggiusta Scorte</DialogTitle>
            <DialogDescription>
              Modifica manualmente la quantità disponibile di questo prodotto
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Product Info */}
            <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-3 space-y-1">
              <p className="text-sm font-medium">{inventory.product?.name}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Codice: {inventory.product?.code} | Magazzino: {inventory.warehouse?.name}
              </p>
              <p className="text-sm">
                Quantità attuale: <span className="font-semibold">{inventory.quantity_available} {inventory.product?.unit}</span>
              </p>
            </div>

            {/* Adjust Type */}
            <div className="space-y-2">
              <Label>Tipo Operazione</Label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Minus className="w-4 h-4 text-red-600" />
                  <Label className="cursor-pointer">Rimuovi</Label>
                </div>
                <Switch
                  checked={adjustType === 'add'}
                  onCheckedChange={(checked: boolean) => setAdjustType(checked ? 'add' : 'remove')}
                />
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-green-600" />
                  <Label className="cursor-pointer">Aggiungi</Label>
                </div>
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantità {adjustType === 'add' ? 'da aggiungere' : 'da rimuovere'}
              </Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                {...register('quantity', {
                  required: 'La quantità è obbligatoria',
                  min: { value: 0.01, message: 'La quantità deve essere maggiore di 0' },
                  max: adjustType === 'remove'
                    ? { value: inventory.quantity_available, message: 'Quantità insufficiente' }
                    : undefined,
                })}
              />
              {errors.quantity && (
                <p className="text-sm text-red-600">{errors.quantity.message}</p>
              )}

              {/* Preview */}
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Nuova quantità: <span className={`font-semibold ${newQuantity < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {newQuantity.toFixed(2)} {inventory.product?.unit}
                </span>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Note (opzionale)</Label>
              <Textarea
                id="notes"
                placeholder="Motivo della rettifica..."
                {...register('notes')}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={adjustMutation.isPending}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={adjustMutation.isPending}
              className={adjustType === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {adjustMutation.isPending ? 'Salvataggio...' :
                adjustType === 'add' ? 'Aggiungi' : 'Rimuovi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

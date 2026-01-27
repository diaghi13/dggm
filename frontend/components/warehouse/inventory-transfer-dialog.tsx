'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { warehousesApi } from '@/lib/api/warehouses';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, AlertTriangle, Package } from 'lucide-react';

interface InventoryTransferDialogProps {
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
  onSuccess?: () => void;
}

interface TransferFormData {
  to_warehouse_id: string;
  quantity: number;
  notes?: string;
}

export function InventoryTransferDialog({
  open,
  onOpenChange,
  inventory,
  onSuccess,
}: InventoryTransferDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransferFormData>({
    defaultValues: {
      to_warehouse_id: '',
      quantity: 0,
      notes: '',
    },
  });

  // Fetch warehouses
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses', { is_active: true, per_page: 100 }],
    queryFn: () => warehousesApi.getAll({ is_active: true, per_page: 100 }),
  });

  const warehouses = warehousesData?.data?.filter(
    (w: any) => w.id !== inventory.warehouse_id
  ) ?? [];

  const currentQuantity = watch('quantity') || 0;

  const onSubmit = async (data: TransferFormData) => {
    setIsSubmitting(true);

    // TODO: Create internal DDT for transfer
    // This should call ddtsApi.create() with type='internal'
    // For now, just show success message

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      reset();
      onOpenChange(false);
      onSuccess?.();

      // TODO: Show toast
      console.log('Transfer would create internal DDT:', {
        type: 'internal',
        from_warehouse_id: inventory.warehouse_id,
        to_warehouse_id: parseInt(data.to_warehouse_id),
        product_id: inventory.product_id,
        quantity: data.quantity,
        notes: data.notes,
      });
    } catch (error) {
      console.error('Transfer error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-blue-600" />
              Trasferimento Stock
            </DialogTitle>
            <DialogDescription>
              Trasferisci {inventory.product?.name} tra magazzini
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Product Info */}
            <div className="rounded-lg border bg-slate-50 dark:bg-slate-900 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{inventory.product?.name}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Codice: {inventory.product?.code}
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Magazzino origine</span>
                  <span className="font-medium">{inventory.warehouse?.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-slate-600 dark:text-slate-400">Disponibile</span>
                  <span className="font-semibold text-green-600">
                    {inventory.quantity_available} {inventory.product?.unit}
                  </span>
                </div>
              </div>
            </div>

            {/* Alert */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Verrà creato automaticamente un DDT interno per tracciare il trasferimento.
                I movimenti di stock saranno generati alla conferma del DDT.
              </AlertDescription>
            </Alert>

            {/* To Warehouse */}
            <div className="space-y-2">
              <Label htmlFor="to_warehouse_id">
                Magazzino Destinazione <span className="text-red-600">*</span>
              </Label>
              <Select
                value={watch('to_warehouse_id')}
                onValueChange={(value) => setValue('to_warehouse_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona magazzino destinazione" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse: any) => (
                    <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!watch('to_warehouse_id') && (
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {warehouses.length === 0
                    ? 'Nessun altro magazzino disponibile'
                    : `${warehouses.length} magazzini disponibili`}
                </p>
              )}
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantità da Trasferire <span className="text-red-600">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                min="0.01"
                max={inventory.quantity_available}
                placeholder="0"
                {...register('quantity', {
                  required: 'La quantità è obbligatoria',
                  min: { value: 0.01, message: 'La quantità deve essere maggiore di 0' },
                  max: {
                    value: inventory.quantity_available,
                    message: `Quantità massima: ${inventory.quantity_available}`
                  },
                })}
              />
              {errors.quantity && (
                <p className="text-sm text-red-600">{errors.quantity.message}</p>
              )}

              {/* Preview */}
              {currentQuantity > 0 && currentQuantity <= inventory.quantity_available && (
                <div className="text-sm space-y-1">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span>Rimanente in origine:</span>
                    <span className="font-medium">
                      {(inventory.quantity_available - currentQuantity).toFixed(2)} {inventory.product?.unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-green-600">
                    <span>Trasferimento:</span>
                    <span className="font-semibold">
                      {currentQuantity.toFixed(2)} {inventory.product?.unit}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Note (opzionale)</Label>
              <Textarea
                id="notes"
                placeholder="Motivo del trasferimento, riferimenti, ecc..."
                {...register('notes')}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
              disabled={isSubmitting}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !watch('to_warehouse_id') ||
                !currentQuantity ||
                currentQuantity > inventory.quantity_available
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2">Creando DDT...</span>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </>
              ) : (
                <>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Crea DDT Trasferimento
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { stockMovementsApi } from '@/lib/api/stock-movements';
import { warehousesApi } from '@/lib/api/warehouses';
import { productsApi } from '@/lib/api/products';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ComboboxSelect } from '@/components/combobox-select';

interface CreateStockMovementDialogProps {
  trigger?: React.ReactNode;
  warehouseId?: number;
  onSuccess?: () => void;
}

type MovementType = 'intake' | 'output' | 'transfer';

interface FormData {
  type: MovementType;
  warehouse_id: number;
  from_warehouse_id?: number;
  to_warehouse_id?: number;
  product_id: number;
  quantity: number;
  unit_cost?: number;
  reason?: string;
  reference?: string;
  notes?: string;
}

export function CreateStockMovementDialog({
  trigger,
  warehouseId,
  onSuccess
}: CreateStockMovementDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [searchProduct, setSearchProduct] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      type: 'intake',
      warehouse_id: warehouseId,
      quantity: 1,
    },
  });

  const movementType = watch('type');
  const selectedWarehouseId = watch('warehouse_id');
  const selectedProductId = watch('product_id');

  // Fetch warehouses
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses', { is_active: true, per_page: 100 }],
    queryFn: () => warehousesApi.getAll({ is_active: true, per_page: 100 }),
  });

  const warehouses = warehousesData?.data ?? [];

  // Fetch products
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', { search: searchProduct, is_active: true, per_page: 50 }],
    queryFn: () => productsApi.getAll({ search: searchProduct, is_active: true, per_page: 50 }),
  });

  const products = productsData?.data ?? [];

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      switch (data.type) {
        case 'intake':
          return stockMovementsApi.createIntake({
            warehouse_id: data.warehouse_id,
            product_id: data.product_id,
            quantity: data.quantity,
            unit_cost: data.unit_cost,
            reference: data.reference,
            notes: data.notes,
          });
        case 'output':
          return stockMovementsApi.createOutput({
            warehouse_id: data.warehouse_id,
            product_id: data.product_id,
            quantity: data.quantity,
            reason: data.reason,
            notes: data.notes,
          });
        case 'transfer':
          if (!data.from_warehouse_id || !data.to_warehouse_id) {
            throw new Error('Seleziona magazzini di origine e destinazione');
          }
          return stockMovementsApi.createTransfer({
            from_warehouse_id: data.from_warehouse_id,
            to_warehouse_id: data.to_warehouse_id,
            product_id: data.product_id,
            quantity: data.quantity,
            notes: data.notes,
          });
        default:
          throw new Error('Tipo movimento non valido');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-inventory'] });
      toast.success('Movimento creato', {
        description: 'Il movimento è stato registrato con successo',
      });
      setOpen(false);
      reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description: error.message || 'Impossibile creare il movimento',
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      reset();
      setSearchProduct('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || <Button>Crea Movimento</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crea Movimento Magazzino</DialogTitle>
          <DialogDescription>
            Registra un movimento di magazzino manualmente
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Tipo Movimento */}
          <div className="space-y-2">
            <Label>Tipo Movimento *</Label>
            <Select
              value={movementType}
              onValueChange={(value) => setValue('type', value as MovementType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="intake">Carico (Entrata)</SelectItem>
                <SelectItem value="output">Scarico (Uscita)</SelectItem>
                <SelectItem value="transfer">Trasferimento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Magazzino/i */}
          {movementType !== 'transfer' ? (
            <div className="space-y-2">
              <Label>Magazzino *</Label>
              <Select
                value={selectedWarehouseId?.toString()}
                onValueChange={(value) => setValue('warehouse_id', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona magazzino" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w: App.Data.WarehouseData) => (
                    <SelectItem key={w.id} value={w.id!.toString()}>
                      {w.code} - {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Da Magazzino *</Label>
                <Select
                  value={watch('from_warehouse_id')?.toString()}
                  onValueChange={(value) => setValue('from_warehouse_id', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w: App.Data.WarehouseData) => (
                      <SelectItem key={w.id} value={w.id!.toString()}>
                        {w.code} - {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>A Magazzino *</Label>
                <Select
                  value={watch('to_warehouse_id')?.toString()}
                  onValueChange={(value) => setValue('to_warehouse_id', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w: App.Data.WarehouseData) => (
                      <SelectItem key={w.id} value={w.id!.toString()}>
                        {w.code} - {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Prodotto */}
          <div className="space-y-2">
            <Label>Prodotto *</Label>
            <ComboboxSelect
              value={selectedProductId?.toString() || ''}
              onValueChange={(value) => setValue('product_id', parseInt(value))}
              onSearchChange={setSearchProduct}
              placeholder="Cerca prodotto..."
              emptyText="Nessun prodotto trovato"
              loading={isLoadingProducts}
              options={products.map((p: App.Data.ProductData) => ({
                label: `${p.code} - ${p.name}`,
                value: p.id?.toString() || '',
              }))}
            />
          </div>

          {/* Quantità */}
          <div className="space-y-2">
            <Label>Quantità *</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              {...register('quantity', {
                required: true,
                min: 0.01,
                valueAsNumber: true,
              })}
            />
            {errors.quantity && (
              <p className="text-sm text-red-600">La quantità è obbligatoria</p>
            )}
          </div>

          {/* Campi specifici per tipo */}
          {movementType === 'intake' && (
            <>
              <div className="space-y-2">
                <Label>Costo Unitario</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register('unit_cost', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label>Riferimento (es. DDT fornitore)</Label>
                <Input
                  placeholder="Es: DDT-2024-001"
                  {...register('reference')}
                />
              </div>
            </>
          )}

          {movementType === 'output' && (
            <div className="space-y-2">
              <Label>Motivo Scarico</Label>
              <Input
                placeholder="Es: Vendita, Scarto, Uso interno..."
                {...register('reason')}
              />
            </div>
          )}

          {/* Note */}
          <div className="space-y-2">
            <Label>Note</Label>
            <Textarea
              placeholder="Note aggiuntive..."
              rows={3}
              {...register('notes')}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Annulla
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Crea Movimento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

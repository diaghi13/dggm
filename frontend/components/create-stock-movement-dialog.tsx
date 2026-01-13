'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ComboboxSelect } from '@/components/combobox-select';
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
import { stockMovementsApi } from '@/lib/api/stock-movements';
import { warehousesApi } from '@/lib/api/warehouses';
import { materialsApi } from '@/lib/api/materials';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';

interface CreateStockMovementDialogProps {
  trigger?: React.ReactNode;
}

export function CreateStockMovementDialog({ trigger }: CreateStockMovementDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [materialSearch, setMaterialSearch] = useState('');
  const [formData, setFormData] = useState({
    type: 'intake',
    material_id: '',
    warehouse_id: '',
    from_warehouse_id: '',
    to_warehouse_id: '',
    quantity: '',
    unit_cost: '',
    movement_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Fetch materials with search
  const { data: materialsData, isLoading: isLoadingMaterials } = useQuery({
    queryKey: ['materials', { is_active: true, search: materialSearch, per_page: 100 }],
    queryFn: () => materialsApi.getAll({ is_active: true, search: materialSearch, per_page: 100 }),
  });

  const materials = materialsData?.data ?? [];

  // Transform materials for combobox
  const materialOptions = useMemo(
    () =>
      materials.map((material: any) => ({
        value: material.id.toString(),
        label: `${material.code} - ${material.name}`,
        description: `${material.unit} • € ${Number(material.standard_cost).toFixed(2)}`,
      })),
    [materials]
  );

  // Fetch warehouses
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses', { is_active: true, per_page: 100 }],
    queryFn: () => warehousesApi.getAll({ is_active: true, per_page: 100 }),
  });

  const warehouses = warehousesData?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      // Choose the right API endpoint based on movement type
      switch (data.type) {
        case 'intake':
          return stockMovementsApi.createIntake(data);
        case 'output':
          return stockMovementsApi.createOutput(data);
        case 'transfer':
          return stockMovementsApi.createTransfer(data);
        case 'adjustment':
          return stockMovementsApi.createAdjustment(data);
        case 'return':
          return stockMovementsApi.createIntake({ ...data, type: 'return' });
        case 'waste':
          return stockMovementsApi.createOutput({ ...data, type: 'waste' });
        default:
          return stockMovementsApi.createIntake(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['material-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['material-movements'] });
      toast.success('Movimento creato', {
        description: 'Il movimento di magazzino è stato registrato con successo',
      });
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description: error.response?.data?.message || 'Impossibile creare il movimento',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      type: 'intake',
      material_id: '',
      warehouse_id: '',
      from_warehouse_id: '',
      to_warehouse_id: '',
      quantity: '',
      unit_cost: '',
      movement_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setMaterialSearch('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: any = {
      type: formData.type,
      material_id: parseInt(formData.material_id),
      quantity: parseFloat(formData.quantity),
      movement_date: formData.movement_date,
      notes: formData.notes || undefined,
    };

    if (formData.unit_cost) {
      payload.unit_cost = parseFloat(formData.unit_cost);
    }

    if (formData.type === 'transfer') {
      payload.from_warehouse_id = parseInt(formData.from_warehouse_id);
      payload.to_warehouse_id = parseInt(formData.to_warehouse_id);
    } else {
      payload.warehouse_id = parseInt(formData.warehouse_id);
    }

    createMutation.mutate(payload);
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isTransfer = formData.type === 'transfer';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="shadow-md">
            <Plus className="mr-2 h-4 w-4" />
            Nuovo Movimento
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nuovo Movimento di Magazzino</DialogTitle>
          <DialogDescription>
            Registra un movimento di carico, scarico, trasferimento o rettifica
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">
              Tipo Movimento <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
              <SelectTrigger id="type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="intake">Carico</SelectItem>
                <SelectItem value="output">Scarico</SelectItem>
                <SelectItem value="transfer">Trasferimento</SelectItem>
                <SelectItem value="adjustment">Rettifica</SelectItem>
                <SelectItem value="return">Reso</SelectItem>
                <SelectItem value="waste">Scarto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="material_id">
              Materiale <span className="text-red-500">*</span>
            </Label>
            <ComboboxSelect
              options={materialOptions}
              value={formData.material_id}
              onValueChange={(value) => handleChange('material_id', value)}
              placeholder="Cerca materiale..."
              searchPlaceholder="Cerca per codice o nome..."
              emptyText="Nessun materiale trovato"
              loading={isLoadingMaterials}
              onSearchChange={setMaterialSearch}
              debounceMs={300}
            />
          </div>

          {isTransfer ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from_warehouse_id">
                  Da Magazzino <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.from_warehouse_id}
                  onValueChange={(value) => handleChange('from_warehouse_id', value)}
                >
                  <SelectTrigger id="from_warehouse_id" className="w-full">
                    <SelectValue placeholder="Seleziona" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse: any) => (
                      <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="to_warehouse_id">
                  A Magazzino <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.to_warehouse_id}
                  onValueChange={(value) => handleChange('to_warehouse_id', value)}
                >
                  <SelectTrigger id="to_warehouse_id" className="w-full">
                    <SelectValue placeholder="Seleziona" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse: any) => (
                      <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="warehouse_id">
                Magazzino <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.warehouse_id}
                onValueChange={(value) => handleChange('warehouse_id', value)}
              >
                <SelectTrigger id="warehouse_id" className="w-full">
                  <SelectValue placeholder="Seleziona magazzino" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse: any) => (
                    <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantità <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_cost">Costo Unitario (€)</Label>
              <Input
                id="unit_cost"
                type="number"
                step="0.01"
                value={formData.unit_cost}
                onChange={(e) => handleChange('unit_cost', e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="movement_date">
                Data <span className="text-red-500">*</span>
              </Label>
              <Input
                id="movement_date"
                type="date"
                value={formData.movement_date}
                onChange={(e) => handleChange('movement_date', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Note</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Note aggiuntive..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crea Movimento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

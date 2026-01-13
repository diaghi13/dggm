'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { siteMaterialsApi } from '@/lib/api/site-materials';
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
import { toast } from 'sonner';
import { Loader2, PackagePlus, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ReturnMaterialDialogProps {
  siteId: number;
  material: {
    id: number;
    material_id: number;
    material: {
      name: string;
      code: string;
      unit: string;
    };
    planned_quantity: number;
    delivered_quantity: number;
    returned_quantity: number;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReturnMaterialDialog({
  siteId,
  material,
  open,
  onOpenChange,
}: ReturnMaterialDialogProps) {
  const queryClient = useQueryClient();

  const [warehouseId, setWarehouseId] = useState<string>('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch warehouses
  const { data: warehousesData, isLoading: loadingWarehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehousesApi.getAll({ is_active: true }),
  });

  const warehouses = warehousesData?.data || [];

  // Return mutation
  const returnMutation = useMutation({
    mutationFn: (data: {
      warehouse_id: number;
      quantity: number;
      notes?: string;
    }) => siteMaterialsApi.returnMaterial(siteId, material!.id, data),
    onSuccess: () => {
      toast.success('Materiale rientrato', {
        description:
          'Il materiale è stato rientrato in magazzino e lo stock è stato aggiornato.',
      });
      queryClient.invalidateQueries({ queryKey: ['site-materials', siteId] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      handleClose();
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description:
          error.response?.data?.message ||
          'Impossibile rientrare il materiale',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!warehouseId) {
      toast.error('Seleziona un magazzino');
      return;
    }

    if (!quantity || parseFloat(quantity) <= 0) {
      toast.error('Inserisci una quantità valida');
      return;
    }

    returnMutation.mutate({
      warehouse_id: parseInt(warehouseId),
      quantity: parseFloat(quantity),
      notes: notes || undefined,
    });
  };

  const handleClose = () => {
    setWarehouseId('');
    setQuantity('');
    setNotes('');
    onOpenChange(false);
  };

  if (!material) return null;

  const maxReturnable =
    material.delivered_quantity - material.returned_quantity;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5 text-blue-600" />
            Rientro Materiale Avanzato
          </DialogTitle>
          <DialogDescription>
            Riporta in magazzino il materiale non utilizzato dal cantiere.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Material Info */}
            <div className="rounded-lg border bg-slate-50 p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Materiale</p>
                  <p className="font-semibold">
                    {material.material.code} - {material.material.name}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    Consegnato / Rientrato
                  </p>
                  <p className="font-semibold">
                    {material.delivered_quantity} / {material.returned_quantity}{' '}
                    {material.material.unit}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-blue-600 font-medium">
                    Massimo rientrabile: {maxReturnable.toFixed(2)}{' '}
                    {material.material.unit}
                  </p>
                </div>
              </div>
            </div>

            {/* Info Alert */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Il materiale verrà ricaricato in magazzino e la quantità
                utilizzata effettiva sarà ricalcolata.
              </AlertDescription>
            </Alert>

            {/* Warehouse Select */}
            <div className="space-y-2">
              <Label htmlFor="warehouse">
                Magazzino di destinazione{' '}
                <span className="text-red-500">*</span>
              </Label>
              <Select value={warehouseId} onValueChange={setWarehouseId}>
                <SelectTrigger id="warehouse">
                  <SelectValue placeholder="Seleziona magazzino" />
                </SelectTrigger>
                <SelectContent>
                  {loadingWarehouses ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : warehouses.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">
                      Nessun magazzino disponibile
                    </div>
                  ) : (
                    warehouses.map((wh: any) => (
                      <SelectItem key={wh.id} value={wh.id.toString()}>
                        {wh.code} - {wh.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity Input */}
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantità da rientrare <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={maxReturnable}
                  placeholder={`Max: ${maxReturnable.toFixed(2)}`}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
                <span className="flex items-center text-sm text-muted-foreground px-3 border rounded-md bg-slate-50">
                  {material.material.unit}
                </span>
              </div>
              {maxReturnable > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(maxReturnable.toString())}
                  className="mt-2"
                >
                  Rientra tutto: {maxReturnable.toFixed(2)}{' '}
                  {material.material.unit}
                </Button>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Note (opzionale)</Label>
              <Textarea
                id="notes"
                placeholder="Motivo del rientro, condizioni materiale..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={returnMutation.isPending}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={returnMutation.isPending || maxReturnable <= 0}
            >
              {returnMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Rientra in Magazzino
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

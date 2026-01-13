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
import { Loader2, TruckIcon, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DeliverMaterialDialogProps {
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

export function DeliverMaterialDialog({
  siteId,
  material,
  open,
  onOpenChange,
}: DeliverMaterialDialogProps) {
  const queryClient = useQueryClient();

  const [warehouseId, setWarehouseId] = useState<string>('');
  const [quantity, setQuantity] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');

  // Fetch warehouses
  const { data: warehousesData, isLoading: loadingWarehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehousesApi.getAll({ is_active: true }),
  });

  const warehouses = warehousesData?.data || [];

  // Deliver mutation
  const deliverMutation = useMutation({
    mutationFn: (data: {
      warehouse_id: number;
      quantity: number;
      delivery_date?: string;
      notes?: string;
    }) => siteMaterialsApi.deliver(siteId, material!.id, data),
    onSuccess: () => {
      toast.success('Materiale consegnato', {
        description:
          'Il materiale è stato consegnato al cantiere e scaricato dal magazzino.',
      });
      queryClient.invalidateQueries({ queryKey: ['site-materials', siteId] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      handleClose();
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description:
          error.response?.data?.message ||
          'Impossibile consegnare il materiale',
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

    deliverMutation.mutate({
      warehouse_id: parseInt(warehouseId),
      quantity: parseFloat(quantity),
      delivery_date: deliveryDate || undefined,
      notes: notes || undefined,
    });
  };

  const handleClose = () => {
    setWarehouseId('');
    setQuantity('');
    setDeliveryDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    onOpenChange(false);
  };

  if (!material) return null;

  const remainingToDeliver =
    material.planned_quantity - material.delivered_quantity;
  const suggestedQuantity = remainingToDeliver > 0 ? remainingToDeliver : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TruckIcon className="h-5 w-5 text-green-600" />
            Consegna Materiale a Cantiere
          </DialogTitle>
          <DialogDescription>
            Il materiale verrà automaticamente scaricato dal magazzino e
            marcato come utilizzato.
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
                    Quantità pianificata / Consegnata
                  </p>
                  <p className="font-semibold">
                    {material.planned_quantity} / {material.delivered_quantity}{' '}
                    {material.material.unit}
                  </p>
                </div>
                {remainingToDeliver > 0 && (
                  <div className="col-span-2">
                    <p className="text-sm text-amber-600 font-medium">
                      Rimanente da consegnare: {remainingToDeliver.toFixed(2)}{' '}
                      {material.material.unit}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Alert explaining behavior */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Workflow Semplificato:</strong> Il materiale
                consegnato viene automaticamente marcato come utilizzato e
                scaricato dal magazzino.
              </AlertDescription>
            </Alert>

            {/* Warehouse Select */}
            <div className="space-y-2">
              <Label htmlFor="warehouse">
                Magazzino <span className="text-red-500">*</span>
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
                Quantità da consegnare <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder={`Es: ${suggestedQuantity.toFixed(2)}`}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
                <span className="flex items-center text-sm text-muted-foreground px-3 border rounded-md bg-slate-50">
                  {material.material.unit}
                </span>
              </div>
              {suggestedQuantity > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(suggestedQuantity.toString())}
                  className="mt-2"
                >
                  Usa rimanente: {suggestedQuantity.toFixed(2)}{' '}
                  {material.material.unit}
                </Button>
              )}
            </div>

            {/* Delivery Date */}
            <div className="space-y-2">
              <Label htmlFor="delivery_date">Data consegna</Label>
              <Input
                id="delivery_date"
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Note (opzionale)</Label>
              <Textarea
                id="notes"
                placeholder="Note sulla consegna..."
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
              disabled={deliverMutation.isPending}
            >
              Annulla
            </Button>
            <Button type="submit" disabled={deliverMutation.isPending}>
              {deliverMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Consegna e Scarica
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { siteMaterialsApi } from '@/lib/api/site-materials';
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
import { toast } from 'sonner';
import { Loader2, Package } from 'lucide-react';

interface LogMaterialUsageDialogProps {
  siteId: number;
  material: {
    id: number;
    material: {
      code: string;
      name: string;
      unit: string;
    };
    planned_quantity: number;
    used_quantity: number;
    remaining_quantity?: number;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogMaterialUsageDialog({
  siteId,
  material,
  open,
  onOpenChange,
}: LogMaterialUsageDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    quantity_used: '',
    actual_unit_cost: '',
    notes: '',
  });

  const logUsageMutation = useMutation({
    mutationFn: (data: any) => siteMaterialsApi.logUsage(siteId, material!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-materials', siteId] });
      toast.success('Utilizzo registrato', {
        description: 'L\'utilizzo del materiale è stato registrato con successo',
      });
      resetForm();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description: error.response?.data?.message || 'Impossibile registrare l\'utilizzo',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      quantity_used: '',
      actual_unit_cost: '',
      notes: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.quantity_used || parseFloat(formData.quantity_used) <= 0) {
      toast.error('Inserisci una quantità valida');
      return;
    }

    const quantityUsed = parseFloat(formData.quantity_used);
    const remaining = (material?.remaining_quantity ?? (material!.planned_quantity - material!.used_quantity));

    if (quantityUsed > remaining) {
      toast.error('Quantità eccessiva', {
        description: `La quantità utilizzata supera quella rimanente (${remaining.toFixed(2)} ${material!.material.unit})`,
      });
      return;
    }

    logUsageMutation.mutate({
      quantity_used: quantityUsed,
      actual_unit_cost: formData.actual_unit_cost ? parseFloat(formData.actual_unit_cost) : undefined,
      notes: formData.notes || undefined,
    });
  };

  if (!material) return null;

  const remaining = material.remaining_quantity ?? (material.planned_quantity - material.used_quantity);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Registra Utilizzo Materiale</DialogTitle>
            <DialogDescription>
              Registra la quantità di materiale effettivamente utilizzata
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Material Info */}
            <div className="rounded-lg border bg-muted/50 p-3">
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-sm">{material.material.name}</div>
                  <div className="text-xs text-muted-foreground">{material.material.code}</div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Pianificato</div>
                      <div className="font-medium">{material.planned_quantity} {material.material.unit}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Utilizzato</div>
                      <div className="font-medium">{material.used_quantity} {material.material.unit}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Rimanente</div>
                      <div className="font-medium text-blue-600">{remaining.toFixed(2)} {material.material.unit}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quantity Used */}
            <div className="grid gap-2">
              <Label htmlFor="quantity_used">
                Quantità Utilizzata <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="quantity_used"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={remaining}
                  placeholder="0.00"
                  value={formData.quantity_used}
                  onChange={(e) => setFormData({ ...formData, quantity_used: e.target.value })}
                  required
                  className="flex-1"
                />
                <div className="flex items-center px-3 border rounded-md bg-muted text-sm text-muted-foreground">
                  {material.material.unit}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Max disponibile: {remaining.toFixed(2)} {material.material.unit}
              </p>
            </div>

            {/* Actual Unit Cost (Optional) */}
            <div className="grid gap-2">
              <Label htmlFor="actual_unit_cost">
                Costo Unitario Effettivo <span className="text-muted-foreground">(opzionale)</span>
              </Label>
              <Input
                id="actual_unit_cost"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.actual_unit_cost}
                onChange={(e) => setFormData({ ...formData, actual_unit_cost: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Lascia vuoto per usare il costo pianificato
              </p>
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Note</Label>
              <Textarea
                id="notes"
                placeholder="Note sull'utilizzo del materiale..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            {/* Total Cost Preview */}
            {formData.quantity_used && (
              <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Costo Totale Utilizzo:</span>
                  <span className="text-lg font-bold text-blue-600">
                    € {(parseFloat(formData.quantity_used) * parseFloat(formData.actual_unit_cost || '0')).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              disabled={logUsageMutation.isPending}
            >
              Annulla
            </Button>
            <Button type="submit" disabled={logUsageMutation.isPending}>
              {logUsageMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registra Utilizzo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectMaterialsApi } from '@/lib/api/project-materials';
import { projectsApi } from '@/lib/api/projects';
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
import { Loader2, ArrowRightLeft, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TransferMaterialDialogProps {
  projectId: number;
  material: {
    id: number;
    product_id?: number | null;
    product?: {
      name?: string | null;
      code?: string | null;
      unit?: string | null;
    } | null;
    planned_quantity: number;
    delivered_quantity: number;
    returned_quantity: number;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransferMaterialDialog({
  projectId,
  material,
  open,
  onOpenChange,
}: TransferMaterialDialogProps) {
  const queryClient = useQueryClient();

  const [toProjectId, setToProjectId] = useState<string>('');
  const [quantity, setQuantity] = useState('');
  const [ddtNumber, setDdtNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch projects (exclude current project)
  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects', 'active'],
    queryFn: async () => {
      const response = await projectsApi.getAll({ is_active: true });
      return response.data.filter((project: any) => project.id !== projectId);
    },
  });

  // Transfer mutation
  const transferMutation = useMutation({
    mutationFn: (data: {
      to_project_id: number;
      quantity: number;
      ddt_number?: string;
      notes?: string;
    }) => projectMaterialsApi.transferToProject(projectId, material!.id, data),
    onSuccess: () => {
      toast.success('Materiale trasferito', {
        description:
          'Il materiale è stato trasferito al progetto di destinazione con DDT.',
      });
      queryClient.invalidateQueries({ queryKey: ['project-materials', projectId] });
      if (toProjectId) {
        queryClient.invalidateQueries({
          queryKey: ['project-materials', parseInt(toProjectId)],
        });
      }
      handleClose();
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description:
          error.response?.data?.message ||
          'Impossibile trasferire il materiale',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!toProjectId) {
      toast.error('Seleziona un progetto di destinazione');
      return;
    }

    if (!quantity || parseFloat(quantity) <= 0) {
      toast.error('Inserisci una quantità valida');
      return;
    }

    transferMutation.mutate({
      to_project_id: parseInt(toProjectId),
      quantity: parseFloat(quantity),
      ddt_number: ddtNumber || undefined,
      notes: notes || undefined,
    });
  };

  const handleClose = () => {
    setToProjectId('');
    setQuantity('');
    setDdtNumber('');
    setNotes('');
    onOpenChange(false);
  };

  if (!material) return null;

  const availableToTransfer =
    material.delivered_quantity - material.returned_quantity;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-purple-600" />
            Trasferimento Materiale tra Progetti
          </DialogTitle>
          <DialogDescription>
            Trasferisci materiale da questo progetto a un altro. Il magazzino
            NON verrà toccato.
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
                    {material.product?.code} - {material.product?.name}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    Consegnato / Rientrato
                  </p>
                  <p className="font-semibold">
                    {material.delivered_quantity} / {material.returned_quantity}{' '}
                    {material.product?.unit}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-purple-600 font-medium">
                    Disponibile per trasferimento:{' '}
                    {availableToTransfer.toFixed(2)} {material.product?.unit}
                  </p>
                </div>
              </div>
            </div>

            {/* Info Alert */}
            <Alert className="border-purple-200 bg-purple-50">
              <FileText className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-sm text-purple-900">
                <strong>Importante:</strong> Il materiale rimane OUT dal
                magazzino. Verrà tracciato con DDT ma lo stock non verrà
                ricaricato.
              </AlertDescription>
            </Alert>

            {/* Project Select */}
            <div className="space-y-2">
              <Label htmlFor="to_project">
                Progetto di destinazione{' '}
                <span className="text-red-500">*</span>
              </Label>
              <Select value={toProjectId} onValueChange={setToProjectId}>
                <SelectTrigger id="to_project">
                  <SelectValue placeholder="Seleziona progetto" />
                </SelectTrigger>
                <SelectContent>
                  {loadingProjects ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : projects.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">
                      Nessun progetto attivo disponibile
                    </div>
                  ) : (
                    projects.map((project: any) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.code} - {project.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity Input */}
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantità da trasferire <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={availableToTransfer}
                  placeholder={`Max: ${availableToTransfer.toFixed(2)}`}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
                <span className="flex items-center text-sm text-muted-foreground px-3 border rounded-md bg-slate-50">
                  {material.product?.unit}
                </span>
              </div>
              {availableToTransfer > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(availableToTransfer.toString())}
                  className="mt-2"
                >
                  Trasferisci tutto: {availableToTransfer.toFixed(2)}{' '}
                  {material.product?.unit}
                </Button>
              )}
            </div>

            {/* DDT Number */}
            <div className="space-y-2">
              <Label htmlFor="ddt_number">
                Numero DDT{' '}
                <span className="text-xs text-muted-foreground">
                  (opzionale ma consigliato)
                </span>
              </Label>
              <Input
                id="ddt_number"
                type="text"
                placeholder="Es: DDT-2026-050"
                value={ddtNumber}
                onChange={(e) => setDdtNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Il DDT verrà registrato per tracciabilità del movimento
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Note (opzionale)</Label>
              <Textarea
                id="notes"
                placeholder="Motivo trasferimento, urgenza, condizioni..."
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
              disabled={transferMutation.isPending}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={transferMutation.isPending || availableToTransfer <= 0}
            >
              {transferMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Trasferisci
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

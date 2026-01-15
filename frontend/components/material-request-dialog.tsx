'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { materialRequestsApi } from '@/lib/api/material-requests';
import { materialsApi } from '@/lib/api/materials';
import { toast } from 'sonner';
import { Loader2, AlertCircle, Package } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import type { MaterialRequestPriority } from '@/lib/types';

const materialRequestSchema = z.object({
  site_id: z.number({
    required_error: 'Il cantiere è obbligatorio',
  }),
  material_id: z.number({
    required_error: 'Seleziona un materiale',
  }),
  quantity_requested: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'La quantità deve essere maggiore di zero',
  }),
  unit_of_measure: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  reason: z.string().min(10, 'Spiega brevemente perché serve questo materiale (min 10 caratteri)'),
  notes: z.string().optional(),
  needed_by: z.string().optional(),
});

type MaterialRequestFormData = z.infer<typeof materialRequestSchema>;

interface MaterialRequestDialogProps {
  siteId: number;
  siteName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const priorityConfig: Record<
  MaterialRequestPriority,
  { label: string; color: string; description: string }
> = {
  low: {
    label: 'Bassa',
    color: 'bg-slate-100 text-slate-700 border-slate-300',
    description: 'Non urgente, può attendere',
  },
  medium: {
    label: 'Media',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    description: 'Necessario nei prossimi giorni',
  },
  high: {
    label: 'Alta',
    color: 'bg-orange-100 text-orange-700 border-orange-300',
    description: 'Necessario presto',
  },
  urgent: {
    label: 'Urgente',
    color: 'bg-red-100 text-red-700 border-red-300',
    description: 'Necessario immediatamente',
  },
};

export function MaterialRequestDialog({
  siteId,
  siteName,
  open,
  onOpenChange,
}: MaterialRequestDialogProps) {
  const queryClient = useQueryClient();
  const [selectedPriority, setSelectedPriority] = useState<MaterialRequestPriority>('medium');

  const form = useForm<MaterialRequestFormData>({
    resolver: zodResolver(materialRequestSchema),
    defaultValues: {
      site_id: siteId,
      priority: 'medium',
      reason: '',
      notes: '',
    },
  });

  const { data: materials, isLoading: loadingMaterials } = useQuery({
    queryKey: ['materials'],
    queryFn: () => materialsApi.getAll(),
    enabled: open,
  });

  const requestMutation = useMutation({
    mutationFn: (data: MaterialRequestFormData) => {
      const payload = {
        site_id: data.site_id,
        material_id: data.material_id,
        quantity_requested: parseFloat(data.quantity_requested),
        unit_of_measure: data.unit_of_measure || undefined,
        priority: data.priority,
        reason: data.reason,
        notes: data.notes || undefined,
        needed_by: data.needed_by || undefined,
      };
      return materialRequestsApi.create(payload);
    },
    onSuccess: () => {
      toast.success('Richiesta materiale inviata con successo');
      queryClient.invalidateQueries({ queryKey: ['material-requests', siteId] });
      queryClient.invalidateQueries({ queryKey: ['my-material-requests'] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Errore durante l\'invio della richiesta');
    },
  });

  const onSubmit = (data: MaterialRequestFormData) => {
    requestMutation.mutate(data);
  };

  const selectedMaterial = materials?.find((m) => m.id === form.watch('material_id'));

  // Auto-fill unit of measure when material is selected
  useEffect(() => {
    if (selectedMaterial?.unit_of_measure) {
      form.setValue('unit_of_measure', selectedMaterial.unit_of_measure);
    }
  }, [selectedMaterial, form]);

  useEffect(() => {
    if (!open) {
      form.reset({
        site_id: siteId,
        priority: 'medium',
        reason: '',
        notes: '',
      });
      setSelectedPriority('medium');
    }
  }, [open, form, siteId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Richiedi Materiale</DialogTitle>
          <DialogDescription>
            Compila il form per richiedere materiale per il cantiere <strong>{siteName}</strong>
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <Package className="h-4 w-4" />
          <AlertDescription>
            La tua richiesta sarà inviata al responsabile del cantiere che potrà approvarla o
            rifiutarla. Riceverai una notifica con l'esito.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Material Selection */}
            <FormField
              control={form.control}
              name="material_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Materiale *</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
                    disabled={loadingMaterials}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona un materiale" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {materials?.map((material) => (
                        <SelectItem key={material.id} value={material.id.toString()}>
                          <div className="flex items-center gap-2">
                            <span>{material.name}</span>
                            {material.code && (
                              <span className="text-xs text-slate-500">({material.code})</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quantity and Unit */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity_requested"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantità *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Es. 10"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit_of_measure"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unità di Misura</FormLabel>
                    <FormControl>
                      <Input placeholder="Es. kg, pz, m" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      {selectedMaterial?.unit_of_measure
                        ? `Predefinita: ${selectedMaterial.unit_of_measure}`
                        : 'Opzionale'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Priority Selection */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priorità *</FormLabel>
                  <FormDescription>Quanto è urgente questa richiesta?</FormDescription>
                  <FormControl>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.keys(priorityConfig) as MaterialRequestPriority[]).map(
                        (priority) => (
                          <button
                            key={priority}
                            type="button"
                            onClick={() => {
                              field.onChange(priority);
                              setSelectedPriority(priority);
                            }}
                            className={`p-3 border-2 rounded-md text-left transition-all hover:shadow-sm ${
                              field.value === priority
                                ? priorityConfig[priority].color
                                : 'border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <div className="font-medium">{priorityConfig[priority].label}</div>
                            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                              {priorityConfig[priority].description}
                            </div>
                          </button>
                        )
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Needed By Date */}
            <FormField
              control={form.control}
              name="needed_by"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Necessario entro (opzionale)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} min={new Date().toISOString().split('T')[0]} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Indica quando ti serve il materiale
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivazione *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Spiega perché serve questo materiale..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Aiuta il responsabile a capire perché serve questo materiale
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note aggiuntive (opzionale)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Altre informazioni utili..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={requestMutation.isPending}
              >
                Annulla
              </Button>
              <Button type="submit" disabled={requestMutation.isPending}>
                {requestMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Invia Richiesta
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

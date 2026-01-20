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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { siteWorkersApi } from '@/lib/api/site-workers';
import { workersApi } from '@/lib/api/workers';
import { SiteRoleBadge } from '@/app/(dashboard)/sites/_components/site-role-badge';
import { toast } from 'sonner';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { SiteWorker } from '@/lib/types';

const assignWorkerSchema = z
  .object({
    worker_id: z.number({ message: 'Seleziona un lavoratore' }),
    role_ids: z.array(z.number()).min(1, 'Seleziona almeno un ruolo'),
    assigned_from: z.string({ message: 'Inserisci data inizio' }),
    assigned_to: z.string().optional(),
    response_days: z.number().min(1).max(30),
    hourly_rate_override: z.string().optional(),
    fixed_rate_override: z.string().optional(),
    rate_override_notes: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      // Can't have both hourly and fixed rate
      if (data.hourly_rate_override && data.fixed_rate_override) {
        return false;
      }
      return true;
    },
    {
      message: 'Non puoi specificare sia tariffa oraria che forfait',
      path: ['fixed_rate_override'],
    }
  );

type AssignWorkerFormData = z.infer<typeof assignWorkerSchema>;

interface AssignWorkerDialogProps {
  siteId: number;
  assignment?: SiteWorker | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignWorkerDialog({ siteId, assignment = null, open, onOpenChange }: AssignWorkerDialogProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!assignment;
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [useRateOverride, setUseRateOverride] = useState(false);
  const [rateType, setRateType] = useState<'hourly' | 'fixed'>('hourly');

  const form = useForm<AssignWorkerFormData>({
    resolver: zodResolver(assignWorkerSchema),
    defaultValues: {
      role_ids: [],
      response_days: 3,
      notes: '',
    },
  });

  const { data: workers, isLoading: loadingWorkers } = useQuery({
    queryKey: ['workers'],
    queryFn: () => workersApi.getAll(),
    enabled: open,
  });

  const { data: roles, isLoading: loadingRoles } = useQuery({
    queryKey: ['site-roles'],
    queryFn: () => siteWorkersApi.getRoles(),
    enabled: open,
  });

  const assignMutation = useMutation({
    mutationFn: (data: AssignWorkerFormData) => {
      const payload = {
        worker_id: data.worker_id,
        role_ids: data.role_ids,
        assigned_from: data.assigned_from,
        assigned_to: data.assigned_to || undefined,
        response_days: data.response_days,
        hourly_rate_override: data.hourly_rate_override
          ? parseFloat(data.hourly_rate_override)
          : undefined,
        fixed_rate_override: data.fixed_rate_override
          ? parseFloat(data.fixed_rate_override)
          : undefined,
        rate_override_notes: data.rate_override_notes || undefined,
        notes: data.notes || undefined,
      };

      console.log('📤 Sending assignment payload:', payload);
      console.log('Site ID:', siteId);
      console.log('Is Edit Mode:', isEditMode);

      if (isEditMode && assignment) {
        // In edit mode, we don't send worker_id (can't change worker)
        const { worker_id, ...updatePayload } = payload;
        console.log('📤 Update payload:', updatePayload);
        return siteWorkersApi.updateAssignment(assignment.id, updatePayload);
      } else {
        console.log('📤 Create payload:', payload);
        return siteWorkersApi.assignWorker(siteId, payload);
      }
    },
    onSuccess: (data) => {
      console.log('✅ Assignment successful!', data);
      toast.success(isEditMode ? 'Assegnazione aggiornata con successo' : 'Lavoratore assegnato con successo');
      queryClient.invalidateQueries({ queryKey: ['site-workers', siteId] });
      onOpenChange(false);
      form.reset();
      setSelectedRoles([]);
      setUseRateOverride(false);
    },
    onError: (error: any) => {
      console.error('❌ Assignment failed:', error);
      console.error('Response data:', error?.response?.data);
      console.error('Response status:', error?.response?.status);
      toast.error(error?.response?.data?.message || (isEditMode ? 'Errore durante l\'aggiornamento' : 'Errore durante l\'assegnazione'));
    },
  });

  const onSubmit = (data: AssignWorkerFormData) => {
    assignMutation.mutate(data);
  };

  const toggleRole = (roleId: number) => {
    const newRoles = selectedRoles.includes(roleId)
      ? selectedRoles.filter((id) => id !== roleId)
      : [...selectedRoles, roleId];
    setSelectedRoles(newRoles);
    form.setValue('role_ids', newRoles);
  };

  const selectedWorker = workers?.data?.find((w) => w.id === form.watch('worker_id'));
  const isExternal = selectedWorker?.worker_type === 'external';

  useEffect(() => {
    if (open && isEditMode && assignment) {
      // Populate form with existing assignment data
      const roleIds = assignment.roles?.map(r => r.id) || [];
      setSelectedRoles(roleIds);

      const hasRateOverride = !!assignment.hourly_rate_override || !!assignment.fixed_rate_override;
      setUseRateOverride(hasRateOverride);

      if (assignment.fixed_rate_override) {
        setRateType('fixed');
      } else if (assignment.hourly_rate_override) {
        setRateType('hourly');
      }

      form.reset({
        worker_id: assignment.worker_id,
        role_ids: roleIds,
        assigned_from: assignment.assigned_from,
        assigned_to: assignment.assigned_to || '',
        response_days: 3, // Default value for edit mode
        hourly_rate_override: assignment.hourly_rate_override?.toString() || '',
        fixed_rate_override: assignment.fixed_rate_override?.toString() || '',
        rate_override_notes: assignment.rate_override_notes || '',
        notes: assignment.notes || '',
      });
    } else if (!open) {
      // Reset form when closing
      form.reset({
        role_ids: [],
        response_days: 3,
        notes: '',
      });
      setSelectedRoles([]);
      setUseRateOverride(false);
      setRateType('hourly');
    }
  }, [open, isEditMode, assignment, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Modifica Assegnazione' : 'Assegna Lavoratore al Cantiere'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? `Modifica i dettagli dell'assegnazione di ${assignment?.worker?.full_name}`
              : 'Seleziona un lavoratore e configura i dettagli dell\'assegnazione'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Worker Selection */}
            <FormField
              control={form.control}
              name="worker_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lavoratore *</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
                    disabled={loadingWorkers || isEditMode}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona un lavoratore" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {workers?.data?.map((worker) => (
                        <SelectItem key={worker.id} value={worker.id.toString()}>
                          {worker.full_name} -{' '}
                          {worker.worker_type === 'employee'
                            ? 'Dipendente'
                            : worker.worker_type === 'external'
                              ? 'Esterno'
                              : 'Freelancer'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isEditMode && (
                    <FormDescription className="text-xs text-slate-500">
                      Il lavoratore non può essere modificato dopo l'assegnazione
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* External Worker Alert */}
            {isExternal && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Questo è un lavoratore esterno. Riceverà una notifica e dovrà accettare
                  l'assegnazione.
                </AlertDescription>
              </Alert>
            )}

            {/* Roles Selection */}
            <FormField
              control={form.control}
              name="role_ids"
              render={() => (
                <FormItem>
                  <FormLabel>Ruoli *</FormLabel>
                  <FormDescription>Seleziona uno o più ruoli per questo lavoratore</FormDescription>
                  <FormControl>
                    <div className="flex flex-wrap gap-2 p-4 border rounded-md bg-slate-50 dark:bg-slate-900">
                      {loadingRoles ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        roles?.map((role) => (
                          <button
                            key={role.id}
                            type="button"
                            onClick={() => toggleRole(role.id)}
                            className="transition-opacity hover:opacity-80"
                          >
                            <SiteRoleBadge
                              role={role}
                              className={
                                selectedRoles.includes(role.id)
                                  ? 'border-2 opacity-100'
                                  : 'opacity-50'
                              }
                            />
                          </button>
                        ))
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assigned_from"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Inizio *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assigned_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Fine (opzionale)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Lascia vuoto per assegnazione senza fine
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Response Days for External Workers */}
            {isExternal && (
              <FormField
                control={form.control}
                name="response_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giorni per risposta: {field.value}</FormLabel>
                    <FormControl>
                      <Slider
                        min={1}
                        max={30}
                        step={1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        className="mt-2"
                      />
                    </FormControl>
                    <FormDescription>
                      Il lavoratore esterno dovrà rispondere entro {field.value} giorni
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Rate Override */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="use-rate-override"
                  checked={useRateOverride}
                  onCheckedChange={(checked) => {
                    setUseRateOverride(checked === true);
                    if (!checked) {
                      form.setValue('hourly_rate_override', undefined);
                      form.setValue('fixed_rate_override', undefined);
                      form.setValue('rate_override_notes', undefined);
                    }
                  }}
                />
                <Label htmlFor="use-rate-override" className="cursor-pointer">
                  Sovrascrivi tariffa per questo cantiere
                </Label>
              </div>

              {useRateOverride && (
                <div className="space-y-3 p-4 border rounded-md bg-slate-50 dark:bg-slate-900">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={rateType === 'hourly' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setRateType('hourly');
                        form.setValue('fixed_rate_override', undefined);
                      }}
                    >
                      Tariffa Oraria
                    </Button>
                    <Button
                      type="button"
                      variant={rateType === 'fixed' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setRateType('fixed');
                        form.setValue('hourly_rate_override', undefined);
                      }}
                    >
                      Forfait
                    </Button>
                  </div>

                  {rateType === 'hourly' ? (
                    <FormField
                      control={form.control}
                      name="hourly_rate_override"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tariffa Oraria (€/h)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Es. 25.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={form.control}
                      name="fixed_rate_override"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Importo Forfait (€)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Es. 5000.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="rate_override_notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Note sulla tariffa</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Motivo della tariffa personalizzata..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Note aggiuntive sull'assegnazione..."
                      className="resize-none"
                      rows={3}
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
                disabled={assignMutation.isPending}
              >
                Annulla
              </Button>
              <Button type="submit" disabled={assignMutation.isPending}>
                {assignMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditMode ? 'Salva Modifiche' : 'Assegna'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

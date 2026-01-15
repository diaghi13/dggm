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
import { Slider } from '@/components/ui/slider';
import { invitationsApi } from '@/lib/api/invitations';
import { suppliersApi } from '@/lib/api/suppliers';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { WorkerType, ContractType } from '@/lib/types';

const invitationSchema = z.object({
  email: z.string().email('Email non valida'),
  first_name: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
  last_name: z.string().min(2, 'Il cognome deve avere almeno 2 caratteri'),
  phone: z.string().optional(),
  supplier_id: z.number().optional(),
  worker_type: z.enum(['employee', 'external', 'freelancer']),
  contract_type: z.enum(['permanent', 'fixed_term', 'seasonal', 'project_based', 'internship']).optional(),
  job_title: z.string().optional(),
  expires_in_days: z.number().min(1).max(30),
});

type InvitationFormData = z.infer<typeof invitationSchema>;

interface CreateInvitationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateInvitationDialog({ open, onOpenChange }: CreateInvitationDialogProps) {
  const queryClient = useQueryClient();
  const [selectedWorkerType, setSelectedWorkerType] = useState<WorkerType>('external');

  const form = useForm<InvitationFormData>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      worker_type: 'external',
      expires_in_days: 7,
    },
  });

  const { data: suppliers, isLoading: loadingSuppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersApi.getAll(),
    enabled: open && selectedWorkerType === 'external',
  });

  const createMutation = useMutation({
    mutationFn: (data: InvitationFormData) => {
      const payload = {
        ...data,
        phone: data.phone || null,
        supplier_id: data.supplier_id || null,
        contract_type: data.contract_type || null,
        job_title: data.job_title || null,
      };
      return invitationsApi.create(payload);
    },
    onSuccess: () => {
      toast.success('Invito inviato con successo');
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Errore durante l\'invio dell\'invito');
    },
  });

  const onSubmit = (data: InvitationFormData) => {
    createMutation.mutate(data);
  };

  useEffect(() => {
    if (!open) {
      form.reset({
        worker_type: 'external',
        expires_in_days: 7,
      });
      setSelectedWorkerType('external');
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invita Nuovo Lavoratore</DialogTitle>
          <DialogDescription>
            Invia un invito via email per registrare un nuovo collaboratore
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Info */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Mario" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cognome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Rossi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="mario.rossi@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefono</FormLabel>
                    <FormControl>
                      <Input placeholder="+39 333 1234567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Worker Type */}
            <FormField
              control={form.control}
              name="worker_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo Lavoratore *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedWorkerType(value as WorkerType);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="employee">Dipendente</SelectItem>
                      <SelectItem value="external">Esterno (Cooperativa/Fornitore)</SelectItem>
                      <SelectItem value="freelancer">Freelancer</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Supplier (only for external) */}
            {selectedWorkerType === 'external' && (
              <FormField
                control={form.control}
                name="supplier_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cooperativa/Fornitore</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                      disabled={loadingSuppliers}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona cooperativa" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {suppliers?.data?.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id.toString()}>
                            {supplier.company_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      Opzionale - associa a una cooperativa
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Contract Type */}
            <FormField
              control={form.control}
              name="contract_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo Contratto</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona contratto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="permanent">Indeterminato</SelectItem>
                      <SelectItem value="fixed_term">Determinato</SelectItem>
                      <SelectItem value="seasonal">Stagionale</SelectItem>
                      <SelectItem value="project_based">A Progetto</SelectItem>
                      <SelectItem value="internship">Stage</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">Opzionale</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Job Title */}
            <FormField
              control={form.control}
              name="job_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Qualifica</FormLabel>
                  <FormControl>
                    <Input placeholder="Es. Elettricista, Muratore..." {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">Opzionale</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Expiration Days */}
            <FormField
              control={form.control}
              name="expires_in_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scadenza invito: {field.value} giorni</FormLabel>
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
                  <FormDescription className="text-xs">
                    L'invito scadrà dopo {field.value} giorni
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createMutation.isPending}
              >
                Annulla
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Invia Invito
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

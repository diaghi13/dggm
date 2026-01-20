'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '@/lib/api/customers';
import { CustomerFormData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { CustomerForm } from '@/components/customer-form';
import { PageHeader } from '@/components/layout/page-header';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function NewCustomerPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CustomerFormData) => customersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Cliente creato con successo', {
        description: 'Il nuovo cliente è stato aggiunto al database',
      });
      router.push('/customers');
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error
        ? error.message
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Impossibile creare il cliente';

      toast.error('Errore', {
        description: errorMessage,
      });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nuovo Cliente"
        description="Aggiungi un nuovo cliente al database"
        icon={UserPlus}
        actions={
          <Button
            variant="outline"
            onClick={() => router.push('/customers')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Torna ai Clienti
          </Button>
        }
      />

      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
        <CustomerForm
          id="customer-form"
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/customers')}
            disabled={createMutation.isPending}
          >
            Annulla
          </Button>
          <Button
            type="submit"
            form="customer-form"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Salvataggio...' : 'Crea Cliente'}
          </Button>
        </div>
      </div>
    </div>
  );
}


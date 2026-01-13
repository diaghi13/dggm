'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '@/lib/api/customers';
import { Customer, CustomerFormData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Users } from 'lucide-react';
import { CustomerForm } from '@/components/customer-form';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { createCustomersColumns } from '@/components/customers-columns';
import { EmptyState } from '@/components/empty-state';
import { toast } from 'sonner';
import { useRouter } from "next/navigation";

export default function CustomersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const perPage = 15;
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['customers', { search, type: typeFilter, active: activeFilter, page, perPage }],
    queryFn: () =>
      customersApi.getAll({
        search: search || undefined,
        type: typeFilter !== 'all' ? (typeFilter as 'individual' | 'company') : undefined,
        is_active: activeFilter !== 'all' ? activeFilter === 'active' : undefined,
        page,
        per_page: perPage,
      }),
  });

  const customers = data?.data || [];
  const meta = data?.meta;

  // Define columns using useMemo to avoid recreation on every render
  const columns = useMemo(
    () =>
      createCustomersColumns(
        (customer) => {
          setSelectedCustomer(customer);
          setIsEditDialogOpen(true);
        },
        (customer) => {
          setSelectedCustomer(customer);
          setIsDeleteDialogOpen(true);
        },
        (customer) => {
          router.push(`/dashboard/customers/${customer.id}`);
        }
      ),
    [router]
  );

  const createMutation = useMutation({
    mutationFn: (data: CustomerFormData) => customersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsCreateDialogOpen(false);
      toast.success('Cliente creato con successo', {
        description: 'Il nuovo cliente è stato aggiunto al database',
      });
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description: error.response?.data?.message || 'Impossibile creare il cliente',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CustomerFormData }) =>
      customersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsEditDialogOpen(false);
      setSelectedCustomer(null);
      toast.success('Cliente aggiornato', {
        description: 'Le modifiche sono state salvate',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => customersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsDeleteDialogOpen(false);
      setSelectedCustomer(null);
      toast.success('Cliente eliminato', {
        description: 'Il cliente è stato rimosso dal database',
      });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clienti"
        description="Gestisci l'anagrafica clienti"
        icon={Users}
        actions={
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuovo Cliente
          </Button>
        }
      />

      {/* Filtri in Card */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <Input
              placeholder="Cerca clienti..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10 h-11 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
            />
          </div>
          <Select value={typeFilter} onValueChange={(value) => { setTypeFilter(value); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-40 h-11 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i tipi</SelectItem>
              <SelectItem value="individual">Privati</SelectItem>
              <SelectItem value="company">Aziende</SelectItem>
            </SelectContent>
          </Select>
          <Select value={activeFilter} onValueChange={(value) => { setActiveFilter(value); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-40 h-11 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700">
              <SelectValue placeholder="Stato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli stati</SelectItem>
              <SelectItem value="active">Attivi</SelectItem>
              <SelectItem value="inactive">Inattivi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={customers}
        isLoading={isLoading}
        storageKey="customers-table"
        onRowClick={(customer) => router.push(`/dashboard/customers/${customer.id}`)}
        emptyState={
          <EmptyState
            icon={Users}
            title="Nessun cliente trovato"
            description="Inizia aggiungendo il tuo primo cliente al database"
            actionLabel="Nuovo Cliente"
            onAction={() => setIsCreateDialogOpen(true)}
          />
        }
      />

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-slate-600">
            Mostrando <span className="font-medium">{meta.from}</span> a{' '}
            <span className="font-medium">{meta.to}</span> di{' '}
            <span className="font-medium">{meta.total}</span> clienti
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1} className="border-slate-300">
              Precedente
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === meta.last_page} className="border-slate-300">
              Successiva
            </Button>
          </div>
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-800">
            <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">Nuovo Cliente</DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              Aggiungi un nuovo cliente al database
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-6 py-6">
            <CustomerForm
              onSubmit={(data) => createMutation.mutate(data)}
              onCancel={() => setIsCreateDialogOpen(false)}
              isLoading={createMutation.isPending}
            />
          </div>
          <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
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
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-800">
            <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">Modifica Cliente</DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              Aggiorna le informazioni del cliente
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-6 py-6">
            {selectedCustomer && (
              <CustomerForm
                customer={selectedCustomer}
                onSubmit={(data) => updateMutation.mutate({ id: selectedCustomer.id, data })}
                onCancel={() => {
                  setIsEditDialogOpen(false);
                  setSelectedCustomer(null);
                }}
                isLoading={updateMutation.isPending}
              />
            )}
          </div>
          <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedCustomer(null);
                }}
                disabled={updateMutation.isPending}
              >
                Annulla
              </Button>
              <Button
                type="submit"
                form="customer-form"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Salvataggio...' : 'Aggiorna Cliente'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-900">Elimina Cliente</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              Sei sicuro di voler eliminare <span className="font-semibold text-slate-900">{selectedCustomer?.display_name}</span>?
              <br />
              <span className="text-red-600 font-medium">Questa azione non può essere annullata.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedCustomer(null)} className="border-slate-300">
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedCustomer && deleteMutation.mutate(selectedCustomer.id)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Elimina Cliente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

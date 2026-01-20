'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workersApi } from '@/lib/api/workers';
import { Worker, WorkerFormData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, UserCheck } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/shared/data-table/data-table';
import { createWorkersColumns } from '@/components/workers-columns';
import { EmptyState } from '@/components/shared/empty-state';
import { WorkerForm } from '@/components/worker-form';
import { toast } from 'sonner';
import { useRouter } from "next/navigation";

export default function WorkersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const perPage = 15;
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['workers', { search, type: typeFilter, active: activeFilter, page, perPage }],
    queryFn: () =>
      workersApi.getAll({
        search: search || undefined,
        worker_type: typeFilter !== 'all' ? (typeFilter as 'employee' | 'freelancer' | 'external') : undefined,
        is_active: activeFilter !== 'all' ? activeFilter === 'active' : undefined,
        page,
        per_page: perPage,
      }),
  });

  const workers = data?.data || [];
  const meta = data?.meta;

  // Define columns using useMemo to avoid recreation on every render
  const columns = useMemo(
    () =>
      createWorkersColumns(
        (worker) => {
          setSelectedWorker(worker);
          setIsEditDialogOpen(true);
        },
        (worker) => {
          setSelectedWorker(worker);
          setIsDeleteDialogOpen(true);
        },
        (worker) => {
          router.push(`/workers/${worker.id}`);
        }
      ),
    [router]
  );

  const createMutation = useMutation({
    mutationFn: (data: WorkerFormData) => workersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      setIsCreateDialogOpen(false);
      toast.success('Collaboratore creato con successo', {
        description: 'Il nuovo collaboratore è stato aggiunto al database',
      });
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description: error.response?.data?.message || 'Impossibile creare il collaboratore',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: WorkerFormData }) =>
      workersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      setIsEditDialogOpen(false);
      setSelectedWorker(null);
      toast.success('Collaboratore aggiornato', {
        description: 'Le modifiche sono state salvate',
      });
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description: error.response?.data?.message || 'Impossibile aggiornare il collaboratore',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => workersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      setIsDeleteDialogOpen(false);
      setSelectedWorker(null);
      toast.success('Collaboratore eliminato', {
        description: 'Il collaboratore è stato rimosso dal database',
      });
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description: error.response?.data?.message || 'Impossibile eliminare il collaboratore',
      });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Collaboratori"
        description="Gestisci dipendenti, freelance e lavoratori esterni"
        icon={UserCheck}
        actions={
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuovo Collaboratore
          </Button>
        }
      />

      {/* Filtri in Card */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <Input
              placeholder="Cerca per nome, codice, email..."
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
              <SelectItem value="employee">Dipendenti</SelectItem>
              <SelectItem value="freelancer">Freelance</SelectItem>
              <SelectItem value="external">Esterni</SelectItem>
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
        data={workers}
        isLoading={isLoading}
        storageKey="workers-table"
        onRowClick={(worker) => router.push(`/workers/${worker.id}`)}
        emptyState={
          <EmptyState
            icon={UserCheck}
            title="Nessun collaboratore trovato"
            description="Inizia aggiungendo il tuo primo collaboratore al database"
            actionLabel="Nuovo Collaboratore"
            onAction={() => setIsCreateDialogOpen(true)}
          />
        }
      />

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Mostrando <span className="font-medium">{meta.from}</span> a{' '}
            <span className="font-medium">{meta.to}</span> di{' '}
            <span className="font-medium">{meta.total}</span> collaboratori
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1} className="border-slate-300 dark:border-slate-700">
              Precedente
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === meta.last_page} className="border-slate-300 dark:border-slate-700">
              Successiva
            </Button>
          </div>
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-800">
            <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">Nuovo Collaboratore</DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              Aggiungi un nuovo collaboratore al database
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-6 py-6">
            <WorkerForm
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
                form="worker-form"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Salvataggio...' : 'Crea Collaboratore'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-800">
            <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">Modifica Collaboratore</DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              Aggiorna le informazioni del collaboratore
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-6 py-6">
            {selectedWorker && (
              <WorkerForm
                worker={selectedWorker}
                onSubmit={(data) => updateMutation.mutate({ id: selectedWorker.id, data })}
                onCancel={() => {
                  setIsEditDialogOpen(false);
                  setSelectedWorker(null);
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
                  setSelectedWorker(null);
                }}
                disabled={updateMutation.isPending}
              >
                Annulla
              </Button>
              <Button
                type="submit"
                form="worker-form"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Salvataggio...' : 'Aggiorna Collaboratore'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">Elimina Collaboratore</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
              Sei sicuro di voler eliminare <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedWorker?.display_name}</span>?
              <br />
              <span className="text-red-600 dark:text-red-400 font-medium">Questa azione non può essere annullata.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedWorker(null)} className="border-slate-300 dark:border-slate-700">
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedWorker && deleteMutation.mutate(selectedWorker.id)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Elimina Collaboratore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

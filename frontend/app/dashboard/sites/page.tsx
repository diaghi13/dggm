'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sitesApi } from '@/lib/api/sites';
import { Site, SiteFormData, SiteStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Building2 } from 'lucide-react';
import { SiteForm } from '@/components/site-form';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { createSitesColumns } from '@/components/sites-columns';
import { EmptyState } from '@/components/empty-state';
import { toast } from 'sonner';

export default function SitesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);

  const queryClient = useQueryClient();

  // Define columns
  const columns = useMemo(
    () =>
      createSitesColumns(
        (site) => {
          setSelectedSite(site);
          setIsEditDialogOpen(true);
        },
        (site) => {
          setSelectedSite(site);
          setIsDeleteDialogOpen(true);
        },
        (site) => {
          router.push(`/dashboard/sites/${site.id}`);
        }
      ),
    [router]
  );

  const { data, isLoading } = useQuery({
    queryKey: ['sites', { page, search, status: statusFilter }],
    queryFn: () => sitesApi.getAll({ 
      page, 
      search, 
      status: statusFilter !== 'all' ? statusFilter as SiteStatus : undefined,
      per_page: 15
    }),
  });

  const createMutation = useMutation({
    mutationFn: sitesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      setIsCreateDialogOpen(false);
      toast.success('Cantiere creato con successo');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: SiteFormData }) => sitesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      setIsEditDialogOpen(false);
      setSelectedSite(null);
      toast.success('Cantiere aggiornato');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: sitesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      setIsDeleteDialogOpen(false);
      setSelectedSite(null);
      toast.success('Cantiere eliminato');
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cantieri"
        description="Gestisci i cantieri attivi e pianificati"
        icon={Building2}
        actions={
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuovo Cantiere
          </Button>
        }
      />

      {/* Filtri in Card */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <Input
              placeholder="Cerca cantieri..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 h-11 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700">
              <SelectValue placeholder="Stato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli stati</SelectItem>
              <SelectItem value="planned">Pianificato</SelectItem>
              <SelectItem value="active">Attivo</SelectItem>
              <SelectItem value="on_hold">In Pausa</SelectItem>
              <SelectItem value="completed">Completato</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        storageKey="sites-table"
        onRowClick={(site) => router.push(`/dashboard/sites/${site.id}`)}
        emptyState={
          <EmptyState
            icon={Building2}
            title="Nessun cantiere trovato"
            description="Inizia creando il tuo primo cantiere"
            actionLabel="Nuovo Cantiere"
            onAction={() => setIsCreateDialogOpen(true)}
          />
        }
      />

      {data && data.meta.last_page > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-slate-600">
            Mostrando <span className="font-medium">{data.meta.from}</span> a{' '}
            <span className="font-medium">{data.meta.to}</span> di{' '}
            <span className="font-medium">{data.meta.total}</span> cantieri
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>
              Precedente
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === data.meta.last_page}>
              Successiva
            </Button>
          </div>
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-800">
            <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">Nuovo Cantiere</DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">Crea un nuovo cantiere</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-6 py-6">
            <SiteForm onSubmit={(data) => createMutation.mutate(data)} onCancel={() => setIsCreateDialogOpen(false)} isLoading={createMutation.isPending} />
          </div>
          <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={createMutation.isPending}>Annulla</Button>
              <Button type="submit" form="site-form" disabled={createMutation.isPending}>{createMutation.isPending ? 'Salvataggio...' : 'Crea Cantiere'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-800">
            <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">Modifica Cantiere</DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">Aggiorna i dettagli del cantiere</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-6 py-6">
            {selectedSite && (
              <SiteForm site={selectedSite} onSubmit={(data) => updateMutation.mutate({ id: selectedSite.id, data })} onCancel={() => { setIsEditDialogOpen(false); setSelectedSite(null); }} isLoading={updateMutation.isPending} />
            )}
          </div>
          <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => { setIsEditDialogOpen(false); setSelectedSite(null); }} disabled={updateMutation.isPending}>Annulla</Button>
              <Button type="submit" form="site-form" disabled={updateMutation.isPending}>{updateMutation.isPending ? 'Salvataggio...' : 'Aggiorna Cantiere'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-900">Elimina Cantiere</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              Confermi eliminazione <span className="font-semibold text-slate-900">{selectedSite?.code}</span>?
              <br />
              <span className="text-red-600 font-medium">Questa azione non può essere annullata.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedSite(null)}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedSite && deleteMutation.mutate(selectedSite.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Elimina Cantiere
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

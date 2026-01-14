'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliersApi } from '@/lib/api/suppliers';
import { Supplier, SupplierFormData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Factory } from 'lucide-react';
import { SupplierForm } from '@/components/supplier-form';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { toast } from 'sonner';
import { DataTable } from "@/components/data-table";
import { createSuppliersColumns } from "@/components/suppliers-columns";
import { useRouter } from "next/navigation";

export default function SuppliersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [supplierTypeFilter, setSupplierTypeFilter] = useState<string>('all');
  const [personnelTypeFilter, setPersonnelTypeFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const queryClient = useQueryClient();

  const columns = useMemo(
    () =>
      createSuppliersColumns(
        (supplier) => {
          setSelectedSupplier(supplier);
          setIsEditDialogOpen(true);
        },
        (supplier) => {
          setSelectedSupplier(supplier);
          setIsDeleteDialogOpen(true);
        },
        (supplier) => {
          router.push(`/dashboard/suppliers/${supplier.id}`);
        }
      ),
    [router]
  );

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', { page, search, supplierTypeFilter, personnelTypeFilter, activeFilter }],
    queryFn: () =>
      suppliersApi.getAll({
        page,
        search: search || undefined,
        supplier_type: supplierTypeFilter !== 'all' ? (supplierTypeFilter as any) : undefined,
        personnel_type: personnelTypeFilter !== 'all' ? (personnelTypeFilter as any) : undefined,
        is_active: activeFilter !== 'all' ? activeFilter === 'active' : undefined,
        per_page: 15,
      }),
  });

  const createMutation = useMutation({
    mutationFn: suppliersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setIsCreateDialogOpen(false);
      toast.success('Fornitore creato con successo');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: SupplierFormData }) => suppliersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setIsEditDialogOpen(false);
      setSelectedSupplier(null);
      toast.success('Fornitore aggiornato');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: suppliersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setIsDeleteDialogOpen(false);
      setSelectedSupplier(null);
      toast.success('Fornitore eliminato');
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fornitori"
        description="Gestisci l'anagrafica fornitori"
        icon={Factory}
        actions={
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuovo Fornitore
          </Button>
        }
      />

      {/* Filtri in Card */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <Input
              placeholder="Cerca per nome, P.IVA, email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10 h-11 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
            />
          </div>
          <Select value={supplierTypeFilter} onValueChange={(value) => { setSupplierTypeFilter(value); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-48 h-11 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700">
              <SelectValue placeholder="Tipo Fornitore" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i tipi</SelectItem>
              <SelectItem value="materials">Materiali</SelectItem>
              <SelectItem value="personnel">Personale</SelectItem>
              <SelectItem value="both">Entrambi</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={personnelTypeFilter}
            onValueChange={(value) => { setPersonnelTypeFilter(value); setPage(1); }}
            disabled={supplierTypeFilter === 'materials'}
          >
            <SelectTrigger className="w-full sm:w-52 h-11 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700">
              <SelectValue placeholder="Tipo Personale" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti</SelectItem>
              <SelectItem value="cooperative">Cooperativa</SelectItem>
              <SelectItem value="staffing_agency">Agenzia Interinale</SelectItem>
              <SelectItem value="rental_with_operator">Noleggio con Operatore</SelectItem>
              <SelectItem value="subcontractor">Subappaltatore</SelectItem>
              <SelectItem value="technical_services">Servizi Tecnici</SelectItem>
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
        data={data?.data || []}
        isLoading={isLoading}
        storageKey="suppliers-table"
        onRowClick={(supplier) => router.push(`/dashboard/suppliers/${supplier.id}`)}
        emptyState={
          <EmptyState
            icon={Factory}
            title="Nessun fornitore trovato"
            description="Inizia aggiungendo il tuo primo fornitore"
            actionLabel="Nuovo Fornitore"
            onAction={() => setIsCreateDialogOpen(true)}
          />
        }
      />

      {data && data.meta.last_page > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-slate-600">
            Mostrando <span className="font-medium">{data.meta.from}</span> a{' '}
            <span className="font-medium">{data.meta.to}</span> di{' '}
            <span className="font-medium">{data.meta.total}</span> fornitori
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
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-800">
            <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">Nuovo Fornitore</DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">Aggiungi un nuovo fornitore</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-6 py-6">
            <SupplierForm onSubmit={(data) => createMutation.mutate(data)} onCancel={() => setIsCreateDialogOpen(false)} isLoading={createMutation.isPending} />
          </div>
          <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={createMutation.isPending}>Annulla</Button>
              <Button type="submit" form="supplier-form" disabled={createMutation.isPending}>{createMutation.isPending ? 'Salvataggio...' : 'Crea Fornitore'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-800">
            <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">Modifica Fornitore</DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">Aggiorna i dettagli del fornitore</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-6 py-6">
            {selectedSupplier && (
              <SupplierForm supplier={selectedSupplier} onSubmit={(data) => updateMutation.mutate({ id: selectedSupplier.id, data })} onCancel={() => { setIsEditDialogOpen(false); setSelectedSupplier(null); }} isLoading={updateMutation.isPending} />
            )}
          </div>
          <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => { setIsEditDialogOpen(false); setSelectedSupplier(null); }} disabled={updateMutation.isPending}>Annulla</Button>
              <Button type="submit" form="supplier-form" disabled={updateMutation.isPending}>{updateMutation.isPending ? 'Salvataggio...' : 'Aggiorna Fornitore'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-900">Elimina Fornitore</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              Confermi eliminazione <span className="font-semibold text-slate-900">{selectedSupplier?.company_name}</span>?
              <br />
              <span className="text-red-600 font-medium">Questa azione non può essere annullata.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedSupplier(null)}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedSupplier && deleteMutation.mutate(selectedSupplier.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Elimina Fornitore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

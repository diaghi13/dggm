'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quotesApi } from '@/lib/api/quotes';
import { Quote, QuoteFormData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, FileText } from 'lucide-react';
import { QuoteForm } from '@/app/(dashboard)/quotes/_components/quote-form';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/shared/data-table/data-table';
import { createQuotesColumns } from '@/app/(dashboard)/quotes/_components/quotes-columns';
import { EmptyState } from '@/components/shared/empty-state';
import { toast } from 'sonner';

export default function QuotesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  const queryClient = useQueryClient();

  // Define columns
  const columns = useMemo(
    () =>
      createQuotesColumns(
        (quote) => {
          setSelectedQuote(quote);
          setIsDeleteDialogOpen(true);
        },
        (quote) => {
          router.push(`/quotes/${quote.id}`);
        }
      ),
    [router]
  );

  const { data, isLoading } = useQuery({
    queryKey: ['quotes', { page, search, status: statusFilter }],
    queryFn: () => quotesApi.getAll({
      page,
      search,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      per_page: 15
    }),
  });

  const createMutation = useMutation({
    mutationFn: quotesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      setIsCreateDialogOpen(false);
      toast.success('Preventivo creato con successo', {
        description: 'Il preventivo è stato creato correttamente',
      });
    },
    onError: (error: Error) => {
      toast.error('Errore', {
        description: error.message || 'Impossibile creare il preventivo',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: QuoteFormData }) =>
      quotesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      setIsEditDialogOpen(false);
      setSelectedQuote(null);
      toast.success('Preventivo aggiornato', {
        description: 'Le modifiche sono state salvate',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: quotesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      setIsDeleteDialogOpen(false);
      setSelectedQuote(null);
      toast.success('Preventivo eliminato', {
        description: 'Il preventivo è stato rimosso dal sistema',
      });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Preventivi"
        description="Gestisci preventivi e offerte commerciali"
        icon={FileText}
        actions={
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuovo Preventivo
          </Button>
        }
      />

      {/* Filtri in Card */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <Input
              placeholder="Cerca per codice, titolo o cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 h-11 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700">
              <SelectValue placeholder="Stato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli stati</SelectItem>
              <SelectItem value="draft">Bozza</SelectItem>
              <SelectItem value="sent">Inviato</SelectItem>
              <SelectItem value="approved">Approvato</SelectItem>
              <SelectItem value="rejected">Rifiutato</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        storageKey="quotes-table"
        onRowClick={(quote) => router.push(`/quotes/${quote.id}`)}
        emptyState={
          <EmptyState
            icon={FileText}
            title="Nessun preventivo trovato"
            description="Inizia creando il tuo primo preventivo"
            actionLabel="Nuovo Preventivo"
            onAction={() => setIsCreateDialogOpen(true)}
          />
        }
      />

      {data && data.meta.last_page > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-slate-600">
            Mostrando <span className="font-medium">{data.meta.from}</span> a{' '}
            <span className="font-medium">{data.meta.to}</span> di{' '}
            <span className="font-medium">{data.meta.total}</span> preventivi
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="border-slate-300"
            >
              Precedente
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === data.meta.last_page}
              className="border-slate-300"
            >
              Successiva
            </Button>
          </div>
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-800">
            <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">Nuovo Preventivo</DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">Inserisci i dettagli del nuovo preventivo</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-6 py-6">
            <QuoteForm onSubmit={(data) => createMutation.mutate(data)} onCancel={() => setIsCreateDialogOpen(false)} />
          </div>
          <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Annulla</Button>
              <Button type="submit" form="quote-form">Crea Preventivo</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-800">
            <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">Modifica Preventivo</DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">Aggiorna i dettagli del preventivo</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-6 py-6">
            {selectedQuote && (
              <QuoteForm quote={selectedQuote} onSubmit={(data) => updateMutation.mutate({ id: selectedQuote.id, data })} onCancel={() => { setIsEditDialogOpen(false); setSelectedQuote(null); }} />
            )}
          </div>
          <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => { setIsEditDialogOpen(false); setSelectedQuote(null); }}>Annulla</Button>
              <Button type="submit" form="quote-form">Aggiorna Preventivo</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-900">Elimina Preventivo</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              Sei sicuro di voler eliminare il preventivo <span className="font-semibold text-slate-900">{selectedQuote?.code}</span>?
              <br />
              <span className="text-red-600 font-medium">Questa azione non può essere annullata.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedQuote(null)} className="border-slate-300">
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedQuote && deleteMutation.mutate(selectedQuote.id)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Elimina Preventivo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

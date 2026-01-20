'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ddtsApi } from '@/lib/api/ddts';
import { warehousesApi } from '@/lib/api/warehouses';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Plus, Package, TrendingUp, ArrowLeftRight } from 'lucide-react';
import { DataTable } from '@/components/shared/data-table/data-table';
import { createDdtsColumns } from '@/components/ddts-columns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Ddt } from '@/lib/types';
import { toast } from 'sonner';

export default function DdtsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [warehouseFilter, setWarehouseFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDdt, setSelectedDdt] = useState<Ddt | null>(null);

  // Define columns
  const columns = useMemo(
    () =>
      createDdtsColumns(
        (ddt) => {
          router.push(`/ddts/${ddt.id}`);
        },
        (ddt) => {
          setSelectedDdt(ddt);
          setIsDeleteDialogOpen(true);
        }
      ),
    [router]
  );

  // Fetch warehouses for filter
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses', { is_active: true, per_page: 100 }],
    queryFn: () => warehousesApi.getAll({ is_active: true, per_page: 100 }),
  });

  const warehouses = warehousesData?.data ?? [];

  // Fetch DDTs data
  const { data: ddtsData, isLoading } = useQuery({
    queryKey: [
      'ddts',
      {
        warehouse_id: warehouseFilter || undefined,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
      },
    ],
    queryFn: () =>
      ddtsApi.getAll({
        warehouse_id: warehouseFilter ? parseInt(warehouseFilter) : undefined,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        per_page: 100,
      }),
  });

  const ddts = ddtsData?.data ?? [];

  const deleteMutation = useMutation({
    mutationFn: ddtsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ddts'] });
      setIsDeleteDialogOpen(false);
      setSelectedDdt(null);
      toast.success('DDT eliminato');
    },
    onError: (error: Error) => {
      toast.error('Errore', {
        description: error.message || 'Impossibile eliminare il DDT',
      });
    },
  });

  // Calculate statistics
  const stats = {
    total: ddts.length,
    draft: ddts.filter((d: Ddt) => d.status === 'draft').length,
    issued: ddts.filter((d: Ddt) => d.status === 'issued').length,
    in_transit: ddts.filter((d: Ddt) => d.status === 'in_transit').length,
    delivered: ddts.filter((d: Ddt) => d.status === 'delivered').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Documenti di Trasporto</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Gestione DDT in entrata, uscita e trasferimenti</p>
        </div>
        <Button onClick={() => router.push('/ddts/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Nuovo DDT
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">DDT registrati</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bozze</CardTitle>
            <Package className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-600">{stats.draft}</div>
            <p className="text-xs text-muted-foreground">Da emettere</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emessi</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.issued}</div>
            <p className="text-xs text-muted-foreground">Attivi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transito</CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.in_transit}</div>
            <p className="text-xs text-muted-foreground">In viaggio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consegnati</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
            <p className="text-xs text-muted-foreground">Completati</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtri</CardTitle>
          <CardDescription>Filtra i documenti di trasporto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Select
              value={warehouseFilter || 'all'}
              onValueChange={(value) => setWarehouseFilter(value === 'all' ? '' : value)}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Tutti i magazzini" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i magazzini</SelectItem>
                {warehouses.map((warehouse: any) => (
                  <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={typeFilter || 'all'}
              onValueChange={(value) => setTypeFilter(value === 'all' ? '' : value)}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Tutti i tipi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i tipi</SelectItem>
                <SelectItem value="incoming">In Entrata</SelectItem>
                <SelectItem value="outgoing">In Uscita</SelectItem>
                <SelectItem value="internal">Interno</SelectItem>
                <SelectItem value="rental_out">Noleggio Out</SelectItem>
                <SelectItem value="rental_return">Reso Noleggio</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter || 'all'}
              onValueChange={(value) => setStatusFilter(value === 'all' ? '' : value)}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Tutti gli stati" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli stati</SelectItem>
                <SelectItem value="draft">Bozza</SelectItem>
                <SelectItem value="issued">Emesso</SelectItem>
                <SelectItem value="in_transit">In Transito</SelectItem>
                <SelectItem value="delivered">Consegnato</SelectItem>
                <SelectItem value="cancelled">Annullato</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* DDTs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Elenco DDT ({ddts.length})</CardTitle>
          <CardDescription>Visualizzazione completa documenti di trasporto</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={ddts}
            isLoading={isLoading}
            storageKey="ddts-table"
            onRowClick={(ddt) => router.push(`/ddts/${ddt.id}`)}
            emptyState={
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Nessun DDT trovato
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {warehouseFilter || typeFilter || statusFilter
                    ? 'Prova a modificare i filtri di ricerca'
                    : 'Inizia creando il tuo primo DDT'}
                </p>
                {!warehouseFilter && !typeFilter && !statusFilter && (
                  <Button className="mt-4" onClick={() => router.push('/ddts/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Crea Primo DDT
                  </Button>
                )}
              </div>
            }
          />
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">Elimina DDT</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
              Sei sicuro di voler eliminare il DDT <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedDdt?.code}</span>?
              <br />
              <span className="text-red-600 dark:text-red-400 font-medium">Questa azione non può essere annullata.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedDdt(null)}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedDdt && deleteMutation.mutate(selectedDdt.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Elimina DDT
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


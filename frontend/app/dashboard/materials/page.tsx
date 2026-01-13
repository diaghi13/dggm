'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { materialsApi } from '@/lib/api/materials';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Plus, Search, AlertTriangle, DollarSign, Archive } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { createMaterialsColumns } from '@/components/materials-columns';
import { PageHeader } from '@/components/page-header';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface Material {
  id: number;
  code: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  standard_cost: number;
  barcode?: string;
  qr_code?: string;
  default_supplier_id?: number;
  reorder_level: number;
  reorder_quantity: number;
  lead_time_days: number;
  location?: string;
  is_active: boolean;
  total_stock?: number;
  total_reserved?: number;
}

const categoryLabels: Record<string, string> = {
  construction: 'Edilizia',
  electrical: 'Elettrico',
  plumbing: 'Idraulica',
  tools: 'Attrezzi',
  equipment: 'Attrezzatura',
  general: 'Generale',
};

export default function MaterialsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('');
  const [showInactive, setShowInactive] = useState(false);

  const { data: materialsData, isLoading } = useQuery({
    queryKey: ['materials', { search, category, is_active: !showInactive ? true : undefined }],
    queryFn: () =>
      materialsApi.getAll({
        search,
        category: category || undefined,
        is_active: !showInactive ? true : undefined,
        per_page: 100,
      }),
  });

  const materials = materialsData?.data ?? [];
  const meta = materialsData?.meta;

  const deleteMutation = useMutation({
    mutationFn: (id: number) => materialsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success('Materiale eliminato', {
        description: 'Il materiale è stato eliminato con successo',
      });
    },
    onError: (error: Error) => {
      toast.error('Errore', {
        description: error.message || 'Impossibile eliminare il materiale',
      });
    },
  });

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Sei sicuro di voler eliminare il materiale "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  // Define columns
  const columns = useMemo(
    () =>
      createMaterialsColumns(
        (material) => {
          router.push(`/dashboard/materials/${material.id}`);
        },
        (material) => {
          handleDelete(material.id, material.name);
        }
      ),
    [router]
  );

  // Calcola statistiche
  const stats = {
    total: materials.length,
    active: materials.filter((m: Material) => m.is_active).length,
    inactive: materials.filter((m: Material) => !m.is_active).length,
    totalValue: materials.reduce((sum: number, m: Material) => sum + (Number(m.total_stock || 0) * Number(m.standard_cost || 0)), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Catalogo Materiali</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Gestione completa del catalogo prodotti e materiali</p>
        </div>
        <Link href="/dashboard/materials/new">
          <Button className="shadow-md">
            <Plus className="mr-2 h-4 w-4" />
            Nuovo Materiale
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Materiali</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} attivi, {stats.inactive} inattivi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valore Magazzino</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€ {stats.totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Valore totale stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorie</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(categoryLabels).length}
            </div>
            <p className="text-xs text-muted-foreground">Categorie disponibili</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alert Scorte</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">0</div>
            <p className="text-xs text-muted-foreground">Sotto scorta minima</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtri</CardTitle>
          <CardDescription>Filtra e cerca materiali nel catalogo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cerca per codice o nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <Select value={category || 'all'} onValueChange={(value) => setCategory(value === 'all' ? '' : value)}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Tutte le categorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le categorie</SelectItem>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="show-inactive"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300"
              />
              <label htmlFor="show-inactive" className="text-sm text-slate-700 cursor-pointer">
                Mostra materiali inattivi
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Materials Table */}
      <Card>
        <CardHeader>
          <CardTitle>Materiali ({materials.length})</CardTitle>
          <CardDescription>
            {meta?.total ? `${meta.total} materiali totali` : 'Elenco di tutti i materiali'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={materials}
            isLoading={isLoading}
            storageKey="materials-table"
            onRowClick={(material) => router.push(`/dashboard/materials/${material.id}`)}
            emptyState={
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Nessun materiale trovato</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {search || category
                    ? 'Prova a modificare i filtri di ricerca'
                    : 'Inizia creando il tuo primo materiale'}
                </p>
                {!search && !category && (
                  <Link href="/dashboard/materials/new">
                    <Button className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Crea Primo Materiale
                    </Button>
                  </Link>
                )}
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

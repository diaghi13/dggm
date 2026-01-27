'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { warehousesApi } from '@/lib/api/warehouses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Warehouse as WarehouseIcon,
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  TrendingUp,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Warehouse {
  id: number;
  code: string;
  name: string;
  type: string;
  address?: string;
  city?: string;
  manager_id?: number;
  manager?: {
    id: number;
    name: string;
    email: string;
  };
  is_active: boolean;
  created_at: string;
}

const typeLabels: Record<string, string> = {
  central: 'Centrale',
  site_storage: 'Deposito Cantiere',
  mobile_truck: 'Mobile (Camion)',
};

const typeColors: Record<string, string> = {
  central: 'bg-blue-100 text-blue-700 border-blue-200',
  site_storage: 'bg-green-100 text-green-700 border-green-200',
  mobile_truck: 'bg-purple-100 text-purple-700 border-purple-200',
};

export default function WarehousesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string>('');
  const [showInactive, setShowInactive] = useState(false);

  const { data: warehousesData, isLoading } = useQuery({
    queryKey: ['warehouses', { search, type, is_active: !showInactive ? true : undefined }],
    queryFn: () =>
      warehousesApi.getAll({
        search,
        type: type || undefined,
        is_active: !showInactive ? true : undefined,
        per_page: 100,
      }),
  });

  const warehouses = warehousesData?.data ?? [];
  const meta = warehousesData?.meta;

  const deleteMutation = useMutation({
    mutationFn: (id: number) => warehousesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success('Magazzino eliminato', {
        description: 'Il magazzino è stato eliminato con successo',
      });
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description: error.response?.data?.message || 'Impossibile eliminare il magazzino',
      });
    },
  });

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Sei sicuro di voler eliminare il magazzino "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  // Calcola statistiche
  const stats = {
    total: warehouses.length,
    active: warehouses.filter((w: Warehouse) => w.is_active).length,
    central: warehouses.filter((w: Warehouse) => w.type === 'central').length,
    site: warehouses.filter((w: Warehouse) => w.type === 'site_storage').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Magazzini</h1>
          <p className="text-slate-600 mt-1">Gestione multi-magazzino e ubicazioni</p>
        </div>
        <Link href="/warehouses/new">
          <Button className="shadow-md">
            <Plus className="mr-2 h-4 w-4" />
            Nuovo Magazzino
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Magazzini</CardTitle>
            <WarehouseIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} attivi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Centrali</CardTitle>
            <WarehouseIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.central}</div>
            <p className="text-xs text-muted-foreground">Magazzini principali</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Depositi Cantiere</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.site}</div>
            <p className="text-xs text-muted-foreground">Storage on-site</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Manager</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {warehouses.filter((w: Warehouse) => w.manager_id).length}
            </div>
            <p className="text-xs text-muted-foreground">Responsabili assegnati</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtri</CardTitle>
          <CardDescription>Filtra e cerca magazzini</CardDescription>
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
            <Select value={type || 'all'} onValueChange={(value) => setType(value === 'all' ? '' : value)}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Tutti i tipi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i tipi</SelectItem>
                {Object.entries(typeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="show-inactive-wh"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300"
              />
              <label htmlFor="show-inactive-wh" className="text-sm text-slate-700 cursor-pointer">
                Mostra magazzini inattivi
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warehouses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Magazzini ({warehouses.length})</CardTitle>
          <CardDescription>
            {meta?.total ? `${meta.total} magazzini totali` : 'Elenco di tutti i magazzini'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-4 text-sm text-slate-600">Caricamento magazzini...</p>
            </div>
          ) : warehouses.length === 0 ? (
            <div className="text-center py-12">
              <WarehouseIcon className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-lg font-semibold text-slate-900">Nessun magazzino trovato</h3>
              <p className="mt-2 text-sm text-slate-600">
                {search || type
                  ? 'Prova a modificare i filtri di ricerca'
                  : 'Inizia creando il tuo primo magazzino'}
              </p>
              {!search && !type && (
                <Link href="/warehouses/new">
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Crea Primo Magazzino
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Codice</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Ubicazione</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouses.map((warehouse: Warehouse) => (
                    <TableRow key={warehouse.id}>
                      <TableCell className="font-medium">{warehouse.code}</TableCell>
                      <TableCell>
                        <div className="font-medium">{warehouse.name}</div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={typeColors[warehouse.type] || typeColors.central}
                        >
                          {typeLabels[warehouse.type] || warehouse.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {warehouse.city ? (
                          <span className="text-sm text-slate-600">
                            {warehouse.city}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {warehouse.manager ? (
                          <span className="text-sm">{warehouse.manager.name}</span>
                        ) : (
                          <span className="text-slate-400 text-sm">Non assegnato</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={warehouse.is_active ? 'default' : 'secondary'}>
                          {warehouse.is_active ? 'Attivo' : 'Inattivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/warehouses/${warehouse.id}`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(warehouse.id, warehouse.name)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

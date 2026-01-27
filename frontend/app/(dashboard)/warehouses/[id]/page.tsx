'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { warehousesApi } from '@/lib/api/warehouses';
import { stockMovementsApi } from '@/lib/api/stock-movements';
import { WarehouseForm } from '@/components/warehouse-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/shared/data-table/data-table';
import { createWarehouseInventoryColumns } from '@/components/warehouse-inventory-columns';
import { createStockMovementsColumns } from '@/components/stock-movements-columns';
import { CreateStockMovementDialog } from '@/components/create-stock-movement-dialog';
import { BulkIntakeDialog } from '@/components/warehouse/bulk-intake-dialog';
import { ArrowLeft, Edit, X, Package, AlertTriangle, TrendingUp, Plus } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

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

export default function WarehouseDetailPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const id = parseInt(params.id as string);

  // Define columns for DataTables
  const inventoryColumns = useMemo(() => createWarehouseInventoryColumns(), []);
  const movementsColumns = useMemo(() => createStockMovementsColumns(), []);

  const { data: warehouse, isLoading } = useQuery({
    queryKey: ['warehouse', id],
    queryFn: () => warehousesApi.getById(id),
    enabled: !!id,
  });

  const { data: inventoryData, isLoading: isLoadingInventory } = useQuery({
    queryKey: ['warehouse-inventory', id],
    queryFn: () => warehousesApi.getInventory(id),
    enabled: !!id,
  });

  const inventory = inventoryData ?? [];

  // Fetch stock movements for this warehouse
  const { data: movementsData, isLoading: isLoadingMovements } = useQuery({
    queryKey: ['warehouse-movements', id],
    queryFn: () => stockMovementsApi.getAll({ warehouse_id: id, per_page: 100 }),
    enabled: !!id,
  });

  const movements = movementsData?.data ?? [];

  const updateMutation = useMutation({
    mutationFn: (data: any) => warehousesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse', id] });
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success('Magazzino aggiornato', {
        description: 'Il magazzino è stato aggiornato con successo',
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description: error.response?.data?.message || 'Impossibile aggiornare il magazzino',
      });
    },
  });

  const handleUpdate = (data: any) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-slate-900">Magazzino non trovato</h3>
        <p className="mt-2 text-sm text-slate-600">Il magazzino richiesto non esiste</p>
        <Link href="/frontend/app/(dashboard)/warehouses">
          <Button className="mt-4">Torna ai Magazzini</Button>
        </Link>
      </div>
    );
  }

  const lowStockItems = inventory.filter((item: App.Data.InventoryData) => item.is_low_stock);
  const totalValue = inventory.reduce(
    (sum: number, item: App.Data.InventoryData) => {
      const quantity = Number(item.quantity_available || 0);
      const price = Number(item.product?.purchase_price || 0);
      return sum + (quantity * price);
    },
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/warehouses">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900">{warehouse.code}</h1>
              <Badge variant={warehouse.is_active ? 'default' : 'secondary'}>
                {warehouse.is_active ? 'Attivo' : 'Inattivo'}
              </Badge>
              <Badge variant="outline" className={typeColors[warehouse.type]}>
                {typeLabels[warehouse.type]}
              </Badge>
            </div>
            <p className="text-slate-600 mt-1">{warehouse.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Modifica
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => setIsEditing(false)}>
              <X className="mr-2 h-4 w-4" />
              Annulla
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Dettagli</TabsTrigger>
          <TabsTrigger value="inventory">
            Inventario
            {lowStockItems.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {lowStockItems.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="movements">
            Movimenti
            {movements.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {movements.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          {isEditing ? (
            <WarehouseForm
              initialData={warehouse}
              onSubmit={handleUpdate}
              isLoading={updateMutation.isPending}
            />
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Materiali in Stock</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{inventory.length}</div>
                    <p className="text-xs text-muted-foreground">Tipologie diverse</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Valore Totale</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">€ {totalValue.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Valore inventario</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Scorte Basse</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-600">{lowStockItems.length}</div>
                    <p className="text-xs text-muted-foreground">Sotto scorta minima</p>
                  </CardContent>
                </Card>
              </div>

              {/* Info Cards */}
              <Card>
                <CardHeader>
                  <CardTitle>Informazioni Generali</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-slate-600">Codice</p>
                      <p className="font-medium">{warehouse.code}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Nome</p>
                      <p className="font-medium">{warehouse.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Tipo</p>
                      <Badge variant="outline" className={typeColors[warehouse.type]}>
                        {typeLabels[warehouse.type]}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Responsabile</p>
                      <p className="font-medium">
                        {warehouse.manager ? warehouse.manager.name : 'Non assegnato'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Location Card */}
              {(warehouse.address || warehouse.city) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Ubicazione</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {warehouse.address && (
                      <div>
                        <p className="text-sm text-slate-600">Indirizzo</p>
                        <p className="font-medium">{warehouse.address}</p>
                      </div>
                    )}
                    {warehouse.city && (
                      <div>
                        <p className="text-sm text-slate-600">Città</p>
                        <p className="font-medium">{warehouse.city}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventario Magazzino</CardTitle>
              <CardDescription>
                {inventory.length} materiali in stock
                {lowStockItems.length > 0 && ` • ${lowStockItems.length} sotto scorta minima`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={inventoryColumns}
                data={inventory}
                isLoading={isLoadingInventory}
                storageKey={`warehouse-${id}-inventory-table`}
                emptyState={
                  <div className="text-center py-12">
                    <Package className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
                    <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Nessun materiale</h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                      Questo magazzino non contiene ancora materiali
                    </p>
                  </div>
                }
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Movements Tab */}
        <TabsContent value="movements" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Movimenti Magazzino</CardTitle>
                  <CardDescription>
                    Storico completo dei movimenti per questo magazzino
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <BulkIntakeDialog
                    warehouseId={id}
                    onSuccess={() => {
                      queryClient.invalidateQueries({ queryKey: ['warehouse-movements', id] });
                      queryClient.invalidateQueries({ queryKey: ['warehouse-inventory', id] });
                    }}
                  />
                  <CreateStockMovementDialog
                    warehouseId={id}
                    trigger={
                      <Button variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        Movimento Singolo
                      </Button>
                    }
                    onSuccess={() => {
                      queryClient.invalidateQueries({ queryKey: ['warehouse-movements', id] });
                      queryClient.invalidateQueries({ queryKey: ['warehouse-inventory', id] });
                    }}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={movementsColumns}
                data={movements}
                isLoading={isLoadingMovements}
                storageKey={`warehouse-${id}-movements-table`}
                emptyState={
                  <div className="text-center py-12">
                    <TrendingUp className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
                    <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Nessun movimento</h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                      Non ci sono ancora movimenti registrati per questo magazzino
                    </p>
                  </div>
                }
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

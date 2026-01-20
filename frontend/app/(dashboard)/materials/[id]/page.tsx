'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { materialsApi } from '@/lib/api/materials';
import { inventoryApi } from '@/lib/api/inventory';
import { stockMovementsApi } from '@/lib/api/stock-movements';
import { MaterialForm } from '@/app/(dashboard)/materials/_components/material-form';
import { MaterialKitComponents } from '@/app/(dashboard)/materials/_components/material-kit-components';
import { MaterialDependencies } from '@/app/(dashboard)/materials/_components/material-dependencies';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/shared/data-table/data-table';
import { createInventoryColumns } from '@/components/inventory-columns';
import { createStockMovementsColumns } from '@/components/stock-movements-columns';
import { ArrowLeft, Edit, Save, X, AlertTriangle, Warehouse as WarehouseIcon, FileText } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

const categoryLabels: Record<string, string> = {
  construction: 'Edilizia',
  electrical: 'Elettrico',
  plumbing: 'Idraulica',
  tools: 'Attrezzi',
  equipment: 'Attrezzatura',
  general: 'Generale',
};

export default function MaterialDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const materialId = parseInt(params.id as string);

  const [editMode, setEditMode] = useState(false);

  // Define columns for DataTables
  const inventoryColumns = useMemo(() => createInventoryColumns(), []);
  const movementsColumns = useMemo(() => createStockMovementsColumns(), []);

  const { data: material, isLoading } = useQuery({
    queryKey: ['material', materialId],
    queryFn: () => materialsApi.getById(materialId),
    enabled: !!materialId,
  });

  // Fetch inventory data for this material
  const { data: inventoryData, isLoading: isLoadingInventory } = useQuery({
    queryKey: ['material-inventory', materialId],
    queryFn: () => inventoryApi.getAll({ material_id: materialId, per_page: 100 }),
    enabled: !!materialId,
  });

  const inventory = inventoryData?.data ?? [];

  // Fetch movements data for this material
  const { data: movementsData, isLoading: isLoadingMovements } = useQuery({
    queryKey: ['material-movements', materialId],
    queryFn: () => stockMovementsApi.getAll({ material_id: materialId, per_page: 50 }),
    enabled: !!materialId,
  });

  const movements = movementsData?.data ?? [];

  const updateMutation = useMutation({
    mutationFn: (data: any) => materialsApi.update(materialId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material', materialId] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setEditMode(false);
      toast.success('Materiale aggiornato', {
        description: 'Le modifiche sono state salvate con successo',
      });
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description: error.response?.data?.message || 'Impossibile salvare le modifiche',
      });
    },
  });

  const handleSubmit = (data: any) => {
    updateMutation.mutate(data);
  };

  const handleCancel = () => {
    if (editMode) {
      setEditMode(false);
    } else {
      router.push('/materials');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Caricamento materiale...</p>
        </div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Materiale non trovato</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Il materiale richiesto non esiste</p>
          <Link href="/frontend/app/(dashboard)/materials">
            <Button className="mt-4">Torna al catalogo</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/frontend/app/(dashboard)/materials">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{material.code}</h1>
              <Badge variant={material.is_active ? 'default' : 'secondary'}>
                {material.is_active ? 'Attivo' : 'Inattivo'}
              </Badge>
              <Badge variant="outline">
                {categoryLabels[material.category] || material.category}
              </Badge>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-1">{material.name}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" />
                Annulla
              </Button>
              <Button onClick={() => document.getElementById('material-form-submit')?.click()}>
                <Save className="mr-2 h-4 w-4" />
                Salva
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditMode(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Modifica
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {editMode ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            // Form submission will be handled by MaterialForm component
          }}
        >
          <MaterialForm
            mode="edit"
            initialData={material}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={updateMutation.isPending}
          />
          <button id="material-form-submit" type="submit" className="hidden" />
        </form>
      ) : (
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList>
            <TabsTrigger value="details">Dettagli</TabsTrigger>
            {material.is_kit && <TabsTrigger value="components">Componenti Kit</TabsTrigger>}
            <TabsTrigger value="dependencies">Dipendenze</TabsTrigger>
            <TabsTrigger value="inventory">Inventario</TabsTrigger>
            <TabsTrigger value="movements">Movimenti</TabsTrigger>
            <TabsTrigger value="usage">Utilizzo</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            {/* Informazioni Generali */}
            <Card>
              <CardHeader>
                <CardTitle>Informazioni Generali</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Codice</label>
                    <p className="mt-1 text-slate-900 dark:text-slate-100">{material.code}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome</label>
                    <p className="mt-1 text-slate-900 dark:text-slate-100">{material.name}</p>
                  </div>
                  {material.description && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Descrizione</label>
                      <p className="mt-1 text-slate-900 dark:text-slate-100">{material.description}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Categoria</label>
                    <p className="mt-1">
                      <Badge variant="outline">
                        {categoryLabels[material.category] || material.category}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Unità di Misura</label>
                    <p className="mt-1 text-slate-900 dark:text-slate-100">{material.unit}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Costo Standard</label>
                    <p className="mt-1 text-slate-900 dark:text-slate-100 font-semibold">
                      € {Number(material.standard_cost || 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Stato</label>
                    <p className="mt-1">
                      <Badge variant={material.is_active ? 'default' : 'secondary'}>
                        {material.is_active ? 'Attivo' : 'Inattivo'}
                      </Badge>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Codici e Tracciamento */}
            {(material.barcode || material.qr_code || material.location) && (
              <Card>
                <CardHeader>
                  <CardTitle>Codici e Tracciamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-6 md:grid-cols-3">
                    {material.barcode && (
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Barcode</label>
                        <p className="mt-1 text-slate-900 dark:text-slate-100 font-mono">{material.barcode}</p>
                      </div>
                    )}
                    {material.qr_code && (
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">QR Code</label>
                        <p className="mt-1 text-slate-900 dark:text-slate-100 font-mono">{material.qr_code}</p>
                      </div>
                    )}
                    {material.location && (
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ubicazione</label>
                        <p className="mt-1 text-slate-900 dark:text-slate-100">📍 {material.location}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Gestione Scorte */}
            <Card>
              <CardHeader>
                <CardTitle>Gestione Scorte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-6 md:grid-cols-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Scorta Minima</label>
                    <p className="mt-1 text-slate-900 dark:text-slate-100">
                      {Number(material.reorder_level || 0).toFixed(2)} {material.unit}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Quantità Riordino</label>
                    <p className="mt-1 text-slate-900 dark:text-slate-100">
                      {Number(material.reorder_quantity || 0).toFixed(2)} {material.unit}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tempo Consegna</label>
                    <p className="mt-1 text-slate-900 dark:text-slate-100">
                      {material.lead_time_days} giorni
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Note */}
            {material.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Note</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-900 dark:text-slate-100 whitespace-pre-wrap">{material.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {material.is_kit && (
            <TabsContent value="components">
              <MaterialKitComponents material={material} />
            </TabsContent>
          )}

          <TabsContent value="dependencies">
            <MaterialDependencies material={material} />
          </TabsContent>

          <TabsContent value="inventory">
            <Card>
              <CardHeader>
                <CardTitle>Inventario per Magazzino</CardTitle>
                <CardDescription>
                      Stock disponibile nei vari magazzini ({inventory.length} magazzini)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={inventoryColumns}
                  data={inventory}
                  isLoading={isLoadingInventory}
                  storageKey={`material-${materialId}-inventory-table`}
                  emptyState={
                    <div className="text-center py-12">
                      <WarehouseIcon className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
                      <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Nessuno stock</h3>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        Questo materiale non è presente in nessun magazzino
                      </p>
                    </div>
                  }
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="movements">
            <Card>
              <CardHeader>
                <CardTitle>Storico Movimenti</CardTitle>
                <CardDescription>
                  Movimentazioni di carico e scarico ({movements.length} movimenti)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={movementsColumns}
                  data={movements}
                  isLoading={isLoadingMovements}
                  storageKey={`material-${materialId}-movements-table`}
                  emptyState={
                    <div className="text-center py-12">
                      <FileText className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
                      <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Nessun movimento</h3>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        Non ci sono ancora movimenti per questo materiale
                      </p>
                    </div>
                  }
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage">
            <Card>
              <CardHeader>
                <CardTitle>Utilizzo nei Cantieri</CardTitle>
                <CardDescription>Cantieri che utilizzano questo materiale</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-slate-300" />
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">Funzionalità in sviluppo</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    La visualizzazione dell'utilizzo del materiale nei cantieri sarà disponibile a breve
                  </p>
                  <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200 max-w-md mx-auto">
                    <p className="text-sm text-slate-700 font-medium mb-2">Features in arrivo:</p>
                    <ul className="list-disc list-inside text-sm text-slate-600 text-left space-y-1">
                      <li>Cantieri che usano questo materiale</li>
                      <li>Quantità pianificate vs utilizzate</li>
                      <li>Varianze di costo per cantiere</li>
                      <li>Trend di consumo nel tempo</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

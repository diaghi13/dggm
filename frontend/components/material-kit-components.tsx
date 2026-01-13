'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { materialsApi } from '@/lib/api/materials';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Edit2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { ComboboxSelect } from '@/components/combobox-select';
import type { Material, MaterialComponent } from '@/lib/types';

interface MaterialKitComponentsProps {
  material: Material;
}

export function MaterialKitComponents({ material }: MaterialKitComponentsProps) {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<MaterialComponent | null>(null);

  // Form state
  const [searchMaterial, setSearchMaterial] = useState('');
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');

  // Fetch materials for combobox
  const { data: materialsData, isLoading: isLoadingMaterials } = useQuery({
    queryKey: ['materials', { search: searchMaterial, is_active: true, per_page: 50 }],
    queryFn: () =>
      materialsApi.getAll({
        search: searchMaterial,
        is_active: true,
        per_page: 50,
      }),
  });

  const materials = materialsData?.data ?? [];

  const addComponentMutation = useMutation({
    mutationFn: (data: { component_material_id: number; quantity: number; notes?: string }) =>
      materialsApi.addComponent(material.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material', material.id] });
      setIsAddDialogOpen(false);
      resetForm();
      toast.success('Componente aggiunto', {
        description: 'Il componente è stato aggiunto al kit',
      });
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description: error.response?.data?.message || 'Impossibile aggiungere il componente',
      });
    },
  });

  const updateComponentMutation = useMutation({
    mutationFn: (data: { componentId: number; quantity: number; notes?: string }) =>
      materialsApi.updateComponent(material.id, data.componentId, {
        quantity: data.quantity,
        notes: data.notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material', material.id] });
      setEditingComponent(null);
      resetForm();
      toast.success('Componente aggiornato');
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description: error.response?.data?.message || 'Impossibile aggiornare il componente',
      });
    },
  });

  const deleteComponentMutation = useMutation({
    mutationFn: (componentId: number) => materialsApi.deleteComponent(material.id, componentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material', material.id] });
      toast.success('Componente rimosso');
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description: error.response?.data?.message || 'Impossibile rimuovere il componente',
      });
    },
  });

  const resetForm = () => {
    setSelectedMaterialId(null);
    setQuantity('1');
    setNotes('');
    setSearchMaterial('');
  };

  const handleSubmit = () => {
    if (!selectedMaterialId || !quantity) {
      toast.error('Campi obbligatori mancanti');
      return;
    }

    if (editingComponent) {
      updateComponentMutation.mutate({
        componentId: editingComponent.id,
        quantity: parseFloat(quantity),
        notes: notes || undefined,
      });
    } else {
      addComponentMutation.mutate({
        component_material_id: selectedMaterialId,
        quantity: parseFloat(quantity),
        notes: notes || undefined,
      });
    }
  };

  const handleEdit = (component: MaterialComponent) => {
    setEditingComponent(component);
    setSelectedMaterialId(component.component_material_id);
    setQuantity(component.quantity.toString());
    setNotes(component.notes || '');
  };

  const components = material.components || [];
  const totalCost = components.reduce((sum, comp) => sum + (comp.total_cost || 0), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Componenti del Kit</CardTitle>
            <CardDescription>
              Materiali che compongono questo kit ({components.length} componenti)
            </CardDescription>
          </div>
          <Dialog
            open={isAddDialogOpen || !!editingComponent}
            onOpenChange={(open) => {
              if (!open) {
                setIsAddDialogOpen(false);
                setEditingComponent(null);
                resetForm();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Aggiungi Componente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingComponent ? 'Modifica Componente' : 'Aggiungi Componente'}
                </DialogTitle>
                <DialogDescription>
                  {editingComponent
                    ? 'Modifica le informazioni del componente'
                    : 'Aggiungi un materiale come componente di questo kit'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="material">Materiale *</Label>
                  <ComboboxSelect
                    value={selectedMaterialId?.toString() || ''}
                    onValueChange={(value) => setSelectedMaterialId(parseInt(value))}
                    onSearchChange={setSearchMaterial}
                    placeholder="Cerca materiale..."
                    emptyText="Nessun materiale trovato"
                    loading={isLoadingMaterials}
                    disabled={!!editingComponent}
                    options={materials.map((m: any) => ({
                      label: `${m.code} - ${m.name}`,
                      value: m.id.toString(),
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantità *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="1.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Note</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Note opzionali sul componente..."
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingComponent(null);
                    resetForm();
                  }}
                >
                  Annulla
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    addComponentMutation.isPending || updateComponentMutation.isPending
                  }
                >
                  {addComponentMutation.isPending || updateComponentMutation.isPending
                    ? 'Salvataggio...'
                    : editingComponent
                    ? 'Aggiorna'
                    : 'Aggiungi'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {components.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">Nessun componente</h3>
            <p className="mt-2 text-sm text-slate-600">
              Aggiungi i materiali che compongono questo kit
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Codice</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-right">Quantità</TableHead>
                    <TableHead>Unità</TableHead>
                    <TableHead className="text-right">Costo Unit.</TableHead>
                    <TableHead className="text-right">Costo Tot.</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {components.map((component) => (
                    <TableRow key={component.id}>
                      <TableCell className="font-mono text-sm">
                        {component.component_material?.code}
                      </TableCell>
                      <TableCell className="font-medium">
                        {component.component_material?.name}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(component.quantity).toFixed(2)}
                      </TableCell>
                      <TableCell>{component.component_material?.unit}</TableCell>
                      <TableCell className="text-right">
                        € {Number(component.component_material?.purchase_price || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        € {Number(component.total_cost || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {component.notes || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(component)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (
                                confirm(
                                  'Sei sicuro di voler rimuovere questo componente dal kit?'
                                )
                              ) {
                                deleteComponentMutation.mutate(component.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Summary */}
            <div className="mt-4 flex justify-end">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="text-sm text-slate-600">Costo Totale Kit</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">
                  € {totalCost.toFixed(2)}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit2, Link2, Box, Cable, Wrench, PackageOpen, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ComboboxSelect } from '@/components/combobox-select';
import type { Material, MaterialDependency, DependencyType, QuantityCalculationType } from '@/lib/types';

interface MaterialDependenciesProps {
  material: Material;
}

const dependencyTypeLabels: Record<DependencyType, string> = {
  container: 'Contenitore',
  accessory: 'Accessorio',
  cable: 'Cavo',
  consumable: 'Consumabile',
  tool: 'Attrezzo',
};

const dependencyTypeIcons: Record<DependencyType, any> = {
  container: Box,
  accessory: PackageOpen,
  cable: Cable,
  consumable: AlertCircle,
  tool: Wrench,
};

const dependencyTypeColors: Record<DependencyType, string> = {
  container: 'bg-blue-100 text-blue-700 border-blue-200',
  accessory: 'bg-purple-100 text-purple-700 border-purple-200',
  cable: 'bg-green-100 text-green-700 border-green-200',
  consumable: 'bg-orange-100 text-orange-700 border-orange-200',
  tool: 'bg-slate-100 text-slate-700 border-slate-200',
};

const quantityTypeLabels: Record<QuantityCalculationType, string> = {
  fixed: 'Quantità Fissa',
  ratio: 'Rapporto 1:1',
  formula: 'Formula',
};

export function MaterialDependencies({ material }: MaterialDependenciesProps) {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDependency, setEditingDependency] = useState<MaterialDependency | null>(null);

  // Form state
  const [searchMaterial, setSearchMaterial] = useState('');
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);
  const [dependencyType, setDependencyType] = useState<DependencyType>('accessory');
  const [quantityType, setQuantityType] = useState<QuantityCalculationType>('ratio');
  const [quantityValue, setQuantityValue] = useState('1');
  const [isVisibleInQuote, setIsVisibleInQuote] = useState(false);
  const [isRequiredForStock, setIsRequiredForStock] = useState(true);
  const [isOptional, setIsOptional] = useState(false);
  const [minQuantityTrigger, setMinQuantityTrigger] = useState('');
  const [maxQuantityTrigger, setMaxQuantityTrigger] = useState('');
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

  // Fetch dependencies
  const { data: dependencies = [], isLoading: isLoadingDeps } = useQuery({
    queryKey: ['material-dependencies', material.id],
    queryFn: () => materialsApi.getDependencies(material.id),
  });

  const addDependencyMutation = useMutation({
    mutationFn: (data: any) => materialsApi.addDependency(material.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-dependencies', material.id] });
      setIsAddDialogOpen(false);
      resetForm();
      toast.success('Dipendenza aggiunta');
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description: error.response?.data?.message || 'Impossibile aggiungere la dipendenza',
      });
    },
  });

  const updateDependencyMutation = useMutation({
    mutationFn: (data: { dependencyId: number; updates: any }) =>
      materialsApi.updateDependency(material.id, data.dependencyId, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-dependencies', material.id] });
      setEditingDependency(null);
      resetForm();
      toast.success('Dipendenza aggiornata');
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description: error.response?.data?.message || 'Impossibile aggiornare la dipendenza',
      });
    },
  });

  const deleteDependencyMutation = useMutation({
    mutationFn: (dependencyId: number) =>
      materialsApi.deleteDependency(material.id, dependencyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-dependencies', material.id] });
      toast.success('Dipendenza rimossa');
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description: error.response?.data?.message || 'Impossibile rimuovere la dipendenza',
      });
    },
  });

  const resetForm = () => {
    setSelectedMaterialId(null);
    setDependencyType('accessory');
    setQuantityType('ratio');
    setQuantityValue('1');
    setIsVisibleInQuote(false);
    setIsRequiredForStock(true);
    setIsOptional(false);
    setMinQuantityTrigger('');
    setMaxQuantityTrigger('');
    setNotes('');
    setSearchMaterial('');
  };

  const handleSubmit = () => {
    if (!selectedMaterialId || !quantityValue) {
      toast.error('Campi obbligatori mancanti');
      return;
    }

    const data = {
      dependency_material_id: selectedMaterialId,
      dependency_type: dependencyType,
      quantity_type: quantityType,
      quantity_value: quantityValue,
      is_visible_in_quote: isVisibleInQuote,
      is_required_for_stock: isRequiredForStock,
      is_optional: isOptional,
      min_quantity_trigger: minQuantityTrigger ? parseFloat(minQuantityTrigger) : undefined,
      max_quantity_trigger: maxQuantityTrigger ? parseFloat(maxQuantityTrigger) : undefined,
      notes: notes || undefined,
    };

    if (editingDependency) {
      const { dependency_material_id, ...updates } = data;
      updateDependencyMutation.mutate({
        dependencyId: editingDependency.id,
        updates,
      });
    } else {
      addDependencyMutation.mutate(data);
    }
  };

  const handleEdit = (dependency: MaterialDependency) => {
    setEditingDependency(dependency);
    setSelectedMaterialId(dependency.dependency_material_id);
    setDependencyType(dependency.dependency_type);
    setQuantityType(dependency.quantity_type);
    setQuantityValue(dependency.quantity_value);
    setIsVisibleInQuote(dependency.is_visible_in_quote);
    setIsRequiredForStock(dependency.is_required_for_stock);
    setIsOptional(dependency.is_optional);
    setMinQuantityTrigger(dependency.min_quantity_trigger?.toString() || '');
    setMaxQuantityTrigger(dependency.max_quantity_trigger?.toString() || '');
    setNotes(dependency.notes || '');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Dipendenze Automatiche</CardTitle>
            <CardDescription>
              Materiali che vengono automaticamente aggiunti quando si usa questo prodotto ({dependencies.length} dipendenze)
            </CardDescription>
          </div>
          <Dialog
            open={isAddDialogOpen || !!editingDependency}
            onOpenChange={(open) => {
              if (!open) {
                setIsAddDialogOpen(false);
                setEditingDependency(null);
                resetForm();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Aggiungi Dipendenza
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingDependency ? 'Modifica Dipendenza' : 'Aggiungi Dipendenza'}
                </DialogTitle>
                <DialogDescription>
                  Configura un materiale che deve essere automaticamente incluso quando si usa questo prodotto
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Material Selection */}
                <div className="space-y-2">
                  <Label htmlFor="material">Materiale Dipendente *</Label>
                  <ComboboxSelect
                    value={selectedMaterialId?.toString() || ''}
                    onValueChange={(value) => setSelectedMaterialId(parseInt(value))}
                    onSearchChange={setSearchMaterial}
                    placeholder="Cerca materiale..."
                    emptyText="Nessun materiale trovato"
                    loading={isLoadingMaterials}
                    disabled={!!editingDependency}
                    options={materials.map((m: any) => ({
                      label: `${m.code} - ${m.name}`,
                      value: m.id.toString(),
                    }))}
                  />
                </div>

                {/* Dependency Type */}
                <div className="space-y-2">
                  <Label htmlFor="dependency_type">Tipo Dipendenza *</Label>
                  <Select value={dependencyType} onValueChange={(value) => setDependencyType(value as DependencyType)}>
                    <SelectTrigger className="min-w-[200px]">
                      <SelectValue placeholder="Seleziona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="container">Contenitore (Box, Baule)</SelectItem>
                      <SelectItem value="accessory">Accessorio</SelectItem>
                      <SelectItem value="cable">Cavo</SelectItem>
                      <SelectItem value="consumable">Consumabile</SelectItem>
                      <SelectItem value="tool">Attrezzo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Quantity Calculation */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity_type">Tipo Calcolo *</Label>
                    <Select value={quantityType} onValueChange={(value) => setQuantityType(value as QuantityCalculationType)}>
                      <SelectTrigger className="min-w-[200px]">
                        <SelectValue placeholder="Tipo calcolo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Quantità Fissa</SelectItem>
                        <SelectItem value="ratio">Rapporto 1:1</SelectItem>
                        <SelectItem value="formula">Formula</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity_value">
                      Valore *
                      {quantityType === 'formula' && (
                        <span className="text-xs text-slate-500 ml-2">(es: ceil(qty/6))</span>
                      )}
                    </Label>
                    <Input
                      id="quantity_value"
                      value={quantityValue}
                      onChange={(e) => setQuantityValue(e.target.value)}
                      placeholder={
                        quantityType === 'fixed'
                          ? '1'
                          : quantityType === 'ratio'
                          ? '1'
                          : 'ceil(qty/6)'
                      }
                    />
                  </div>
                </div>

                {/* Triggers */}
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900 font-medium mb-1">Trigger di Quantità</p>
                    <p className="text-xs text-blue-800">
                      Usa i trigger per applicare la dipendenza solo in specifici range di quantità.
                      <br />
                      <strong>Esempio:</strong> Se vendi 1-5 SmartBat servono 6 cavi, ma da 6 in poi non servono più → imposta <em>Max: 5</em>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="min_trigger">Quantità Minima Trigger</Label>
                      <Input
                        id="min_trigger"
                        type="number"
                        step="0.01"
                        value={minQuantityTrigger}
                        onChange={(e) => setMinQuantityTrigger(e.target.value)}
                        placeholder="Opzionale"
                      />
                      <p className="text-xs text-slate-500">
                        Applica dipendenza solo se quantità ≥ questo valore
                        <br />
                        <span className="text-slate-400">Es: Min 10 = attiva solo per 10+ unità</span>
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max_trigger">Quantità Massima Trigger</Label>
                      <Input
                        id="max_trigger"
                        type="number"
                        step="0.01"
                        value={maxQuantityTrigger}
                        onChange={(e) => setMaxQuantityTrigger(e.target.value)}
                        placeholder="Opzionale"
                      />
                      <p className="text-xs text-slate-500">
                        Applica dipendenza solo se quantità ≤ questo valore
                        <br />
                        <span className="text-slate-400">Es: Max 5 = attiva solo fino a 5 unità</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="visible_quote"
                      checked={isVisibleInQuote}
                      onCheckedChange={(checked) => setIsVisibleInQuote(checked as boolean)}
                    />
                    <label
                      htmlFor="visible_quote"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Visibile nel preventivo (al cliente)
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="required_stock"
                      checked={isRequiredForStock}
                      onCheckedChange={(checked) => setIsRequiredForStock(checked as boolean)}
                    />
                    <label
                      htmlFor="required_stock"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Obbligatorio per scarico magazzino
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="optional"
                      checked={isOptional}
                      onCheckedChange={(checked) => setIsOptional(checked as boolean)}
                    />
                    <label
                      htmlFor="optional"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Opzionale (chiedi conferma utente)
                    </label>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Note</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Note opzionali sulla dipendenza..."
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingDependency(null);
                    resetForm();
                  }}
                >
                  Annulla
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={addDependencyMutation.isPending || updateDependencyMutation.isPending}
                >
                  {addDependencyMutation.isPending || updateDependencyMutation.isPending
                    ? 'Salvataggio...'
                    : editingDependency
                    ? 'Aggiorna'
                    : 'Aggiungi'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Guida utente */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Come funzionano le dipendenze?</h4>
              <div className="text-sm text-blue-800 space-y-2">
                <p>
                  <strong>Esempio pratico:</strong> Se vendi "6 SmartBat", il sistema può automaticamente aggiungere anche "1 Box SmartBat" e "6 Cavi alimentazione".
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                  <div className="bg-white/50 p-2 rounded border border-blue-100">
                    <div className="font-medium text-blue-900">Contenitore</div>
                    <div className="text-xs mt-1">Box, baule, flight case</div>
                    <div className="text-xs text-blue-600 mt-1 font-mono">Formula: ceil(qty/6)</div>
                  </div>
                  <div className="bg-white/50 p-2 rounded border border-blue-100">
                    <div className="font-medium text-blue-900">Cavo</div>
                    <div className="text-xs mt-1">1 cavo per ogni unità</div>
                    <div className="text-xs text-blue-600 mt-1 font-mono">Rapporto 1:1</div>
                  </div>
                  <div className="bg-white/50 p-2 rounded border border-blue-100">
                    <div className="font-medium text-blue-900">Accessorio</div>
                    <div className="text-xs mt-1">Quantità fissa</div>
                    <div className="text-xs text-blue-600 mt-1 font-mono">Fisso: 1</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {isLoadingDeps ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-sm text-slate-600">Caricamento dipendenze...</p>
          </div>
        ) : dependencies.length === 0 ? (
          <div className="text-center py-12">
            <Link2 className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">Nessuna dipendenza configurata</h3>
            <p className="mt-2 text-sm text-slate-600">
              Clicca "Aggiungi Dipendenza" per configurare materiali che vengono inclusi automaticamente
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Materiale</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Calcolo Quantità</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dependencies.map((dep: MaterialDependency) => {
                  const Icon = dependencyTypeIcons[dep.dependency_type];
                  return (
                    <TableRow key={dep.id}>
                      <TableCell>
                        <div className="font-medium">{dep.dependency_material?.name}</div>
                        <div className="text-sm text-slate-500 font-mono">
                          {dep.dependency_material?.code}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`gap-1 ${dependencyTypeColors[dep.dependency_type]}`}
                        >
                          <Icon className="h-3 w-3" />
                          {dependencyTypeLabels[dep.dependency_type]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{quantityTypeLabels[dep.quantity_type]}</div>
                          <div className="text-slate-500 font-mono text-xs">
                            {dep.quantity_value}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-1">
                          {dep.min_quantity_trigger && (
                            <div className="text-slate-600">Min: {dep.min_quantity_trigger}</div>
                          )}
                          {dep.max_quantity_trigger && (
                            <div className="text-slate-600">Max: {dep.max_quantity_trigger}</div>
                          )}
                          {!dep.min_quantity_trigger && !dep.max_quantity_trigger && (
                            <span className="text-slate-400">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {dep.is_visible_in_quote && (
                            <Badge variant="secondary" className="text-xs">
                              Preventivo
                            </Badge>
                          )}
                          {dep.is_required_for_stock && (
                            <Badge variant="default" className="text-xs">
                              Obbligatorio
                            </Badge>
                          )}
                          {dep.is_optional && (
                            <Badge variant="outline" className="text-xs">
                              Opzionale
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(dep)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm('Sei sicuro di voler rimuovere questa dipendenza?')) {
                                deleteDependencyMutation.mutate(dep.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

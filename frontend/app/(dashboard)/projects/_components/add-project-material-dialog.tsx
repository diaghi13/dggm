'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/products';
import { projectMaterialsApi } from '@/lib/api/project-materials';
import { kitAssembliesApi } from '@/lib/api/kit-assemblies';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ComboboxSelect } from '@/components/combobox-select';
import { CurrencyDisplay } from '@/components/ui/currency-input';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AddProjectMaterialDialogProps {
  projectId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddProjectMaterialDialog({
  projectId,
  open,
  onOpenChange,
}: AddProjectMaterialDialogProps) {
  const queryClient = useQueryClient();
  const [materialSearch, setMaterialSearch] = useState('');
  const [kitAssemblyId, setKitAssemblyId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    material_id: '',
    planned_quantity: '',
    planned_unit_cost: '',
    required_date: '',
    is_extra: true,
    extra_reason: '',
    notes: '',
    is_consumable: false,
    include_in_final_balance: true,
  });

  // Fetch materials for selection
  const { data: materialsData, isLoading: isLoadingMaterials } = useQuery({
    queryKey: ['products', { is_active: true, search: materialSearch }],
    queryFn: () =>
      productsApi.getAll({
        is_active: true,
        search: materialSearch,
        per_page: 50,
      }),
    enabled: open,
  });

  const selectedProductId = formData.material_id ? parseInt(formData.material_id) : null;
  const selectedProduct = materialsData?.data?.find((m: any) => m.id.toString() === formData.material_id);

  // Fetch available kit assemblies when a kit product is selected
  const { data: availableAssemblies } = useQuery({
    queryKey: ['kit-assemblies-available', selectedProductId],
    queryFn: () => kitAssembliesApi.getAvailable(selectedProductId!),
    enabled: !!selectedProductId && selectedProduct?.product_type === 'kit',
  });

  const addMutation = useMutation({
    mutationFn: (data: any) => projectMaterialsApi.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-materials', projectId] });
      toast.success('Materiale aggiunto al progetto');
      resetForm();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore durante l\'aggiunta del materiale');
    },
  });

  const resetForm = () => {
    setFormData({
      material_id: '',
      planned_quantity: '',
      planned_unit_cost: '',
      required_date: '',
      is_extra: true,
      extra_reason: '',
      notes: '',
      is_consumable: false,
      include_in_final_balance: true,
    });
    setMaterialSearch('');
    setKitAssemblyId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.material_id || !formData.planned_quantity || !formData.planned_unit_cost) {
      toast.error('Compila tutti i campi obbligatori');
      return;
    }

    addMutation.mutate({
      product_id: parseInt(formData.material_id),
      planned_quantity: parseFloat(formData.planned_quantity),
      planned_unit_cost: parseFloat(formData.planned_unit_cost),
      required_date: formData.required_date || undefined,
      is_extra: formData.is_extra,
      extra_reason: formData.extra_reason || undefined,
      notes: formData.notes || undefined,
      kit_assembly_id: kitAssemblyId || undefined,
      is_consumable: formData.is_consumable,
      include_in_final_balance: formData.include_in_final_balance,
    });
  };

  const handleMaterialChange = (value: string) => {
    setFormData({ ...formData, material_id: value });

    // Auto-fill unit cost if material is selected
    const selectedMaterial = materialsData?.data?.find((m: any) => m.id.toString() === value);
    if (selectedMaterial && !formData.planned_unit_cost) {
      setFormData(prev => ({
        ...prev,
        material_id: value,
        planned_unit_cost: selectedMaterial.purchase_price || selectedMaterial.standard_cost || '',
      }));
    }
  };

  const materials = materialsData?.data || [];
  const materialOptions = materials.map((material: any) => ({
    value: material.id.toString(),
    label: `${material.code} - ${material.name}`,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Aggiungi Materiale al Progetto</DialogTitle>
            <DialogDescription>
              Seleziona un materiale dal catalogo e specifica la quantità pianificata
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="material">
                Materiale <span className="text-red-500">*</span>
              </Label>
              <ComboboxSelect
                options={materialOptions}
                value={formData.material_id}
                onValueChange={handleMaterialChange}
                onSearchChange={setMaterialSearch}
                placeholder="Cerca materiale..."
                emptyText="Nessun materiale trovato"
                disabled={isLoadingMaterials}
              />
            </div>

            {selectedProduct?.product_type === 'kit' && (
              <div className="grid gap-2">
                <Label>
                  Assembly specifica{' '}
                  <span className="text-muted-foreground text-xs">(opzionale)</span>
                </Label>
                <Select
                  value={kitAssemblyId?.toString() ?? 'none'}
                  onValueChange={(v) => setKitAssemblyId(v === 'none' ? null : Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nessuna assembly specifica" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-muted-foreground">Nessuna assembly specifica</span>
                    </SelectItem>
                    {availableAssemblies?.data?.map((assembly) => (
                      <SelectItem key={assembly.id} value={assembly.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span>{assembly.name}</span>
                          {(assembly.warehouse?.name ?? assembly.location) && (
                            <span className="text-xs text-muted-foreground">
                              {assembly.warehouse?.name ?? assembly.location}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="planned_quantity">
                  Quantità Pianificata <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="planned_quantity"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={formData.planned_quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, planned_quantity: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="planned_unit_cost">
                  Costo Unitario (€) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="planned_unit_cost"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.planned_unit_cost}
                  onChange={(e) =>
                    setFormData({ ...formData, planned_unit_cost: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="required_date">Data Necessità</Label>
              <Input
                id="required_date"
                type="date"
                value={formData.required_date}
                onChange={(e) =>
                  setFormData({ ...formData, required_date: e.target.value })
                }
              />
            </div>

            <div className="flex items-center space-x-2 rounded-lg border p-3 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
              <Checkbox
                id="is_extra"
                checked={formData.is_extra}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_extra: checked as boolean })
                }
              />
              <div className="flex-1">
                <Label
                  htmlFor="is_extra"
                  className="text-sm font-medium cursor-pointer"
                >
                  Materiale Extra
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Contrassegna come extra/variante non prevista nel preventivo originale
                </p>
              </div>
            </div>

            {formData.is_extra && (
              <div className="grid gap-2">
                <Label htmlFor="extra_reason">Motivo Extra</Label>
                <Textarea
                  id="extra_reason"
                  placeholder="Perché questo materiale non era previsto nel preventivo?"
                  value={formData.extra_reason}
                  onChange={(e) => setFormData({ ...formData, extra_reason: e.target.value })}
                  rows={2}
                />
              </div>
            )}

            <div className="flex items-center space-x-2 rounded-lg border p-3 border-slate-200 dark:border-slate-700">
              <Checkbox
                id="is_consumable"
                checked={formData.is_consumable}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_consumable: checked as boolean })
                }
              />
              <div className="flex-1">
                <Label
                  htmlFor="is_consumable"
                  className="text-sm font-medium cursor-pointer"
                >
                  Materiale Consumabile
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  I consumabili non vengono conteggiati nei rientri
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 rounded-lg border p-3 border-slate-200 dark:border-slate-700">
              <Checkbox
                id="include_in_final_balance"
                checked={formData.include_in_final_balance}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, include_in_final_balance: checked as boolean })
                }
              />
              <div className="flex-1">
                <Label
                  htmlFor="include_in_final_balance"
                  className="text-sm font-medium cursor-pointer"
                >
                  Includi in Final Balance
                </Label>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Note</Label>
              <Textarea
                id="notes"
                placeholder="Note aggiuntive sul materiale..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            {formData.planned_quantity && formData.planned_unit_cost && (
              <div className="rounded-lg border bg-muted/50 p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Costo Totale Pianificato:</span>
                  <span className="text-lg font-bold">
                    <CurrencyDisplay value={parseFloat(formData.planned_quantity) * parseFloat(formData.planned_unit_cost)} />
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={addMutation.isPending}
            >
              Annulla
            </Button>
            <Button type="submit" disabled={addMutation.isPending}>
              {addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Aggiungi Materiale
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

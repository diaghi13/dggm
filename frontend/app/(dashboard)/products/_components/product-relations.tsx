'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/products';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Trash2, Edit2, Package, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { ComboboxSelect } from '@/components/combobox-select';
import { QuantityTypeBadge } from './quantity-type-badge';
import { DialogFooter as CustomDialogFooter } from '@/components/dialog-footer';
import type { Product, ProductRelation, ProductRelationType } from '@/lib/types';

interface ProductRelationsProps {
  product: Product;
}

export function ProductRelations({ product }: ProductRelationsProps) {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRelation, setEditingRelation] = useState<ProductRelation | null>(null);

  // Form state
  const [searchProduct, setSearchProduct] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [relationTypeId, setRelationTypeId] = useState<number | null>(null);
  const [quantityType, setQuantityType] = useState<App.Enums.ProductRelationQuantityType>('fixed');
  const [quantityValue, setQuantityValue] = useState('1');
  const [isVisibleInQuote, setIsVisibleInQuote] = useState(false);
  const [isVisibleInMaterialList, setIsVisibleInMaterialList] = useState(true);
  const [isRequiredForStock, setIsRequiredForStock] = useState(true);
  const [isOptional, setIsOptional] = useState(false);
  const [minQuantityTrigger, setMinQuantityTrigger] = useState<string>('');
  const [maxQuantityTrigger, setMaxQuantityTrigger] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Fetch relation types
  const { data: relationTypesData } = useQuery({
    queryKey: ['product-relation-types'],
    queryFn: () => productsApi.getRelationTypes(),
  });

  const relationTypes = relationTypesData ?? [];

  // Fetch products for combobox
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', { search: searchProduct, is_active: true, per_page: 50 }],
    queryFn: () =>
      productsApi.getAll({
        search: searchProduct,
        is_active: true,
        per_page: 50,
      }),
  });

  const products = productsData?.data ?? [];

  const addRelationMutation = useMutation({
    mutationFn: (data: {
      related_product_id: number;
      relation_type_id: number;
      quantity_type: App.Enums.ProductRelationQuantityType;
      quantity_value: string;
      is_visible_in_quote: boolean;
      is_visible_in_material_list: boolean;
      is_required_for_stock: boolean;
      is_optional: boolean;
      notes?: string;
    }) => productsApi.addRelation(product.id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', product.id] });
      setIsAddDialogOpen(false);
      resetForm();
      toast.success('Relazione aggiunta', {
        description: 'La relazione è stata aggiunta con successo',
      });
    },
    onError: (error: Error) => {
      toast.error('Errore', {
        description: (error as Error & { response?: { data?: { message?: string } } }).response?.data?.message || 'Impossibile aggiungere la relazione',
      });
    },
  });

  const updateRelationMutation = useMutation({
    mutationFn: (data: {
      relationId: number;
      relation_type_id: number;
      quantity_type: App.Enums.ProductRelationQuantityType;
      quantity_value: string;
      is_visible_in_quote: boolean;
      is_visible_in_material_list: boolean;
      is_required_for_stock: boolean;
      is_optional: boolean;
      notes?: string;
    }) =>
      productsApi.updateRelation(product.id!, data.relationId, {
        relation_type_id: data.relation_type_id,
        quantity_type: data.quantity_type,
        quantity_value: data.quantity_value,
        is_visible_in_quote: data.is_visible_in_quote,
        is_visible_in_material_list: data.is_visible_in_material_list,
        is_required_for_stock: data.is_required_for_stock,
        is_optional: data.is_optional,
        notes: data.notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', product.id] });
      setIsAddDialogOpen(false);
      setEditingRelation(null);
      resetForm();
      toast.success('Relazione aggiornata');
    },
    onError: (error: Error) => {
      toast.error('Errore', {
        description: (error as Error & { response?: { data?: { message?: string } } }).response?.data?.message || 'Impossibile aggiornare la relazione',
      });
    },
  });

  const deleteRelationMutation = useMutation({
    mutationFn: (relationId: number) => productsApi.deleteRelation(product.id!, relationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', product.id] });
      toast.success('Relazione rimossa');
    },
    onError: (error: Error) => {
      toast.error('Errore', {
        description: (error as Error & { response?: { data?: { message?: string } } }).response?.data?.message || 'Impossibile rimuovere la relazione',
      });
    },
  });

  const resetForm = () => {
    setSelectedProductId(null);
    setRelationTypeId(null);
    setQuantityType('fixed');
    setQuantityValue('1');
    setIsVisibleInQuote(false);
    setIsVisibleInMaterialList(true);
    setIsRequiredForStock(true);
    setIsOptional(false);
    setMinQuantityTrigger('');
    setMaxQuantityTrigger('');
    setNotes('');
    setSearchProduct('');
    setShowAdvanced(false);
  };

  const handleSubmit = () => {
    if (!selectedProductId || !relationTypeId) {
      toast.error('Campi obbligatori mancanti', {
        description: 'Seleziona un prodotto e un tipo di relazione',
      });
      return;
    }

    if (!product.id) {
      toast.error('Errore', {
        description: 'ID prodotto non trovato',
      });
      console.error('❌ Product ID mancante:', product);
      return;
    }

    const data = {
      related_product_id: selectedProductId,
      relation_type_id: relationTypeId,
      quantity_type: quantityType,
      quantity_value: quantityValue,
      is_visible_in_quote: isVisibleInQuote,
      is_visible_in_material_list: isVisibleInMaterialList,
      is_required_for_stock: isRequiredForStock,
      is_optional: isOptional,
      min_quantity_trigger: minQuantityTrigger ? parseFloat(minQuantityTrigger) : null,
      max_quantity_trigger: maxQuantityTrigger ? parseFloat(maxQuantityTrigger) : null,
      notes: notes || undefined,
    };

    if (editingRelation) {
      updateRelationMutation.mutate({
        relationId: editingRelation.id!,
        ...data,
      });
    } else {
      addRelationMutation.mutate(data);
    }
  };

  const handleEdit = (relation: ProductRelation) => {
    setEditingRelation(relation);
    setSelectedProductId(relation.related_product_id);
    setRelationTypeId(relation.relation_type_id);
    setQuantityType(relation.quantity_type);
    setQuantityValue(relation.quantity_value);
    setIsVisibleInQuote(relation.is_visible_in_quote || false);
    setIsVisibleInMaterialList(relation.is_visible_in_material_list ?? true);
    setIsRequiredForStock(relation.is_required_for_stock ?? true);
    setIsOptional(relation.is_optional || false);
    setMinQuantityTrigger(relation.min_quantity_trigger?.toString() || '');
    setMaxQuantityTrigger(relation.max_quantity_trigger?.toString() || '');
    setNotes(relation.notes || '');
    setShowAdvanced(!!(relation.min_quantity_trigger || relation.max_quantity_trigger));
    setIsAddDialogOpen(true);
  };

  const relations = product.relations || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Relazioni Prodotto</CardTitle>
            <CardDescription>
              Gestione relazioni e dipendenze tra prodotti ({relations.length} relazioni)
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingRelation(null); }}>
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi Relazione
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] p-0 flex flex-col">
              <DialogHeader className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                <DialogTitle>
                  {editingRelation ? 'Modifica Relazione' : 'Aggiungi Nuova Relazione'}
                </DialogTitle>
                <DialogDescription>
                  Definisci la relazione tra questo prodotto e altri prodotti
                </DialogDescription>
              </DialogHeader>

              <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
                {/* Prodotto Correlato */}
                <div className="space-y-2">
                  <Label>Prodotto Correlato *</Label>
                  <ComboboxSelect
                    value={selectedProductId?.toString()}
                    onValueChange={(value) => setSelectedProductId(value ? parseInt(value) : null)}
                    onSearchChange={setSearchProduct}
                    options={products
                      .filter((p: Product) => p.id !== product.id) // Escludi il prodotto corrente
                      .map((p: Product) => ({
                        value: p.id!.toString(),
                        label: `${p.code} - ${p.name}`,
                      }))}
                    placeholder="Cerca prodotto..."
                    emptyText="Nessun prodotto trovato"
                    loading={isLoadingProducts}
                    disabled={!!editingRelation}
                  />
                </div>

                {/* Tipo Relazione */}
                <div className="space-y-2">
                  <Label htmlFor="relation_type">Tipo Relazione *</Label>
                  <Select
                    value={relationTypeId?.toString()}
                    onValueChange={(value) => setRelationTypeId(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona tipo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {relationTypes.map((type: ProductRelationType) => (
                        <SelectItem key={type.id} value={type.id!.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tipo Quantità e Valore */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="quantity_type">Tipo Quantità *</Label>
                    <Select
                      value={quantityType}
                      onValueChange={(value: App.Enums.ProductRelationQuantityType) =>
                        setQuantityType(value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fisso</SelectItem>
                        <SelectItem value="multiplied">Moltiplicato</SelectItem>
                        <SelectItem value="formula">Formula</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {quantityType === 'fixed' && 'Quantità fissa indipendente dalla quantità del prodotto'}
                      {quantityType === 'multiplied' && 'Quantità moltiplicata per la quantità del prodotto'}
                      {quantityType === 'formula' && 'Calcolo personalizzato con formula'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity_value">
                      {quantityType === 'formula' ? 'Formula *' : 'Quantità *'}
                    </Label>
                    <Input
                      id="quantity_value"
                      value={quantityValue}
                      onChange={(e) => setQuantityValue(e.target.value)}
                      placeholder={
                        quantityType === 'formula'
                          ? 'es: ceil(qty/6)'
                          : quantityType === 'multiplied'
                          ? 'es: 4'
                          : 'es: 1'
                      }
                    />
                    {quantityType === 'fixed' && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Es: 1 = sempre 1 pezzo, 2 = sempre 2 pezzi
                      </p>
                    )}
                    {quantityType === 'multiplied' && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Es: 4 = ogni prodotto include 4 pezzi di questo componente
                      </p>
                    )}
                    {quantityType === 'formula' && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Usa &quot;qty&quot; come variabile. Es: ceil(qty/6) = 1 baule ogni 6 prodotti
                      </p>
                    )}
                  </div>
                </div>

                {/* Visibilità nelle 3 Liste */}
                <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Visibilità nelle Liste
                  </p>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_visible_in_quote"
                      checked={isVisibleInQuote}
                      onCheckedChange={(checked) => setIsVisibleInQuote(checked as boolean)}
                    />
                    <Label
                      htmlFor="is_visible_in_quote"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Mostra in Preventivo
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_visible_in_material_list"
                      checked={isVisibleInMaterialList}
                      onCheckedChange={(checked) => setIsVisibleInMaterialList(checked as boolean)}
                    />
                    <Label
                      htmlFor="is_visible_in_material_list"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Mostra in Lista Materiale (Cantiere)
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_required_for_stock"
                      checked={isRequiredForStock}
                      onCheckedChange={(checked) => setIsRequiredForStock(checked as boolean)}
                    />
                    <Label
                      htmlFor="is_required_for_stock"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Includi in Stock Count
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_optional"
                      checked={isOptional}
                      onCheckedChange={(checked) => setIsOptional(checked as boolean)}
                    />
                    <Label htmlFor="is_optional" className="text-sm font-normal cursor-pointer">
                      Opzionale (richiede conferma utente)
                    </Label>
                  </div>
                </div>

                {/* Impostazioni Avanzate (Collapsabile) */}
                <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                  <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100">
                    <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                    Impostazioni Avanzate (Trigger Quantità)
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4 space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-4">
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        I trigger di quantità permettono di attivare/disattivare automaticamente questa relazione in base alla quantità del prodotto principale.
                      </p>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="min_quantity_trigger">Quantità Minima Trigger</Label>
                          <Input
                            id="min_quantity_trigger"
                            type="number"
                            step="0.01"
                            min="0"
                            value={minQuantityTrigger}
                            onChange={(e) => setMinQuantityTrigger(e.target.value)}
                            placeholder="es: 10"
                          />
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Includi questa relazione solo se quantità {'>='} valore
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="max_quantity_trigger">Quantità Massima Trigger</Label>
                          <Input
                            id="max_quantity_trigger"
                            type="number"
                            step="0.01"
                            min="0"
                            value={maxQuantityTrigger}
                            onChange={(e) => setMaxQuantityTrigger(e.target.value)}
                            placeholder="es: 100"
                          />
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Includi questa relazione solo se quantità {'<='} valore
                          </p>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Note */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Note</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Note aggiuntive sulla relazione..."
                    rows={3}
                  />
                </div>
              </div>

              <CustomDialogFooter
                onCancel={() => {
                  setIsAddDialogOpen(false);
                  resetForm();
                }}
                onSubmit={handleSubmit}
                submitLabel={editingRelation ? 'Aggiorna' : 'Aggiungi'}
                isLoading={addRelationMutation.isPending || updateRelationMutation.isPending}
                submitDisabled={!selectedProductId || !relationTypeId}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {relations.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
              Nessuna relazione
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Questo prodotto non ha relazioni con altri prodotti
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prodotto</TableHead>
                <TableHead>Tipo Relazione</TableHead>
                <TableHead>Quantità</TableHead>
                <TableHead>Liste</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {relations.map((relation) => (
                <TableRow key={relation.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {relation.relatedProduct?.code}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {relation.relatedProduct?.name}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {relation.relationType?.name || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <QuantityTypeBadge type={relation.quantity_type} />
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {relation.quantity_value}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {relation.is_visible_in_quote && (
                        <Badge variant="secondary" className="text-xs">
                          Preventivo
                        </Badge>
                      )}
                      {relation.is_visible_in_material_list && (
                        <Badge variant="secondary" className="text-xs">
                          Cantiere
                        </Badge>
                      )}
                      {relation.is_required_for_stock && (
                        <Badge variant="secondary" className="text-xs">
                          Stock
                        </Badge>
                      )}
                      {relation.is_optional && (
                        <Badge variant="outline" className="text-xs">
                          Opzionale
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(relation)}
                        className="hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (
                            confirm(
                              `Sei sicuro di voler rimuovere questa relazione con "${relation.relatedProduct?.name}"?`
                            )
                          ) {
                            deleteRelationMutation.mutate(relation.id!);
                          }
                        }}
                        className="hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

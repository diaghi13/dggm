'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { stockMovementsApi } from '@/lib/api/stock-movements';
import { warehousesApi } from '@/lib/api/warehouses';
import { Button } from '@/components/ui/button';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Trash2, PackagePlus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ProductAutocomplete } from '@/app/(dashboard)/products/_components/product-autocomplete';
import ProductData = App.Data.ProductData;

interface BulkIntakeDialogProps {
  trigger?: React.ReactNode;
  warehouseId?: number;
  onSuccess?: () => void;
}

interface ProductItem {
  id: string;
  product_id: number;
  product?: App.Data.ProductData;
  quantity: number;
  unit_cost?: number;
}

export function BulkIntakeDialog({
  trigger,
  warehouseId,
  onSuccess
}: BulkIntakeDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  // Form state
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | undefined>(warehouseId);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ProductItem[]>([]);

  // Current item being added
  const [selectedProduct, setSelectedProduct] = useState<App.Data.ProductData | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [unitCost, setUnitCost] = useState('');

  // Fetch warehouses
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses', { is_active: true, per_page: 100 }],
    queryFn: () => warehousesApi.getAll({ is_active: true, per_page: 100 }),
  });

  const warehouses = warehousesData?.data ?? [];

  // Add item to list
  const handleAddItem = () => {
    if (!selectedProduct || !quantity) {
      toast.error('Seleziona un prodotto e inserisci la quantità');
      return;
    }

    const existingItem = items.find(item => item.product_id === selectedProduct.id);
    if (existingItem) {
      toast.error('Prodotto già aggiunto alla lista');
      return;
    }

    const newItem: ProductItem = {
      id: Math.random().toString(),
      product_id: selectedProduct.id!,
      product: selectedProduct,
      quantity: parseFloat(quantity),
      unit_cost: unitCost ? parseFloat(unitCost) : undefined,
    };

    setItems(prev => [...prev, newItem]);

    // Reset form
    setSelectedProduct(null);
    setQuantity('1');
    setUnitCost('');

    toast.success('Prodotto aggiunto alla lista');
  };

  // Remove item from list
  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // Calculate total
  const totalValue = items.reduce((sum, item) => {
    return sum + (item.quantity * (item.unit_cost || 0));
  }, 0);

  const totalItems = items.length;

  // Create bulk intake mutation
  const bulkIntakeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedWarehouseId) {
        throw new Error('Seleziona un magazzino');
      }
      if (items.length === 0) {
        throw new Error('Aggiungi almeno un prodotto');
      }

      // Create multiple intake movements
      const promises = items.map(item =>
        stockMovementsApi.createIntake({
          warehouse_id: selectedWarehouseId,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
          reference: reference || undefined,
          notes: notes || undefined,
        })
      );

      return Promise.all(promises);
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-movements'] });

      toast.success('Carico completato', {
        description: `${results.length} ${results.length === 1 ? 'prodotto caricato' : 'prodotti caricati'} con successo`,
      });

      handleClose();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error('Errore', {
        description: error.message || 'Impossibile completare il carico',
      });
    },
  });

  const handleClose = () => {
    setOpen(false);
    setItems([]);
    setSelectedWarehouseId(warehouseId);
    setReference('');
    setNotes('');
    setSelectedProduct(null);
    setQuantity('1');
    setUnitCost('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    bulkIntakeMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) handleClose();
      else setOpen(true);
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <PackagePlus className="mr-2 h-4 w-4" />
            Carico Iniziale / Bulk
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Carico Iniziale / Bulk</DialogTitle>
          <DialogDescription>
            Carica più prodotti contemporaneamente in magazzino (es. carico iniziale, inventario)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Magazzino e Riferimento */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Magazzino Destinazione *</Label>
              <Select
                value={selectedWarehouseId?.toString()}
                onValueChange={(value) => setSelectedWarehouseId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona magazzino" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w: App.Data.WarehouseData) => (
                    <SelectItem key={w.id} value={w.id!.toString()}>
                      {w.code} - {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Riferimento (es. DDT fornitore)</Label>
              <Input
                placeholder="Es: DDT-2024-001"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
          </div>

          {/* Aggiungi Prodotto */}
          <div className="border rounded-lg p-4 space-y-4 bg-slate-50 dark:bg-slate-900">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Aggiungi Prodotto
            </h3>

            <div className="space-y-3">
              {/* Riga 1: Prodotto (full width) */}
              <div>
                <Label className="text-xs mb-1.5 block">Prodotto *</Label>
                <ProductAutocomplete
                  value={selectedProduct?.id}
                  onSelect={(product) => {
                    setSelectedProduct(product);
                    // Auto-compila il costo unitario
                    if (product?.purchase_price) {
                      setUnitCost(product.purchase_price.toString());
                    }
                  }}
                  placeholder="Cerca o scansiona prodotto..."
                  showBarcodeScanner={true}
                />
              </div>

              {/* Riga 2: Quantità, Costo, Bottone Add */}
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-5">
                  <Label className="text-xs mb-1.5 block">Quantità *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="1.00"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="col-span-6">
                  <Label className="text-xs mb-1.5 block">Costo Unit. €</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="col-span-1 flex items-end">
                  <Button
                    type="button"
                    onClick={handleAddItem}
                    disabled={!selectedProduct || !quantity}
                    className="w-full h-11"
                    title="Aggiungi alla lista"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Lista Prodotti */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Prodotti da Caricare ({totalItems})</Label>
              {totalValue > 0 && (
                <Badge variant="secondary" className="gap-1">
                  Valore Totale: € {totalValue.toFixed(2)}
                </Badge>
              )}
            </div>

            {items.length === 0 ? (
              <div className="border-2 border-dashed rounded-lg p-8 text-center text-slate-500 dark:text-slate-400">
                <PackagePlus className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Nessun prodotto aggiunto</p>
                <p className="text-xs mt-1">Aggiungi prodotti alla lista per procedere</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Codice</TableHead>
                      <TableHead>Prodotto</TableHead>
                      <TableHead className="text-right">Quantità</TableHead>
                      <TableHead className="text-right">Costo Unit.</TableHead>
                      <TableHead className="text-right">Totale</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-sm">
                          {item.product?.code || '-'}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.product?.name || 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantity} {item.product?.unit}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.unit_cost ? `€ ${item.unit_cost.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {item.unit_cost
                            ? `€ ${(item.quantity * item.unit_cost).toFixed(2)}`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(item.id)}
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label>Note</Label>
            <Textarea
              placeholder="Note aggiuntive sul carico..."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={bulkIntakeMutation.isPending || items.length === 0 || !selectedWarehouseId}
            >
              {bulkIntakeMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Carica {items.length > 0 && `(${items.length})`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subrentalSuppliersApi } from '@/lib/api/subrental-suppliers';
import type { SubrentalSupplierFormData } from '@/lib/api/subrental-suppliers';
import { suppliersApi } from '@/lib/api/suppliers';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Plus, Pencil, Trash2, Star, Building2, Info } from 'lucide-react';
import type { Product, ProductSubrentalSupplier } from '@/lib/types';
import { CurrencyDisplay } from '@/components/ui/currency-input';

interface SubrentalTabProps {
  product: Product;
}

type OwnershipType = 'owned' | 'subrental' | 'mixed';

const ownershipLabels: Record<OwnershipType, string> = {
  owned: 'Proprietà',
  subrental: 'Sub-noleggio',
  mixed: 'Misto',
};

const ownershipVariants: Record<
  OwnershipType,
  { className: string }
> = {
  owned: {
    className:
      'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300 border-green-200 dark:border-green-800',
  },
  subrental: {
    className:
      'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  },
  mixed: {
    className:
      'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
};

function ReliabilityStars({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < score
              ? 'fill-amber-400 text-amber-400'
              : 'fill-transparent text-slate-300 dark:text-slate-600'
          }`}
        />
      ))}
      <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">
        {score}/5
      </span>
    </div>
  );
}

const emptyFormData: SubrentalSupplierFormData = {
  supplier_id: 0,
  day_rate: 0,
  reliability_score: 3,
  is_preferred: false,
  notes: null,
};

export function SubrentalTab({ product }: SubrentalTabProps) {
  const queryClient = useQueryClient();
  const productId = product.id as number;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] =
    useState<ProductSubrentalSupplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] =
    useState<ProductSubrentalSupplier | null>(null);
  const [formData, setFormData] =
    useState<SubrentalSupplierFormData>(emptyFormData);
  const [supplierSearch, setSupplierSearch] = useState('');

  // TODO: These routes are not yet implemented on the backend.
  // The query will fail gracefully until the backend routes are added.
  const {
    data: subrentalSuppliers = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['product-subrental-suppliers', productId],
    queryFn: () => subrentalSuppliersApi.getAll(productId),
    enabled: !!productId,
    retry: false,
  });

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers', { per_page: 200, is_active: true }],
    queryFn: () => suppliersApi.getAll({ per_page: 200, is_active: true }),
  });

  const suppliers = suppliersData?.data ?? [];
  const filteredSuppliers = supplierSearch
    ? suppliers.filter(
        (s) =>
          s.company_name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
          s.code.toLowerCase().includes(supplierSearch.toLowerCase()),
      )
    : suppliers;

  const createMutation = useMutation({
    mutationFn: (data: SubrentalSupplierFormData) =>
      subrentalSuppliersApi.create(productId, data),
    onSuccess: () => {
      toast.success('Fornitore aggiunto con successo');
      queryClient.invalidateQueries({
        queryKey: ['product-subrental-suppliers', productId],
      });
      handleCloseDialog();
    },
    onError: () => {
      toast.error("Errore durante l'aggiunta del fornitore");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<SubrentalSupplierFormData>;
    }) => subrentalSuppliersApi.update(productId, id, data),
    onSuccess: () => {
      toast.success('Fornitore aggiornato con successo');
      queryClient.invalidateQueries({
        queryKey: ['product-subrental-suppliers', productId],
      });
      handleCloseDialog();
    },
    onError: () => {
      toast.error("Errore durante l'aggiornamento del fornitore");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      subrentalSuppliersApi.delete(productId, id),
    onSuccess: () => {
      toast.success('Fornitore rimosso con successo');
      queryClient.invalidateQueries({
        queryKey: ['product-subrental-suppliers', productId],
      });
      setDeleteDialogOpen(false);
      setDeletingSupplier(null);
    },
    onError: () => {
      toast.error('Errore durante la rimozione del fornitore');
    },
  });

  const handleOpenCreate = () => {
    setEditingSupplier(null);
    setFormData(emptyFormData);
    setSupplierSearch('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (supplier: ProductSubrentalSupplier) => {
    setEditingSupplier(supplier);
    setFormData({
      supplier_id: supplier.supplier_id,
      day_rate: supplier.day_rate,
      reliability_score: supplier.reliability_score,
      is_preferred: supplier.is_preferred,
      notes: supplier.notes ?? null,
    });
    setSupplierSearch(supplier.supplier?.company_name ?? '');
    setDialogOpen(true);
  };

  const handleOpenDelete = (supplier: ProductSubrentalSupplier) => {
    setDeletingSupplier(supplier);
    setDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingSupplier(null);
    setFormData(emptyFormData);
    setSupplierSearch('');
  };

  const handleSubmit = () => {
    if (!formData.supplier_id || formData.supplier_id === 0) {
      toast.error('Seleziona un fornitore');
      return;
    }
    if (formData.day_rate <= 0) {
      toast.error('La tariffa giornaliera deve essere maggiore di 0');
      return;
    }

    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const ownershipType: OwnershipType =
    (product.ownership_type as OwnershipType | undefined) ?? 'owned';
  const ownershipStyle = ownershipVariants[ownershipType];
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Ownership Badge */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-slate-500" />
            Tipo di Approvvigionamento
          </CardTitle>
          <CardDescription>
            Indica se il prodotto è di proprietà, in sub-noleggio o entrambi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <span
              className={`inline-flex items-center px-4 py-2 rounded-lg border text-sm font-semibold ${ownershipStyle.className}`}
            >
              {ownershipLabels[ownershipType]}
            </span>

            {product.is_premium && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg border text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                <Star className="h-3.5 w-3.5 mr-1.5 fill-current" />
                Premium
              </span>
            )}

            {product.subrental_markup != null && (
              <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                <Info className="h-4 w-4" />
                <span>Markup sub-noleggio:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {product.subrental_markup}%
                </span>
              </div>
            )}

            {product.estimated_base_day != null && (
              <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                <span>Costo base/giorno stimato:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  <CurrencyDisplay value={Number(product.estimated_base_day)} />
                </span>
                {product.rental_price_estimated && (
                  <Badge variant="outline" className="text-xs">
                    Stimato
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subrental Suppliers Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Fornitori Sub-Noleggio</CardTitle>
            <CardDescription>
              Fornitori da cui è possibile noleggiare questo prodotto
            </CardDescription>
          </div>
          <Button onClick={handleOpenCreate} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi Fornitore
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center text-slate-500 dark:text-slate-400">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent mb-3" />
              <p className="text-sm">Caricamento fornitori...</p>
            </div>
          ) : isError ? (
            <div className="py-10 text-center">
              <Building2 className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Impossibile caricare i fornitori sub-noleggio.
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Questa funzionalità richiede l&apos;implementazione del backend
                (Phase 3 Rental Engine).
              </p>
            </div>
          ) : subrentalSuppliers.length === 0 ? (
            <div className="py-10 text-center">
              <Building2 className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Nessun fornitore configurato per il sub-noleggio
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Aggiungi un fornitore per abilitare il sub-noleggio di questo
                prodotto
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={handleOpenCreate}
              >
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi il primo fornitore
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornitore</TableHead>
                  <TableHead>Tariffa/Giorno</TableHead>
                  <TableHead>Affidabilità</TableHead>
                  <TableHead>Preferito</TableHead>
                  <TableHead>Ultimo Aggiornamento</TableHead>
                  <TableHead className="w-[100px]">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subrentalSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {supplier.supplier?.company_name ?? `Fornitore #${supplier.supplier_id}`}
                        </div>
                        {supplier.supplier?.code && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            {supplier.supplier.code}
                          </div>
                        )}
                        {supplier.notes && (
                          <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-[200px]">
                            {supplier.notes}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        <CurrencyDisplay value={Number(supplier.day_rate)} />
                      </span>
                    </TableCell>
                    <TableCell>
                      <ReliabilityStars score={supplier.reliability_score} />
                    </TableCell>
                    <TableCell>
                      {supplier.is_preferred ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300 border-green-200 dark:border-green-800">
                          Preferito
                        </Badge>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 text-sm">
                          —
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {supplier.last_updated ? (
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {format(new Date(supplier.last_updated), 'dd MMM yyyy', {
                            locale: it,
                          })}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 text-sm">
                          —
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(supplier)}
                          className="h-8 w-8 p-0"
                          title="Modifica"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDelete(supplier)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                          title="Rimuovi"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier
                ? 'Modifica Fornitore Sub-Noleggio'
                : 'Aggiungi Fornitore Sub-Noleggio'}
            </DialogTitle>
            <DialogDescription>
              {editingSupplier
                ? 'Aggiorna le condizioni di noleggio per questo fornitore'
                : 'Configura un nuovo fornitore da cui noleggiare questo prodotto'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Supplier Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Fornitore <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.supplier_id ? String(formData.supplier_id) : ''}
                onValueChange={(value) =>
                  setFormData({ ...formData, supplier_id: parseInt(value) })
                }
                disabled={!!editingSupplier}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleziona un fornitore..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredSuppliers.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      <span className="font-medium">{s.company_name}</span>
                      <span className="ml-2 text-xs text-slate-500">
                        {s.code}
                      </span>
                    </SelectItem>
                  ))}
                  {filteredSuppliers.length === 0 && (
                    <SelectItem value="" disabled>
                      Nessun fornitore trovato
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Day Rate */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Tariffa Giornaliera (€) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.day_rate || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    day_rate: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            {/* Reliability Score */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Affidabilità (0–5)
              </label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min="0"
                  max="5"
                  step="1"
                  value={formData.reliability_score}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reliability_score: Math.min(
                        5,
                        Math.max(0, parseInt(e.target.value) || 0),
                      ),
                    })
                  }
                  className="w-24"
                />
                <ReliabilityStars score={formData.reliability_score} />
              </div>
            </div>

            {/* Is Preferred */}
            <div className="flex items-center gap-3">
              <Checkbox
                id="is-preferred"
                checked={formData.is_preferred ?? false}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    is_preferred: checked === true,
                  })
                }
              />
              <label
                htmlFor="is-preferred"
                className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Fornitore preferito
              </label>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Note (opzionale)
              </label>
              <Textarea
                placeholder="Condizioni speciali, contatto di riferimento..."
                value={formData.notes ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    notes: e.target.value || null,
                  })
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Annulla
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending
                ? 'Salvataggio...'
                : editingSupplier
                  ? 'Salva Modifiche'
                  : 'Aggiungi Fornitore'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rimuovi Fornitore Sub-Noleggio</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler rimuovere{' '}
              <strong>
                {deletingSupplier?.supplier?.company_name ??
                  `Fornitore #${deletingSupplier?.supplier_id}`}
              </strong>{' '}
              dall&apos;elenco dei fornitori sub-noleggio? Questa azione non può
              essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingSupplier) {
                  deleteMutation.mutate(deletingSupplier.id);
                }
              }}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Rimuovi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

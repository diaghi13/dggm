'use client';

import React, { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { finalBalancesApi } from '@/lib/api/final-balances';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Folder,
  Package,
  Clock,
  Receipt,
  Wrench,
  AlertTriangle,
  Link2,
  Circle,
  Truck,
  Pencil,
  Trash2,
  Plus,
  Lock,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { handleMutationError } from '@/lib/utils/handle-mutation-error';
import { CurrencyDisplay, CurrencyInput } from '@/components/ui/currency-input';
import type {
  FinalBalanceItem,
  FinalBalanceItemType,
  CreateFinalBalanceItemInput,
  UpdateFinalBalanceItemInput,
} from '@/lib/types';

// ─── Item type config ────────────────────────────────────────────────────────

const ITEM_TYPE_CONFIG: Record<
  FinalBalanceItemType,
  { label: string; icon: React.ElementType; color: string }
> = {
  section: {
    label: 'Sezione',
    icon: Folder,
    color: 'text-slate-600 dark:text-slate-400',
  },
  material: {
    label: 'Materiale',
    icon: Package,
    color: 'text-blue-600 dark:text-blue-400',
  },
  labor: {
    label: 'Manodopera',
    icon: Clock,
    color: 'text-green-600 dark:text-green-400',
  },
  expense: {
    label: 'Spesa',
    icon: Receipt,
    color: 'text-orange-600 dark:text-orange-400',
  },
  service: {
    label: 'Servizio',
    icon: Wrench,
    color: 'text-purple-600 dark:text-purple-400',
  },
  damage: {
    label: 'Danno',
    icon: AlertTriangle,
    color: 'text-red-600 dark:text-red-400',
  },
  transport: {
    label: 'Trasporto',
    icon: Truck,
    color: 'text-cyan-600 dark:text-cyan-400',
  },
  quote_reference: {
    label: 'Rif. Preventivo',
    icon: Link2,
    color: 'text-indigo-600 dark:text-indigo-400',
  },
  other: {
    label: 'Altro',
    icon: Circle,
    color: 'text-slate-500 dark:text-slate-400',
  },
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface FinalBalanceItemsEditorProps {
  finalBalanceId: number;
  items: FinalBalanceItem[];
  isReadOnly: boolean;
  onItemsChange: () => void;
}

interface ItemFormState {
  type: FinalBalanceItemType;
  description: string;
  unit: string;
  quantity: string;
  unit_price: string;
  cost_price: string;
  discount_percentage: string;
  notes: string;
  parent_id: string;
}

const DEFAULT_FORM: ItemFormState = {
  type: 'material',
  description: '',
  unit: '',
  quantity: '1',
  unit_price: '0',
  cost_price: '',
  discount_percentage: '0',
  notes: '',
  parent_id: '',
};

// ─── Helper: build flat sorted list ─────────────────────────────────────────

function flattenItems(items: FinalBalanceItem[]): FinalBalanceItem[] {
  const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);
  const result: FinalBalanceItem[] = [];
  const roots = sorted.filter((i) => i.parent_id === null);
  function walk(list: FinalBalanceItem[]) {
    for (const item of list) {
      result.push(item);
      const children = sorted
        .filter((c) => c.parent_id === item.id)
        .sort((a, b) => a.sort_order - b.sort_order);
      if (children.length > 0) walk(children);
    }
  }
  walk(roots);
  return result;
}

function computeSubtotal(items: FinalBalanceItem[]): number {
  return items
    .filter((i) => i.type !== 'section')
    .reduce((sum, i) => sum + (i.total ?? 0), 0);
}

// ─── Item Row ────────────────────────────────────────────────────────────────

interface ItemRowProps {
  item: FinalBalanceItem;
  isChild: boolean;
  isReadOnly: boolean;
  onEdit: (item: FinalBalanceItem) => void;
  onDelete: (item: FinalBalanceItem) => void;
}

function ItemRow({ item, isChild, isReadOnly, onEdit, onDelete }: ItemRowProps) {
  const isSection = item.type === 'section';
  const isQuoteRef = item.type === 'quote_reference';
  const config = ITEM_TYPE_CONFIG[item.type];
  const Icon = config.icon;

  const rowClass = [
    'group flex items-start gap-3 px-4 py-3 border-b transition-colors',
    isSection
      ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
      : isQuoteRef
        ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-slate-100 dark:border-slate-800'
        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/40',
  ].join(' ');

  return (
    <div className={rowClass}>
      {/* Indent for children */}
      {isChild && (
        <div className="flex-shrink-0 flex items-center mt-0.5">
          <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
        </div>
      )}

      {/* Type icon */}
      <div className={`flex-shrink-0 mt-0.5 ${config.color}`}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`${isSection ? 'font-bold text-slate-900 dark:text-slate-100' : 'font-medium text-slate-800 dark:text-slate-200'} text-sm`}
          >
            {item.description}
          </span>
          {isSection && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400"
            >
              SEZIONE
            </Badge>
          )}
          {isQuoteRef && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 gap-0.5"
            >
              <Lock className="h-2.5 w-2.5" />
              Rif. Preventivo
            </Badge>
          )}
          {!item.is_manual && !isSection && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500"
            >
              Auto
            </Badge>
          )}
        </div>
        {item.code && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Cod. {item.code}
          </p>
        )}
        {item.notes && (
          <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-0.5">
            {item.notes}
          </p>
        )}
      </div>

      {/* Quantity / Unit */}
      {!isSection && (
        <div className="flex-shrink-0 text-right text-sm text-slate-600 dark:text-slate-400 min-w-[60px]">
          <span className="font-medium">{item.quantity}</span>
          {item.unit && (
            <span className="text-xs text-slate-400 ml-1">{item.unit}</span>
          )}
        </div>
      )}

      {/* Unit price */}
      {!isSection && (
        <div className="flex-shrink-0 text-right text-sm text-slate-700 dark:text-slate-300 min-w-[80px]">
          <CurrencyDisplay value={item.unit_price} />
        </div>
      )}

      {/* Discount */}
      {!isSection && (
        <div className="flex-shrink-0 text-right text-sm min-w-[50px]">
          {item.discount_percentage > 0 ? (
            <span className="text-red-600 dark:text-red-400 text-xs">
              -{item.discount_percentage}%
            </span>
          ) : (
            <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
          )}
        </div>
      )}

      {/* Total */}
      {!isSection && (
        <div className="flex-shrink-0 text-right font-semibold text-sm text-slate-900 dark:text-slate-100 min-w-[90px]">
          <CurrencyDisplay value={item.total} />
        </div>
      )}

      {/* Actions */}
      {!isReadOnly && (
        <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            onClick={() => onEdit(item)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 dark:hover:text-red-400"
            onClick={() => onDelete(item)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Item Form Dialog ────────────────────────────────────────────────────────

interface ItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: FinalBalanceItem | null;
  sections: FinalBalanceItem[];
  finalBalanceId: number;
  onSuccess: () => void;
}

function ItemFormDialog({
  open,
  onOpenChange,
  editingItem,
  sections,
  finalBalanceId,
  onSuccess,
}: ItemFormDialogProps) {
  const [form, setForm] = useState<ItemFormState>(() => {
    if (editingItem) {
      return {
        type: editingItem.type,
        description: editingItem.description,
        unit: editingItem.unit ?? '',
        quantity: String(editingItem.quantity),
        unit_price: String(editingItem.unit_price),
        cost_price: editingItem.cost_price != null ? String(editingItem.cost_price) : '',
        discount_percentage: String(editingItem.discount_percentage),
        notes: editingItem.notes ?? '',
        parent_id: editingItem.parent_id != null ? String(editingItem.parent_id) : '',
      };
    }
    return DEFAULT_FORM;
  });

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      if (editingItem) {
        setForm({
          type: editingItem.type,
          description: editingItem.description,
          unit: editingItem.unit ?? '',
          quantity: String(editingItem.quantity),
          unit_price: String(editingItem.unit_price),
          cost_price: editingItem.cost_price != null ? String(editingItem.cost_price) : '',
          discount_percentage: String(editingItem.discount_percentage),
          notes: editingItem.notes ?? '',
          parent_id: editingItem.parent_id != null ? String(editingItem.parent_id) : '',
        });
      } else {
        setForm(DEFAULT_FORM);
      }
    }
  }, [open, editingItem]);

  const addMutation = useMutation({
    mutationFn: (data: CreateFinalBalanceItemInput) =>
      finalBalancesApi.addItem(finalBalanceId, data),
    onSuccess: () => {
      toast.success('Voce aggiunta');
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => handleMutationError(error, 'Errore durante il salvataggio'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateFinalBalanceItemInput) =>
      finalBalancesApi.updateItem(editingItem!.id, data),
    onSuccess: () => {
      toast.success('Voce aggiornata');
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => handleMutationError(error, 'Errore durante il salvataggio'),
  });

  const isPending = addMutation.isPending || updateMutation.isPending;
  const isSection = form.type === 'section';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description.trim()) {
      toast.error('Descrizione obbligatoria');
      return;
    }
    const payload: CreateFinalBalanceItemInput = {
      type: form.type,
      description: form.description.trim(),
      unit: form.unit.trim() || null,
      quantity: isSection ? 0 : parseFloat(form.quantity) || 1,
      unit_price: isSection ? 0 : parseFloat(form.unit_price) || 0,
      cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
      discount_percentage: isSection ? 0 : parseFloat(form.discount_percentage) || 0,
      notes: form.notes.trim() || null,
      parent_id: form.parent_id ? parseInt(form.parent_id) : null,
    };
    if (editingItem) {
      updateMutation.mutate(payload);
    } else {
      addMutation.mutate(payload);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-slate-100">
            {editingItem ? 'Modifica Voce' : 'Aggiungi Voce'}
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            {editingItem
              ? 'Modifica i dettagli della voce'
              : 'Aggiungi una nuova voce al consuntivo'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div className="space-y-1.5">
            <Label className="text-slate-700 dark:text-slate-300">Tipo</Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm((f) => ({ ...f, type: v as FinalBalanceItemType }))}
            >
              <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                {(Object.entries(ITEM_TYPE_CONFIG) as [FinalBalanceItemType, typeof ITEM_TYPE_CONFIG[FinalBalanceItemType]][])
                  .filter(([key]) => key !== 'quote_reference')
                  .map(([key, cfg]) => {
                    const Ico = cfg.icon;
                    return (
                      <SelectItem key={key} value={key} className="text-slate-900 dark:text-slate-100">
                        <span className="flex items-center gap-2">
                          <Ico className={`h-4 w-4 ${cfg.color}`} />
                          {cfg.label}
                        </span>
                      </SelectItem>
                    );
                  })}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-slate-700 dark:text-slate-300">
              Descrizione <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Descrizione della voce..."
              className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 min-h-[80px]"
              required
            />
          </div>

          {!isSection && (
            <>
              {/* Unit + Quantity */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-slate-700 dark:text-slate-300">Unità</Label>
                  <Input
                    value={form.unit}
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                    placeholder="pz, ora, m²..."
                    className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-700 dark:text-slate-300">Quantità</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                    className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Unit price + Discount */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-slate-700 dark:text-slate-300">Prezzo unitario (€)</Label>
                  <CurrencyInput
                    value={parseFloat(form.unit_price) || 0}
                    onChange={(v) => setForm((f) => ({ ...f, unit_price: String(v) }))}
                    className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-700 dark:text-slate-300">Sconto %</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={form.discount_percentage}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, discount_percentage: e.target.value }))
                    }
                    placeholder="0"
                    className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Cost price */}
              <div className="space-y-1.5">
                <Label className="text-slate-700 dark:text-slate-300">
                  Prezzo di costo (€)
                  <span className="ml-1 text-xs text-slate-400 dark:text-slate-500">opzionale, per calcolo margine</span>
                </Label>
                <CurrencyInput
                  value={form.cost_price ? parseFloat(form.cost_price) : 0}
                  onChange={(v) =>
                    setForm((f) => ({ ...f, cost_price: v ? String(v) : '' }))
                  }
                  className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
            </>
          )}

          {/* Parent section (for nesting) */}
          {sections.length > 0 && !isSection && (
            <div className="space-y-1.5">
              <Label className="text-slate-700 dark:text-slate-300">Sezione padre</Label>
              <Select
                value={form.parent_id || '__none__'}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, parent_id: v === '__none__' ? '' : v }))
                }
              >
                <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                  <SelectValue placeholder="Nessuna sezione" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                  <SelectItem value="__none__" className="text-slate-900 dark:text-slate-100">
                    Nessuna sezione
                  </SelectItem>
                  {sections.map((s) => (
                    <SelectItem
                      key={s.id}
                      value={String(s.id)}
                      className="text-slate-900 dark:text-slate-100"
                    >
                      {s.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-slate-700 dark:text-slate-300">Note</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Note opzionali..."
              className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 min-h-[60px]"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isPending ? 'Salvataggio...' : editingItem ? 'Salva modifiche' : 'Aggiungi voce'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function FinalBalanceItemsEditor({
  finalBalanceId,
  items,
  isReadOnly,
  onItemsChange,
}: FinalBalanceItemsEditorProps) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FinalBalanceItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<FinalBalanceItem | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => finalBalancesApi.deleteItem(id),
    onSuccess: () => {
      toast.success('Voce eliminata');
      onItemsChange();
    },
    onError: (error) => handleMutationError(error, "Errore durante l'eliminazione"),
  });

  const handleEdit = useCallback((item: FinalBalanceItem) => {
    setEditingItem(item);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback((item: FinalBalanceItem) => {
    setDeletingItem(item);
  }, []);

  const handleAddItem = useCallback(() => {
    setEditingItem(null);
    setDialogOpen(true);
  }, []);

  const handleAddSection = useCallback(() => {
    setEditingItem({
      id: -1,
      final_balance_id: finalBalanceId,
      parent_id: null,
      quote_item_id: null,
      project_material_id: null,
      project_service_id: null,
      project_expense_id: null,
      incident_id: null,
      type: 'section',
      description: '',
      code: null,
      unit: null,
      quantity: 0,
      unit_price: 0,
      cost_price: null,
      discount_percentage: 0,
      subtotal: 0,
      total: 0,
      is_manual: true,
      sort_order: items.length,
      notes: null,
    });
    setDialogOpen(true);
  }, [finalBalanceId, items.length]);

  const confirmDelete = useCallback(() => {
    if (deletingItem) {
      deleteMutation.mutate(deletingItem.id);
      setDeletingItem(null);
    }
  }, [deletingItem, deleteMutation]);

  const flatItems = flattenItems(items);
  const sections = items.filter((i) => i.type === 'section');
  const subtotal = computeSubtotal(items);
  const isEditingNew = editingItem?.id === -1;

  return (
    <div className="space-y-0">
      {/* Column headers */}
      <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
        <div className="flex-shrink-0 w-4" />
        <div className="flex-1">Descrizione</div>
        <div className="flex-shrink-0 w-[60px] text-right">Qt.</div>
        <div className="flex-shrink-0 w-[80px] text-right">Prezzo</div>
        <div className="flex-shrink-0 w-[50px] text-right">Sc.</div>
        <div className="flex-shrink-0 w-[90px] text-right">Totale</div>
        {!isReadOnly && <div className="flex-shrink-0 w-[64px]" />}
      </div>

      {/* Items */}
      {flatItems.length === 0 ? (
        <div className="py-12 text-center border-b border-slate-100 dark:border-slate-800">
          <Package className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Nessuna voce aggiunta
          </p>
          {!isReadOnly && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Usa i pulsanti sotto per aggiungere voci
            </p>
          )}
        </div>
      ) : (
        flatItems.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            isChild={item.parent_id !== null}
            isReadOnly={isReadOnly}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))
      )}

      {/* Subtotal footer */}
      {flatItems.length > 0 && (
        <div className="flex items-center justify-end gap-6 px-4 py-3 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-700">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Subtotale voci
          </span>
          <span className="text-base font-bold text-slate-900 dark:text-slate-100 min-w-[90px] text-right">
            <CurrencyDisplay value={subtotal} />
          </span>
        </div>
      )}

      {/* Action bar */}
      {!isReadOnly && (
        <div className="flex items-center gap-2 px-4 py-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddItem}
            className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Aggiungi Voce
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddSection}
            className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Folder className="h-3.5 w-3.5 mr-1.5" />
            Aggiungi Sezione
          </Button>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <ItemFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingItem(null);
        }}
        editingItem={isEditingNew ? null : editingItem}
        sections={sections}
        finalBalanceId={finalBalanceId}
        onSuccess={onItemsChange}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingItem}
        onOpenChange={(open) => !open && setDeletingItem(null)}
      >
        <AlertDialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 dark:text-slate-100">
              Elimina voce
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
              Vuoi eliminare la voce{' '}
              <strong className="text-slate-700 dark:text-slate-300">
                &quot;{deletingItem?.description}&quot;
              </strong>
              ? L&apos;operazione non è reversibile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

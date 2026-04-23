'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectOrderListApi } from '@/lib/api/project-order-list';
import { suppliersApi } from '@/lib/api/suppliers';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  CheckCircle2,
  ShoppingCart,
  RefreshCw,
  ArrowRightLeft,
  Info,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
} from 'lucide-react';
import { CurrencyDisplay } from '@/components/ui/currency-input';
import type { OrderListItem, SubrentalAssignment, SubrentalSupplierEntry, Supplier } from '@/lib/types';

interface Props {
  projectId: number;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function calcSectionTotal(items: OrderListItem[]): number {
  return items.reduce((sum, i) => sum + (i.estimated_cost ?? 0), 0);
}

// ─── Section wrapper ────────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  count: number;
  cost?: number;
  colorClass: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function OrderSection({ title, icon, count, cost, colorClass, defaultOpen = true, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className={`rounded-lg border px-4 ${colorClass}`}>
        <CollapsibleTrigger asChild>
          <button
            className="flex w-full items-center gap-3 py-3 text-left hover:opacity-80 transition-opacity"
            type="button"
          >
            {icon}
            <span className="font-semibold">{title}</span>
            <Badge className="ml-0.5">{count} articoli</Badge>
            {cost !== undefined && cost > 0 && (
              <span className="text-sm font-medium ml-1">
                · <CurrencyDisplay value={cost} />
              </span>
            )}
            <span className="ml-auto">
              {open ? <ChevronDown className="h-4 w-4 opacity-60" /> : <ChevronRight className="h-4 w-4 opacity-60" />}
            </span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="pb-4">{children}</div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ─── Inline editable field (save on blur) ──────────────────────────────────

interface InlineFieldProps {
  value: number | null;
  placeholder: string;
  prefix?: string;
  width?: string;
  onSave: (v: number | null) => void;
}

function InlineField({ value, placeholder, prefix, width = 'w-24', onSave }: InlineFieldProps) {
  const [local, setLocal] = useState(value != null ? String(value) : '');

  useEffect(() => {
    setLocal(value != null ? String(value) : '');
  }, [value]);

  const commit = useCallback(() => {
    const trimmed = local.trim().replace(',', '.');
    const parsed = trimmed !== '' ? parseFloat(trimmed) : null;
    if (parsed !== null && isNaN(parsed)) return;
    if (parsed !== value) onSave(parsed);
  }, [local, value, onSave]);

  return (
    <div className="flex items-center gap-1">
      {prefix && <span className="text-xs text-slate-500 dark:text-slate-400">{prefix}</span>}
      <Input
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); }}
        className={`h-6 ${width} text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100`}
      />
    </div>
  );
}

// ─── Single assignment row ──────────────────────────────────────────────────

interface AssignmentRowProps {
  assignment: SubrentalAssignment;
  onUpdatePrice: (price: number | null) => void;
  onUpdateQty: (qty: number | null) => void;
  onRemove: () => void;
  isPending: boolean;
}

function AssignmentRow({ assignment, onUpdatePrice, onUpdateQty, onRemove, isPending }: AssignmentRowProps) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 px-2 py-1.5">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
          {assignment.supplier_name}
        </p>
        {assignment.day_rate !== null && (
          <p className="text-xs text-slate-400 dark:text-slate-500">
            €{assignment.day_rate.toFixed(2)}/g
          </p>
        )}
      </div>
      <InlineField
        value={assignment.quantity}
        placeholder="qta"
        width="w-14"
        onSave={onUpdateQty}
      />
      <InlineField
        value={assignment.quoted_price}
        placeholder="€ totale"
        prefix="€"
        width="w-20"
        onSave={onUpdatePrice}
      />
      <button
        type="button"
        onClick={onRemove}
        disabled={isPending}
        className="shrink-0 rounded-full p-0.5 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
        title="Rimuovi fornitore"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Add supplier popover ───────────────────────────────────────────────────

interface AddSupplierPopoverProps {
  item: OrderListItem;
  allSuppliers: Supplier[];
  isPending: boolean;
  onSelect: (supplierId: number, existingEntryId: number | undefined, dayRate: number | null) => void;
}

function AddSupplierPopover({ item, allSuppliers, isPending, onSelect }: AddSupplierPopoverProps) {
  const [open, setOpen] = useState(false);

  const assignedEntryIds = new Set(item.subrental_assignments.map((a) => a.subrental_supplier_entry_id));
  const registeredSupplierIds = new Set(item.subrental_suppliers.map((s) => s.supplier_id));

  // Registered entries not yet assigned
  const availableRegistered = item.subrental_suppliers.filter(
    (s) => !assignedEntryIds.has(s.id)
  );
  // Other suppliers not yet registered
  const otherSuppliers = allSuppliers.filter((s) => !registeredSupplierIds.has(s.id ?? 0));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          className="h-7 gap-1.5 text-xs border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30"
        >
          <Plus className="h-3 w-3" />
          Aggiungi fornitore
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg" align="start">
        <Command className="bg-transparent">
          <CommandInput
            placeholder="Cerca fornitore..."
            className="h-9 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border-b border-slate-200 dark:border-slate-700"
          />
          <CommandList className="max-h-64">
            <CommandEmpty className="py-4 text-center text-xs text-slate-500 dark:text-slate-400">
              Nessun fornitore trovato.
            </CommandEmpty>

            {availableRegistered.length > 0 && (
              <CommandGroup
                heading="Fornitori registrati"
                className="[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-slate-500 [&_[cmdk-group-heading]]:dark:text-slate-400 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-medium"
              >
                {availableRegistered.map((entry) => {
                  const sup = allSuppliers.find((s) => s.id === entry.supplier_id);
                  const label = sup?.company_name ?? entry.name ?? `Fornitore #${entry.supplier_id}`;
                  const priceLabel = entry.day_rate != null ? `€${entry.day_rate.toFixed(2)}/g` : 'tariffa da definire';
                  return (
                    <CommandItem
                      key={`reg-${entry.id}`}
                      value={label}
                      onSelect={() => { onSelect(entry.supplier_id, entry.id, entry.day_rate); setOpen(false); }}
                      className="flex items-center gap-2 text-xs text-slate-900 dark:text-slate-100 cursor-pointer data-[selected=true]:bg-blue-50 dark:data-[selected=true]:bg-blue-900/30"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="truncate font-medium">{label}</span>
                        <span className="text-slate-400 dark:text-slate-500">{priceLabel}</span>
                      </div>
                      {entry.is_preferred && (
                        <Badge className="ml-auto shrink-0 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-xs">Preferito</Badge>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {availableRegistered.length > 0 && otherSuppliers.length > 0 && (
              <CommandSeparator className="bg-slate-200 dark:bg-slate-700" />
            )}

            {otherSuppliers.length > 0 && (
              <CommandGroup
                heading="Altri fornitori"
                className="[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-slate-500 [&_[cmdk-group-heading]]:dark:text-slate-400 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-medium"
              >
                {otherSuppliers.map((sup) => (
                  <CommandItem
                    key={`other-${sup.id}`}
                    value={sup.company_name}
                    onSelect={() => { onSelect(sup.id!, undefined, null); setOpen(false); }}
                    className="flex items-center gap-2 text-xs text-slate-900 dark:text-slate-100 cursor-pointer data-[selected=true]:bg-blue-50 dark:data-[selected=true]:bg-blue-900/30"
                  >
                    <span className="truncate">{sup.company_name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ─── Subrental cell for one item ────────────────────────────────────────────

interface SubrentalCellProps {
  item: OrderListItem;
  allSuppliers: Supplier[];
  isAddPending: boolean;
  isUpdatePending: boolean;
  isRemovePending: boolean;
  onAdd: (supplierId: number, existingEntryId: number | undefined, dayRate: number | null) => void;
  onUpdatePrice: (entryId: number, price: number | null) => void;
  onUpdateQty: (entryId: number, qty: number | null) => void;
  onRemove: (entryId: number) => void;
}

function SubrentalCell({
  item,
  allSuppliers,
  isAddPending,
  isUpdatePending,
  isRemovePending,
  onAdd,
  onUpdatePrice,
  onUpdateQty,
  onRemove,
}: SubrentalCellProps) {
  return (
    <div className="space-y-1.5">
      {item.subrental_assignments.map((assignment) => (
        <AssignmentRow
          key={assignment.subrental_supplier_entry_id}
          assignment={assignment}
          onUpdatePrice={(price) => onUpdatePrice(assignment.subrental_supplier_entry_id, price)}
          onUpdateQty={(qty) => onUpdateQty(assignment.subrental_supplier_entry_id, qty)}
          onRemove={() => onRemove(assignment.subrental_supplier_entry_id)}
          isPending={isUpdatePending || isRemovePending}
        />
      ))}
      <AddSupplierPopover
        item={item}
        allSuppliers={allSuppliers}
        isPending={isAddPending}
        onSelect={onAdd}
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProjectOrderListTab({ projectId }: Props) {
  const queryClient = useQueryClient();

  const { data: orderList, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['project-order-list', projectId],
    queryFn: () => projectOrderListApi.getOrderList(projectId),
    enabled: !!projectId,
  });

  const { data: allSuppliersData } = useQuery({
    queryKey: ['suppliers', 'material-or-both'],
    queryFn: () => suppliersApi.getAll({ per_page: 500 }),
    staleTime: 5 * 60 * 1000,
  });
  const allSuppliers: Supplier[] = (allSuppliersData?.data ?? []).filter(
    (s) => s.supplier_type === 'materials' || s.supplier_type === 'both',
  );

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['project-order-list', projectId] });
  }, [queryClient, projectId]);

  const addMutation = useMutation({
    mutationFn: async ({
      materialId,
      productId,
      supplierId,
      existingEntryId,
      defaultQuantity,
      dayRate,
    }: {
      materialId: number;
      productId: number | null;
      supplierId: number;
      existingEntryId: number | undefined;
      defaultQuantity: number;
      dayRate: number | null;
    }) => {
      let entryId = existingEntryId;
      if (entryId === undefined && productId !== null) {
        const newEntry = await projectOrderListApi.createSubrentalSupplier(productId, supplierId, null);
        entryId = newEntry.id;
      }
      if (entryId !== undefined) {
        const defaultQuotedPrice = dayRate != null ? Math.round(dayRate * defaultQuantity * 100) / 100 : null;
        await projectOrderListApi.addSubrentalAssignment(projectId, materialId, entryId, defaultQuantity, defaultQuotedPrice);
      }
    },
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ materialId, entryId, data }: { materialId: number; entryId: number; data: { quoted_price?: number | null; quantity?: number | null } }) =>
      projectOrderListApi.updateSubrentalAssignment(projectId, materialId, entryId, data),
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: ({ materialId, entryId }: { materialId: number; entryId: number }) =>
      projectOrderListApi.removeSubrentalAssignment(projectId, materialId, entryId),
    onSuccess: invalidate,
  });

  const toPurchaseTotal = orderList ? calcSectionTotal(orderList.to_purchase) : 0;
  const toSubrentalTotal = orderList ? calcSectionTotal(orderList.to_subrental) : 0;
  const grandTotal = toPurchaseTotal + toSubrentalTotal;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-500 dark:text-slate-400">
        Caricamento lista ordine...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Lista Ordine</h2>
          {orderList && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Generata il {formatDate(orderList.generated_at)}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2 border-slate-200 dark:border-slate-700 dark:text-slate-100"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Rigenera
        </Button>
      </div>

      {!orderList ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 py-12 text-center dark:border-slate-700 dark:bg-slate-800/20">
          <ShoppingCart className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Nessuna lista ordine disponibile</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {/* Disponibile */}
            <OrderSection
              title="Disponibile"
              icon={<CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />}
              count={orderList.available.length}
              colorClass="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/10 text-green-800 dark:text-green-200"
            >
              {orderList.available.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 py-2">Nessun articolo disponibile.</p>
              ) : (
                <div className="rounded-md border border-green-200 dark:border-green-800 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
                        <TableHead className="text-green-800 dark:text-green-200">Prodotto</TableHead>
                        <TableHead className="text-right text-green-800 dark:text-green-200">Pianificato</TableHead>
                        <TableHead className="text-right text-green-800 dark:text-green-200">Disponibile</TableHead>
                        <TableHead className="text-green-800 dark:text-green-200">Stato</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderList.available.map((item) => (
                        <TableRow key={item.project_material_id} className="border-green-100 dark:border-green-900">
                          <TableCell>
                            <p className="font-medium text-slate-900 dark:text-slate-100">{item.product_name}</p>
                            {item.product_code && <p className="text-xs text-slate-500 dark:text-slate-400">{item.product_code}</p>}
                          </TableCell>
                          <TableCell className="text-right text-slate-700 dark:text-slate-300">{item.planned_qty} {item.unit}</TableCell>
                          <TableCell className="text-right text-slate-700 dark:text-slate-300">{item.available_qty} {item.unit}</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 text-xs">Nessuna Azione</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </OrderSection>

            {/* Da Acquistare */}
            <OrderSection
              title="Da Acquistare"
              icon={<ShoppingCart className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />}
              count={orderList.to_purchase.length}
              cost={toPurchaseTotal}
              colorClass="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/10 text-amber-800 dark:text-amber-200"
            >
              {orderList.to_purchase.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 py-2">Nessun articolo da acquistare.</p>
              ) : (
                <div className="rounded-md border border-amber-200 dark:border-amber-800 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
                        <TableHead className="text-amber-800 dark:text-amber-200">Prodotto</TableHead>
                        <TableHead className="text-right text-amber-800 dark:text-amber-200">Da Ordinare</TableHead>
                        <TableHead className="text-right text-amber-800 dark:text-amber-200">Costo Stimato</TableHead>
                        <TableHead className="text-amber-800 dark:text-amber-200">Catalogo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderList.to_purchase.map((item) => (
                        <TableRow key={item.project_material_id} className={`border-amber-100 dark:border-amber-900 ${!item.is_catalog_item ? 'bg-orange-50/60 dark:bg-orange-950/10' : ''}`}>
                          <TableCell>
                            <p className="font-medium text-slate-900 dark:text-slate-100">{item.product_name}</p>
                            {item.product_code && <p className="text-xs text-slate-500 dark:text-slate-400">{item.product_code}</p>}
                          </TableCell>
                          <TableCell className="text-right text-slate-700 dark:text-slate-300">{item.to_order_qty} {item.unit}</TableCell>
                          <TableCell className="text-right font-medium text-slate-900 dark:text-slate-100">
                            <CurrencyDisplay value={item.estimated_cost} />
                          </TableCell>
                          <TableCell>
                            {item.is_catalog_item ? (
                              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-xs">Catalogo</Badge>
                            ) : (
                              <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 text-xs">Fuori Catalogo</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </OrderSection>

            {/* Da Subnoleggiare */}
            <OrderSection
              title="Da Subnoleggiare"
              icon={<ArrowRightLeft className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />}
              count={orderList.to_subrental.length}
              cost={toSubrentalTotal}
              colorClass="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/10 text-blue-800 dark:text-blue-200"
            >
              {orderList.to_subrental.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 py-2">Nessun articolo da subnoleggiare.</p>
              ) : (
                <div className="rounded-md border border-blue-200 dark:border-blue-800 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
                        <TableHead className="text-blue-800 dark:text-blue-200">Prodotto</TableHead>
                        <TableHead className="text-right text-blue-800 dark:text-blue-200">Da Ordinare</TableHead>
                        <TableHead className="text-right text-blue-800 dark:text-blue-200">Costo Stimato</TableHead>
                        <TableHead className="text-blue-800 dark:text-blue-200 w-72">Fornitori Subnoleggio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderList.to_subrental.map((item) => (
                        <TableRow key={item.project_material_id} className="border-blue-100 dark:border-blue-900 align-top">
                          <TableCell>
                            <p className="font-medium text-slate-900 dark:text-slate-100">{item.product_name}</p>
                            {item.product_code && <p className="text-xs text-slate-500 dark:text-slate-400">{item.product_code}</p>}
                          </TableCell>
                          <TableCell className="text-right text-slate-700 dark:text-slate-300">
                            {item.to_order_qty} {item.unit}
                          </TableCell>
                          <TableCell className="text-right font-medium text-slate-900 dark:text-slate-100">
                            {item.estimated_cost > 0 ? (
                              <CurrencyDisplay value={item.estimated_cost} />
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <SubrentalCell
                              item={item}
                              allSuppliers={allSuppliers}
                              isAddPending={addMutation.isPending}
                              isUpdatePending={updateMutation.isPending}
                              isRemovePending={removeMutation.isPending}
                              onAdd={(supplierId, existingEntryId, dayRate) =>
                                addMutation.mutate({
                                  materialId: item.project_material_id,
                                  productId: item.product_id,
                                  supplierId,
                                  existingEntryId,
                                  defaultQuantity: item.to_order_qty,
                                  dayRate,
                                })
                              }
                              onUpdatePrice={(entryId, price) =>
                                updateMutation.mutate({
                                  materialId: item.project_material_id,
                                  entryId,
                                  data: { quoted_price: price },
                                })
                              }
                              onUpdateQty={(entryId, qty) =>
                                updateMutation.mutate({
                                  materialId: item.project_material_id,
                                  entryId,
                                  data: { quantity: qty },
                                })
                              }
                              onRemove={(entryId) =>
                                removeMutation.mutate({
                                  materialId: item.project_material_id,
                                  entryId,
                                })
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </OrderSection>
          </div>

          {grandTotal > 0 && (
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Costo Totale Stimato (Acquisto + Subnoleggio)
              </span>
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                <CurrencyDisplay value={grandTotal} />
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/30">
            <Info className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Esporta PDF disponibile a breve</p>
          </div>
        </>
      )}
    </div>
  );
}

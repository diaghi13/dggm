"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Plus,
  FileText,
  CheckSquare,
  X,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import { QuoteItem, ItemFormData, QuoteItemsBuilderProps } from "./types";
import {
  flattenItems,
  findItem,
  removeItem,
  calculateTotals,
  calculateItemTotal,
  extractSelectedItems,
  sanitizeOrphanedChildren,
} from "./utils";
import { useDragAndDrop } from "./use-drag-and-drop";
import { SortableItem } from "./sortable-item";
import { ItemFormDialog } from "./item-form-dialog";
import { BulkActionBar } from "./bulk-action-bar";
import { CurrencyDisplay } from "@/components/ui/currency-input";

export function QuoteItemsBuilder({
  items,
  onChange,
  priceListId,
  showUnitPrices = true,
  quoteType,
  effectiveEventDays,
  defaultVatRate = 22,
}: QuoteItemsBuilderProps) {
  const [localItems, setLocalItems] = useState<QuoteItem[]>(items);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<QuoteItem | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [dismissedTypeChangeBanner, setDismissedTypeChangeBanner] = useState(false);
  const [showTypeChangeBanner, setShowTypeChangeBanner] = useState(false);
  const isInitialMount = useRef(true);
  const isSyncing = useRef(false);
  const tempIdCounter = useRef(Date.now());
  const prevQuoteType = useRef(quoteType);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: number;
    childCount: number;
  } | null>(null);
  const [formData, setFormData] = useState<ItemFormData>({
    type: "item",
    parent_id: null,
    description: "",
    quantity: 1,
    unit_price: 0,
    discount_percentage: 0,
    hide_unit_price: false,
    //show_subtotal: true,
  });

  // Shortcut Ctrl/Cmd + Shift + A per aggiungere una nuova voce
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (!isDialogOpen) {
          e.preventDefault();
          handleAdd();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDialogOpen]);

  // Sincronizza localItems quando la prop items cambia (es. caricamento dati)
  useEffect(() => {
    isSyncing.current = true;
    setLocalItems(items);
    setTimeout(() => {
      isSyncing.current = false;
    }, 0);
  }, [items]);

  // Sincronizza localItems con il componente padre quando cambiano localmente
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    // Non chiamare onChange se stiamo sincronizzando dalla prop items
    if (isSyncing.current) {
      return;
    }
    onChange(localItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localItems]);

  // Mostra banner quando quoteType cambia e ci sono già degli articoli
  useEffect(() => {
    if (prevQuoteType.current !== quoteType) {
      prevQuoteType.current = quoteType;
      if (localItems.length > 0) {
        setShowTypeChangeBanner(true);
        setDismissedTypeChangeBanner(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteType]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: selectionMode ? { distance: Infinity } : undefined,
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const { activeId, overId, handleDragStart, handleDragOver, handleDragEnd } =
    useDragAndDrop(localItems, setLocalItems, expandedItems, setExpandedItems);

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      type: "item",
      description: "",
      quote_id: null,
      parent_id: null,
      product_id: null,
      price_list_item_id: null,
      code: null,
      notes: null,
      sort_order: localItems.length,
      unit: null,
      quantity: 1,
      unit_price: 0,
      cost_price: null,
      discount_percentage: 0,
      subtotal: 0,
      discount_amount: 0,
      total: 0,
      vat_rate: defaultVatRate,
      vat_amount: 0,
      total_with_vat: 0,
      hide_unit_price: false,
      include_image: false,
      included_media_ids: [], // Default: nessun media selezionato
      //show_subtotal: true,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (item: QuoteItem) => {
    setEditingItem(item);
    // Use all fields from QuoteItemData
    setFormData({
      ...item,
      // Ensure required fields have defaults
      vat_rate: item.vat_rate ?? 22,
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    const totals = calculateTotals(formData);

    if (editingItem) {
      const updateItem = (items: QuoteItem[]): QuoteItem[] => {
        return items.map((item) => {
          if (item.id === editingItem.id) {
            return { ...item, ...formData, ...totals };
          }
          if (item.children) {
            return {
              ...item,
              children: updateItem(item.children),
            };
          }
          return item;
        });
      };

      if (editingItem.parent_id !== formData.parent_id) {
        let newItems = removeItem(localItems, editingItem.id!);
        const updatedItem = { ...editingItem, ...formData, ...totals };

        if (formData.parent_id === null) {
          newItems = [...newItems, updatedItem];
        } else {
          newItems = newItems.map((item) => {
            if (item.id === formData.parent_id) {
              return {
                ...item,
                children: [...(item.children || []), updatedItem],
              };
            }
            return item;
          });
          setExpandedItems((prev) => new Set([...prev, formData.parent_id!]));
        }

        setLocalItems(newItems);
      } else {
        const updatedItems = updateItem(localItems);
        setLocalItems(updatedItems);
      }
    } else {
      const newItem: QuoteItem = {
        id: ++tempIdCounter.current,
        quote_id: 0,
        parent_id: formData.parent_id ?? null,
        sort_order: localItems.length,
        type: formData.type,
        description: formData.description,
        code: formData.code ?? null,
        quantity: formData.quantity ?? 1,
        unit: formData.unit ?? null,
        billing_unit: formData.billing_unit ?? "unit",
        duration: formData.duration ?? null,
        unit_price: formData.unit_price ?? 0,
        cost_price: formData.cost_price ?? null,
        margin_amount: null,
        margin_percent: null,
        product_id: formData.product_id ?? null,
        price_list_item_id: formData.price_list_item_id ?? null,
        discount_percentage: formData.discount_percentage ?? 0,
        vat_rate: formData.vat_rate ?? 0,
        notes: formData.notes ?? null,
        hide_unit_price: formData.hide_unit_price ?? false,
        include_image: formData.include_image ?? false,
        included_media_ids: formData.included_media_ids ?? [],
        expand_kit: formData.expand_kit ?? false,
        //show_subtotal: formData.show_subtotal ?? true,
        ...totals,
      };

      if (formData.parent_id === null) {
        const updatedItems = [...localItems, newItem];
        setLocalItems(updatedItems);
      } else {
        const updatedItems = localItems.map((item) => {
          if (item.id === formData.parent_id) {
            return {
              ...item,
              children: [...(item.children || []), newItem],
            };
          }
          return item;
        });
        setLocalItems(updatedItems);
        setExpandedItems((prev) => new Set([...prev, formData.parent_id!]));
      }
    }

    setIsDialogOpen(false);
    setEditingItem(null);
  };

  const handleDelete = useCallback((id: number) => {
    const itemToDelete = localItems.find((item) => item.id === id);
    const childCount = itemToDelete?.children?.length ?? 0;

    if (itemToDelete?.type === "section" && childCount > 0) {
      setDeleteConfirm({ id, childCount });
      return;
    }

    const updatedItems = removeItem(localItems, id);
    const sanitized = sanitizeOrphanedChildren(updatedItems);
    setLocalItems(sanitized);
  }, [localItems]);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteConfirm) return;

    const updatedItems = removeItem(localItems, deleteConfirm.id);
    const sanitized = sanitizeOrphanedChildren(updatedItems);
    setLocalItems(sanitized);
    setDeleteConfirm(null);
  }, [localItems, deleteConfirm]);

  const handleToggleExpand = (id: number) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleToggleSelectionMode = () => {
    setSelectionMode((prev) => !prev);
    setSelectedItems(new Set());
  };

  const handleToggleItemSelection = (id: number) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBulkMoveToSection = (sectionId: number) => {
    const selectedIds = Array.from(selectedItems);
    const { trimmedTree, extractedItems } = extractSelectedItems(
      localItems,
      selectedIds,
      sectionId,
    );

    const updatedItems = trimmedTree.map((item) => {
      if (item.id === sectionId) {
        const updatedChildren = [
          ...(item.children || []),
          ...extractedItems.map((e) => ({ ...e, parent_id: sectionId })),
        ];
        return { ...item, children: updatedChildren };
      }
      return item;
    });

    setLocalItems(updatedItems);
    setExpandedItems((prev) => new Set([...prev, sectionId]));
    setSelectionMode(false);
    setSelectedItems(new Set());
  };

  const handleBulkCreateSection = (name: string) => {
    const selectedIds = Array.from(selectedItems);
    const newSectionId = ++tempIdCounter.current;

    const { trimmedTree, extractedItems } = extractSelectedItems(
      localItems,
      selectedIds,
      newSectionId,
    );

    const newSection: QuoteItem = {
      id: newSectionId,
      quote_id: 0,
      parent_id: null,
      sort_order: trimmedTree.length,
      type: "section",
      description: name,
      code: null,
      quantity: 0,
      unit: null,
      billing_unit: "unit",
      duration: null,
      unit_price: 0,
      product_id: null,
      price_list_item_id: null,
      discount_percentage: 0,
      vat_rate: 0,
      notes: null,
      hide_unit_price: false,
      include_image: false,
      included_media_ids: [],
      expand_kit: false,
      cost_price: null,
      margin_amount: null,
      margin_percent: null,
      subtotal: 0,
      discount_amount: 0,
      total: 0,
      vat_amount: 0,
      total_with_vat: 0,
      children: extractedItems.map((e) => ({ ...e, parent_id: newSectionId })),
    };

    setLocalItems([...trimmedTree, newSection]);
    setExpandedItems((prev) => new Set([...prev, newSectionId]));
    setSelectionMode(false);
    setSelectedItems(new Set());
  };

  const totalAmount = localItems
    .filter((item) => !item.parent_id)
    .reduce((sum, item) => sum + calculateItemTotal(item), 0);

  return (
    <div className="space-y-4">
      {/* Quote type change warning banner */}
      {showTypeChangeBanner && !dismissedTypeChangeBanner && (
        <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 text-amber-900 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="flex items-center justify-between gap-2">
            <span>
              Il tipo di preventivo è cambiato. Alcuni articoli potrebbero avere prezzi non aggiornati.
            </span>
            <button
              type="button"
              onClick={() => setDismissedTypeChangeBanner(true)}
              className="shrink-0 rounded p-0.5 hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors"
              aria-label="Chiudi avviso"
            >
              <X className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Voci del Preventivo
          </h3>
          <p className="text-sm text-slate-600">
            Trascina per riordinare le voci
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Scorciatoie da tastiera</p>
                  <div className="space-y-2">
                    {[
                      { keys: ["⌘", "↵"], label: "Aggiungi voce" },
                      { keys: ["Spazio"], label: "Afferra elemento (drag)" },
                      { keys: ["↑", "↓"], label: "Sposta elemento" },
                      { keys: ["↵"], label: "Rilascia elemento" },
                      { keys: ["Esc"], label: "Annulla spostamento" },
                    ].map(({ keys, label }) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
                        <div className="flex items-center gap-1">
                          {keys.map((k) => (
                            <kbd key={k} className="px-1.5 py-0.5 text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700">{k}</kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Selezione multipla</p>
                  <ol className="space-y-1.5 list-decimal list-inside">
                    {[
                      'Clicca "Seleziona" per attivare la modalità',
                      "Spunta le voci da raggruppare",
                      'Clicca "Sposta in sezione": scegli una sezione esistente o creane una nuova',
                      "Digita il nome della sezione e premi ↵ per confermare",
                    ].map((step) => (
                      <li key={step} className="text-xs text-slate-600 dark:text-slate-400">{step}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button
            variant={selectionMode ? "default" : "outline"}
            onClick={handleToggleSelectionMode}
          >
            <CheckSquare className="mr-2 h-4 w-4" />
            {selectionMode ? "Annulla selezione" : "Seleziona"}
          </Button>
          <Button onClick={handleAdd} className="shadow-md" title="Aggiungi Voce (⌘↵)">
            <Plus className="mr-2 h-4 w-4" />
            Aggiungi Voce
          </Button>
        </div>
      </div>

      {localItems.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">
            Nessuna voce presente
          </p>
          <p className="text-sm text-slate-500 mb-4">
            Inizia aggiungendo la prima voce al preventivo
          </p>
          <Button onClick={handleAdd} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Aggiungi Prima Voce
          </Button>
        </div>
      ) : (
        <>
          {selectionMode && selectedItems.size > 0 && (
            <BulkActionBar
              selectedCount={selectedItems.size}
              sections={localItems.filter((item) => item.type === "section")}
              onMoveToSection={handleBulkMoveToSection}
              onCreateSection={handleBulkCreateSection}
              onClearSelection={() => setSelectedItems(new Set())}
              onExitSelectionMode={handleToggleSelectionMode}
            />
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={flattenItems(localItems).map((item) => item.id || 0)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {localItems
                  .filter((item) => !item.parent_id)
                  .map((item) => {
                    const activeItem = activeId
                      ? findItem(localItems, activeId)
                      : null;
                    const isRootItemDragOver =
                      overId === item.id! &&
                      item.type !== "section" &&
                      activeItem?.type !== "section" &&
                      activeItem?.parent_id !== null &&
                      item.parent_id === null;

                    const isSectionDragOver =
                      overId === item.id! &&
                      item.type === "section" &&
                      activeItem?.type !== "section" &&
                      expandedItems.has(item.id!);

                    return (
                      <SortableItem
                        key={item.id!}
                        item={item}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onToggleExpand={handleToggleExpand}
                        isExpanded={expandedItems.has(item.id!)}
                        showUnitPrices={showUnitPrices}
                        isDragOverSection={isSectionDragOver}
                        isDragOverRootItem={isRootItemDragOver}
                        selectionMode={selectionMode}
                        selectedItems={selectedItems}
                        onToggleSelect={handleToggleItemSelection}
                      />
                    );
                  })}
              </div>
            </SortableContext>
          </DndContext>

          <div className="flex justify-end pt-4 border-t border-slate-200">
            <div className="text-right">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                Totale Voci
              </p>
              <p className="text-2xl font-bold text-blue-600">
                <CurrencyDisplay value={totalAmount} />
              </p>
            </div>
          </div>
        </>
      )}

      <ItemFormDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSave}
        formData={formData}
        setFormData={setFormData}
        editingItem={editingItem}
        localItems={localItems}
        priceListId={priceListId}
        quoteType={quoteType}
        effectiveEventDays={effectiveEventDays}
      />

      <AlertDialog
        open={deleteConfirm !== null}
        onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare la sezione?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa sezione contiene{" "}
              {deleteConfirm?.childCount === 1
                ? "1 elemento"
                : `${deleteConfirm?.childCount} elementi`}
              . Eliminando la sezione verranno eliminati anche tutti gli elementi
              al suo interno.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Elimina sezione e contenuto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

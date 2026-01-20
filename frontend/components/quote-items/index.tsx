'use client';

import { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Plus, FileText } from 'lucide-react';
import { QuoteItem, ItemFormData, QuoteItemsBuilderProps } from './types';
import { flattenItems, findItem, removeItem, calculateTotals, calculateItemTotal } from './utils';
import { useDragAndDrop } from './use-drag-and-drop';
import { SortableItem } from './sortable-item';
import { ItemFormDialog } from './item-form-dialog';

export function QuoteItemsBuilder({ items, onChange, showUnitPrices = true }: QuoteItemsBuilderProps) {
  const [localItems, setLocalItems] = useState<QuoteItem[]>(items);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<QuoteItem | null>(null);
  const isInitialMount = useRef(true);
  const tempIdCounter = useRef(Date.now());
  const [formData, setFormData] = useState<ItemFormData>({
    type: 'item',
    parent_id: null,
    description: '',
    quantity: 1,
    unit_price: 0,
    discount_percentage: 0,
    hide_unit_price: false,
  });

  // Sincronizza localItems con il componente padre
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    onChange(localItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localItems]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const {
    activeId,
    overId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = useDragAndDrop(localItems, setLocalItems, expandedItems, setExpandedItems);

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      type: 'item',
      parent_id: null,
      material_id: null,
      description: '',
      quantity: 1,
      unit_price: 0,
      discount_percentage: 0,
      hide_unit_price: false,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (item: QuoteItem) => {
    setEditingItem(item);
    setFormData({
      type: item.type,
      parent_id: item.parent_id ?? null,
      material_id: item.material_id ?? null,
      code: item.code ?? undefined,
      description: item.description,
      notes: item.notes ?? undefined,
      unit: item.unit ?? undefined,
      quantity: item.quantity ?? 0,
      unit_price: item.unit_price ?? 0,
      discount_percentage: item.discount_percentage,
      hide_unit_price: item.hide_unit_price ?? false,
      show_subtotal: item.show_subtotal ?? false,
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
        let newItems = removeItem(localItems, editingItem.id);
        const updatedItem = { ...editingItem, ...formData, ...totals };

        if (formData.parent_id === null) {
          newItems = [...newItems, updatedItem];
        } else {
          newItems = newItems.map(item => {
            if (item.id === formData.parent_id) {
              return {
                ...item,
                children: [...(item.children || []), updatedItem],
              };
            }
            return item;
          });
          setExpandedItems(prev => new Set([...prev, formData.parent_id!]));
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
        ...formData,
        ...totals,
      };

      if (formData.parent_id === null) {
        const updatedItems = [...localItems, newItem];
        setLocalItems(updatedItems);
      } else {
        const updatedItems = localItems.map(item => {
          if (item.id === formData.parent_id) {
            return {
              ...item,
              children: [...(item.children || []), newItem],
            };
          }
          return item;
        });
        setLocalItems(updatedItems);
        setExpandedItems(prev => new Set([...prev, formData.parent_id!]));
      }
    }

    setIsDialogOpen(false);
    setEditingItem(null);
  };

  const handleDelete = (id: number) => {
    const updatedItems = removeItem(localItems, id);
    setLocalItems(updatedItems);
  };

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

  const totalAmount = localItems
    .filter((item) => !item.parent_id)
    .reduce((sum, item) => sum + calculateItemTotal(item), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Voci del Preventivo</h3>
          <p className="text-sm text-slate-600">Trascina per riordinare le voci</p>
        </div>
        <Button onClick={handleAdd} className="shadow-md">
          <Plus className="mr-2 h-4 w-4" />
          Aggiungi Voce
        </Button>
      </div>

      {localItems.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">Nessuna voce presente</p>
          <p className="text-sm text-slate-500 mb-4">Inizia aggiungendo la prima voce al preventivo</p>
          <Button onClick={handleAdd} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Aggiungi Prima Voce
          </Button>
        </div>
      ) : (
        <>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={flattenItems(localItems).map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {localItems
                  .filter((item) => !item.parent_id)
                  .map((item) => {
                    const activeItem = activeId ? findItem(localItems, activeId) : null;
                    const isRootItemDragOver =
                      overId === item.id &&
                      item.type !== 'section' &&
                      activeItem?.type !== 'section' &&
                      activeItem?.parent_id !== null &&
                      item.parent_id === null;

                    const isSectionDragOver =
                      overId === item.id &&
                      item.type === 'section' &&
                      activeItem?.type !== 'section' &&
                      expandedItems.has(item.id) &&
                      item.children && item.children.length > 0;

                    return (
                      <SortableItem
                        key={item.id}
                        item={item}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onToggleExpand={handleToggleExpand}
                        isExpanded={expandedItems.has(item.id)}
                        showUnitPrices={showUnitPrices}
                        isDragOverSection={isSectionDragOver}
                        isDragOverRootItem={isRootItemDragOver}
                      />
                    );
                  })}
              </div>
            </SortableContext>
          </DndContext>

          <div className="flex justify-end pt-4 border-t border-slate-200">
            <div className="text-right">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Totale Voci</p>
              <p className="text-2xl font-bold text-blue-600">
                € {totalAmount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
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
      />
    </div>
  );
}


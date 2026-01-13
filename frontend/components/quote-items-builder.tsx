'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  GripVertical,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  Folder,
  FileText,
  Eye,
  EyeOff,
} from 'lucide-react';
import { MaterialAutocomplete } from '@/components/material-autocomplete';
interface QuoteItem {
  id: number;
  quote_id: number;
  parent_id: number | null;
  material_id?: number | null;
  type: 'section' | 'item' | 'labor' | 'material';
  code?: string | null;
  description: string;
  notes?: string | null;
  sort_order: number;
  unit?: string | null;
  quantity: number | null;
  unit_price: number | null;
  discount_percentage: number;
  hide_unit_price?: boolean;
  subtotal: number;
  discount_amount: number;
  total: number;
  children?: QuoteItem[];
  material?: {
    id: number;
    code: string;
    name: string;
    unit: string;
    standard_cost: number;
    category: string;
  };
}

interface QuoteItemsBuilderProps {
  items: QuoteItem[];
  onChange: (items: QuoteItem[]) => void;
  showUnitPrices?: boolean;
}

interface ItemFormData {
  type: 'section' | 'item' | 'labor' | 'material';
  material_id?: number | null;
  code?: string;
  description: string;
  notes?: string;
  unit?: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  hide_unit_price: boolean;
}

function SortableItem({
  item,
  onEdit,
  onDelete,
  onToggleExpand,
  isExpanded,
  showUnitPrices,
  level = 0,
}: {
  item: QuoteItem;
  onEdit: (item: QuoteItem) => void;
  onDelete: (id: number) => void;
  onToggleExpand: (id: number) => void;
  isExpanded: boolean;
  showUnitPrices?: boolean;
  level?: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isSection = item.type === 'section';
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div ref={setNodeRef} style={style} className={`${level > 0 ? 'ml-8' : ''}`}>
      <div
        className={`
          group flex items-start gap-3 p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white
          hover:border-blue-300 hover:shadow-md transition-all
          ${isSection ? 'bg-slate-50 border-slate-300' : ''}
        `}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing mt-1 text-slate-400 hover:text-slate-600"
        >
          <GripVertical className="w-5 h-5" />
        </div>

        {/* Expand/Collapse for sections */}
        {isSection && (
          <button
            onClick={() => onToggleExpand(item.id)}
            className="mt-1 text-slate-400 hover:text-slate-600"
          >
            {isExpanded ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
        )}

        {/* Icon */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mt-0.5 ${
          isSection ? 'bg-blue-100' : 'bg-green-100'
        }`}>
          {isSection ? (
            <Folder className="w-5 h-5 text-blue-600" />
          ) : (
            <FileText className="w-5 h-5 text-green-600" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {item.code && (
                  <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {item.code}
                  </span>
                )}
                <Badge variant={isSection ? 'default' : 'outline'} className="text-xs">
                  {isSection ? 'Sezione' : 'Voce'}
                </Badge>
                {item.hide_unit_price && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <EyeOff className="w-3 h-3" />
                    Prezzo nascosto
                  </Badge>
                )}
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{item.description}</h4>
              {item.notes && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{item.notes}</p>
              )}
              {!isSection && (
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span>
                    Q.tà: <span className="font-medium text-slate-900">{item.quantity}</span>
                  </span>
                  {showUnitPrices && !item.hide_unit_price && (
                    <span>
                      Prezzo: <span className="font-medium text-slate-900">€ {parseFloat(String(item.unit_price)).toFixed(2)}</span>
                    </span>
                  )}
                  {item.unit && (
                    <span>
                      Unità: <span className="font-medium text-slate-900">{item.unit}</span>
                    </span>
                  )}
                  {item.discount_percentage > 0 && (
                    <span className="text-orange-600">
                      Sconto: {item.discount_percentage}%
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Total & Actions */}
            <div className="flex items-center gap-3">
              {!isSection && (
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">
                    € {item.total.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </p>
                  {item.discount_percentage > 0 && (
                    <p className="text-xs text-slate-500 line-through">
                      € {item.subtotal.toFixed(2)}
                    </p>
                  )}
                </div>
              )}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                  onClick={() => onEdit(item)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                  onClick={() => onDelete(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Children */}
      {isSection && isExpanded && hasChildren && (
        <div className="mt-2 space-y-2">
          {item.children!.map((child) => (
            <SortableItem
              key={child.id}
              item={child}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleExpand={onToggleExpand}
              isExpanded={false}
              showUnitPrices={showUnitPrices}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function QuoteItemsBuilder({ items, onChange, showUnitPrices = true }: QuoteItemsBuilderProps) {
  const [localItems, setLocalItems] = useState<QuoteItem[]>(items);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<QuoteItem | null>(null);
  const [formData, setFormData] = useState<ItemFormData>({
    type: 'item',
    description: '',
    quantity: 1,
    unit_price: 0,
    discount_percentage: 0,
    hide_unit_price: false,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const calculateTotals = (item: ItemFormData): Pick<QuoteItem, 'subtotal' | 'discount_amount' | 'total'> => {
    if (item.type === 'section') {
      return { subtotal: 0, discount_amount: 0, total: 0 };
    }
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unit_price) || 0;
    const discountPercentage = Number(item.discount_percentage) || 0;

    const subtotal = quantity * unitPrice;
    const discount_amount = (subtotal * discountPercentage) / 100;
    const total = subtotal - discount_amount;
    return { subtotal, discount_amount, total };
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocalItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
          ...item,
          sort_order: index,
        }));
        onChange(newItems);
        return newItems;
      });
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      type: 'item',
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
      material_id: item.material_id ?? null,
      code: item.code ?? undefined,
      description: item.description,
      notes: item.notes ?? undefined,
      unit: item.unit ?? undefined,
      quantity: item.quantity ?? 0,
      unit_price: item.unit_price ?? 0,
      discount_percentage: item.discount_percentage,
      hide_unit_price: item.hide_unit_price ?? false,
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    const totals = calculateTotals(formData);

    if (editingItem) {
      // Update existing item
      const updatedItems = localItems.map((item) =>
        item.id === editingItem.id
          ? { ...item, ...formData, ...totals }
          : item
      );
      setLocalItems(updatedItems);
      onChange(updatedItems);
    } else {
      // Add new item
      const newItem: QuoteItem = {
        id: Date.now(), // Temporary ID
        quote_id: 0, // Will be set by backend
        parent_id: null,
        sort_order: localItems.length,
        ...formData,
        ...totals,
      };
      const updatedItems = [...localItems, newItem];
      setLocalItems(updatedItems);
      onChange(updatedItems);
    }

    setIsDialogOpen(false);
    setEditingItem(null);
  };

  const handleDelete = (id: number) => {
    const updatedItems = localItems.filter((item) => item.id !== id);
    setLocalItems(updatedItems);
    onChange(updatedItems);
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
    .reduce((sum, item) => sum + Number(item.total || 0), 0);

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
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localItems.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {localItems
                  .filter((item) => !item.parent_id)
                  .map((item) => (
                    <SortableItem
                      key={item.id}
                      item={item}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggleExpand={handleToggleExpand}
                      isExpanded={expandedItems.has(item.id)}
                      showUnitPrices={showUnitPrices}
                    />
                  ))}
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

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900">
              {editingItem ? 'Modifica Voce' : 'Nuova Voce'}
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              {editingItem ? 'Modifica i dettagli della voce' : 'Inserisci i dettagli della nuova voce'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Type Selection */}
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'section' | 'item') =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger className="h-11 border-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="item">Voce</SelectItem>
                  <SelectItem value="section">Sezione</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Material Selection (only for items) */}
            {formData.type === 'item' && (
              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">
                  Materiale dal Magazzino (opzionale)
                </Label>
                <MaterialAutocomplete
                  value={formData.material_id}
                  onSelect={(material) => {
                    if (material) {
                      setFormData({
                        ...formData,
                        material_id: material.id,
                        code: material.code,
                        description: material.name,
                        unit: material.unit,
                        unit_price: Number(material.standard_cost || 0),
                      });
                    } else {
                      setFormData({
                        ...formData,
                        material_id: null,
                      });
                    }
                  }}
                  placeholder="Cerca nel catalogo materiali..."
                />
                <p className="text-xs text-slate-500">
                  Seleziona un materiale dal catalogo per pre-compilare i campi
                </p>
              </div>
            )}

            {/* Code */}
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Codice (opzionale)</Label>
              <Input
                value={formData.code ?? ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Es: ART-001"
                className="h-11 border-slate-300 focus:border-blue-500"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Descrizione *</Label>
              <Input
                value={formData.description ?? ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrizione della voce"
                className="h-11 border-slate-300 focus:border-blue-500"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Note (opzionale)</Label>
              <Textarea
                value={formData.notes ?? ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Note aggiuntive..."
                rows={3}
                className="border-slate-300 focus:border-blue-500"
              />
            </div>

            {formData.type === 'item' && (
              <>
                {/* Quantity & Unit */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">Quantità *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.quantity ?? 0}
                      onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                      className="h-11 border-slate-300 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">Unità di Misura</Label>
                    <Input
                      value={formData.unit ?? ''}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="Es: pz, m, kg"
                      className="h-11 border-slate-300 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Unit Price & Discount */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">Prezzo Unitario *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.unit_price ?? 0}
                      onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                      className="h-11 border-slate-300 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">Sconto %</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.discount_percentage ?? 0}
                      onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) || 0 })}
                      className="h-11 border-slate-300 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Hide Unit Price */}
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <input
                    type="checkbox"
                    id="hide-price"
                    checked={formData.hide_unit_price}
                    onChange={(e) => setFormData({ ...formData, hide_unit_price: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="hide-price" className="text-sm text-slate-700 cursor-pointer">
                    Nascondi prezzo unitario nel preventivo
                  </Label>
                </div>

                {/* Calculated Total */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700">Totale Calcolato:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      € {calculateTotals(formData).total.toFixed(2)}
                    </span>
                  </div>
                  {formData.discount_percentage > 0 && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Subtotale: € {calculateTotals(formData).subtotal.toFixed(2)} -{' '}
                      Sconto: € {calculateTotals(formData).discount_amount.toFixed(2)}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-300">
              Annulla
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.description}
              className="shadow-md"
            >
              {editingItem ? 'Salva Modifiche' : 'Aggiungi Voce'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

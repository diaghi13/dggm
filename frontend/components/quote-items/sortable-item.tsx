import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import {
  GripVertical,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  Folder,
  FileText,
  EyeOff,
} from 'lucide-react';
import { QuoteItem } from './types';
import { calculateSectionTotal } from './utils';

interface SortableItemProps {
  item: QuoteItem;
  onEdit: (item: QuoteItem) => void;
  onDelete: (id: number) => void;
  onToggleExpand: (id: number) => void;
  isExpanded: boolean;
  showUnitPrices?: boolean;
  level?: number;
  isDragOverSection?: boolean;
  isDragOverRootItem?: boolean;
}

export function SortableItem({
  item,
  onEdit,
  onDelete,
  onToggleExpand,
  isExpanded,
  showUnitPrices,
  level = 0,
  isDragOverSection = false,
  isDragOverRootItem = false,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: {
      type: item.type,
      item: item,
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isSection = item.type === 'section';
  const hasChildren = item.children && item.children.length > 0;
  const sectionTotal = isSection && item.show_subtotal ? calculateSectionTotal(item) : null;

  return (
    <div ref={setNodeRef} style={style} className={`${level > 0 ? 'ml-8' : ''}`}>
      <div
        className={`
          group flex items-start gap-3 p-4 rounded-lg border bg-white
          hover:border-blue-300 hover:shadow-md
          ${isDragging ? '' : 'transition-all'}
          ${isSection ? 'bg-slate-50 border-slate-300' : 'border-slate-200 dark:border-slate-800'}
          ${isDragOverSection && isSection ? 'border-blue-500 border-2 border-dashed bg-blue-50/50 shadow-lg' : ''}
          ${isDragOverRootItem && !isSection ? 'border-green-500 border-2 border-dashed bg-green-50/50 shadow-lg' : ''}
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
                {isSection && item.show_subtotal && (
                  <Badge variant="secondary" className="text-xs">
                    Subtotale parziale
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
              {isSection && sectionTotal !== null && (
                <div className="text-right">
                  <p className="text-sm text-slate-600 mb-0.5">Subtotale:</p>
                  <p className="text-lg font-bold text-blue-600">
                    € {sectionTotal.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </p>
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
          <SortableContext
            items={item.children!.map((child) => child.id)}
            strategy={verticalListSortingStrategy}
          >
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
          </SortableContext>
        </div>
      )}
    </div>
  );
}


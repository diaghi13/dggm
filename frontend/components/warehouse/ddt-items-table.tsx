'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';

interface DdtItemsTableProps {
  items: App.Data.DdtItemData[];
  editable?: boolean;
  onEdit?: (item: App.Data.DdtItemData) => void;
  onDelete?: (itemId: number) => void;
}

export function DdtItemsTable({
  items,
  editable = false,
  onEdit,
  onDelete
}: DdtItemsTableProps) {
  const calculateTotal = (item: App.Data.DdtItemData) => {
    const quantity = Number(item.quantity || 0);
    const unitCost = Number(item.unit_cost || 0);
    return (quantity * unitCost).toFixed(2);
  };

  const grandTotal = items.reduce((sum, item) => {
    return sum + (Number(calculateTotal(item)) || 0);
  }, 0);

  if (items.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-slate-50 dark:bg-slate-900">
        <p className="text-slate-600 dark:text-slate-400">
          Nessun articolo presente nel DDT
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Codice</TableHead>
              <TableHead>Prodotto</TableHead>
              <TableHead className="text-right">Quantità</TableHead>
              <TableHead>Unità</TableHead>
              <TableHead className="text-right">Costo Unit.</TableHead>
              <TableHead className="text-right">Totale</TableHead>
              {editable && <TableHead className="text-right">Azioni</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id || Math.random()}>
                <TableCell className="font-mono text-sm">
                  {item.product?.code || '-'}
                </TableCell>
                <TableCell className="font-medium">
                  <div>
                    <div>{item.product?.name || 'N/A'}</div>
                    {item.notes && (
                      <div className="text-xs text-slate-500 mt-1">
                        {item.notes}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {Number(item.quantity).toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {item.unit}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  € {Number(item.unit_cost || 0).toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  € {calculateTotal(item)}
                </TableCell>
                {editable && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(item)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && item.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(item.id!)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Totale */}
      <div className="flex justify-end">
        <div className="bg-slate-50 dark:bg-slate-900 border rounded-lg px-6 py-4 min-w-[300px]">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Totale DDT:
            </span>
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              € {grandTotal.toFixed(2)}
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {items.length} {items.length === 1 ? 'articolo' : 'articoli'}
          </div>
        </div>
      </div>
    </div>
  );
}

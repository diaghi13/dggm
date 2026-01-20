'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, MapPin, Package, Trash2 } from 'lucide-react';
import {
  AvatarTextCell,
  MoneyCell,
  StatusBadgeCell,
  TextCell
} from '@/components/table-cells';
import { Can } from '@/components/features/auth/can';

interface Material {
  id: number;
  code: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  standard_cost: number;
  barcode?: string;
  qr_code?: string;
  default_supplier_id?: number;
  reorder_level: number;
  reorder_quantity: number;
  lead_time_days: number;
  location?: string;
  is_active: boolean;
  total_stock?: number;
  total_reserved?: number;
}

const categoryColors: Record<string, string> = {
  construction: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  electrical: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
  plumbing: 'bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
  tools: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  equipment: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  general: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
};

const categoryLabels: Record<string, string> = {
  construction: 'Edilizia',
  electrical: 'Elettrico',
  plumbing: 'Idraulica',
  tools: 'Attrezzi',
  equipment: 'Attrezzatura',
  general: 'Generale',
};

export const createMaterialsColumns = (
  onEdit: (material: Material) => void,
  onDelete: (material: Material) => void
): ColumnDef<Material>[] => [
  {
    accessorKey: 'code',
    header: 'Codice',
    size: 150,
    enableHiding: false,
    cell: ({ row }) => (
      <AvatarTextCell
        icon={Package}
        primaryText={row.original.code}
      />
    ),
  },
  {
    accessorKey: 'name',
    header: 'Nome',
    size: 250,
    cell: ({ row }) => {
      const material = row.original;
      return (
        <div>
          <TextCell text={material.name} bold />
          {material.location && (
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 text-slate-400 dark:text-slate-500" />
              <span className="text-xs text-slate-500 dark:text-slate-400">{material.location}</span>
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'category',
    header: 'Categoria',
    size: 150,
    cell: ({ row }) => (
      <StatusBadgeCell
        status={row.original.category}
        statusColors={categoryColors}
        statusLabels={categoryLabels}
      />
    ),
  },
  {
    accessorKey: 'standard_cost',
    header: () => <div className="text-right">Costo Standard</div>,
    size: 140,
    cell: ({ row }) => (
      <MoneyCell amount={row.original.standard_cost} />
    ),
  },
  {
    accessorKey: 'unit',
    header: 'Unità',
    size: 100,
    cell: ({ row }) => (
      <TextCell text={row.original.unit} />
    ),
  },
  {
    accessorKey: 'total_stock',
    header: () => <div className="text-right">Stock Totale</div>,
    size: 130,
    cell: ({ row }) => {
      const stock = row.original.total_stock;
      return stock !== undefined ? (
        <div className="text-right">
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {Number(stock || 0).toFixed(2)}
          </span>
        </div>
      ) : (
        <div className="text-right">
          <span className="text-slate-400 dark:text-slate-600">-</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'is_active',
    header: 'Stato',
    size: 100,
    cell: ({ row }) => (
      <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
        {row.original.is_active ? 'Attivo' : 'Inattivo'}
      </Badge>
    ),
  },
  {
    id: 'actions',
    header: () => <div className="text-right">Azioni</div>,
    size: 100,
    enableHiding: false,
    enableSorting: false,
    cell: ({ row }) => {
      const material = row.original;
      return (
        <div className="flex justify-end gap-1">
          <Can permission="materials.edit">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(material);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </Can>
          <Can permission="materials.delete">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(material);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </Can>
        </div>
      );
    },
  },
];


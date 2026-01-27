'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, MapPin, Package, Trash2 } from 'lucide-react';
import {
  AvatarTextCell,
  MoneyCell,
  TextCell
} from '@/components/table-cells';
import { Can } from '@/components/features/auth/can';
import type { Product } from '@/lib/types';

export const createProductsColumns = (
  onEdit: (product: Product) => void,
  onDelete: (product: Product) => void
): ColumnDef<Product>[] => [
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
      const product = row.original;
      return (
        <div>
          <TextCell text={product.name} bold />
          {product.location && (
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 text-slate-400 dark:text-slate-500" />
              <span className="text-xs text-slate-500 dark:text-slate-400">{product.location}</span>
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
    cell: ({ row }) => {
      const category = row.original.category;
      if (!category) return <span className="text-slate-400">N/A</span>;

      return (
        <Badge
          variant="outline"
          style={{
            backgroundColor: category.color ? `${category.color}20` : undefined,
            borderColor: category.color || undefined,
            color: category.color || undefined,
          }}
        >
          {category.icon && <span className="mr-1">{category.icon}</span>}
          {category.name}
        </Badge>
      );
    },
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
      const stock = row.original.calculated_sale_price;
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
      const product = row.original;
      return (
        <div className="flex justify-end gap-1">
          <Can permission="materials.edit">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(product);
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
                onDelete(product);
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


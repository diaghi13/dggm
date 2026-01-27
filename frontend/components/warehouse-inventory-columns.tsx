'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { MoneyCell, TextCell } from '@/components/table-cells';
import Link from 'next/link';

export const createWarehouseInventoryColumns = (): ColumnDef<App.Data.InventoryData>[] => [
  {
    accessorKey: 'product.code',
    header: 'Codice',
    size: 120,
    enableHiding: false,
    cell: ({ row }) => (
      <Link
        href={`/products/${row.original.product?.id}`}
        className="font-medium hover:underline text-blue-600 dark:text-blue-400"
      >
        {row.original.product?.code}
      </Link>
    ),
  },
  {
    accessorKey: 'product.name',
    header: 'Prodotto',
    size: 250,
    cell: ({ row }) => {
      const item = row.original;
      const category = item.product?.category;

      return (
        <div>
          <TextCell text={item.product?.name || ''} bold />
          {category && typeof category === 'object' && (
            <Badge
              variant="outline"
              className="mt-1"
              style={{
                backgroundColor: category.color ? `${category.color}20` : undefined,
                borderColor: category.color || undefined,
                color: category.color || undefined,
              }}
            >
              {category.icon && <span className="mr-1">{category.icon}</span>}
              {category.name}
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'quantity_available',
    header: () => <div className="text-right">Disponibile</div>,
    size: 130,
    cell: ({ row }) => (
      <div className="text-right font-medium text-slate-900 dark:text-slate-100">
        {Number(row.original.quantity_available).toFixed(2)} {row.original.product?.unit}
      </div>
    ),
  },
  {
    accessorKey: 'quantity_reserved',
    header: () => <div className="text-right">Riservato</div>,
    size: 120,
    cell: ({ row }) => (
      <div className="text-right text-slate-700 dark:text-slate-300">
        {Number(row.original.quantity_reserved).toFixed(2)} {row.original.product?.unit}
      </div>
    ),
  },
  {
    accessorKey: 'quantity_in_transit',
    header: () => <div className="text-right">In Transito</div>,
    size: 120,
    cell: ({ row }) => (
      <div className="text-right text-slate-700 dark:text-slate-300">
        {Number(row.original.quantity_in_transit).toFixed(2)} {row.original.product?.unit}
      </div>
    ),
  },
  {
    accessorKey: 'minimum_stock',
    header: () => <div className="text-right">Scorta Min.</div>,
    size: 120,
    cell: ({ row }) => (
      <div className="text-right text-slate-700 dark:text-slate-300">
        {Number(row.original.minimum_stock).toFixed(2)} {row.original.product?.unit}
      </div>
    ),
  },
  {
    id: 'value',
    header: () => <div className="text-right">Valore</div>,
    size: 130,
    cell: ({ row }) => {
      const value = Number(row.original.quantity_available) * Number(row.original.product?.standard_cost || 0);
      return <MoneyCell amount={value} bold />;
    },
  },
  {
    accessorKey: 'is_low_stock',
    header: 'Stato',
    size: 100,
    cell: ({ row }) => (
      row.original.is_low_stock ? (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Basso
        </Badge>
      ) : (
        <Badge variant="default">OK</Badge>
      )
    ),
  },
];


'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { MoneyCell, StatusBadgeCell, TextCell } from '@/components/table-cells';
import Link from 'next/link';

interface WarehouseInventoryItem {
  id: number;
  material_id: number;
  warehouse_id: number;
  quantity_available: number;
  quantity_reserved: number;
  quantity_in_transit: number;
  minimum_stock: number;
  maximum_stock: number;
  reorder_point: number;
  reorder_quantity: number;
  location?: string;
  is_low_stock: boolean;
  last_count_date?: string;
  last_movement_date?: string;
  material: {
    id: number;
    code: string;
    name: string;
    category: string;
    unit: string;
    standard_cost: number;
  };
}

const categoryLabels: Record<string, string> = {
  construction: 'Edilizia',
  electrical: 'Elettrico',
  plumbing: 'Idraulica',
  tools: 'Attrezzi',
  equipment: 'Attrezzatura',
  general: 'Generale',
};

const categoryColors: Record<string, string> = {
  construction: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  electrical: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
  plumbing: 'bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
  tools: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  equipment: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  general: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
};

export const createWarehouseInventoryColumns = (): ColumnDef<WarehouseInventoryItem>[] => [
  {
    accessorKey: 'material.code',
    header: 'Codice',
    size: 120,
    enableHiding: false,
    cell: ({ row }) => (
      <Link
        href={`/frontend/app/(dashboard)/materials/${row.original.material.id}`}
        className="font-medium hover:underline text-blue-600 dark:text-blue-400"
      >
        {row.original.material.code}
      </Link>
    ),
  },
  {
    accessorKey: 'material.name',
    header: 'Materiale',
    size: 250,
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div>
          <TextCell text={item.material.name} bold />
          <StatusBadgeCell
            status={item.material.category}
            statusColors={categoryColors}
            statusLabels={categoryLabels}
          />
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
        {Number(row.original.quantity_available).toFixed(2)} {row.original.material.unit}
      </div>
    ),
  },
  {
    accessorKey: 'quantity_reserved',
    header: () => <div className="text-right">Riservato</div>,
    size: 120,
    cell: ({ row }) => (
      <div className="text-right text-slate-700 dark:text-slate-300">
        {Number(row.original.quantity_reserved).toFixed(2)} {row.original.material.unit}
      </div>
    ),
  },
  {
    accessorKey: 'quantity_in_transit',
    header: () => <div className="text-right">In Transito</div>,
    size: 120,
    cell: ({ row }) => (
      <div className="text-right text-slate-700 dark:text-slate-300">
        {Number(row.original.quantity_in_transit).toFixed(2)} {row.original.material.unit}
      </div>
    ),
  },
  {
    accessorKey: 'minimum_stock',
    header: () => <div className="text-right">Scorta Min.</div>,
    size: 120,
    cell: ({ row }) => (
      <div className="text-right text-slate-700 dark:text-slate-300">
        {Number(row.original.minimum_stock).toFixed(2)} {row.original.material.unit}
      </div>
    ),
  },
  {
    id: 'value',
    header: () => <div className="text-right">Valore</div>,
    size: 130,
    cell: ({ row }) => {
      const value = Number(row.original.quantity_available) * Number(row.original.material.standard_cost);
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


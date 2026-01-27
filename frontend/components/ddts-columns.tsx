'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { FileText, Eye, Trash2 } from 'lucide-react';
import { Ddt } from '@/lib/types';
import { AvatarTextCell, TextCell } from '@/components/table-cells';
import { DdtTypeBadge } from '@/components/warehouse/ddt-type-badge';
import { DdtStatusBadge } from '@/components/warehouse/ddt-status-badge';
import Link from 'next/link';

export const createDdtsColumns = (
  onView: (ddt: Ddt) => void,
  onDelete: (ddt: Ddt) => void
): ColumnDef<Ddt>[] => [
  {
    accessorKey: 'code',
    header: 'Codice',
    size: 150,
    enableHiding: false,
    cell: ({ row }) => (
      <AvatarTextCell
        icon={FileText}
        primaryText={row.original.code}
        secondaryText={row.original.ddt_number}
      />
    ),
  },
  {
    accessorKey: 'type',
    header: 'Tipo',
    size: 150,
    cell: ({ row }) => (
      <DdtTypeBadge type={row.original.type as App.Enums.DdtType} />
    ),
  },
  {
    accessorKey: 'status',
    header: 'Stato',
    size: 130,
    cell: ({ row }) => (
      <DdtStatusBadge status={row.original.status as App.Enums.DdtStatus} />
    ),
  },
  {
    accessorKey: 'ddt_date',
    header: 'Data DDT',
    size: 120,
    cell: ({ row }) => (
      <TextCell
        text={new Date(row.original.ddt_date).toLocaleDateString('it-IT')}
      />
    ),
  },
  {
    id: 'reference',
    header: 'Riferimento',
    size: 200,
    cell: ({ row }) => {
      const ddt = row.original;

      if (ddt.supplier) {
        return <TextCell text={ddt.supplier.name} />;
      }

      if (ddt.customer) {
        return <TextCell text={ddt.customer.name} />;
      }

      if (ddt.site) {
        return (
          <Link
            href={`/frontend/app/(dashboard)/sites/${ddt.site.id}`}
            className="hover:underline text-blue-600 dark:text-blue-400 text-sm"
          >
            {ddt.site.code} - {ddt.site.name}
          </Link>
        );
      }

      return <span className="text-slate-400 dark:text-slate-600">-</span>;
    },
  },
  {
    accessorKey: 'from_warehouse.name',
    header: 'Da Magazzino',
    size: 150,
    cell: ({ row }) => {
      const warehouse = row.original.from_warehouse;
      return warehouse ? (
        <Link
          href={`/frontend/app/(dashboard)/warehouses/${warehouse.id}`}
          className="hover:underline text-blue-600 dark:text-blue-400 text-sm"
        >
          {warehouse.name}
        </Link>
      ) : (
        <span className="text-slate-400 dark:text-slate-600">-</span>
      );
    },
  },
  {
    accessorKey: 'to_warehouse.name',
    header: 'A Magazzino',
    size: 150,
    cell: ({ row }) => {
      const warehouse = row.original.to_warehouse;
      return warehouse ? (
        <Link
          href={`/frontend/app/(dashboard)/warehouses/${warehouse.id}`}
          className="hover:underline text-blue-600 dark:text-blue-400 text-sm"
        >
          {warehouse.name}
        </Link>
      ) : (
        <span className="text-slate-400 dark:text-slate-600">-</span>
      );
    },
  },
  {
    accessorKey: 'total_items',
    header: () => <div className="text-right">Articoli</div>,
    size: 100,
    cell: ({ row }) => (
      <div className="text-right font-medium text-slate-900 dark:text-slate-100">
        {row.original.total_items}
      </div>
    ),
  },
  {
    accessorKey: 'total_quantity',
    header: () => <div className="text-right">Quantità</div>,
    size: 100,
    cell: ({ row }) => (
      <div className="text-right font-medium text-slate-900 dark:text-slate-100">
        {Number(row.original.total_quantity).toFixed(2)}
      </div>
    ),
  },
  {
    id: 'actions',
    header: () => <div className="text-right">Azioni</div>,
    size: 100,
    enableHiding: false,
    enableSorting: false,
    cell: ({ row }) => {
      const ddt = row.original;
      return (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={(e) => {
              e.stopPropagation();
              onView(ddt);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {ddt.status === 'draft' && (
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(ddt);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      );
    },
  },
];


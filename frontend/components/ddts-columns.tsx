'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { FileText, Eye, Trash2 } from 'lucide-react';
import { Ddt } from '@/lib/types';
import { AvatarTextCell, StatusBadgeCell, TextCell } from '@/components/table-cells';
import Link from 'next/link';

const ddtTypeLabels: Record<string, string> = {
  incoming: 'In Entrata',
  outgoing: 'In Uscita',
  internal: 'Interno',
  rental_out: 'Noleggio Out',
  rental_return: 'Reso Noleggio',
  return_from_customer: 'Reso da Cliente',
  return_to_supplier: 'Reso a Fornitore',
};

const ddtTypeColors: Record<string, string> = {
  incoming: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700',
  outgoing: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700',
  internal: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700',
  rental_out: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700',
  rental_return: 'bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700',
  return_from_customer: 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700',
  return_to_supplier: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700',
};

const ddtStatusLabels: Record<string, string> = {
  draft: 'Bozza',
  issued: 'Emesso',
  in_transit: 'In Transito',
  delivered: 'Consegnato',
  cancelled: 'Annullato',
};

const ddtStatusColors: Record<string, string> = {
  draft: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
  issued: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700',
  in_transit: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700',
  delivered: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700',
  cancelled: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700',
};

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
      <StatusBadgeCell
        status={row.original.type}
        statusColors={ddtTypeColors}
        statusLabels={ddtTypeLabels}
      />
    ),
  },
  {
    accessorKey: 'status',
    header: 'Stato',
    size: 130,
    cell: ({ row }) => (
      <StatusBadgeCell
        status={row.original.status}
        statusColors={ddtStatusColors}
        statusLabels={ddtStatusLabels}
      />
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
            href={`/dashboard/sites/${ddt.site.id}`}
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
          href={`/dashboard/warehouses/${warehouse.id}`}
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
          href={`/dashboard/warehouses/${warehouse.id}`}
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


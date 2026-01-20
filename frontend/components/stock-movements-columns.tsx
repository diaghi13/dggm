'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Settings2, Building2, Factory, Warehouse, LucideIcon } from 'lucide-react';
import { StockMovement } from '@/lib/types';
import { MoneyCell, TextCell } from '@/components/table-cells';
import Link from 'next/link';

const movementTypeLabels: Record<string, string> = {
  INTAKE: 'Carico',
  OUTPUT: 'Scarico',
  TRANSFER: 'Trasferimento',
  ADJUSTMENT: 'Rettifica',
  SITE_ALLOCATION: 'Allocazione Cantiere',
  SITE_RETURN: 'Rientro Cantiere',
  RENTAL_OUT: 'Noleggio Uscita',
  RENTAL_RETURN: 'Noleggio Rientro',
};

const movementTypeColors: Record<string, string> = {
  INTAKE: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700',
  OUTPUT: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700',
  TRANSFER: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700',
  ADJUSTMENT: 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700',
  SITE_ALLOCATION: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700',
  SITE_RETURN: 'bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700',
  RENTAL_OUT: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
  RENTAL_RETURN: 'bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700',
};

const movementTypeIcons: Record<string, LucideIcon> = {
  INTAKE: ArrowDownLeft,
  OUTPUT: ArrowUpRight,
  TRANSFER: ArrowLeftRight,
  ADJUSTMENT: Settings2,
  SITE_ALLOCATION: Building2,
  SITE_RETURN: Factory,
  RENTAL_OUT: Warehouse,
  RENTAL_RETURN: Warehouse,
};

export const createStockMovementsColumns = (): ColumnDef<StockMovement>[] => [
  {
    accessorKey: 'movement_date',
    header: 'Data',
    size: 120,
    cell: ({ row }) => (
      <TextCell
        text={new Date(row.original.movement_date).toLocaleDateString('it-IT')}
        bold
      />
    ),
  },
  {
    accessorKey: 'type',
    header: 'Tipo',
    size: 150,
    enableHiding: false,
    cell: ({ row }) => {
      const type = row.original.type;
      const Icon = movementTypeIcons[type] || Settings2; // Fallback icon
      const color = movementTypeColors[type] || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
      const label = movementTypeLabels[type] || type;

      return (
        <Badge className={`${color} font-medium text-xs border gap-1`}>
          <Icon className="h-3 w-3" />
          {label}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'material.name',
    header: 'Materiale',
    size: 250,
    cell: ({ row }) => {
      const material = row.original.material;
      return material ? (
        <div>
          <Link
            href={`/frontend/app/(dashboard)/materials/${material.id}`}
            className="font-medium hover:underline text-blue-600 dark:text-blue-400"
          >
            {material.code}
          </Link>
          <p className="text-sm text-slate-600 dark:text-slate-400">{material.name}</p>
        </div>
      ) : (
        <span className="text-slate-400 dark:text-slate-600">-</span>
      );
    },
  },
  {
    accessorKey: 'quantity',
    header: () => <div className="text-right">Quantità</div>,
    size: 120,
    cell: ({ row }) => {
      const movement = row.original;
      const isPositive = movement.type === 'intake';
      return (
        <div className={`text-right font-medium ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {isPositive ? '+' : '-'}{Number(movement.quantity).toFixed(2)} {movement.material?.unit}
        </div>
      );
    },
  },
  {
    accessorKey: 'warehouse.name',
    header: 'Magazzino',
    size: 180,
    cell: ({ row }) => {
      const movement = row.original;

      if (movement.type === 'transfer') {
        return (
          <div className="text-sm">
            <div className="flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-red-500" />
              <Link
                href={`/frontend/app/(dashboard)/warehouses/${movement.from_warehouse?.id}`}
                className="hover:underline text-blue-600 dark:text-blue-400"
              >
                {movement.from_warehouse?.name}
              </Link>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <ArrowDownLeft className="h-3 w-3 text-green-500" />
              <Link
                href={`/frontend/app/(dashboard)/warehouses/${movement.to_warehouse?.id}`}
                className="hover:underline text-blue-600 dark:text-blue-400"
              >
                {movement.to_warehouse?.name}
              </Link>
            </div>
          </div>
        );
      }

      return movement.warehouse ? (
        <Link
          href={`/frontend/app/(dashboard)/warehouses/${movement.warehouse.id}`}
          className="hover:underline flex items-center gap-1 text-blue-600 dark:text-blue-400"
        >
          <Warehouse className="h-3 w-3" />
          <span className="text-sm">{movement.warehouse.name}</span>
        </Link>
      ) : (
        <span className="text-slate-400 dark:text-slate-600">-</span>
      );
    },
  },
  {
    id: 'reference',
    header: 'Riferimento',
    size: 180,
    cell: ({ row }) => {
      const movement = row.original;

      if (movement.supplier) {
        return (
          <div className="flex items-center gap-1">
            <Factory className="h-3 w-3 text-slate-400 dark:text-slate-500" />
            <span className="text-sm text-slate-700 dark:text-slate-300">{movement.supplier.company_name}</span>
          </div>
        );
      }

      if (movement.site) {
        return (
          <Link
            href={`/frontend/app/(dashboard)/sites/${movement.site.id}`}
            className="flex items-center gap-1 hover:underline text-blue-600 dark:text-blue-400"
          >
            <Building2 className="h-3 w-3" />
            <span className="text-sm">{movement.site.code}</span>
          </Link>
        );
      }

      if (movement.supplier_document) {
        return <TextCell text={movement.supplier_document} />;
      }

      return <span className="text-slate-400 dark:text-slate-600">-</span>;
    },
  },
  {
    id: 'cost',
    header: () => <div className="text-right">Costo</div>,
    size: 120,
    cell: ({ row }) => {
      const cost = row.original.total_cost;
      return cost ? (
        <MoneyCell amount={cost} />
      ) : (
        <div className="text-right">
          <span className="text-slate-400 dark:text-slate-600">-</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'created_by_user.name',
    header: 'Utente',
    size: 150,
    cell: ({ row }) => {
      const user = row.original.created_by_user;
      return user ? (
        <TextCell text={user.name} />
      ) : (
        <span className="text-slate-400 dark:text-slate-600">-</span>
      );
    },
  },
];


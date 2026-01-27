'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Building2, Factory, ArrowDownLeft, ArrowUpRight, Warehouse } from 'lucide-react';
import { StockMovement } from '@/lib/types';
import { MoneyCell, TextCell } from '@/components/table-cells';
import { StockMovementTypeBadge } from '@/components/warehouse/stock-movement-type-badge';
import Link from 'next/link';

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
    cell: ({ row }) => (
      <StockMovementTypeBadge type={row.original.type as App.Enums.StockMovementType} />
    ),
  },
  {
    accessorKey: 'product.name',
    header: 'Prodotto',
    size: 250,
    cell: ({ row }) => {
      const product = row.original.product;
      return product ? (
        <div>
          <Link
            href={`/products/${product.id}`}
            className="font-medium hover:underline text-blue-600 dark:text-blue-400"
          >
            {product.code}
          </Link>
          <p className="text-sm text-slate-600 dark:text-slate-400">{product.name}</p>
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


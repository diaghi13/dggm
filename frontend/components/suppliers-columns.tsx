'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Supplier } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Edit, Eye, Factory, Mail, MapPin, Phone, Trash2 } from 'lucide-react';
import { StatusBadge } from '@/components/status-badge';
import { AvatarTextCell, IconTextCell, TextCell } from '@/components/table-cells';

export const createSuppliersColumns = (
  onEdit: (supplier: Supplier) => void,
  onDelete: (supplier: Supplier) => void,
  onView: (supplier: Supplier) => void
): ColumnDef<Supplier>[] => [
  {
    accessorKey: 'company_name',
    header: 'Ragione Sociale',
    size: 250,
    enableHiding: false,
    cell: ({ row }) => (
      <AvatarTextCell
        icon={Factory}
        primaryText={row.original.company_name}
      />
    ),
  },
  {
    accessorKey: 'vat_number',
    header: 'P.IVA',
    size: 150,
    cell: ({ row }) => {
      const vatNumber = row.original.vat_number;
      return vatNumber ? (
        <TextCell text={vatNumber} />
      ) : (
        <span className="text-slate-400 dark:text-slate-600">-</span>
      );
    },
  },
  {
    accessorKey: 'email',
    header: 'Email',
    size: 220,
    cell: ({ row }) => (
      <IconTextCell icon={Mail} text={row.original.email} />
    ),
  },
  {
    accessorKey: 'phone',
    header: 'Telefono',
    size: 180,
    cell: ({ row }) => (
      <IconTextCell icon={Phone} text={row.original.phone} />
    ),
  },
  {
    accessorKey: 'city',
    header: 'Città',
    size: 150,
    cell: ({ row }) => (
      <IconTextCell icon={MapPin} text={row.original.city} />
    ),
  },
  {
    accessorKey: 'is_active',
    header: 'Stato',
    size: 100,
    cell: ({ row }) => <StatusBadge active={row.original.is_active} />,
  },
  {
    id: 'actions',
    header: () => <div className="text-right">Azioni</div>,
    size: 120,
    enableHiding: false,
    enableSorting: false,
    cell: ({ row }) => {
      const supplier = row.original;
      return (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={(e) => {
              e.stopPropagation();
              onView(supplier);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(supplier);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(supplier);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];


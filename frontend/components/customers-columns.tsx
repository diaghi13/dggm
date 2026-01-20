'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Building2, Edit, Eye, Mail, MapPin, Phone, Trash2, User } from 'lucide-react';
import { StatusBadge } from '@/components/shared/status-badge';
import { TypeBadge } from '@/components/type-badge';
import { AvatarTextCell, IconTextCell } from '@/components/table-cells';

export const createCustomersColumns = (
  onEdit: (customer: Customer) => void,
  onDelete: (customer: Customer) => void,
  onView: (customer: Customer) => void
): ColumnDef<Customer>[] => [
  {
    accessorKey: 'display_name',
    header: 'Nome',
    size: 250,
    enableHiding: false, // Keep name always visible
    cell: ({ row }) => {
      const customer = row.original;
      return (
        <AvatarTextCell
          icon={customer.type === 'company' ? Building2 : User}
          primaryText={customer.display_name}
        />
      );
    },
  },
  {
    accessorKey: 'type',
    header: 'Tipo',
    size: 120,
    cell: ({ row }) => <TypeBadge type={row.original.type} />,
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
    cell: ({ row }) => {
      const phone = row.original.phone || row.original.mobile;
      return <IconTextCell icon={Phone} text={phone} />;
    },
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
    enableHiding: false, // Keep actions always visible
    enableSorting: false,
    cell: ({ row }) => {
      const customer = row.original;
      return (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={(e) => {
              e.stopPropagation();
              onView(customer);
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
              onEdit(customer);
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
              onDelete(customer);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];

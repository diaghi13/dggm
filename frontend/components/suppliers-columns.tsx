'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Supplier } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Eye, Factory, Mail, MapPin, Phone, Trash2, Package, Users, Box } from 'lucide-react';
import { StatusBadge } from '@/components/shared/status-badge';
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
    accessorKey: 'supplier_type',
    header: 'Tipo Fornitore',
    size: 150,
    cell: ({ row }) => {
      const type = row.original.supplier_type;
      const getTypeConfig = () => {
        switch (type) {
          case 'materials':
            return { label: 'Materiali', icon: Package, className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
          case 'personnel':
            return { label: 'Personale', icon: Users, className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' };
          case 'both':
            return { label: 'Entrambi', icon: Box, className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
          default:
            return { label: '-', icon: Package, className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' };
        }
      };
      const config = getTypeConfig();
      const Icon = config.icon;
      return (
        <Badge variant="secondary" className={`${config.className} font-medium`}>
          <Icon className="h-3 w-3 mr-1" />
          {config.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'personnel_type',
    header: 'Tipo Personale',
    size: 180,
    cell: ({ row }) => {
      const personnelType = row.original.personnel_type;
      if (!personnelType || row.original.supplier_type === 'materials') {
        return <span className="text-slate-400 dark:text-slate-600">-</span>;
      }
      const getPersonnelLabel = () => {
        switch (personnelType) {
          case 'cooperative':
            return 'Cooperativa';
          case 'staffing_agency':
            return 'Agenzia Interinale';
          case 'rental_with_operator':
            return 'Noleggio con Operatore';
          case 'subcontractor':
            return 'Subappaltatore';
          case 'technical_services':
            return 'Servizi Tecnici';
          default:
            return personnelType;
        }
      };
      return (
        <Badge variant="outline" className="font-normal">
          {getPersonnelLabel()}
        </Badge>
      );
    },
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


'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Contractor } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Edit, Eye, Trash2, Building2, Mail, Phone, Briefcase, Users } from 'lucide-react';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { AvatarTextCell, IconTextCell } from '@/components/table-cells';

const contractorTypeLabels = {
  cooperative: 'Cooperativa',
  subcontractor: 'Subappaltatore',
  temporary_agency: 'Agenzia Interinale',
} as const;

const contractorTypeColors = {
  cooperative: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  subcontractor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
  temporary_agency: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100',
} as const;

export const createContractorsColumns = (
  onEdit: (contractor: Contractor) => void,
  onDelete: (contractor: Contractor) => void,
  onView: (contractor: Contractor) => void
): ColumnDef<Contractor>[] => [
  {
    accessorKey: 'code',
    header: 'Codice',
    size: 120,
    enableHiding: false,
    cell: ({ row }) => (
      <span className="font-mono text-sm text-slate-600 dark:text-slate-400">
        {row.original.code}
      </span>
    ),
  },
  {
    accessorKey: 'company_name',
    header: 'Ragione Sociale',
    size: 280,
    enableHiding: false,
    cell: ({ row }) => {
      const contractor = row.original;
      return (
        <AvatarTextCell
          icon={Briefcase}
          primaryText={contractor.company_name}
          secondaryText={contractor.vat_number || undefined}
        />
      );
    },
  },
  {
    accessorKey: 'contractor_type',
    header: 'Tipo',
    size: 160,
    cell: ({ row }) => {
      const type = row.original.contractor_type;
      return (
        <Badge className={contractorTypeColors[type]}>
          {contractorTypeLabels[type]}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'email',
    header: 'Email',
    size: 220,
    cell: ({ row }) => (
      <IconTextCell icon={Mail} text={row.original.email || undefined} />
    ),
  },
  {
    accessorKey: 'phone',
    header: 'Telefono',
    size: 160,
    cell: ({ row }) => (
      <IconTextCell icon={Phone} text={row.original.phone || undefined} />
    ),
  },
  {
    accessorKey: 'contact_person',
    header: 'Referente',
    size: 180,
    cell: ({ row }) => {
      const contact = row.original.contact_person;
      if (!contact) return <span className="text-slate-400 dark:text-slate-500">-</span>;
      return (
        <span className="text-sm text-slate-700 dark:text-slate-300">
          {contact}
        </span>
      );
    },
  },
  {
    accessorKey: 'active_workers_count',
    header: 'Worker Attivi',
    size: 130,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-slate-400 dark:text-slate-500" />
        <Badge variant="outline" className="font-mono">
          {row.original.active_workers_count || 0}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: 'is_active',
    header: 'Stato',
    size: 120,
    cell: ({ row }) => <StatusBadge active={row.original.is_active} />,
  },
  {
    id: 'actions',
    header: 'Azioni',
    size: 140,
    enableHiding: false,
    cell: ({ row }) => {
      const contractor = row.original;
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onView(contractor);
            }}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">Visualizza</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(contractor);
            }}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">Modifica</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(contractor);
            }}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Elimina</span>
          </Button>
        </div>
      );
    },
  },
];

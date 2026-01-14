'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Worker } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Edit, Eye, Trash2, User, Mail, Phone, Briefcase, UserCheck, Users } from 'lucide-react';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { AvatarTextCell, IconTextCell } from '@/components/table-cells';

const workerTypeLabels = {
  employee: 'Dipendente',
  freelancer: 'Freelance',
  external: 'Esterno',
} as const;

const workerTypeColors = {
  employee: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  freelancer: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
  external: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
} as const;

export const createWorkersColumns = (
  onEdit: (worker: Worker) => void,
  onDelete: (worker: Worker) => void,
  onView: (worker: Worker) => void
): ColumnDef<Worker>[] => [
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
    accessorKey: 'display_name',
    header: 'Nome',
    size: 250,
    enableHiding: false,
    cell: ({ row }) => {
      const worker = row.original;
      return (
        <AvatarTextCell
          icon={worker.worker_type === 'external' ? Users : UserCheck}
          primaryText={worker.display_name}
          secondaryText={worker.supplier?.company_name}
        />
      );
    },
  },
  {
    accessorKey: 'worker_type',
    header: 'Tipo',
    size: 150,
    cell: ({ row }) => {
      const type = row.original.worker_type;
      return (
        <Badge className={workerTypeColors[type]}>
          {workerTypeLabels[type]}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'job_title',
    header: 'Ruolo',
    size: 180,
    cell: ({ row }) => (
      <IconTextCell icon={Briefcase} text={row.original.job_title} />
    ),
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
    accessorKey: 'mobile',
    header: 'Telefono',
    size: 160,
    cell: ({ row }) => {
      const phone = row.original.mobile || row.original.phone;
      return <IconTextCell icon={Phone} text={phone} />;
    },
  },
  {
    accessorKey: 'hire_date',
    header: 'Data Assunzione',
    size: 150,
    cell: ({ row }) => {
      const date = row.original.hire_date;
      if (!date) return <span className="text-slate-400">-</span>;
      return (
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {new Date(date).toLocaleDateString('it-IT')}
        </span>
      );
    },
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
      const worker = row.original;
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onView(worker);
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
              onEdit(worker);
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
              onDelete(worker);
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

'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Site } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Building2, Calendar, Edit, Euro, Eye, MapPin, Trash2, User } from 'lucide-react';
import {
  LargeAvatarTextCell,
  IconTextCell,
  MoneyCell,
  StatusBadgeCell
} from '@/components/table-cells';

const statusColors: Record<string, string> = {
  draft: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200',
  planned: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  active: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
  in_progress: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
  on_hold: 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  completed: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  cancelled: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
};

const statusLabels: Record<string, string> = {
  draft: 'Bozza',
  planned: 'Pianificato',
  active: 'Attivo',
  in_progress: 'In Corso',
  on_hold: 'In Pausa',
  completed: 'Completato',
  cancelled: 'Annullato',
};

export const createSitesColumns = (
  onEdit: (site: Site) => void,
  onDelete: (site: Site) => void,
  onView: (site: Site) => void
): ColumnDef<Site>[] => [
  {
    accessorKey: 'code',
    header: 'Codice/Nome',
    size: 250,
    enableHiding: false,
    cell: ({ row }) => {
      const site = row.original;
      return (
        <LargeAvatarTextCell
          icon={Building2}
          primaryText={site.code}
          secondaryText={site.name}
        />
      );
    },
  },
  {
    accessorKey: 'customer',
    header: 'Cliente',
    size: 200,
    cell: ({ row }) => (
      <IconTextCell
        icon={User}
        text={row.original.customer?.display_name}
      />
    ),
  },
  {
    accessorKey: 'city',
    header: 'Indirizzo',
    size: 180,
    cell: ({ row }) => (
      <IconTextCell icon={MapPin} text={row.original.city} />
    ),
  },
  {
    accessorKey: 'status',
    header: 'Stato',
    size: 130,
    cell: ({ row }) => (
      <StatusBadgeCell
        status={row.original.status}
        statusColors={statusColors}
        statusLabels={statusLabels}
      />
    ),
  },
  {
    accessorKey: 'start_date',
    header: 'Data Inizio',
    size: 140,
    cell: ({ row }) => {
      const startDate = row.original.start_date;
      return startDate ? (
        <IconTextCell
          icon={Calendar}
          text={new Date(startDate).toLocaleDateString('it-IT')}
        />
      ) : (
        <span className="text-slate-400 dark:text-slate-600">-</span>
      );
    },
  },
  {
    accessorKey: 'estimated_amount',
    header: () => <div className="text-right">Importo</div>,
    size: 150,
    cell: ({ row }) => (
      <MoneyCell amount={row.original.estimated_amount} />
    ),
  },
  {
    id: 'actions',
    header: () => <div className="text-right">Azioni</div>,
    size: 120,
    enableHiding: false,
    enableSorting: false,
    cell: ({ row }) => {
      const site = row.original;
      return (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={(e) => {
              e.stopPropagation();
              onView(site);
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
              onEdit(site);
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
              onDelete(site);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];

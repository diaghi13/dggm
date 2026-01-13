'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Quote } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Calendar, Eye, FileText, Trash2, User } from 'lucide-react';
import {
  AvatarTextCell,
  IconTextCell,
  MoneyCell,
  StatusBadgeCell,
  TextCell
} from '@/components/table-cells';

const statusColors: Record<string, string> = {
  draft: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
  sent: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700',
  approved: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700',
  rejected: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700',
  expired: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700',
  converted: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700',
};

const statusLabels: Record<string, string> = {
  draft: 'Bozza',
  sent: 'Inviato',
  approved: 'Approvato',
  rejected: 'Rifiutato',
  expired: 'Scaduto',
  converted: 'Convertito',
};

export const createQuotesColumns = (
  onDelete: (quote: Quote) => void,
  onView: (quote: Quote) => void
): ColumnDef<Quote>[] => [
  {
    accessorKey: 'code',
    header: 'Codice',
    size: 150,
    enableHiding: false,
    cell: ({ row }) => (
      <AvatarTextCell
        icon={FileText}
        primaryText={row.original.code}
      />
    ),
  },
  {
    accessorKey: 'title',
    header: 'Titolo',
    size: 250,
    cell: ({ row }) => (
      <TextCell text={row.original.title} truncate bold />
    ),
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
    accessorKey: 'issue_date',
    header: 'Data Emissione',
    size: 150,
    cell: ({ row }) => (
      <IconTextCell
        icon={Calendar}
        text={new Date(row.original.issue_date).toLocaleDateString('it-IT')}
      />
    ),
  },
  {
    accessorKey: 'total_amount',
    header: () => <div className="text-right">Importo Totale</div>,
    size: 150,
    cell: ({ row }) => (
      <MoneyCell amount={row.original.total_amount} bold />
    ),
  },
  {
    id: 'actions',
    header: () => <div className="text-right">Azioni</div>,
    size: 100,
    enableHiding: false,
    enableSorting: false,
    cell: ({ row }) => {
      const quote = row.original;
      return (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={(e) => {
              e.stopPropagation();
              onView(quote);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(quote);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];


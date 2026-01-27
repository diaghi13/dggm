'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type DdtStatus = App.Enums.DdtStatus;

interface DdtStatusBadgeProps {
  status: DdtStatus | null;
  className?: string;
}

const statusConfig: Record<DdtStatus, { label: string; className: string }> = {
  draft: {
    label: 'Bozza',
    className: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600',
  },
  issued: {
    label: 'Emesso',
    className: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700',
  },
  in_transit: {
    label: 'In Transito',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700',
  },
  delivered: {
    label: 'Consegnato',
    className: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700',
  },
  cancelled: {
    label: 'Annullato',
    className: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300 dark:border-red-700',
  },
};

export function DdtStatusBadge({ status, className }: DdtStatusBadgeProps) {
  if (!status) return null;

  const config = statusConfig[status];
  if (!config) return null;

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}

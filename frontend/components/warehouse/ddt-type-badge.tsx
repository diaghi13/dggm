'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Package, TruckIcon, ArrowLeftRight, PackageOpen, PackageCheck, Undo2, RotateCcw } from 'lucide-react';

type DdtType = App.Enums.DdtType;

interface DdtTypeBadgeProps {
  type: DdtType;
  className?: string;
  showIcon?: boolean;
}

const typeConfig: Record<DdtType, { label: string; className: string; icon: typeof Package }> = {
  incoming: {
    label: 'In Entrata',
    className: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700',
    icon: PackageCheck,
  },
  outgoing: {
    label: 'In Uscita',
    className: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700',
    icon: TruckIcon,
  },
  internal: {
    label: 'Trasferimento',
    className: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-700',
    icon: ArrowLeftRight,
  },
  rental_out: {
    label: 'Noleggio Out',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700',
    icon: PackageOpen,
  },
  rental_return: {
    label: 'Reso Noleggio',
    className: 'bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900 dark:text-cyan-300 dark:border-cyan-700',
    icon: RotateCcw,
  },
  return_from_customer: {
    label: 'Reso da Cliente',
    className: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-700',
    icon: Undo2,
  },
  return_to_supplier: {
    label: 'Reso a Fornitore',
    className: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300 dark:border-red-700',
    icon: Undo2,
  },
};

export function DdtTypeBadge({ type, className, showIcon = true }: DdtTypeBadgeProps) {
  const config = typeConfig[type];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {config.label}
    </Badge>
  );
}

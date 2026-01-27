'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Settings,
  Undo2,
  Trash2,
  PackageOpen,
  PackageCheck,
  MapPin,
  Package
} from 'lucide-react';

type StockMovementType = App.Enums.StockMovementType;

interface StockMovementTypeBadgeProps {
  type: StockMovementType;
  className?: string;
  showIcon?: boolean;
}

const typeConfig: Record<StockMovementType, { label: string; className: string; icon: typeof Package }> = {
  intake: {
    label: 'Carico',
    className: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700',
    icon: ArrowDownLeft,
  },
  output: {
    label: 'Scarico',
    className: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300 dark:border-red-700',
    icon: ArrowUpRight,
  },
  transfer: {
    label: 'Trasferimento',
    className: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700',
    icon: ArrowLeftRight,
  },
  adjustment: {
    label: 'Rettifica',
    className: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-700',
    icon: Settings,
  },
  return: {
    label: 'Reso',
    className: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-700',
    icon: Undo2,
  },
  waste: {
    label: 'Scarto',
    className: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600',
    icon: Trash2,
  },
  rental_out: {
    label: 'Noleggio Out',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700',
    icon: PackageOpen,
  },
  rental_return: {
    label: 'Reso Noleggio',
    className: 'bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900 dark:text-cyan-300 dark:border-cyan-700',
    icon: PackageCheck,
  },
  site_allocation: {
    label: 'Allocato Cantiere',
    className: 'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900 dark:text-indigo-300 dark:border-indigo-700',
    icon: MapPin,
  },
  site_return: {
    label: 'Reso da Cantiere',
    className: 'bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-900 dark:text-teal-300 dark:border-teal-700',
    icon: MapPin,
  },
};

export function StockMovementTypeBadge({ type, className, showIcon = true }: StockMovementTypeBadgeProps) {
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

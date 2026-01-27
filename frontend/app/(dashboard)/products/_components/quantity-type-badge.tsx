'use client';

import { Badge } from '@/components/ui/badge';
import { Hash, X, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuantityTypeBadgeProps {
  type: App.Enums.ProductRelationQuantityType;
  size?: 'sm' | 'md';
  className?: string;
}

const typeConfig: Record<App.Enums.ProductRelationQuantityType, {
  label: string;
  icon: React.ElementType;
  className: string;
}> = {
  fixed: {
    label: 'Fisso',
    icon: Hash,
    className: 'bg-slate-50 dark:bg-slate-950/30 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800',
  },
  multiplied: {
    label: 'Moltiplicato',
    icon: X,
    className: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  },
  formula: {
    label: 'Formula',
    icon: Calculator,
    className: 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  },
};

export function QuantityTypeBadge({ type, size = 'md', className }: QuantityTypeBadgeProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs';
  const iconSize = size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3';

  return (
    <Badge variant="outline" className={cn(config.className, sizeClasses, className)}>
      <Icon className={cn(iconSize, 'mr-1')} />
      {config.label}
    </Badge>
  );
}

'use client';

import { Badge } from '@/components/ui/badge';
import { Package, Briefcase, Boxes } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductTypeBadgeProps {
  type: App.Enums.ProductType;
  className?: string;
}

const typeConfig: Record<App.Enums.ProductType, {
  label: string;
  icon: React.ElementType;
  className: string;
}> = {
  article: {
    label: 'Articolo',
    icon: Package,
    className: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  },
  service: {
    label: 'Servizio',
    icon: Briefcase,
    className: 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  },
  composite: {
    label: 'Composto',
    icon: Boxes,
    className: 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
  },
};

export function ProductTypeBadge({ type, className }: ProductTypeBadgeProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}

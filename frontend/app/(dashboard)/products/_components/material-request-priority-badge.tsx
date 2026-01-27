import { Badge } from '@/components/ui/badge';
import type { MaterialRequestPriority } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AlertTriangle, AlertCircle, Info, Flame } from 'lucide-react';

interface MaterialRequestPriorityBadgeProps {
  priority: MaterialRequestPriority;
  className?: string;
}

const priorityConfig: Record<
  MaterialRequestPriority,
  {
    label: string;
    icon: React.ElementType;
    className: string;
  }
> = {
  low: {
    label: 'Bassa',
    icon: Info,
    className: 'bg-slate-100 text-slate-700 border-slate-300',
  },
  medium: {
    label: 'Media',
    icon: AlertCircle,
    className: 'bg-blue-100 text-blue-700 border-blue-300',
  },
  high: {
    label: 'Alta',
    icon: AlertTriangle,
    className: 'bg-orange-100 text-orange-700 border-orange-300',
  },
  urgent: {
    label: 'Urgente',
    icon: Flame,
    className: 'bg-red-100 text-red-700 border-red-300',
  },
};

export function MaterialRequestPriorityBadge({
  priority,
  className,
}: MaterialRequestPriorityBadgeProps) {
  const config = priorityConfig[priority];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}

// Export alias for backward compatibility
export { MaterialRequestPriorityBadge as ProductRequestPriorityBadge };


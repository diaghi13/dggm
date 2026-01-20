import { Badge } from '@/components/ui/badge';
import { SiteWorkerStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  Clock,
  XCircle,
  Briefcase,
  CheckCheck,
  Ban,
} from 'lucide-react';

interface SiteWorkerStatusBadgeProps {
  status: SiteWorkerStatus;
  label?: string;
  className?: string;
}

const statusConfig: Record<
  SiteWorkerStatus,
  {
    label: string;
    icon: React.ElementType;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    className: string;
  }
> = {
  pending: {
    label: 'In Attesa',
    icon: Clock,
    variant: 'outline',
    className: 'border-yellow-500 text-yellow-700 dark:text-yellow-400',
  },
  accepted: {
    label: 'Accettato',
    icon: CheckCircle2,
    variant: 'outline',
    className: 'border-green-500 text-green-700 dark:text-green-400',
  },
  rejected: {
    label: 'Rifiutato',
    icon: XCircle,
    variant: 'destructive',
    className: '',
  },
  active: {
    label: 'Attivo',
    icon: Briefcase,
    variant: 'default',
    className: 'bg-blue-500 text-white border-blue-500',
  },
  completed: {
    label: 'Completato',
    icon: CheckCheck,
    variant: 'secondary',
    className: 'bg-gray-500 text-white border-gray-500',
  },
  cancelled: {
    label: 'Annullato',
    icon: Ban,
    variant: 'outline',
    className: 'border-gray-400 text-gray-600 dark:text-gray-400',
  },
};

export function SiteWorkerStatusBadge({
  status,
  label,
  className,
}: SiteWorkerStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      <Icon className="h-3 w-3" />
      {label || config.label}
    </Badge>
  );
}

import { Badge } from '@/components/ui/badge';
import type { MaterialRequestStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Clock, CheckCircle2, XCircle, Truck } from 'lucide-react';

interface MaterialRequestStatusBadgeProps {
  status: MaterialRequestStatus;
  className?: string;
}

const statusConfig: Record<
  MaterialRequestStatus,
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
  approved: {
    label: 'Approvata',
    icon: CheckCircle2,
    variant: 'outline',
    className: 'border-green-500 text-green-700 dark:text-green-400',
  },
  rejected: {
    label: 'Rifiutata',
    icon: XCircle,
    variant: 'destructive',
    className: '',
  },
  delivered: {
    label: 'Consegnata',
    icon: Truck,
    variant: 'secondary',
    className: 'bg-blue-500 text-white border-blue-500',
  },
};

export function MaterialRequestStatusBadge({
  status,
  className,
}: MaterialRequestStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}

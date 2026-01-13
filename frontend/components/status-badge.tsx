import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  active: boolean;
  className?: string;
}

export function StatusBadge({ active, className }: StatusBadgeProps) {
  return (
    <Badge
      className={cn(
        'font-medium text-xs',
        active
          ? 'bg-green-100 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-950/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800'
          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        className
      )}
    >
      {active ? 'Attivo' : 'Inattivo'}
    </Badge>
  );
}

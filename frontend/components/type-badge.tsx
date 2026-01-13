import { Badge } from '@/components/ui/badge';
import { Building2, User } from 'lucide-react';

interface TypeBadgeProps {
  type: 'individual' | 'company';
}

export function TypeBadge({ type }: TypeBadgeProps) {
  return (
    <Badge
      className={
        type === 'company'
          ? 'bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 font-medium text-xs'
          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-medium text-xs'
      }
    >
      {type === 'company' ? (
        <>
          <Building2 className="w-3 h-3 mr-1" />
          Azienda
        </>
      ) : (
        <>
          <User className="w-3 h-3 mr-1" />
          Privato
        </>
      )}
    </Badge>
  );
}

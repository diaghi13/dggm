import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';

interface PageDetailHeaderProps {
  title: string | ReactNode;
  backUrl: string;
  backLabel?: string;
  actions?: ReactNode;
  badge?: ReactNode;
}

export function PageDetailHeader({
  title,
  backUrl,
  backLabel = 'Indietro',
  actions,
  badge
}: PageDetailHeaderProps) {
  const router = useRouter();

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-6 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(backUrl)}
            className="mt-1 shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">{backLabel}</span>
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              {typeof title === 'string' ? (
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {title}
                </h1>
              ) : (
                title
              )}
              {badge}
            </div>
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}


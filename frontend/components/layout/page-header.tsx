import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-6", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-10 h-10 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Icon className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {title}
              </h1>
              {description && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{description}</p>
              )}
            </div>
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

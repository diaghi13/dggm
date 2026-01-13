import { cn } from "@/lib/utils";

interface DataTableWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function DataTableWrapper({ children, className }: DataTableWrapperProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden",
        className
      )}
    >
      <div className="overflow-x-auto">
        {children}
      </div>
    </div>
  );
}

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TableRow } from '@/components/ui/table';

// TableRow wrapper con dark mode
interface DataTableRowProps {
  children: ReactNode;
  className?: string;
}

export function DataTableRow({ children, className }: DataTableRowProps) {
  return (
    <TableRow className={cn(
      "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800",
      className
    )}>
      {children}
    </TableRow>
  );
}

// TableCell con icona e testo
interface TableCellWithIconProps {
  icon: React.ElementType;
  text: string | null | undefined;
  placeholder?: string;
}

export function TableCellWithIcon({ icon: Icon, text, placeholder = '-' }: TableCellWithIconProps) {
  if (!text) {
    return <span className="text-slate-400 dark:text-slate-600">{placeholder}</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
      <span className="text-sm text-slate-700 dark:text-slate-300">{text}</span>
    </div>
  );
}

// TableCell con avatar/icona
interface TableCellWithAvatarProps {
  icon: React.ElementType;
  text: string;
  iconClassName?: string;
}

export function TableCellWithAvatar({ icon: Icon, text, iconClassName }: TableCellWithAvatarProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <Icon className={cn("w-4 h-4 text-slate-600 dark:text-slate-400", iconClassName)} />
      </div>
      <span className="font-medium text-slate-900 dark:text-slate-100">{text}</span>
    </div>
  );
}

// Filtri in Card riutilizzabile
interface SearchFilterCardProps {
  children: ReactNode;
}

export function SearchFilterCard({ children }: SearchFilterCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
      {children}
    </div>
  );
}


'use client';

import { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Icon + Text Cell
interface IconTextCellProps {
  icon: LucideIcon;
  text?: string | null;
  iconClassName?: string;
  textClassName?: string;
}

export function IconTextCell({ icon: Icon, text, iconClassName, textClassName }: IconTextCellProps) {
  if (!text) {
    return <span className="text-slate-400 dark:text-slate-600">-</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <Icon className={cn("w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0", iconClassName)} />
      <span className={cn("text-sm text-slate-700 dark:text-slate-300", textClassName)}>{text}</span>
    </div>
  );
}

// Avatar + Text Cell (for names, codes, etc.)
interface AvatarTextCellProps {
  icon: LucideIcon;
  primaryText: string;
  secondaryText?: string;
  iconClassName?: string;
  avatarClassName?: string;
}

export function AvatarTextCell({
  icon: Icon,
  primaryText,
  secondaryText,
  iconClassName,
  avatarClassName
}: AvatarTextCellProps) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn(
        "w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0",
        avatarClassName
      )}>
        <Icon className={cn("w-4 h-4 text-slate-600 dark:text-slate-400", iconClassName)} />
      </div>
      <div className="flex flex-col">
        <span className="font-mono text-sm font-medium text-slate-900 dark:text-slate-100">{primaryText}</span>
        {secondaryText && (
          <span className="text-sm text-slate-600 dark:text-slate-400">{secondaryText}</span>
        )}
      </div>
    </div>
  );
}

// Large Avatar + Text Cell (for sites, etc.)
interface LargeAvatarTextCellProps {
  icon: LucideIcon;
  primaryText: string;
  secondaryText?: string;
  iconClassName?: string;
  avatarClassName?: string;
}

export function LargeAvatarTextCell({
  icon: Icon,
  primaryText,
  secondaryText,
  iconClassName,
  avatarClassName
}: LargeAvatarTextCellProps) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn(
        "w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0",
        avatarClassName
      )}>
        <Icon className={cn("w-5 h-5 text-slate-600 dark:text-slate-400", iconClassName)} />
      </div>
      <div className="flex flex-col">
        <p className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">{primaryText}</p>
        {secondaryText && (
          <p className="text-sm text-slate-600 dark:text-slate-400">{secondaryText}</p>
        )}
      </div>
    </div>
  );
}

// Money Cell
interface MoneyCellProps {
  amount: number | string;
  currency?: string;
  bold?: boolean;
}

export function MoneyCell({ amount, currency = '€', bold = false }: MoneyCellProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      <span className="text-slate-400 dark:text-slate-500">{currency}</span>
      <span className={cn(
        "text-slate-900 dark:text-slate-100",
        bold ? "font-semibold" : "font-medium"
      )}>
        {parseFloat(amount.toString()).toLocaleString('it-IT', {
          minimumFractionDigits: 2,
        })}
      </span>
    </div>
  );
}

// Date Cell
interface DateCellProps {
  date: string | Date;
  format?: 'short' | 'long';
}

export function DateCell({ date, format = 'short' }: DateCellProps) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-700 dark:text-slate-300">
        {dateObj.toLocaleDateString('it-IT',
          format === 'long'
            ? { year: 'numeric', month: 'long', day: 'numeric' }
            : undefined
        )}
      </span>
    </div>
  );
}

// Status Badge Cell
interface StatusBadgeCellProps {
  status: string;
  statusColors: Record<string, string>;
  statusLabels: Record<string, string>;
}

export function StatusBadgeCell({ status, statusColors, statusLabels }: StatusBadgeCellProps) {
  return (
    <Badge className={cn(statusColors[status], "font-medium text-xs border")}>
      {statusLabels[status]}
    </Badge>
  );
}

// Simple Text Cell
interface TextCellProps {
  text: string;
  truncate?: boolean;
  maxWidth?: string;
  bold?: boolean;
}

export function TextCell({ text, truncate = false, maxWidth = 'max-w-xs', bold = false }: TextCellProps) {
  return (
    <div className={maxWidth}>
      <p className={cn(
        "text-slate-900 dark:text-slate-100",
        bold && "font-medium",
        truncate && "truncate"
      )}>
        {text}
      </p>
    </div>
  );
}


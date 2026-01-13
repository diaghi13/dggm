'use client';

import { Button } from '@/components/ui/button';

interface DialogFooterProps {
  onCancel: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  submitDisabled?: boolean;
}

export function DialogFooter({
  onCancel,
  onSubmit,
  submitLabel = 'Salva',
  cancelLabel = 'Annulla',
  isLoading = false,
  submitDisabled = false,
}: DialogFooterProps) {
  return (
    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 dark:bg-slate-900/50 dark:border-slate-800">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isLoading}
      >
        {cancelLabel}
      </Button>
      {onSubmit && (
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isLoading || submitDisabled}
        >
          {isLoading ? 'Salvataggio...' : submitLabel}
        </Button>
      )}
    </div>
  );
}


'use client';

import { cn } from '@/lib/utils';

interface LoadingScreenProps {
  message?: string;
  className?: string;
}

export function LoadingScreen({ message = 'Caricamento...', className }: LoadingScreenProps) {
  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950",
      className
    )}>
      <div className="flex flex-col items-center space-y-4">
        {/* Logo DGGM ERP */}
        <div className="relative">
          <div className="w-16 h-16 bg-slate-900 dark:bg-slate-100 rounded-lg flex items-center justify-center">
            <svg
              className="w-9 h-9 text-white dark:text-slate-900"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>

          {/* Spinner animato */}
          <div className="absolute -inset-2">
            <div className="w-20 h-20 border-4 border-slate-200 dark:border-slate-800 border-t-slate-900 dark:border-t-slate-100 rounded-lg animate-spin" />
          </div>
        </div>

        {/* Testo */}
        <div className="text-center space-y-1">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            DGGM ERP
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {message}
          </p>
        </div>

        {/* Barra di progresso animata */}
        <div className="w-48 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-slate-900 dark:bg-slate-100 rounded-full animate-progress" />
        </div>
      </div>
    </div>
  );
}

/**
 * LoadingScreen inline - Per uso all'interno di un container
 */
export function LoadingInline({ message = 'Caricamento...', className }: LoadingScreenProps) {
  return (
    <div className={cn("flex items-center justify-center p-8", className)}>
      <div className="flex flex-col items-center space-y-3">
        {/* Spinner semplice */}
        <div className="relative w-12 h-12">
          <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-slate-900 dark:border-t-slate-100 rounded-full animate-spin" />
        </div>

        {/* Testo */}
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {message}
        </p>
      </div>
    </div>
  );
}

/**
 * LoadingSpinner - Solo spinner per uso generico
 */
export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("w-5 h-5 border-2 border-slate-200 dark:border-slate-800 border-t-slate-900 dark:border-t-slate-100 rounded-full animate-spin", className)} />
  );
}


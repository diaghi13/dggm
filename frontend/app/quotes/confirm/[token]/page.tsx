import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import QuoteConfirmClient from './client';

export default function QuoteConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            <p className="text-slate-500 text-sm">Caricamento preventivo...</p>
          </div>
        </div>
      }
    >
      <QuoteConfirmClient />
    </Suspense>
  );
}

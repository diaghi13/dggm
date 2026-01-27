'use client';

import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-400/20 rounded-full blur-xl" />
            <div className="relative bg-white dark:bg-slate-900 p-6 rounded-full border-2 border-slate-200 dark:border-slate-800 shadow-lg">
              <WifiOff className="h-16 w-16 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Nessuna connessione
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Sembra che tu sia offline. Controlla la tua connessione internet e riprova.
          </p>
        </div>

        {/* Features when offline */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 text-left space-y-3">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Cosa puoi fare offline:
          </h2>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Visualizzare i dati precedentemente caricati</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Navigare tra le pagine già visitate</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-500 mt-0.5">⚠</span>
              <span>Le modifiche verranno sincronizzate quando torni online</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleRefresh}
            className="w-full"
            size="lg"
          >
            <RefreshCw className="mr-2 h-5 w-5" />
            Riprova
          </Button>

          <p className="text-sm text-slate-500 dark:text-slate-500">
            Questa pagina si aggiornerà automaticamente quando tornerai online
          </p>
        </div>
      </div>
    </div>
  );
}
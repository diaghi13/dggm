'use client';

import { useState } from 'react';
import { LoadingScreen, LoadingInline, LoadingSpinner } from '@/components/loading-screen';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function LoadingExamplePage() {
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 3000);
  };

  if (showFullScreen) {
    return <LoadingScreen message="Caricamento in corso..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Componenti Loading
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Esempi di utilizzo dei componenti di loading dell'app
        </p>
      </div>

      {/* Full Screen Loading */}
      <Card>
        <CardHeader>
          <CardTitle>LoadingScreen - Schermo Intero</CardTitle>
          <CardDescription>
            Da usare durante l'autenticazione, caricamento iniziale dell'app, o processi lunghi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Questo componente copre l'intero schermo con il logo DGGM ERP animato.
            </p>
            <pre className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm overflow-x-auto">
              {`<LoadingScreen message="Caricamento..." />`}
            </pre>
          </div>
          <Button onClick={() => setShowFullScreen(true)}>
            Mostra Loading Full Screen (3 secondi)
          </Button>
          {showFullScreen && setTimeout(() => setShowFullScreen(false), 3000)}
        </CardContent>
      </Card>

      {/* Inline Loading */}
      <Card>
        <CardHeader>
          <CardTitle>LoadingInline - Caricamento Inline</CardTitle>
          <CardDescription>
            Da usare all'interno di card, sezioni o aree specifiche della pagina
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Questo componente mostra un loader compatto per aree specifiche.
            </p>
            <pre className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm overflow-x-auto">
              {`<LoadingInline message="Caricamento dati..." />`}
            </pre>
          </div>
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4">
            {isLoading ? (
              <LoadingInline message="Caricamento dati..." />
            ) : (
              <div className="text-center py-4">
                <p className="text-slate-600 dark:text-slate-400">
                  Contenuto caricato con successo!
                </p>
              </div>
            )}
          </div>
          <Button onClick={simulateLoading} disabled={isLoading}>
            {isLoading ? 'Caricamento...' : 'Simula Caricamento (3 secondi)'}
          </Button>
        </CardContent>
      </Card>

      {/* Loading Spinner */}
      <Card>
        <CardHeader>
          <CardTitle>LoadingSpinner - Spinner Generico</CardTitle>
          <CardDescription>
            Da usare all'interno di bottoni, testi, o piccole aree
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Un semplice spinner per uso generico, altamente personalizzabile.
            </p>
            <pre className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm overflow-x-auto">
              {`<LoadingSpinner className="w-5 h-5" />`}
            </pre>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <LoadingSpinner className="w-4 h-4" />
              <span className="text-sm">Spinner piccolo (16px)</span>
            </div>
            <div className="flex items-center gap-3">
              <LoadingSpinner className="w-6 h-6" />
              <span className="text-sm">Spinner medio (24px)</span>
            </div>
            <div className="flex items-center gap-3">
              <LoadingSpinner className="w-8 h-8" />
              <span className="text-sm">Spinner grande (32px)</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
              Esempio nei bottoni:
            </p>
            <div className="flex gap-3">
              <Button disabled>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Caricamento...
              </Button>
              <Button variant="outline" disabled>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Elaborazione...
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Use Cases */}
      <Card>
        <CardHeader>
          <CardTitle>Casi d'Uso Consigliati</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                🖥️ LoadingScreen (Full Screen)
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-400">
                <li>Verifica autenticazione al caricamento dell'app</li>
                <li>Caricamento iniziale dei dati essenziali</li>
                <li>Processi lunghi che bloccano l'intera UI</li>
                <li>Redirect tra pagine importanti</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                📦 LoadingInline (Inline)
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-400">
                <li>Caricamento dati in una sezione specifica</li>
                <li>Refresh di tabelle o liste</li>
                <li>Caricamento dettagli in una card</li>
                <li>Aggiornamento di grafici o statistiche</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                ⚡ LoadingSpinner (Generic)
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-400">
                <li>All'interno di bottoni durante azioni</li>
                <li>Accanto a testi informativi</li>
                <li>In piccole aree della UI</li>
                <li>Indicatori di stato inline</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useParams, useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDdt } from '@/hooks/use-ddts';

export default function EditDdtPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const { data: ddt, isLoading } = useDdt(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
            Caricamento DDT...
          </p>
        </div>
      </div>
    );
  }

  // Verifica che il DDT sia in stato Draft
  if (ddt && ddt.status !== 'draft') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/ddts/${id}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Modifica DDT
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              DDT #{ddt.ddt_number}
            </p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Modifica non consentita</strong>
            <p className="mt-2">
              Questo DDT è in stato <strong>{ddt.status}</strong> e non può essere modificato.
              Solo i DDT in stato <strong>Draft</strong> possono essere modificati.
            </p>
            <p className="mt-2">
              Se hai bisogno di correggere questo DDT, dovrai:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Annullare il DDT corrente</li>
              <li>Creare un nuovo DDT con i dati corretti</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.push(`/ddts/${id}`)}
          >
            Torna al Dettaglio
          </Button>
          <Button
            onClick={() => router.push('/ddts/new')}
          >
            Crea Nuovo DDT
          </Button>
        </div>
      </div>
    );
  }

  if (!ddt) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
          <h3 className="mt-4 text-lg font-semibold">DDT non trovato</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Il DDT richiesto non esiste o è stato eliminato
          </p>
          <Button onClick={() => router.push('/ddts')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Torna ai DDT
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/ddts/${id}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Modifica DDT
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            DDT #{ddt.ddt_number} - Stato: Draft
          </p>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Funzionalità in sviluppo</strong>
          <p className="mt-2">
            La modifica dei DDT sarà disponibile a breve. Per ora puoi:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Visualizzare i dettagli del DDT</li>
            <li>Eliminare il DDT se in stato Draft</li>
            <li>Creare un nuovo DDT</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => router.push(`/ddts/${id}`)}
        >
          Torna al Dettaglio
        </Button>
        <Button
          onClick={() => router.push('/ddts/new')}
        >
          Crea Nuovo DDT
        </Button>
      </div>
    </div>
  );
}

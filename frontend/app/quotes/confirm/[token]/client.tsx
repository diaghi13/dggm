'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Loader2, CheckCircle2, XCircle, AlertCircle, FileText, Ban, Download } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface PublicQuoteRevision {
  id: number;
  version: number;
  status: string;
  issue_date: string | null;
  total_amount: number;
  revision_notes: string | null;
  is_current_version: boolean;
}

type QuoteData = {
  token_valid: boolean;
  quote: {
    code: string;
    title: string;
    status: string;
    total_amount: number;
    expiry_date: string | null;
    notes: string | null;
    customer_name: string | null;
  };
  company: {
    name: string;
    logo_url: string | null;
  };
  revisions: PublicQuoteRevision[];
};

type ActionResult = {
  success: boolean;
  action?: 'accepted' | 'rejected';
  code?: string;
  message: string;
  status?: string;
};

type PageState =
  | 'loading'
  | 'invalid'
  | 'obsolete'
  | 'already_actioned'
  | 'pending'
  | 'confirming'
  | 'success'
  | 'error';

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);

const formatDate = (date: string): string =>
  new Date(date).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

const ALREADY_ACTIONED_STATUSES = ['accepted', 'rejected', 'expired', 'cancelled'];

const revisionStatusBadge = (revision: PublicQuoteRevision): { label: string; className: string } => {
  if (revision.is_current_version) {
    return {
      label: 'Revisione corrente',
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    };
  }
  const map: Record<string, { label: string; className: string }> = {
    approved: {
      label: 'Approvata',
      className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    },
    accepted: {
      label: 'Accettata',
      className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    },
    rejected: {
      label: 'Rifiutata',
      className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    },
    expired: {
      label: 'Scaduta',
      className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    },
    sent: {
      label: 'Inviata',
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    },
    draft: {
      label: 'Bozza',
      className: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    },
    converted: {
      label: 'Convertita',
      className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    },
  };
  return (
    map[revision.status] ?? {
      label: 'Obsoleta',
      className: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
    }
  );
};

export default function QuoteConfirmClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = params.token as string;
  const actionParam = searchParams.get('action') as 'accept' | 'reject' | null;

  const [pageState, setPageState] = useState<PageState>('loading');
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [actionResult, setActionResult] = useState<ActionResult | null>(null);
  const [selectedAction, setSelectedAction] = useState<'accept' | 'reject' | null>(
    actionParam ?? null
  );
  const [downloadingRevisionId, setDownloadingRevisionId] = useState<number | null>(null);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const response = await fetch(`${API_BASE}/public/quotes/${token}`, {
          headers: { 'Content-Type': 'application/json' },
        });

        const json = await response.json();

        if (!response.ok || !json.success) {
          setPageState('invalid');
          return;
        }

        const data: QuoteData = json.data;

        if (!data.token_valid) {
          setPageState('invalid');
          return;
        }

        if (!data.quote.is_current_version) {
          setQuoteData(data);
          setPageState('obsolete');
          return;
        }

        if (ALREADY_ACTIONED_STATUSES.includes(data.quote.status)) {
          setQuoteData(data);
          setPageState('already_actioned');
          return;
        }

        setQuoteData(data);
        setPageState('pending');
      } catch {
        setPageState('invalid');
      }
    };

    fetchQuote();
  }, [token]);

  const handleConfirm = async () => {
    if (!selectedAction) return;
    setPageState('confirming');

    try {
      const endpoint = selectedAction === 'accept' ? 'accept' : 'reject';
      const response = await fetch(`${API_BASE}/public/quotes/${token}/${endpoint}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      const json: ActionResult = await response.json();

      setActionResult(json);

      if (json.success) {
        setPageState('success');
      } else {
        setPageState('error');
      }
    } catch {
      setActionResult({ success: false, message: 'Errore di rete. Riprova più tardi.' });
      setPageState('error');
    }
  };

  const handleCancel = () => {
    setSelectedAction(null);
  };

  const handleRevisionPdfDownload = async (revision: PublicQuoteRevision) => {
    if (downloadingRevisionId !== null) return;
    setDownloadingRevisionId(revision.id);
    try {
      const response = await fetch(
        `${API_BASE}/public/quotes/${token}/revisions/${revision.id}/pdf`
      );
      if (!response.ok) throw new Error('Errore nel download del PDF');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `preventivo-${quoteData?.quote.code ?? 'rev'}-rev${revision.version}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      // silently ignore — user can retry
    } finally {
      setDownloadingRevisionId(null);
    }
  };

  const statusLabel = (status: string): string => {
    const map: Record<string, string> = {
      accepted: 'Accettato',
      rejected: 'Rifiutato',
      expired: 'Scaduto',
      cancelled: 'Annullato',
      draft: 'Bozza',
      sent: 'Inviato',
      pending: 'In attesa',
    };
    return map[status] ?? status;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-start py-12 px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        {quoteData && (
          <div className="flex flex-col items-center mb-8">
            {quoteData.company.logo_url ? (
              <Image
                src={quoteData.company.logo_url}
                alt={quoteData.company.name}
                width={120}
                height={60}
                className="object-contain mb-3"
                unoptimized
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center mb-3">
                <FileText className="w-6 h-6 text-slate-500" />
              </div>
            )}
            <p className="text-slate-500 text-sm font-medium">{quoteData.company.name}</p>
          </div>
        )}

        {/* Loading */}
        {pageState === 'loading' && (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400 mb-4" />
            <p className="text-slate-500 text-sm">Caricamento preventivo...</p>
          </div>
        )}

        {/* Invalid token */}
        {pageState === 'invalid' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-50 mx-auto mb-4">
              <XCircle className="w-7 h-7 text-red-500" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900 mb-2">
              Link non valido o scaduto
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              Il link che hai utilizzato non è più attivo. Contatta l&apos;azienda per ricevere
              un nuovo preventivo.
            </p>
          </div>
        )}

        {/* Obsolete revision */}
        {pageState === 'obsolete' && quoteData && (
          <div className="bg-white rounded-2xl shadow-sm border border-amber-200 p-8 text-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-amber-50 mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-amber-500" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900 mb-2">
              Preventivo non più valido
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              Il preventivo <span className="font-medium text-slate-700">{quoteData.quote.code} — Rev {quoteData.quote.version}</span> è stato
              sostituito da una revisione più recente.
            </p>
            <p className="text-slate-500 text-sm leading-relaxed mt-2">
              Contatta l&apos;azienda per ricevere il link aggiornato.
            </p>
          </div>
        )}

        {/* Already actioned */}
        {pageState === 'already_actioned' && quoteData && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-slate-100 mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-slate-500" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900 mb-2">
              Preventivo {statusLabel(quoteData.quote.status).toLowerCase()}
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              Questo preventivo è già stato{' '}
              <span className="font-medium text-slate-700">
                {statusLabel(quoteData.quote.status).toLowerCase()}
              </span>
              . Non è possibile eseguire ulteriori azioni.
            </p>
            <div className="mt-6 pt-6 border-t border-slate-100 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Preventivo</span>
                <span className="text-slate-900 font-medium">{quoteData.quote.code}</span>
              </div>
              {quoteData.quote.customer_name && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Cliente</span>
                  <span className="text-slate-900">{quoteData.quote.customer_name}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main pending / confirm view */}
        {(pageState === 'pending' || pageState === 'confirming') && quoteData && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Quote summary */}
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileText className="w-4 h-4 text-slate-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5">
                    Preventivo
                  </p>
                  <h1 className="text-lg font-semibold text-slate-900 leading-tight">
                    {quoteData.quote.code}
                  </h1>
                  {quoteData.quote.title && (
                    <p className="text-sm text-slate-500 mt-0.5 truncate">
                      {quoteData.quote.title}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {quoteData.quote.customer_name && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Cliente</span>
                    <span className="text-sm font-medium text-slate-900">
                      {quoteData.quote.customer_name}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Totale</span>
                  <span className="text-base font-semibold text-slate-900">
                    {formatCurrency(quoteData.quote.total_amount)}
                  </span>
                </div>
                {quoteData.quote.expiry_date && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Valido fino al</span>
                    <span className="text-sm font-medium text-slate-900">
                      {formatDate(quoteData.quote.expiry_date)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Storico Revisioni */}
            {quoteData.revisions && quoteData.revisions.length > 0 && (
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
                <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-3">
                  Storico Revisioni
                </h2>
                <div className="space-y-3">
                  {quoteData.revisions.map((revision) => {
                    const badge = revisionStatusBadge(revision);
                    const isDownloading = downloadingRevisionId === revision.id;
                    return (
                      <div
                        key={revision.id}
                        className="flex flex-col gap-1.5 pb-3 border-b border-slate-50 dark:border-slate-800 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 w-10 flex-shrink-0">
                            Rev {revision.version}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                          {revision.issue_date && (
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              {new Date(revision.issue_date).toLocaleDateString('it-IT', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })}
                            </span>
                          )}
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-100 ml-auto">
                            {formatCurrency(revision.total_amount)}
                          </span>
                          <button
                            onClick={() => handleRevisionPdfDownload(revision)}
                            disabled={downloadingRevisionId !== null}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                          >
                            {isDownloading ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Download className="w-3 h-3" />
                            )}
                            {isDownloading ? 'Scaricamento...' : `Scarica Rev ${revision.version}`}
                          </button>
                        </div>
                        {revision.revision_notes && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 pl-12 italic">
                            &ldquo;{revision.revision_notes}&rdquo;
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action section */}
            <div className="p-6">
              {!selectedAction ? (
                // No action pre-selected — show both buttons
                <div className="space-y-3">
                  <p className="text-sm text-slate-500 text-center mb-4">
                    Cosa vuoi fare con questo preventivo?
                  </p>
                  <button
                    onClick={() => setSelectedAction('accept')}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Accetta preventivo
                  </button>
                  <button
                    onClick={() => setSelectedAction('reject')}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-sm font-medium transition-colors"
                  >
                    <Ban className="w-4 h-4" />
                    Rifiuta preventivo
                  </button>
                </div>
              ) : (
                // Action selected — show banner + confirm
                <div className="space-y-4">
                  {/* Banner */}
                  {selectedAction === 'accept' ? (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold">Stai per ACCETTARE questo preventivo</p>
                        <p className="text-xs mt-0.5 text-emerald-700">
                          L&apos;azienda verrà notificata della tua accettazione.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800">
                      <Ban className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold">Stai per RIFIUTARE questo preventivo</p>
                        <p className="text-xs mt-0.5 text-red-700">
                          L&apos;azienda verrà notificata del rifiuto.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <button
                    onClick={handleConfirm}
                    disabled={pageState === 'confirming'}
                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                      selectedAction === 'accept'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {pageState === 'confirming' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Conferma in corso...
                      </>
                    ) : selectedAction === 'accept' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Conferma accettazione
                      </>
                    ) : (
                      <>
                        <Ban className="w-4 h-4" />
                        Conferma rifiuto
                      </>
                    )}
                  </button>

                  {/* Cancel link — hidden during confirming */}
                  {pageState !== 'confirming' && (
                    <button
                      onClick={handleCancel}
                      className="w-full text-center text-sm text-slate-400 hover:text-slate-600 transition-colors py-1"
                    >
                      Annulla
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success */}
        {pageState === 'success' && actionResult && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
            {actionResult.action === 'accepted' ? (
              <>
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 mx-auto mb-5">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h1 className="text-xl font-semibold text-slate-900 mb-2">
                  Preventivo accettato!
                </h1>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Riceverai presto conferma dall&apos;azienda. Grazie per la tua fiducia.
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mx-auto mb-5">
                  <Ban className="w-8 h-8 text-slate-500" />
                </div>
                <h1 className="text-xl font-semibold text-slate-900 mb-2">
                  Preventivo rifiutato
                </h1>
                <p className="text-slate-500 text-sm leading-relaxed">
                  L&apos;azienda sarà notificata della tua decisione.
                </p>
              </>
            )}
            {quoteData && (
              <div className="mt-6 pt-6 border-t border-slate-100 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Preventivo</span>
                  <span className="text-slate-900 font-medium">{quoteData.quote.code}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {pageState === 'error' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-50 mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900 mb-2">
              Qualcosa è andato storto
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              {actionResult?.message || 'Si è verificato un errore. Riprova più tardi.'}
            </p>
            <button
              onClick={() => {
                setPageState('pending');
                setActionResult(null);
              }}
              className="mt-6 text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              Torna al preventivo
            </button>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-8">
          {quoteData?.company.name ?? 'DGGM ERP'} &mdash; Documento sicuro
        </p>
      </div>
    </div>
  );
}

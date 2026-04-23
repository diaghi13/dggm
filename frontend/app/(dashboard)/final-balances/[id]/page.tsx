'use client';

import React, { useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { finalBalancesApi } from '@/lib/api/final-balances';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileCheck,
  FileDown,
  Loader2,
  Trash2,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ProtectedRoute } from '@/components/features/auth/protected-route';
import { FinalBalanceItemsEditor } from '../_components/final-balance-items-editor';
import { FinalBalanceMetaPanel } from '../_components/final-balance-meta-panel';
import type { FinalBalanceStatus, UpdateFinalBalanceInput } from '@/lib/types';

// ─── Status config ────────────────────────────────────────────────────────────

const statusBadgeConfig: Record<
  FinalBalanceStatus,
  { label: string; className: string; icon: React.ElementType }
> = {
  draft: {
    label: 'Bozza',
    className:
      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-600',
    icon: Clock,
  },
  finalized: {
    label: 'Finalizzato',
    className:
      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700',
    icon: FileCheck,
  },
  approved: {
    label: 'Approvato',
    className:
      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-300 dark:border-green-700',
    icon: CheckCircle2,
  },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FinalBalanceDetailPage() {
  return (
    <ProtectedRoute permission="projects.view">
      <FinalBalanceDetailContent />
    </ProtectedRoute>
  );
}

function FinalBalanceDetailContent() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = parseInt(params.id as string);

  const [confirmFinalize, setConfirmFinalize] = React.useState(false);
  const [confirmApprove, setConfirmApprove] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const { data: fb, isLoading, error } = useQuery({
    queryKey: ['final-balance', id],
    queryFn: () => finalBalancesApi.getById(id),
    enabled: !!id && !isNaN(id),
  });

  const refetchFb = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['final-balance', id] });
  }, [queryClient, id]);

  const finalizeMutation = useMutation({
    mutationFn: () => finalBalancesApi.finalize(id),
    onSuccess: () => {
      toast.success('Final Balance finalizzato');
      refetchFb();
    },
    onError: () => toast.error('Errore durante la finalizzazione'),
  });

  const approveMutation = useMutation({
    mutationFn: () => finalBalancesApi.approve(id),
    onSuccess: () => {
      toast.success('Final Balance approvato');
      refetchFb();
    },
    onError: () => toast.error('Errore durante l\'approvazione'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => finalBalancesApi.delete(id),
    onSuccess: () => {
      toast.success('Final Balance eliminato');
      router.push('/final-balances');
    },
    onError: () => toast.error('Errore durante l\'eliminazione'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateFinalBalanceInput) => finalBalancesApi.update(id, data),
    onSuccess: () => {
      refetchFb();
    },
    onError: () => toast.error('Errore durante il salvataggio'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Caricamento Final Balance...</span>
        </div>
      </div>
    );
  }

  if (error || !fb) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-slate-500 dark:text-slate-400">Final Balance non trovato.</p>
        <Button
          variant="outline"
          onClick={() => router.push('/final-balances')}
          className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna alla lista
        </Button>
      </div>
    );
  }

  const statusCfg = statusBadgeConfig[fb.status];
  const StatusIcon = statusCfg.icon;
  const isReadOnly = fb.status === 'approved';
  const items = fb.items ?? [];

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Left: breadcrumb + title */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/final-balances')}
                className="h-7 px-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Final Balance
              </Button>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="font-mono text-slate-600 dark:text-slate-400">{fb.code}</span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {fb.title}
              </h1>
              <Badge
                variant="outline"
                className="font-mono text-xs border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
              >
                {fb.code}
              </Badge>
              <Badge variant="outline" className={statusCfg.className}>
                <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
                {statusCfg.label}
              </Badge>
              {fb.is_partial && (
                <Badge
                  variant="outline"
                  className="border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400"
                >
                  <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                  Parziale
                </Badge>
              )}
            </div>

            {/* Project link */}
            {fb.project_id && fb.project_name && (
              <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                <span>Progetto:</span>
                <Link
                  href={`/projects/${fb.project_id}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  {fb.project_name}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>

          {/* Right: action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* PDF button (disabled) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60"
                  >
                    <FileDown className="h-4 w-4 mr-1.5" />
                    PDF
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>PDF disponibile a breve</p>
              </TooltipContent>
            </Tooltip>

            {/* Finalize (draft only) */}
            {fb.status === 'draft' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(true)}
                  className="text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => setConfirmFinalize(true)}
                  disabled={finalizeMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {finalizeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <FileCheck className="h-4 w-4 mr-1.5" />
                  )}
                  Finalizza
                </Button>
              </>
            )}

            {/* Approve (finalized only) */}
            {fb.status === 'finalized' && (
              <Button
                size="sm"
                onClick={() => setConfirmApprove(true)}
                disabled={approveMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {approveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                )}
                Approva
              </Button>
            )}

            {/* Approved: read-only badge */}
            {fb.status === 'approved' && (
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-300 dark:border-green-700 px-3 py-1">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                Documento approvato — sola lettura
              </Badge>
            )}
          </div>
        </div>

        {/* Partial banner */}
        {fb.is_partial && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Questo è un <strong>consuntivo parziale</strong> — il progetto non è ancora completato.
            </p>
          </div>
        )}

        {/* Main layout: 2/3 editor + 1/3 meta */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Items editor (left, 2 cols) */}
          <div className="md:col-span-2">
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Voci del Consuntivo
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {items.filter((i) => i.type !== 'section').length} voci
                </span>
              </div>
              <FinalBalanceItemsEditor
                finalBalanceId={fb.id}
                items={items}
                isReadOnly={isReadOnly}
                onItemsChange={refetchFb}
              />
            </Card>
          </div>

          {/* Meta panel (right, 1 col) */}
          <div className="md:col-span-1">
            <FinalBalanceMetaPanel
              finalBalance={fb}
              onUpdate={() => refetchFb()}
              isReadOnly={isReadOnly}
            />
          </div>
        </div>

        {/* ── Confirm: Finalize ── */}
        <AlertDialog open={confirmFinalize} onOpenChange={setConfirmFinalize}>
          <AlertDialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-slate-900 dark:text-slate-100">
                Finalizza il consuntivo?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
                Una volta finalizzato il documento non potrà più essere modificato facilmente.
                Potrai ancora approvarlo in seguito.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                Annulla
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setConfirmFinalize(false);
                  finalizeMutation.mutate();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <FileCheck className="h-4 w-4 mr-1.5" />
                Finalizza
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ── Confirm: Approve ── */}
        <AlertDialog open={confirmApprove} onOpenChange={setConfirmApprove}>
          <AlertDialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-slate-900 dark:text-slate-100">
                Approvare il consuntivo?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
                L&apos;approvazione è definitiva. Il documento diventerà di sola lettura e non
                potrà più essere modificato.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                Annulla
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setConfirmApprove(false);
                  approveMutation.mutate();
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Approva
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ── Confirm: Delete ── */}
        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-slate-900 dark:text-slate-100">
                Eliminare il consuntivo?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
                Il documento <strong className="text-slate-700 dark:text-slate-300">{fb.code}</strong> verrà
                eliminato definitivamente insieme a tutte le sue voci.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                Annulla
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setConfirmDelete(false);
                  deleteMutation.mutate();
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Elimina
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}

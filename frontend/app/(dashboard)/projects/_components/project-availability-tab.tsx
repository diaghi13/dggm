'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectAvailabilityApi } from '@/lib/api/project-availability';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  CheckCircle2,
  AlertCircle,
  XCircle,
  MinusCircle,
  PlayCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  ProjectAvailabilityCheckItem,
  AvailabilityResolution,
} from '@/lib/types';

interface Props {
  projectId: number;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const checkStatusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'In attesa',
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  },
  completed: {
    label: 'Completata',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  resolved: {
    label: 'Risolta',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  },
};

const resolutionBadge: Record<AvailabilityResolution, { label: string; className: string }> = {
  none: {
    label: 'Nessuna',
    className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  },
  reserve_existing: {
    label: 'Prenotato',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  },
  subrental: {
    label: 'Subnoleggio',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  remove_from_project: {
    label: 'Rimosso',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  },
};

export function ProjectAvailabilityTab({ projectId }: Props) {
  const queryClient = useQueryClient();
  const [removingItem, setRemovingItem] = useState<ProjectAvailabilityCheckItem | null>(null);

  const {
    data: latestCheck,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['project-availability', projectId],
    queryFn: () => projectAvailabilityApi.getLatest(projectId),
    enabled: !!projectId,
    retry: false,
  });

  const runCheckMutation = useMutation({
    mutationFn: () => projectAvailabilityApi.runCheck(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-availability', projectId] });
      toast.success('Verifica completata');
    },
    onError: () => toast.error('Errore durante la verifica'),
  });

  const resolveMutation = useMutation({
    mutationFn: ({
      itemId,
      resolution,
    }: {
      itemId: number;
      resolution: AvailabilityResolution;
    }) =>
      projectAvailabilityApi.resolveItem(itemId, { resolution }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-availability', projectId] });
      toast.success('Risolto');
    },
    onError: () => toast.error('Errore durante la risoluzione'),
  });

  const handleReserve = (item: ProjectAvailabilityCheckItem) => {
    resolveMutation.mutate({ itemId: item.id, resolution: 'reserve_existing' });
  };

  const handleSubrental = (item: ProjectAvailabilityCheckItem) => {
    resolveMutation.mutate({ itemId: item.id, resolution: 'subrental' });
  };

  const handleRemove = (item: ProjectAvailabilityCheckItem) => {
    setRemovingItem(item);
  };

  const confirmRemove = () => {
    if (!removingItem) return;
    resolveMutation.mutate(
      { itemId: removingItem.id, resolution: 'remove_from_project' },
      { onSettled: () => setRemovingItem(null) }
    );
  };

  const getAvailabilityColor = (
    available: number,
    planned: number
  ): string => {
    if (available >= planned) return 'text-green-600 dark:text-green-400 font-semibold';
    if (available > 0) return 'text-orange-600 dark:text-orange-400 font-semibold';
    return 'text-red-600 dark:text-red-400 font-semibold';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Verifica Disponibilità
          </h2>
          {latestCheck && (
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Ultima verifica: {formatDate(latestCheck.checked_at)}
              </p>
              <Badge
                className={
                  checkStatusConfig[latestCheck.status]?.className ??
                  checkStatusConfig.pending.className
                }
              >
                {checkStatusConfig[latestCheck.status]?.label ?? latestCheck.status}
              </Badge>
            </div>
          )}
        </div>
        <Button
          onClick={() => runCheckMutation.mutate()}
          disabled={runCheckMutation.isPending}
          className="gap-2"
        >
          {runCheckMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <PlayCircle className="h-4 w-4" />
          )}
          {runCheckMutation.isPending ? 'Verifica in corso...' : 'Esegui Verifica'}
        </Button>
      </div>

      {/* Traffic light summary */}
      {latestCheck && (
        <div className="grid grid-cols-4 gap-3">
          <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/20">
            <CheckCircle2 className="h-8 w-8 text-green-500 dark:text-green-400 shrink-0" />
            <div>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {latestCheck.available_count}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">Disponibili</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-950/20">
            <AlertCircle className="h-8 w-8 text-orange-500 dark:text-orange-400 shrink-0" />
            <div>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                {latestCheck.partial_count}
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400">Parziali</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/20">
            <XCircle className="h-8 w-8 text-red-500 dark:text-red-400 shrink-0" />
            <div>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                {latestCheck.unavailable_count}
              </p>
              <p className="text-xs text-red-600 dark:text-red-400">Non Disponibili</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
            <MinusCircle className="h-8 w-8 text-slate-400 dark:text-slate-500 shrink-0" />
            <div>
              <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                {latestCheck.resolved_count}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Risolti</p>
            </div>
          </div>
        </div>
      )}

      {/* Items table */}
      {isLoading && (
        <div className="flex items-center justify-center py-12 text-slate-500 dark:text-slate-400">
          Caricamento...
        </div>
      )}

      {(isError || !latestCheck) && !isLoading && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 py-12 text-center dark:border-slate-700 dark:bg-slate-800/20">
          <PlayCircle className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Nessuna verifica eseguita
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
            Esegui una verifica per controllare la disponibilità dei materiali
          </p>
        </div>
      )}

      {latestCheck && latestCheck.items.length > 0 && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 dark:border-slate-700">
                <TableHead className="text-slate-700 dark:text-slate-300">Prodotto</TableHead>
                <TableHead className="text-right text-slate-700 dark:text-slate-300">Pianificato</TableHead>
                <TableHead className="text-right text-slate-700 dark:text-slate-300">Disponibile</TableHead>
                <TableHead className="text-right text-slate-700 dark:text-slate-300">Carenza</TableHead>
                <TableHead className="text-slate-700 dark:text-slate-300">Stato</TableHead>
                <TableHead className="text-slate-700 dark:text-slate-300">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {latestCheck.items.map((item) => {
                const isResolved = item.resolution !== 'none';
                const res = resolutionBadge[item.resolution];

                return (
                  <TableRow
                    key={item.id}
                    className="border-slate-100 dark:border-slate-800"
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {item.product_name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {item.product_code}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-slate-700 dark:text-slate-300">
                      {item.planned_qty}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={getAvailabilityColor(item.available_qty, item.planned_qty)}>
                        {item.available_qty}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.shortage_qty > 0 ? (
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          -{item.shortage_qty}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.availability_status === 'available' && !isResolved && (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                          Disponibile
                        </Badge>
                      )}
                      {item.availability_status === 'partial' && !isResolved && (
                        <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                          Parziale
                        </Badge>
                      )}
                      {item.availability_status === 'unavailable' && !isResolved && (
                        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                          Non Disponibile
                        </Badge>
                      )}
                      {isResolved && (
                        <Badge className={res.className}>{res.label}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {!isResolved && item.availability_status !== 'available' && (
                        <div className="flex items-center gap-1.5">
                          {item.available_qty > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReserve(item)}
                              disabled={resolveMutation.isPending}
                              className="text-xs h-7"
                            >
                              Prenota
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSubrental(item)}
                            disabled={resolveMutation.isPending}
                            className="text-xs h-7"
                          >
                            Subnoleggio
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemove(item)}
                            disabled={resolveMutation.isPending}
                            className="text-xs h-7"
                          >
                            Rimuovi
                          </Button>
                        </div>
                      )}
                      {isResolved && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Confirm remove dialog */}
      <AlertDialog open={!!removingItem} onOpenChange={(open) => { if (!open) setRemovingItem(null); }}>
        <AlertDialogContent className="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 dark:text-slate-100">
              Rimuovere dal progetto?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
              Sei sicuro di voler rimuovere{' '}
              <strong className="text-slate-900 dark:text-slate-100">
                {removingItem?.product_name}
              </strong>{' '}
              dal progetto? Questa azione non può essere annullata facilmente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-200 dark:border-slate-700 dark:text-slate-100">
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemove}
            >
              Rimuovi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

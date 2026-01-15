'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { siteWorkersApi } from '@/lib/api/site-workers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SiteWorkerStatusBadge } from '@/components/site-worker-status-badge';
import { SiteRoleBadges } from '@/components/site-role-badge';
import { AssignWorkerDialog } from '@/components/assign-worker-dialog';
import { SiteWorker } from '@/lib/types';
import {
  UserPlus,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Trash2,
  AlertTriangle,
  Play,
  CheckCheck,
  Ban,
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface SiteWorkersTabProps {
  siteId: number;
}

export function SiteWorkersTab({ siteId }: SiteWorkersTabProps) {
  const queryClient = useQueryClient();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<SiteWorker | null>(null);

  const { data: workers, isLoading } = useQuery({
    queryKey: ['site-workers', siteId],
    queryFn: () => siteWorkersApi.getWorkersBySite(siteId),
  });

  const acceptMutation = useMutation({
    mutationFn: (siteWorkerId: number) => siteWorkersApi.acceptAssignment(siteWorkerId),
    onSuccess: () => {
      toast.success('Assegnazione accettata');
      queryClient.invalidateQueries({ queryKey: ['site-workers', siteId] });
    },
    onError: () => {
      toast.error('Errore durante l\'accettazione');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (siteWorkerId: number) => siteWorkersApi.rejectAssignment(siteWorkerId),
    onSuccess: () => {
      toast.success('Assegnazione rifiutata');
      queryClient.invalidateQueries({ queryKey: ['site-workers', siteId] });
    },
    onError: () => {
      toast.error('Errore durante il rifiuto');
    },
  });

  const changeStatusMutation = useMutation({
    mutationFn: ({ siteWorkerId, status }: { siteWorkerId: number; status: any }) =>
      siteWorkersApi.changeStatus(siteWorkerId, { status }),
    onSuccess: () => {
      toast.success('Status aggiornato');
      queryClient.invalidateQueries({ queryKey: ['site-workers', siteId] });
    },
    onError: () => {
      toast.error('Errore durante l\'aggiornamento');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (siteWorkerId: number) => siteWorkersApi.removeWorker(siteWorkerId),
    onSuccess: () => {
      toast.success('Lavoratore rimosso dal cantiere');
      queryClient.invalidateQueries({ queryKey: ['site-workers', siteId] });
    },
    onError: () => {
      toast.error('Errore durante la rimozione');
    },
  });

  const pendingWorkers = workers?.filter((w) => w.status === 'pending') || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-slate-500">
            <p>Caricamento...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Alert */}
      {pendingWorkers.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Ci sono {pendingWorkers.length} lavorator{pendingWorkers.length === 1 ? 'e' : 'i'}{' '}
            in attesa di conferma
          </AlertDescription>
        </Alert>
      )}

      {/* Workers Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Squadra Cantiere</CardTitle>
          <Button onClick={() => setAssignDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Assegna Lavoratore
          </Button>
        </CardHeader>
        <CardContent>
          {!workers || workers.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nessun lavoratore assegnato</p>
              <p className="text-sm mt-1">
                Clicca su "Assegna Lavoratore" per comporre la squadra
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lavoratore</TableHead>
                  <TableHead>Ruoli</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Tariffa</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workers.map((worker) => (
                  <TableRow key={worker.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{worker.worker?.full_name}</div>
                        <div className="text-sm text-slate-500">
                          {worker.worker?.worker_type === 'employee'
                            ? 'Dipendente'
                            : worker.worker?.worker_type === 'external'
                              ? 'Esterno'
                              : 'Freelancer'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {worker.roles && worker.roles.length > 0 ? (
                        <SiteRoleBadges roles={worker.roles} />
                      ) : (
                        <span className="text-sm text-slate-400">Nessun ruolo</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <SiteWorkerStatusBadge status={worker.status} />
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>
                          {format(new Date(worker.assigned_from), 'dd MMM yyyy', {
                            locale: it,
                          })}
                        </div>
                        {worker.assigned_to && (
                          <div className="text-slate-500">
                            {format(new Date(worker.assigned_to), 'dd MMM yyyy', { locale: it })}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {worker.fixed_rate_override ? (
                        <div className="text-sm">
                          <div className="font-medium">€{worker.fixed_rate_override}</div>
                          <div className="text-slate-500">Forfait</div>
                        </div>
                      ) : worker.hourly_rate_override ? (
                        <div className="text-sm">
                          <div className="font-medium">€{worker.hourly_rate_override}/h</div>
                          <div className="text-slate-500">Override</div>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">Tariffa std.</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Azioni</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {worker.status === 'pending' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => acceptMutation.mutate(worker.id)}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Accetta
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => rejectMutation.mutate(worker.id)}>
                                <XCircle className="h-4 w-4 mr-2" />
                                Rifiuta
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          {worker.status === 'accepted' && (
                            <DropdownMenuItem
                              onClick={() =>
                                changeStatusMutation.mutate({
                                  siteWorkerId: worker.id,
                                  status: 'active',
                                })
                              }
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Attiva
                            </DropdownMenuItem>
                          )}
                          {worker.status === 'active' && (
                            <DropdownMenuItem
                              onClick={() =>
                                changeStatusMutation.mutate({
                                  siteWorkerId: worker.id,
                                  status: 'completed',
                                })
                              }
                            >
                              <CheckCheck className="h-4 w-4 mr-2" />
                              Completa
                            </DropdownMenuItem>
                          )}
                          {['pending', 'accepted', 'active'].includes(worker.status) && (
                            <DropdownMenuItem
                              onClick={() =>
                                changeStatusMutation.mutate({
                                  siteWorkerId: worker.id,
                                  status: 'cancelled',
                                })
                              }
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Annulla
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => removeMutation.mutate(worker.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Rimuovi
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Assign Worker Dialog */}
      <AssignWorkerDialog
        siteId={siteId}
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
      />
    </div>
  );
}

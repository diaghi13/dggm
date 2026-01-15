'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { siteWorkersApi } from '@/lib/api/site-workers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { SiteWorker, SiteWorkerStatus } from '@/lib/types';
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
  Search,
  Filter,
  X as XIcon,
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

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SiteWorkerStatus | 'all'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const { data: workers, isLoading } = useQuery({
    queryKey: ['site-workers', siteId],
    queryFn: () => siteWorkersApi.getWorkersBySite(siteId),
  });

  // Filtered workers
  const filteredWorkers = useMemo(() => {
    if (!workers) return [];

    return workers.filter((worker) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = worker.worker?.full_name?.toLowerCase().includes(query);
        const matchesType = worker.worker?.worker_type?.toLowerCase().includes(query);

        if (!matchesName && !matchesType) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all' && worker.status !== statusFilter) {
        return false;
      }

      // Role filter
      if (roleFilter !== 'all') {
        if (!worker.roles || !worker.roles.some(role => role.slug === roleFilter)) {
          return false;
        }
      }

      return true;
    });
  }, [workers, searchQuery, statusFilter, roleFilter]);

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

  const pendingWorkers = filteredWorkers?.filter((w) => w.status === 'pending') || [];

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all' || roleFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setRoleFilter('all');
  };

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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Cerca</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Nome lavoratore..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Stato</label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as SiteWorkerStatus | 'all')}>
                <SelectTrigger>
                  <SelectValue placeholder="Tutti gli stati" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli stati</SelectItem>
                  <SelectItem value="pending">In attesa</SelectItem>
                  <SelectItem value="accepted">Accettato</SelectItem>
                  <SelectItem value="rejected">Rifiutato</SelectItem>
                  <SelectItem value="active">Attivo</SelectItem>
                  <SelectItem value="completed">Completato</SelectItem>
                  <SelectItem value="cancelled">Annullato</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Role Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Ruolo</label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tutti i ruoli" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i ruoli</SelectItem>
                  <SelectItem value="worker">Operaio</SelectItem>
                  <SelectItem value="foreman">Caposquadra</SelectItem>
                  <SelectItem value="supervisor">Supervisore</SelectItem>
                  <SelectItem value="technician">Tecnico</SelectItem>
                  <SelectItem value="driver">Autista</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Trovati {filteredWorkers.length} lavoratori su {workers?.length || 0}
              </p>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <XIcon className="h-4 w-4 mr-2" />
                Pulisci Filtri
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
          {!filteredWorkers || filteredWorkers.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-50" />
              {hasActiveFilters ? (
                <>
                  <p>Nessun lavoratore trovato</p>
                  <p className="text-sm mt-1">
                    Prova a modificare i filtri di ricerca
                  </p>
                </>
              ) : (
                <>
                  <p>Nessun lavoratore assegnato</p>
                  <p className="text-sm mt-1">
                    Clicca su "Assegna Lavoratore" per comporre la squadra
                  </p>
                </>
              )}
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
                {filteredWorkers.map((worker) => (
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

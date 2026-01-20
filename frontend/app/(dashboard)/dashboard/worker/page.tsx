'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { siteWorkersApi } from '@/lib/api/site-workers';
import { materialRequestsApi } from '@/lib/api/material-requests';
import { useAuthStore } from '@/stores/auth-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SiteWorkerStatusBadge } from '@/app/(dashboard)/sites/_components/site-worker-status-badge';
import { SiteRoleBadges } from '@/app/(dashboard)/sites/_components/site-role-badge';
import { MaterialRequestStatusBadge } from '@/app/(dashboard)/materials/_components/material-request-status-badge';
import { MaterialRequestPriorityBadge } from '@/app/(dashboard)/materials/_components/material-request-priority-badge';
import { MaterialRequestDialog } from '@/app/(dashboard)/materials/_components/material-request-dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  Briefcase,
  CheckCircle2,
  XCircle,
  Package,
  AlertTriangle,
  Building2,
  UserPlus,
  Clock,
  Plus,
} from 'lucide-react';
import type { SiteWorker, MaterialRequest } from '@/lib/types';

export default function WorkerDashboardPage() {
  const queryClient = useQueryClient();
  const { user, refreshUser } = useAuthStore();
  const [respondDialog, setRespondDialog] = useState<{
    open: boolean;
    assignment: SiteWorker | null;
    action: 'accept' | 'reject';
  }>({
    open: false,
    assignment: null,
    action: 'accept',
  });
  const [notes, setNotes] = useState('');
  const [materialRequestDialog, setMaterialRequestDialog] = useState<{
    open: boolean;
    siteId: number | null;
    siteName: string;
  }>({
    open: false,
    siteId: null,
    siteName: '',
  });

  // Debug: Log user data to see if worker is included
  console.log('🔍 Worker Dashboard - User data:', user);
  console.log('🔍 Worker ID:', user?.worker?.id);

  // Auto-refresh user data if worker field is missing
  useEffect(() => {
    if (user && !user.worker) {
      console.log('⚠️ Worker field missing, refreshing user data...');
      refreshUser().then(() => {
        console.log('✅ User data refreshed');
      }).catch((error) => {
        console.error('❌ Failed to refresh user data:', error);
      });
    }
  }, [user, refreshUser]);

  // Fetch worker's site assignments
  const { data: assignments, isLoading: loadingAssignments } = useQuery({
    queryKey: ['my-site-assignments'],
    queryFn: async () => {
      if (!user?.worker?.id) {
        console.log('⚠️ No worker ID found, returning empty array');
        return [];
      }
      console.log('✅ Fetching assignments for worker ID:', user.worker.id);
      return siteWorkersApi.getSitesByWorker(user.worker.id);
    },
    enabled: !!user?.worker?.id,
  });

  // Fetch worker's material requests
  const { data: materialRequests, isLoading: loadingRequests } = useQuery({
    queryKey: ['my-material-requests'],
    queryFn: () => materialRequestsApi.getMyRequests(),
  });

  const acceptMutation = useMutation({
    mutationFn: (assignmentId: number) =>
      siteWorkersApi.acceptAssignment(assignmentId, notes),
    onSuccess: () => {
      toast.success('Assegnazione accettata');
      queryClient.invalidateQueries({ queryKey: ['my-site-assignments'] });
      closeRespondDialog();
    },
    onError: () => {
      toast.error('Errore durante l\'accettazione');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (assignmentId: number) =>
      siteWorkersApi.rejectAssignment(assignmentId, notes),
    onSuccess: () => {
      toast.success('Assegnazione rifiutata');
      queryClient.invalidateQueries({ queryKey: ['my-site-assignments'] });
      closeRespondDialog();
    },
    onError: () => {
      toast.error('Errore durante il rifiuto');
    },
  });

  const openRespondDialog = (assignment: SiteWorker, action: 'accept' | 'reject') => {
    setRespondDialog({ open: true, assignment, action });
    setNotes('');
  };

  const closeRespondDialog = () => {
    setRespondDialog({ open: false, assignment: null, action: 'accept' });
    setNotes('');
  };

  const handleRespond = () => {
    if (!respondDialog.assignment) return;

    if (respondDialog.action === 'accept') {
      acceptMutation.mutate(respondDialog.assignment.id);
    } else {
      rejectMutation.mutate(respondDialog.assignment.id);
    }
  };

  const pendingAssignments = assignments?.filter((a) => a.status === 'pending') || [];
  const activeAssignments = assignments?.filter((a) => a.status === 'active') || [];
  const pendingMaterialRequests =
    materialRequests?.filter((r) => r.status === 'pending') || [];

  if (loadingAssignments) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-slate-500">Caricamento...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard Lavoratore</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Benvenuto {user?.name}, gestisci le tue assegnazioni e richieste
        </p>
      </div>

      {/* Pending Assignments Alert */}
      {pendingAssignments.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            Hai {pendingAssignments.length} assegnazion{pendingAssignments.length === 1 ? 'e' : 'i'}{' '}
            in attesa di conferma
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Assegnazioni Attive</CardTitle>
            <Briefcase className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAssignments.length}</div>
            <p className="text-xs text-slate-500 mt-1">Cantieri in corso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Attesa</CardTitle>
            <Clock className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingAssignments.length}</div>
            <p className="text-xs text-slate-500 mt-1">Da confermare</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Richieste Materiale</CardTitle>
            <Package className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingMaterialRequests.length}</div>
            <p className="text-xs text-slate-500 mt-1">In attesa di approvazione</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="assignments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assignments">
            Assegnazioni
            {pendingAssignments.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingAssignments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests">Richieste Materiale</TabsTrigger>
        </TabsList>

        {/* Assignments Tab */}
        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle>Le Mie Assegnazioni</CardTitle>
            </CardHeader>
            <CardContent>
              {!assignments || assignments.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nessuna assegnazione</p>
                  <p className="text-sm mt-1">
                    Quando verrai assegnato a un cantiere lo vedrai qui
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cantiere</TableHead>
                      <TableHead>Ruoli</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Periodo</TableHead>
                      <TableHead>Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{assignment.site?.name}</div>
                            <div className="text-sm text-slate-500">{assignment.site?.code}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {assignment.roles && assignment.roles.length > 0 ? (
                            <SiteRoleBadges roles={assignment.roles} />
                          ) : (
                            <span className="text-sm text-slate-400">Nessun ruolo</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <SiteWorkerStatusBadge status={assignment.status} />
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>
                              {format(new Date(assignment.assigned_from), 'dd MMM yyyy', {
                                locale: it,
                              })}
                            </div>
                            {assignment.assigned_to && (
                              <div className="text-slate-500">
                                {format(new Date(assignment.assigned_to), 'dd MMM yyyy', {
                                  locale: it,
                                })}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {assignment.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => openRespondDialog(assignment, 'accept')}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Accetta
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openRespondDialog(assignment, 'reject')}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Rifiuta
                              </Button>
                            </div>
                          )}
                          {(assignment.status === 'active' || assignment.status === 'accepted') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setMaterialRequestDialog({
                                  open: true,
                                  siteId: assignment.site_id,
                                  siteName: assignment.site?.name || '',
                                })
                              }
                            >
                              <Package className="h-4 w-4 mr-1" />
                              Richiedi Materiale
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Material Requests Tab */}
        <TabsContent value="requests">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Le Mie Richieste Materiale</CardTitle>
              {activeAssignments.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuova Richiesta
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Seleziona Cantiere</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {activeAssignments.map((assignment) => (
                      <DropdownMenuItem
                        key={assignment.id}
                        onClick={() =>
                          setMaterialRequestDialog({
                            open: true,
                            siteId: assignment.site_id,
                            siteName: assignment.site?.name || '',
                          })
                        }
                      >
                        <Building2 className="h-4 w-4 mr-2" />
                        <div>
                          <div className="font-medium">{assignment.site?.name}</div>
                          <div className="text-xs text-slate-500">{assignment.site?.code}</div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </CardHeader>
            <CardContent>
              {loadingRequests ? (
                <div className="text-center py-12 text-slate-500">
                  <p>Caricamento...</p>
                </div>
              ) : !materialRequests || materialRequests.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nessuna richiesta materiale</p>
                  <p className="text-sm mt-1">
                    Puoi richiedere materiale dai cantieri in cui sei attivo
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cantiere</TableHead>
                      <TableHead>Materiale</TableHead>
                      <TableHead>Quantità</TableHead>
                      <TableHead>Priorità</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materialRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="font-medium">{request.site?.name}</div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{request.material?.name}</div>
                            {request.material?.code && (
                              <div className="text-sm text-slate-500">
                                {request.material.code}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>
                              {request.quantity_requested} {request.unit_of_measure}
                            </div>
                            {request.quantity_approved && (
                              <div className="text-sm text-green-600">
                                Approvate: {request.quantity_approved}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <MaterialRequestPriorityBadge priority={request.priority} />
                        </TableCell>
                        <TableCell>
                          <MaterialRequestStatusBadge status={request.status} />
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(request.created_at), 'dd MMM yyyy', {
                              locale: it,
                            })}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Respond to Assignment Dialog */}
      <Dialog open={respondDialog.open} onOpenChange={() => closeRespondDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {respondDialog.action === 'accept' ? 'Accetta' : 'Rifiuta'} Assegnazione
            </DialogTitle>
            <DialogDescription>
              Cantiere: <strong>{respondDialog.assignment?.site?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div>
            <label className="text-sm font-medium">
              {respondDialog.action === 'accept' ? 'Note (opzionale)' : 'Motivo rifiuto *'}
            </label>
            <Textarea
              placeholder={
                respondDialog.action === 'accept'
                  ? 'Aggiungi eventuali note...'
                  : 'Spiega il motivo del rifiuto...'
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeRespondDialog}>
              Annulla
            </Button>
            <Button
              variant={respondDialog.action === 'accept' ? 'default' : 'destructive'}
              onClick={handleRespond}
              disabled={
                (respondDialog.action === 'reject' && !notes) ||
                acceptMutation.isPending ||
                rejectMutation.isPending
              }
            >
              {respondDialog.action === 'accept' ? 'Accetta' : 'Rifiuta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Material Request Dialog */}
      {materialRequestDialog.siteId && (
        <MaterialRequestDialog
          siteId={materialRequestDialog.siteId}
          siteName={materialRequestDialog.siteName}
          open={materialRequestDialog.open}
          onOpenChange={(open) =>
            setMaterialRequestDialog({ ...materialRequestDialog, open })
          }
        />
      )}
    </div>
  );
}

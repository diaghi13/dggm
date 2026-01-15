'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { materialRequestsApi } from '@/lib/api/material-requests';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MaterialRequestStatusBadge } from '@/components/material-request-status-badge';
import { MaterialRequestPriorityBadge } from '@/components/material-request-priority-badge';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  Package,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Truck,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import type { MaterialRequest } from '@/lib/types';

interface MaterialRequestsTabProps {
  siteId: number;
}

export function MaterialRequestsTab({ siteId }: MaterialRequestsTabProps) {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null);
  const [respondDialog, setRespondDialog] = useState<'approve' | 'reject' | null>(null);
  const [responseData, setResponseData] = useState({
    quantity_approved: '',
    response_notes: '',
    rejection_reason: '',
    quantity_delivered: '',
  });

  const { data: requests, isLoading } = useQuery({
    queryKey: ['material-requests', siteId],
    queryFn: () => materialRequestsApi.getRequestsBySite(siteId),
  });

  const approveMutation = useMutation({
    mutationFn: ({ requestId, data }: { requestId: number; data: any }) =>
      materialRequestsApi.approve(requestId, data),
    onSuccess: () => {
      toast.success('Richiesta approvata');
      queryClient.invalidateQueries({ queryKey: ['material-requests', siteId] });
      setRespondDialog(null);
      setSelectedRequest(null);
      setResponseData({ quantity_approved: '', response_notes: '', rejection_reason: '', quantity_delivered: '' });
    },
    onError: () => {
      toast.error('Errore durante l\'approvazione');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ requestId, reason }: { requestId: number; reason: string }) =>
      materialRequestsApi.reject(requestId, reason),
    onSuccess: () => {
      toast.success('Richiesta rifiutata');
      queryClient.invalidateQueries({ queryKey: ['material-requests', siteId] });
      setRespondDialog(null);
      setSelectedRequest(null);
      setResponseData({ quantity_approved: '', response_notes: '', rejection_reason: '', quantity_delivered: '' });
    },
    onError: () => {
      toast.error('Errore durante il rifiuto');
    },
  });

  const deliverMutation = useMutation({
    mutationFn: ({ requestId, quantity }: { requestId: number; quantity?: number }) =>
      materialRequestsApi.markDelivered(requestId, quantity),
    onSuccess: () => {
      toast.success('Richiesta contrassegnata come consegnata');
      queryClient.invalidateQueries({ queryKey: ['material-requests', siteId] });
    },
    onError: () => {
      toast.error('Errore durante l\'aggiornamento');
    },
  });

  const handleApprove = () => {
    if (!selectedRequest) return;

    const data: any = {};
    if (responseData.quantity_approved) {
      data.quantity_approved = parseFloat(responseData.quantity_approved);
    }
    if (responseData.response_notes) {
      data.response_notes = responseData.response_notes;
    }

    approveMutation.mutate({ requestId: selectedRequest.id, data });
  };

  const handleReject = () => {
    if (!selectedRequest) return;
    rejectMutation.mutate({
      requestId: selectedRequest.id,
      reason: responseData.rejection_reason,
    });
  };

  const pendingRequests = requests?.filter((r) => r.status === 'pending') || [];
  const urgentRequests = requests?.filter((r) => r.priority === 'urgent' && r.status === 'pending') || [];

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
      {/* Alerts */}
      {urgentRequests.length > 0 && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-900/10">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            Ci sono {urgentRequests.length} richieste urgenti in attesa
          </AlertDescription>
        </Alert>
      )}

      {pendingRequests.length > 0 && urgentRequests.length === 0 && (
        <Alert>
          <Package className="h-4 w-4" />
          <AlertDescription>
            Ci sono {pendingRequests.length} richieste in attesa di approvazione
          </AlertDescription>
        </Alert>
      )}

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Richieste Materiale</CardTitle>
        </CardHeader>
        <CardContent>
          {!requests || requests.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nessuna richiesta materiale</p>
              <p className="text-sm mt-1">
                I lavoratori possono richiedere materiale dal loro pannello
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lavoratore</TableHead>
                  <TableHead>Materiale</TableHead>
                  <TableHead>Quantità</TableHead>
                  <TableHead>Priorità</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Richiesta</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {request.requested_by_worker?.full_name}
                        </div>
                        <div className="text-sm text-slate-500">
                          {request.requested_by_user?.name}
                        </div>
                      </div>
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
                        <div className="font-medium">
                          {request.quantity_requested} {request.unit_of_measure}
                        </div>
                        {request.quantity_approved && request.quantity_approved !== request.quantity_requested && (
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
                        {format(new Date(request.created_at), 'dd MMM yyyy', { locale: it })}
                      </div>
                      {request.needed_by && (
                        <div className="text-xs text-slate-500">
                          Entro: {format(new Date(request.needed_by), 'dd MMM', { locale: it })}
                        </div>
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
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedRequest(request);
                              // Show details dialog here if needed
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Dettagli
                          </DropdownMenuItem>
                          {request.can_approve && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedRequest(request);
                                setRespondDialog('approve');
                              }}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Approva
                            </DropdownMenuItem>
                          )}
                          {request.can_reject && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedRequest(request);
                                setRespondDialog('reject');
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Rifiuta
                            </DropdownMenuItem>
                          )}
                          {request.can_deliver && (
                            <DropdownMenuItem
                              onClick={() => {
                                deliverMutation.mutate({
                                  requestId: request.id,
                                  quantity: request.quantity_approved || undefined,
                                });
                              }}
                            >
                              <Truck className="h-4 w-4 mr-2" />
                              Segna Consegnata
                            </DropdownMenuItem>
                          )}
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

      {/* Approve Dialog */}
      <Dialog open={respondDialog === 'approve'} onOpenChange={() => setRespondDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approva Richiesta Materiale</DialogTitle>
            <DialogDescription>
              Conferma l'approvazione della richiesta di {selectedRequest?.material?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                Quantità Approvata (opzionale)
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder={`Richieste: ${selectedRequest?.quantity_requested} ${selectedRequest?.unit_of_measure}`}
                value={responseData.quantity_approved}
                onChange={(e) =>
                  setResponseData({ ...responseData, quantity_approved: e.target.value })
                }
              />
              <p className="text-xs text-slate-500 mt-1">
                Lascia vuoto per approvare la quantità richiesta
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Note (opzionale)</label>
              <Textarea
                placeholder="Aggiungi eventuali note..."
                value={responseData.response_notes}
                onChange={(e) =>
                  setResponseData({ ...responseData, response_notes: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRespondDialog(null)}>
              Annulla
            </Button>
            <Button onClick={handleApprove} disabled={approveMutation.isPending}>
              Approva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={respondDialog === 'reject'} onOpenChange={() => setRespondDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rifiuta Richiesta Materiale</DialogTitle>
            <DialogDescription>
              Indica il motivo del rifiuto per {selectedRequest?.material?.name}
            </DialogDescription>
          </DialogHeader>

          <div>
            <label className="text-sm font-medium">Motivazione Rifiuto *</label>
            <Textarea
              placeholder="Spiega perché la richiesta viene rifiutata..."
              value={responseData.rejection_reason}
              onChange={(e) =>
                setResponseData({ ...responseData, rejection_reason: e.target.value })
              }
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRespondDialog(null)}>
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isPending || !responseData.rejection_reason}
            >
              Rifiuta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

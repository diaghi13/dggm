'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MaterialRequestStatusBadge } from '@/app/(dashboard)/products/_components/material-request-status-badge';
import { MaterialRequestPriorityBadge } from '@/app/(dashboard)/products/_components/material-request-priority-badge';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  Package,
  User,
  Calendar,
  Clock,
  MapPin,
  FileText,
  CheckCircle2,
  XCircle,
  Truck,
  AlertCircle,
} from 'lucide-react';
import type { MaterialRequest } from '@/lib/types';

interface MaterialRequestDetailsDialogProps {
  request: MaterialRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MaterialRequestDetailsDialog({
  request,
  open,
  onOpenChange,
}: MaterialRequestDetailsDialogProps) {
  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Dettagli Richiesta Materiale
          </DialogTitle>
          <DialogDescription>
            Richiesta #{request.id} - {request.material?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Priority */}
          <div className="flex items-center gap-3">
            <MaterialRequestStatusBadge status={request.status} />
            <MaterialRequestPriorityBadge priority={request.priority} />
          </div>

          <Separator />

          {/* Material Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Materiale
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 dark:text-slate-400">Nome</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {request.material?.name}
                </p>
              </div>
              {request.material?.code && (
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Codice</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {request.material.code}
                  </p>
                </div>
              )}
              <div>
                <p className="text-slate-500 dark:text-slate-400">Unità di misura</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {request.unit_of_measure || 'Non specificata'}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Quantity Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Quantità
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 dark:text-slate-400">Richiesta</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {request.quantity_requested} {request.unit_of_measure}
                </p>
              </div>
              {request.quantity_approved && (
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Approvata</p>
                  <p className="font-medium text-green-600 dark:text-green-400">
                    {request.quantity_approved} {request.unit_of_measure}
                  </p>
                </div>
              )}
              {request.quantity_delivered && (
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Consegnata</p>
                  <p className="font-medium text-blue-600 dark:text-blue-400">
                    {request.quantity_delivered} {request.unit_of_measure}
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Requester Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <User className="h-4 w-4" />
              Richiedente
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 dark:text-slate-400">Lavoratore</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {request.requested_by_worker?.full_name || 'Non specificato'}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Utente</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {request.requested_by_user?.name || 'Non specificato'}
                </p>
              </div>
            </div>
          </div>

          {request.approved_by_user && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Approvazione
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Approvata da</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {request.approved_by_user.name}
                    </p>
                  </div>
                  {request.approved_at && (
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">Data approvazione</p>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {format(new Date(request.approved_at), 'dd MMM yyyy HH:mm', {
                          locale: it,
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Dates */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 dark:text-slate-400">Richiesta il</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {format(new Date(request.created_at), 'dd MMM yyyy HH:mm', {
                    locale: it,
                  })}
                </p>
              </div>
              {request.needed_by && (
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Necessaria entro</p>
                  <p className="font-medium text-orange-600 dark:text-orange-400">
                    {format(new Date(request.needed_by), 'dd MMM yyyy', { locale: it })}
                  </p>
                </div>
              )}
              {request.delivered_at && (
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Consegnata il</p>
                  <p className="font-medium text-blue-600 dark:text-blue-400">
                    {format(new Date(request.delivered_at), 'dd MMM yyyy HH:mm', {
                      locale: it,
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Notes Section */}
          {(request.notes || request.response_notes || request.rejection_reason) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Note
                </h3>

                {request.notes && (
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Note richiesta
                    </p>
                    <p className="text-sm text-slate-900 dark:text-slate-100">
                      {request.notes}
                    </p>
                  </div>
                )}

                {request.response_notes && (
                  <div className="rounded-lg bg-green-50 dark:bg-green-900/10 p-3">
                    <p className="text-xs text-green-700 dark:text-green-400 mb-1">
                      Note approvazione
                    </p>
                    <p className="text-sm text-slate-900 dark:text-slate-100">
                      {request.response_notes}
                    </p>
                  </div>
                )}

                {request.rejection_reason && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-900/10 p-3">
                    <p className="text-xs text-red-700 dark:text-red-400 mb-1">
                      Motivo rifiuto
                    </p>
                    <p className="text-sm text-slate-900 dark:text-slate-100">
                      {request.rejection_reason}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}


          {/* Timeline */}
          <Separator />
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Cronologia
            </h3>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    Richiesta creata
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">
                    {format(new Date(request.created_at), 'dd MMM yyyy HH:mm', {
                      locale: it,
                    })}
                  </p>
                </div>
              </div>

              {request.status === 'approved' && request.approved_at && (
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-green-500 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      Richiesta approvata
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      {format(new Date(request.approved_at), 'dd MMM yyyy HH:mm', {
                        locale: it,
                      })}
                    </p>
                  </div>
                </div>
              )}

              {request.status === 'rejected' && request.responded_at && (
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-red-500 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      Richiesta rifiutata
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      {format(new Date(request.responded_at), 'dd MMM yyyy HH:mm', {
                        locale: it,
                      })}
                    </p>
                  </div>
                </div>
              )}

              {request.delivered_at && (
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-purple-500 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      Materiale consegnato
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      {format(new Date(request.delivered_at), 'dd MMM yyyy HH:mm', {
                        locale: it,
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState } from 'react';
import { useCancelDdt } from '@/hooks/use-ddts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, XCircle, Package, Undo2 } from 'lucide-react';
import { DdtTypeBadge } from '@/components/warehouse/ddt-type-badge';
import { DdtStatusBadge } from '@/components/warehouse/ddt-status-badge';

interface DdtCancelDialogProps {
  ddt: App.Data.DdtData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DdtCancelDialog({
  ddt,
  open,
  onOpenChange,
  onSuccess,
}: DdtCancelDialogProps) {
  const [reason, setReason] = useState('');
  const cancelMutation = useCancelDdt();

  const handleCancel = async () => {
    if (!reason.trim() || !ddt.id) {
      return;
    }

    cancelMutation.mutate(
      { id: ddt.id, reason: reason.trim() },
      {
        onSuccess: () => {
          setReason('');
          onOpenChange(false);
          onSuccess?.();
        },
      }
    );
  };

  const totalItems = ddt.items?.length || 0;
  const canCancel = ddt.status !== 'delivered' && ddt.status !== 'cancelled';
  const hasMovements = ddt.status === 'issued' || ddt.status === 'in_transit';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            Annulla DDT
          </DialogTitle>
          <DialogDescription>
            Annullare il DDT {ddt.code}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Cannot Cancel Alert */}
          {!canCancel && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Impossibile annullare:</strong>{' '}
                {ddt.status === 'delivered'
                  ? 'Il DDT è già stato consegnato.'
                  : 'Il DDT è già stato annullato.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Warning Alert */}
          {canCancel && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Attenzione:</strong> Questa operazione è irreversibile.
                {hasMovements && (
                  <span className="block mt-1">
                    I movimenti di magazzino generati da questo DDT verranno reversati
                    e le quantità di stock ripristinate.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* DDT Info */}
          <div className="rounded-lg border bg-slate-50 dark:bg-slate-900 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Codice DDT</p>
                <p className="font-semibold text-lg">{ddt.code}</p>
              </div>
              <div className="flex gap-2">
                <DdtTypeBadge type={ddt.type as App.Enums.DdtType} />
                <DdtStatusBadge status={ddt.status as App.Enums.DdtStatus} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Numero DDT</p>
                <p className="font-medium">{ddt.ddt_number}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Data</p>
                <p className="font-medium">
                  {new Date(ddt.ddt_date).toLocaleDateString('it-IT')}
                </p>
              </div>
            </div>

            {/* Items Summary */}
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">Articoli</span>
                </div>
                <div className="font-medium">{totalItems} articoli</div>
              </div>
            </div>
          </div>

          {/* Reason Input */}
          {canCancel && (
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-sm font-medium">
                Motivo Annullamento <span className="text-red-600">*</span>
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Inserisci il motivo dell'annullamento (obbligatorio)..."
                rows={4}
                className="resize-none"
                disabled={cancelMutation.isPending}
              />
              {reason.trim().length < 10 && reason.length > 0 && (
                <p className="text-xs text-red-600">
                  Il motivo deve essere di almeno 10 caratteri
                </p>
              )}
            </div>
          )}

          {/* Info Box */}
          {canCancel && hasMovements && (
            <div className="rounded-lg bg-orange-50 dark:bg-orange-950 p-4">
              <div className="flex items-start gap-2">
                <Undo2 className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                    Cosa succederà:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-orange-800 dark:text-orange-200">
                    <li>• Il DDT passerà allo stato "Annullato"</li>
                    <li>• I movimenti di magazzino verranno reversati</li>
                    <li>• Le quantità di stock verranno ripristinate</li>
                    <li>• L'operazione verrà registrata nello storico</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setReason('');
              onOpenChange(false);
            }}
            disabled={cancelMutation.isPending}
          >
            Chiudi
          </Button>
          {canCancel && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelMutation.isPending || reason.trim().length < 10}
            >
              {cancelMutation.isPending ? (
                <>
                  <span className="mr-2">Annullando...</span>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Annulla DDT
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState } from 'react';
import { useConfirmDdt } from '@/hooks/use-ddts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Package } from 'lucide-react';
import { DdtTypeBadge } from '@/components/warehouse/ddt-type-badge';

interface DdtConfirmDialogProps {
  ddt: App.Data.DdtData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DdtConfirmDialog({
  ddt,
  open,
  onOpenChange,
  onSuccess,
}: DdtConfirmDialogProps) {
  const confirmMutation = useConfirmDdt();

  const handleConfirm = async () => {
    if (!ddt.id) {
      console.log('DDT ID is missing');
      return;
    }

    confirmMutation.mutate(ddt.id, {
      onSuccess: () => {
        onOpenChange(false);
        onSuccess?.();
      },
    });
  };

  const totalItems = ddt.items?.length || 0;
  const totalQuantity = ddt.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Conferma DDT
          </DialogTitle>
          <DialogDescription>
            Confermare il DDT {ddt.code} e generare i movimenti di stock?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning Alert */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Attenzione:</strong> Questa operazione è irreversibile.
              Una volta confermato, il DDT non potrà più essere modificato e verranno
              generati automaticamente i movimenti di magazzino.
            </AlertDescription>
          </Alert>

          {/* DDT Info */}
          <div className="rounded-lg border bg-slate-50 dark:bg-slate-900 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Codice DDT</p>
                <p className="font-semibold text-lg">{ddt.code}</p>
              </div>
              <DdtTypeBadge type={ddt.type as App.Enums.DdtType} />
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

            {/* Warehouses */}
            {(ddt.from_warehouse || ddt.to_warehouse) && (
              <div className="pt-2 border-t">
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">Magazzini</p>
                <div className="flex items-center gap-2 text-sm">
                  {ddt.from_warehouse && (
                    <Badge variant="outline" className="gap-1">
                      <span className="text-red-600">←</span>
                      {ddt.from_warehouse.name}
                    </Badge>
                  )}
                  {ddt.to_warehouse && (
                    <Badge variant="outline" className="gap-1">
                      <span className="text-green-600">→</span>
                      {ddt.to_warehouse.name}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Items Summary */}
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">Articoli</span>
                </div>
                <div className="font-medium">
                  {totalItems} articoli ({totalQuantity.toFixed(2)} unità totali)
                </div>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Cosa succederà:</strong>
            </p>
            <ul className="mt-2 space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>• Il DDT passerà allo stato &#34;Emesso&#34;</li>
              <li>• Verranno creati automaticamente {totalItems} movimenti di magazzino</li>
              <li>• Le quantità di stock verranno aggiornate</li>
              <li>• Il DDT non sarà più modificabile</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={confirmMutation.isPending}
          >
            Annulla
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={confirmMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {confirmMutation.isPending ? (
              <>
                <span className="mr-2">Confermando...</span>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Conferma DDT
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

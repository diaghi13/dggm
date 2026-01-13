'use client';

import { AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface DdtPendingAlertProps {
  pendingCount: number;
  onViewAll: () => void;
  onConfirmAll: () => void;
  isConfirming?: boolean;
}

export function DdtPendingAlert({
  pendingCount,
  onViewAll,
  onConfirmAll,
  isConfirming = false,
}: DdtPendingAlertProps) {
  if (pendingCount === 0) {
    return null;
  }

  return (
    <Alert className="border-amber-200 bg-amber-50">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <span className="font-semibold text-amber-900">
            {pendingCount} DDT {pendingCount === 1 ? 'in attesa' : 'in attesa'}
          </span>
          <span className="text-amber-700 ml-2">
            di conferma ricezione
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onViewAll}
            className="border-amber-300 text-amber-900 hover:bg-amber-100"
          >
            Visualizza
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onConfirmAll}
            disabled={isConfirming}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isConfirming ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4 animate-spin" />
                Confermando...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Conferma Tutti
              </>
            )}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

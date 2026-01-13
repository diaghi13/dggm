'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
import { ChevronDown, Send, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface QuoteStatusDropdownProps {
  currentStatus: string;
  onStatusChange: (status: string) => void;
  disabled?: boolean;
}

const statusConfig = {
  draft: {
    label: 'Bozza',
    icon: Clock,
    nextStatuses: ['sent', 'approved', 'rejected'],
  },
  sent: {
    label: 'Inviato',
    icon: Send,
    nextStatuses: ['approved', 'rejected', 'expired'],
  },
  approved: {
    label: 'Approvato',
    icon: CheckCircle2,
    nextStatuses: [],
  },
  rejected: {
    label: 'Rifiutato',
    icon: XCircle,
    nextStatuses: ['draft'],
  },
  expired: {
    label: 'Scaduto',
    icon: Clock,
    nextStatuses: ['draft'],
  },
};

const statusActionConfig: Record<string, { label: string; description: string; icon: any }> = {
  sent: {
    label: 'Invia al Cliente',
    description: 'Segna il preventivo come inviato al cliente',
    icon: Send,
  },
  approved: {
    label: 'Approva e Converti',
    description: 'Il preventivo verrà approvato e automaticamente convertito in cantiere',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rifiuta',
    description: 'Segna il preventivo come rifiutato dal cliente',
    icon: XCircle,
  },
  expired: {
    label: 'Segna come Scaduto',
    description: 'Il preventivo è scaduto e non è più valido',
    icon: Clock,
  },
  draft: {
    label: 'Torna a Bozza',
    description: 'Riporta il preventivo in stato bozza per modifiche',
    icon: Clock,
  },
};

export function QuoteStatusDropdown({
  currentStatus,
  onStatusChange,
  disabled = false,
}: QuoteStatusDropdownProps) {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const config = statusConfig[currentStatus as keyof typeof statusConfig];
  const availableStatuses = config?.nextStatuses || [];

  const handleStatusClick = (status: string) => {
    setSelectedStatus(status);
    setConfirmDialogOpen(true);
  };

  const handleConfirm = () => {
    if (selectedStatus) {
      onStatusChange(selectedStatus);
    }
    setConfirmDialogOpen(false);
    setSelectedStatus(null);
  };

  if (!config || availableStatuses.length === 0) {
    return null;
  }

  const selectedConfig = selectedStatus ? statusActionConfig[selectedStatus] : null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={disabled}>
            Cambia Stato
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {availableStatuses.map((status) => {
            const actionConfig = statusActionConfig[status];
            const Icon = actionConfig.icon;
            return (
              <DropdownMenuItem
                key={status}
                onClick={() => handleStatusClick(status)}
                className="cursor-pointer"
              >
                <Icon className="mr-2 h-4 w-4" />
                {actionConfig.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedConfig?.label}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedConfig?.description}
              {selectedStatus === 'approved' && (
                <span className="block mt-2 font-medium text-emerald-600 dark:text-emerald-400">
                  Questa azione creerà automaticamente un nuovo cantiere.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Conferma
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

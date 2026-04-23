'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { finalBalancesApi } from '@/lib/api/final-balances';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  FileCheck,
  Plus,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { GenerateFinalBalanceDialog } from '@/app/(dashboard)/final-balances/_components/generate-final-balance-dialog';
import { CurrencyDisplay } from '@/components/ui/currency-input';
import type { FinalBalanceDoc, FinalBalanceStatus } from '@/lib/types';

interface ProjectFinalBalanceSectionProps {
  projectId: number;
  hasQuote?: boolean;
}

const statusConfig: Record<
  FinalBalanceStatus,
  { label: string; className: string; icon: React.ElementType }
> = {
  draft: {
    label: 'Bozza',
    className:
      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-600',
    icon: Clock,
  },
  finalized: {
    label: 'Finalizzato',
    className:
      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700',
    icon: FileCheck,
  },
  approved: {
    label: 'Approvato',
    className:
      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-300 dark:border-green-700',
    icon: CheckCircle2,
  },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('it-IT');
}

function FinalBalanceCard({
  fb,
  onOpen,
}: {
  fb: FinalBalanceDoc;
  onOpen: (id: number) => void;
}) {
  const cfg = statusConfig[fb.status];
  const StatusIcon = cfg.icon;

  return (
    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left: info */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Code + badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className="font-mono text-xs border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
              >
                {fb.code}
              </Badge>
              <Badge variant="outline" className={cfg.className}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {cfg.label}
              </Badge>
              {fb.is_partial && (
                <Badge
                  variant="outline"
                  className="text-xs border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400"
                >
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Parziale
                </Badge>
              )}
            </div>

            {/* Title */}
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
              {fb.title}
            </p>

            {/* Date */}
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Calendar className="h-3 w-3" />
              {formatDate(fb.issue_date)}
            </div>
          </div>

          {/* Right: total + action */}
          <div className="flex-shrink-0 flex flex-col items-end gap-3">
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400">Totale</p>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                <CurrencyDisplay value={fb.total_amount} />
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => onOpen(fb.id)}
              className="h-7 text-xs"
            >
              Apri
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProjectFinalBalanceSection({
  projectId,
  hasQuote = false,
}: ProjectFinalBalanceSectionProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: finalBalances, isLoading, refetch } = useQuery<FinalBalanceDoc[]>({
    queryKey: ['project-final-balances', projectId],
    queryFn: () => finalBalancesApi.getByProject(projectId),
  });

  const handleOpen = (id: number) => {
    router.push(`/final-balances/${id}`);
  };

  const handleGenerated = (id: number) => {
    router.push(`/final-balances/${id}`);
  };

  const items = finalBalances ?? [];

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Consuntivi
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Consuntivi e rendiconto finale del progetto
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Nuovo Consuntivo
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">Caricamento...</p>
        </div>
      ) : items.length === 0 ? (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 border-dashed">
          <CardContent className="pt-8 pb-8 text-center">
            <FileCheck className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
              Nessun Consuntivo
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Genera il consuntivo finale del progetto partendo dai dati raccolti.
            </p>
            <Button
              size="sm"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Genera Consuntivo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((fb) => (
            <FinalBalanceCard key={fb.id} fb={fb} onOpen={handleOpen} />
          ))}
        </div>
      )}

      {/* Generate Dialog */}
      <GenerateFinalBalanceDialog
        projectId={projectId}
        hasQuote={hasQuote}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onGenerated={handleGenerated}
      />
    </div>
  );
}

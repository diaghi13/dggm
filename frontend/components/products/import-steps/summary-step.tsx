'use client';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  X,
  FileCheck,
  FileX,
} from 'lucide-react';
import type { ImportSummary } from '../product-import-dialog';

interface SummaryStepProps {
  summary: ImportSummary;
  onClose: () => void;
  onNewImport: () => void;
}

export function SummaryStep({ summary, onClose, onNewImport }: SummaryStepProps) {
  const successRate = summary.total > 0
    ? Math.round((summary.imported / summary.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Main Status Card */}
      <div
        className={`p-6 rounded-lg border-2 ${
          summary.success && !summary.hasErrors
            ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
            : summary.success && summary.hasErrors
            ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20'
            : 'border-red-500 bg-red-50 dark:bg-red-950/20'
        }`}
      >
        <div className="flex items-start gap-4">
          {summary.success && !summary.hasErrors ? (
            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400 flex-shrink-0" />
          ) : summary.success && summary.hasErrors ? (
            <AlertTriangle className="h-12 w-12 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          ) : (
            <XCircle className="h-12 w-12 text-red-600 dark:text-red-400 flex-shrink-0" />
          )}

          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-2">
              {summary.success && !summary.hasErrors
                ? 'Importazione Completata con Successo!'
                : summary.success && summary.hasErrors
                ? 'Importazione Completata con Avvisi'
                : 'Importazione Fallita'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {summary.success && !summary.hasErrors
                ? 'Tutti i prodotti sono stati importati correttamente.'
                : summary.success && summary.hasErrors
                ? 'Alcuni prodotti sono stati importati, ma ci sono stati degli errori.'
                : 'Nessun prodotto è stato importato a causa di errori.'}
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-3">
            <FileCheck className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <div className="text-sm text-muted-foreground">Totale Righe</div>
              <div className="text-2xl font-bold">{summary.total}</div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            <div>
              <div className="text-sm text-muted-foreground">Importati</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {summary.imported}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-3">
            <FileX className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            <div>
              <div className="text-sm text-muted-foreground">Saltati</div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {summary.skipped}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Rate */}
      <div className="p-4 rounded-lg border bg-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Tasso di Successo</span>
          <Badge
            variant={successRate === 100 ? 'default' : successRate >= 80 ? 'secondary' : 'destructive'}
          >
            {successRate}%
          </Badge>
        </div>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              successRate === 100
                ? 'bg-green-500'
                : successRate >= 80
                ? 'bg-blue-500'
                : 'bg-amber-500'
            }`}
            style={{ width: `${successRate}%` }}
          />
        </div>
      </div>

      {/* Errors List */}
      {summary.hasErrors && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Errori Rilevati ({summary.errors.length})</AlertTitle>
          <AlertDescription>
            <div className="mt-3 space-y-1 max-h-[200px] overflow-y-auto">
              {summary.errors.map((error, index) => (
                <div
                  key={index}
                  className="text-xs font-mono bg-destructive/10 p-2 rounded border border-destructive/20"
                >
                  {error}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button onClick={onNewImport} variant="outline" className="flex-1">
          <RefreshCw className="h-4 w-4 mr-2" />
          Nuova Importazione
        </Button>
        <Button onClick={onClose} className="flex-1">
          <X className="h-4 w-4 mr-2" />
          Chiudi
        </Button>
      </div>
    </div>
  );
}
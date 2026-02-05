'use client';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  AlertCircle,
  Upload,
  Loader2,
} from 'lucide-react';
import type { ColumnMapping, ParsedRow, ImportProgress } from '../product-import-dialog';

interface ConfirmationStepProps {
  parsedData: ParsedRow[];
  mappings: ColumnMapping[];
  onImport: () => Promise<void>;
  isImporting: boolean;
  importProgress?: ImportProgress | null;
}

export function ConfirmationStep({
  parsedData,
  mappings,
  onImport,
  isImporting,
  importProgress,
}: ConfirmationStepProps) {
  const validRows = parsedData.filter((row) => !row.errors);
  const invalidRows = parsedData.filter((row) => row.errors);
  const mappedFields = mappings.filter((m) => m.dbField !== null);

  const progressPercentage = importProgress
    ? ((importProgress.imported + importProgress.skipped) / importProgress.total) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="p-6 rounded-lg border bg-card space-y-4">
        <h3 className="font-semibold text-lg">Riepilogo Importazione</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">
              Righe da importare
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {validRows.length}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">
              Righe scartate
            </div>
            <div className="text-2xl font-bold text-destructive">
              {invalidRows.length}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="text-sm text-muted-foreground mb-2">
            Campi mappati
          </div>
          <div className="flex flex-wrap gap-2">
            {mappedFields.map((mapping) => (
              <Badge key={mapping.dbField} variant="secondary">
                {mapping.dbField}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Warnings */}
      {invalidRows.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Attenzione:</strong> {invalidRows.length} righe contengono
            errori e non saranno importate. Potrai correggerle e importarle
            successivamente.
          </AlertDescription>
        </Alert>
      )}

      {validRows.length === 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Nessuna riga valida da importare.</strong> Torna indietro e
            correggi gli errori prima di procedere.
          </AlertDescription>
        </Alert>
      )}

      {/* Import Progress */}
      {isImporting && importProgress && (
        <div className="space-y-3 p-6 rounded-lg border bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="font-medium">Importazione in corso...</span>
            </div>
            <span className="text-sm font-medium">
              {importProgress.currentChunk} / {importProgress.totalChunks} chunks
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              Importati: <strong className="text-green-600">{importProgress.imported}</strong>
            </span>
            <span>
              Saltati: <strong className="text-amber-600">{importProgress.skipped}</strong>
            </span>
            <span>
              Totale: <strong>{importProgress.total}</strong>
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Attendere, i prodotti vengono inseriti nel database in gruppi di 50...
          </p>
        </div>
      )}

      {/* Success State */}
      {!isImporting && validRows.length > 0 && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            Tutto pronto per l'importazione! Clicca su "Importa Prodotti" per
            procedere.
          </AlertDescription>
        </Alert>
      )}

      {/* Important Notes */}
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">Note Importanti</h4>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>
            I prodotti saranno creati con i dati forniti nel file Excel
          </li>
          <li>
            I codici prodotto devono essere univoci (duplicati verranno scartati)
          </li>
          <li>
            L'importazione potrebbe richiedere alcuni secondi per file di grandi dimensioni
          </li>
          <li>
            Potrai modificare i prodotti importati in qualsiasi momento
          </li>
        </ul>
      </div>

      {/* Import Button */}
      {!isImporting && validRows.length > 0 && (
        <Button
          onClick={onImport}
          className="w-full"
          size="lg"
          disabled={isImporting}
        >
          <Upload className="h-4 w-4 mr-2" />
          Importa {validRows.length} Prodott{validRows.length === 1 ? 'o' : 'i'}
        </Button>
      )}
    </div>
  );
}
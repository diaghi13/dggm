'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileUploadStep } from './import-steps/file-upload-step';
import { ColumnMappingStep } from './import-steps/column-mapping-step';
import { PreviewStep } from './import-steps/preview-step';
import { ConfirmationStep } from './import-steps/confirmation-step';
import { SummaryStep } from './import-steps/summary-step';
import { ArrowLeft, ArrowRight, Upload } from 'lucide-react';
import { productsApi } from '@/lib/api/products';
import { toast } from 'sonner';

export type ImportStep = 'upload' | 'mapping' | 'preview' | 'confirm' | 'summary';

export interface ColumnMapping {
  excelColumn: string; // Single column or composed identifier
  excelColumns?: string[]; // Multiple columns for composition
  dbField: string | null;
  required: boolean;
  separator?: string; // Separator for composed columns (default: empty string)
  isComposed?: boolean; // Flag to indicate if this is a composed field
}

export interface ParsedRow {
  rowIndex: number;
  data: Record<string, any>;
  errors?: string[];
}

export interface ImportProgress {
  total: number;
  imported: number;
  skipped: number;
  errors: string[];
  currentChunk: number;
  totalChunks: number;
}

export interface ImportSummary {
  total: number;
  imported: number;
  skipped: number;
  errors: string[];
  hasErrors: boolean;
  success: boolean;
}

interface ProductImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

export function ProductImportDialog({
  open,
  onOpenChange,
  onImportComplete,
}: ProductImportDialogProps) {
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [defaultProductType, setDefaultProductType] = useState<string>('article');
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);

  const steps: { key: ImportStep; label: string; description: string }[] = [
    {
      key: 'upload',
      label: 'Carica File',
      description: 'Seleziona il file Excel da importare',
    },
    {
      key: 'mapping',
      label: 'Mappa Colonne',
      description: 'Associa le colonne del file ai campi del database',
    },
    {
      key: 'preview',
      label: 'Anteprima',
      description: 'Verifica i dati prima dell\'importazione',
    },
    {
      key: 'confirm',
      label: 'Conferma',
      description: 'Conferma e avvia l\'importazione',
    },
    {
      key: 'summary',
      label: 'Riepilogo',
      description: 'Riepilogo dell\'importazione completata',
    },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);
  const progressValue = ((currentStepIndex + 1) / steps.length) * 100;

  const canGoNext = () => {
    switch (currentStep) {
      case 'upload':
        return excelFile !== null && excelColumns.length > 0;
      case 'mapping':
        return columnMappings.some((m) => m.dbField !== null);
      case 'preview':
        return parsedData.length > 0;
      case 'confirm':
        return false;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const stepOrder: ImportStep[] = ['upload', 'mapping', 'preview', 'confirm'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const stepOrder: ImportStep[] = ['upload', 'mapping', 'preview', 'confirm'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleClose = () => {
    if (!isImporting) {
      setCurrentStep('upload');
      setExcelFile(null);
      setExcelColumns([]);
      setColumnMappings([]);
      setParsedData([]);
      onOpenChange(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <FileUploadStep
            file={excelFile}
            onFileSelect={(file, columns) => {
              setExcelFile(file);
              setExcelColumns(columns);
            }}
            onColumnsExtracted={(columns) => {
              setExcelColumns(columns);
            }}
          />
        );
      case 'mapping':
        return (
          <ColumnMappingStep
            excelColumns={excelColumns}
            mappings={columnMappings}
            onMappingsChange={setColumnMappings}
            defaultProductType={defaultProductType}
            onDefaultProductTypeChange={setDefaultProductType}
          />
        );
      case 'preview':
        return (
          <PreviewStep
            file={excelFile!}
            mappings={columnMappings}
            onDataParsed={setParsedData}
            parsedData={parsedData}
          />
        );
      case 'summary':
        return importSummary ? (
          <SummaryStep
            summary={importSummary}
            onClose={handleClose}
            onNewImport={() => {
              setCurrentStep('upload');
              setExcelFile(null);
              setExcelColumns([]);
              setColumnMappings([]);
              setParsedData([]);
              setImportSummary(null);
            }}
          />
        ) : null;
      case 'confirm':
        return (
          <ConfirmationStep
            parsedData={parsedData}
            mappings={columnMappings}
            onImport={async () => {
              setIsImporting(true);
              try {
                // Filter out invalid rows
                const validRows = parsedData.filter((row) => !row.errors);

                // Check if "type" column is mapped
                const hasTypeColumn = columnMappings.some(
                  (m) => m.dbField === 'type' && m.dbField !== null
                );

                // Prepare products data for import
                const products = validRows.map((row) => {
                  const product: Record<string, any> = {};

                  // Map all fields
                  columnMappings.forEach((mapping) => {
                    if (mapping.dbField && row.data[mapping.dbField] !== undefined) {
                      let value = row.data[mapping.dbField];

                      // Transform specific fields
                      if (mapping.dbField === 'price' || mapping.dbField === 'cost') {
                        value = parseFloat(String(value).replace(',', '.'));
                      }

                      if (mapping.dbField === 'is_active') {
                        const strValue = String(value).toLowerCase();
                        value = ['true', '1', 'si', 'yes'].includes(strValue);
                      }

                      if (mapping.dbField === 'min_stock' || mapping.dbField === 'max_stock') {
                        value = parseInt(String(value), 10);
                      }

                      product[mapping.dbField] = value;
                    }
                  });

                  // If "type" column is not mapped, use default type
                  if (!hasTypeColumn) {
                    product.type = defaultProductType;
                  }

                  return product;
                });

                // Split into chunks of 50 for better performance
                const CHUNK_SIZE = 50;
                const chunks: any[][] = [];
                for (let i = 0; i < products.length; i += CHUNK_SIZE) {
                  chunks.push(products.slice(i, i + CHUNK_SIZE));
                }

                // Initialize progress
                setImportProgress({
                  total: products.length,
                  imported: 0,
                  skipped: 0,
                  errors: [],
                  currentChunk: 0,
                  totalChunks: chunks.length,
                });

                let totalImported = 0;
                let totalSkipped = 0;
                const allErrors: string[] = [];

                // Import chunks sequentially
                for (let i = 0; i < chunks.length; i++) {
                  try {
                    const response = await productsApi.importFromExcel({
                      products: chunks[i]
                    });

                    totalImported += response.data?.imported || 0;
                    totalSkipped += response.data?.skipped || 0;
                    if (response.data?.errors) {
                      allErrors.push(...response.data.errors);
                    }

                    // Update progress
                    setImportProgress({
                      total: products.length,
                      imported: totalImported,
                      skipped: totalSkipped,
                      errors: allErrors,
                      currentChunk: i + 1,
                      totalChunks: chunks.length,
                    });
                  } catch (error: any) {
                    console.error(`Chunk ${i + 1} failed:`, error);
                    allErrors.push(`Errore chunk ${i + 1}: ${error.response?.data?.message || error.message}`);
                  }
                }

                // Create import summary
                const summary: ImportSummary = {
                  total: products.length,
                  imported: totalImported,
                  skipped: totalSkipped,
                  errors: allErrors,
                  hasErrors: allErrors.length > 0,
                  success: totalImported > 0,
                };

                setImportSummary(summary);

                // Show toast notification
                if (totalImported > 0) {
                  toast.success('Import completato', {
                    description: `${totalImported} prodotti importati${totalSkipped > 0 ? `, ${totalSkipped} saltati` : ''}`,
                  });
                } else {
                  toast.error('Import fallito', {
                    description: 'Nessun prodotto è stato importato',
                  });
                }

                // Navigate to summary step instead of closing
                setCurrentStep('summary');
                onImportComplete?.();
              } catch (error: any) {
                console.error('Import failed:', error);
                toast.error('Errore durante l\'importazione', {
                  description: error.response?.data?.message || 'Si è verificato un errore',
                });
              } finally {
                setIsImporting(false);
                setImportProgress(null);
              }
            }}
            importProgress={importProgress}
            isImporting={isImporting}
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] lg:max-w-7xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importa Prodotti da Excel
          </DialogTitle>
          <DialogDescription>
            {steps[currentStepIndex].description}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progressValue} />
          <div className="flex justify-between text-xs text-muted-foreground">
            {steps.map((step, index) => (
              <div
                key={step.key}
                className={`flex items-center gap-1 ${
                  index === currentStepIndex
                    ? 'font-semibold text-foreground'
                    : ''
                }`}
              >
                <span
                  className={`flex items-center justify-center w-5 h-5 rounded-full text-xs ${
                    index <= currentStepIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {index + 1}
                </span>
                <span className="hidden sm:inline">{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto py-4">{renderStep()}</div>

        {/* Navigation Buttons */}
        {currentStep !== 'summary' && (
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 'upload' || isImporting}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>

            {currentStep !== 'confirm' ? (
              <Button onClick={handleNext} disabled={!canGoNext() || isImporting}>
                Avanti
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
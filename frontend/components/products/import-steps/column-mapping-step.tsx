'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { AlertCircle, CheckCircle2, ArrowRight, Loader2, Info, Plus, Trash2 } from 'lucide-react';
import { importApi, type ImportField } from '@/lib/api/import';
import type { ColumnMapping } from '../product-import-dialog';

interface ColumnMappingStepProps {
  excelColumns: string[];
  mappings: ColumnMapping[];
  onMappingsChange: (mappings: ColumnMapping[]) => void;
  model?: string;
  defaultProductType?: string;
  onDefaultProductTypeChange?: (type: string) => void;
}

export function ColumnMappingStep({
  excelColumns,
  mappings,
  onMappingsChange,
  model = 'products',
  defaultProductType = 'article',
  onDefaultProductTypeChange,
}: ColumnMappingStepProps) {
  const [localMappings, setLocalMappings] = useState<ColumnMapping[]>([]);
  const [isComposedDialogOpen, setIsComposedDialogOpen] = useState(false);
  const [selectedDbField, setSelectedDbField] = useState<string | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [separator, setSeparator] = useState('');

  // Fetch dynamic fields from API
  const { data: fieldsData, isLoading: isLoadingFields } = useQuery({
    queryKey: ['import-fields', model],
    queryFn: () => importApi.getImportableFields(model),
  });

  const DB_FIELDS: ImportField[] = fieldsData?.fields || [];

  // Check if "type" column is mapped
  const hasTypeColumnMapped = localMappings.some((m) => m.dbField === 'type');

  // Initialize mappings on mount or when excel columns change
  useEffect(() => {
    if (excelColumns.length > 0 && localMappings.length === 0 && DB_FIELDS.length > 0) {
      const initialMappings = excelColumns.map((col) => {
        // Try to auto-map based on column name similarity
        const normalizedCol = col.toLowerCase().trim();
        let dbField: string | null = null;

        // Auto-mapping logic - match against available DB fields
        for (const field of DB_FIELDS) {
          const fieldKey = field.key.toLowerCase();
          const fieldLabel = field.label.toLowerCase();

          // Exact match with key
          if (normalizedCol === fieldKey) {
            dbField = field.key;
            break;
          }

          // Partial match with key or label
          if (normalizedCol.includes(fieldKey) || fieldLabel.includes(normalizedCol)) {
            dbField = field.key;
            break;
          }
        }

        const field = DB_FIELDS.find((f) => f.key === dbField);
        return {
          excelColumn: col,
          dbField,
          required: field?.required || false,
        };
      });

      setLocalMappings(initialMappings);
      onMappingsChange(initialMappings);
    }
  }, [excelColumns, localMappings.length, onMappingsChange, DB_FIELDS]);

  const handleCheckboxChange = (excelColumn: string, dbFieldKey: string, checked: boolean) => {
    const updatedMappings = localMappings.map((mapping) => {
      // If this is the column being changed
      if (mapping.excelColumn === excelColumn) {
        const field = DB_FIELDS.find((f) => f.key === dbFieldKey);
        return {
          ...mapping,
          dbField: checked ? dbFieldKey : null,
          required: field?.required || false,
        };
      }
      // If another column was mapped to this dbField, unmap it (one-to-one mapping)
      if (mapping.dbField === dbFieldKey && checked) {
        return {
          ...mapping,
          dbField: null,
          required: false,
        };
      }
      return mapping;
    });

    setLocalMappings(updatedMappings);
    onMappingsChange(updatedMappings);
  };

  const handleCreateComposedField = () => {
    if (selectedColumns.length < 2 || !selectedDbField) {
      return;
    }

    // Get field info for validation
    const field = DB_FIELDS.find((f) => f.key === selectedDbField);
    if (!field) return;

    // Remove any existing mapping for this dbField
    const cleanedMappings = localMappings.filter((m) => m.dbField !== selectedDbField);

    // Create a composed mapping mapped directly to the DB field
    const composedMapping: ColumnMapping = {
      excelColumn: `${field.label} (Composto)`, // Display name
      excelColumns: selectedColumns,
      dbField: selectedDbField,
      required: field.required,
      separator: separator,
      isComposed: true,
    };

    const updatedMappings = [...cleanedMappings, composedMapping];
    setLocalMappings(updatedMappings);
    onMappingsChange(updatedMappings);

    // Reset dialog state
    setIsComposedDialogOpen(false);
    setSelectedDbField(null);
    setSelectedColumns([]);
    setSeparator('');
  };

  const handleRemoveComposedField = (dbField: string) => {
    const updatedMappings = localMappings.filter(
      (m) => !(m.isComposed && m.dbField === dbField)
    );
    setLocalMappings(updatedMappings);
    onMappingsChange(updatedMappings);
  };

  const requiredFields = DB_FIELDS.filter((f) => f.required);
  const mappedRequiredFields = requiredFields.filter((field) =>
    localMappings.some((m) => m.dbField === field.key)
  );
  const missingRequiredFields = requiredFields.filter(
    (field) => !localMappings.some((m) => m.dbField === field.key)
  );

  // Get DB fields that are already composed (to hide from matrix)
  const composedDbFields = localMappings
    .filter((m) => m.isComposed)
    .map((m) => m.dbField)
    .filter(Boolean);

  // Filter out composed fields from the matrix columns
  const availableDbFields = DB_FIELDS.filter(
    (field) => !composedDbFields.includes(field.key)
  );

  if (isLoadingFields) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Caricamento configurazione campi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Default Product Type Select - shown only if "type" column is NOT mapped */}
      {!hasTypeColumnMapped && model === 'products' && (
        <Alert className="border-blue-500/50 bg-blue-500/10">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="space-y-3">
            <div className="text-blue-800 dark:text-blue-200">
              <strong>Tipo Prodotto non mappato</strong> - Seleziona il tipo da applicare a tutti i prodotti:
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Tipo di Default:
              </span>
              <Select
                value={defaultProductType}
                onValueChange={onDefaultProductTypeChange}
              >
                <SelectTrigger className="w-[200px] bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="article">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Articolo</span>
                      <span className="text-xs text-muted-foreground">Prodotto fisico inventoriabile</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="service">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Servizio</span>
                      <span className="text-xs text-muted-foreground">Servizio non inventoriabile</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="composite">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Prodotto Composto</span>
                      <span className="text-xs text-muted-foreground">Composto da altri prodotti</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Status Alert */}
      {missingRequiredFields.length > 0 ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Campi obbligatori mancanti:</strong>{' '}
            {missingRequiredFields.map((f) => f.label).join(', ')}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            Tutti i campi obbligatori sono stati mappati correttamente.
          </AlertDescription>
        </Alert>
      )}

      {/* Required Fields Summary */}
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">Campi Obbligatori</h4>
        <div className="flex flex-wrap gap-2">
          {requiredFields.map((field) => {
            const isMapped = mappedRequiredFields.some((f) => f.key === field.key);
            return (
              <Badge
                key={field.key}
                variant={isMapped ? 'default' : 'destructive'}
                className="gap-1"
              >
                {isMapped && <CheckCircle2 className="h-3 w-3" />}
                {field.label}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Composed Fields Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-sm">Campi Composti</h4>
            <p className="text-xs text-muted-foreground">
              Combina più colonne per creare un singolo campo (es: Codice Famiglia + Codice Prodotto)
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsComposedDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi Campo Composto
          </Button>
        </div>

        {localMappings.filter((m) => m.isComposed).length > 0 && (
          <div className="space-y-2">
            {localMappings
              .filter((m) => m.isComposed)
              .map((mapping) => {
                const dbFieldInfo = DB_FIELDS.find((f) => f.key === mapping.dbField);
                return (
                  <div
                    key={mapping.dbField}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{dbFieldInfo?.label}</span>
                        {mapping.required && (
                          <Badge variant="destructive" className="text-xs">
                            Obbligatorio
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          Campo Composto
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Colonne: {mapping.excelColumns?.join(
                          mapping.separator ? ` "${mapping.separator}" ` : ' + '
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveComposedField(mapping.dbField!)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Mapping Matrix */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-sm">Mapping Colonne (Matrice)</h4>
            <p className="text-xs text-muted-foreground">
              Seleziona la casella per associare una colonna Excel a un campo del database
            </p>
          </div>
          <div className="hidden lg:block">
            <Badge variant="secondary" className="text-xs">
              {localMappings.filter((m) => !m.isComposed).length} colonne × {availableDbFields.length} campi
            </Badge>
          </div>
        </div>

        {/* Mobile warning */}
        <div className="lg:hidden p-4 border border-amber-500/50 bg-amber-500/10 rounded-lg">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Nota:</strong> La matrice di mapping è ottimizzata per schermi desktop.
            Su mobile potrebbe essere necessario scorrere orizzontalmente.
          </p>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm relative">
              <thead className="sticky top-0 z-20">
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-medium min-w-[180px] sticky left-0 bg-muted/50 z-30 border-r">
                    Colonna Excel
                  </th>
                  {availableDbFields.map((field) => (
                    <th
                      key={field.key}
                      className="p-3 text-center font-medium min-w-[120px] bg-muted/50"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span>{field.label}</span>
                        {field.required && (
                          <Badge variant="destructive" className="text-xs px-1 py-0">
                            Obbligatorio
                          </Badge>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {excelColumns.map((excelCol, rowIndex) => {
                  const mapping = localMappings.find((m) => m.excelColumn === excelCol && !m.isComposed);
                  return (
                    <tr
                      key={excelCol}
                      className={`border-b ${
                        rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                      } hover:bg-muted/40`}
                    >
                      <td className="p-3 font-medium sticky left-0 bg-inherit z-10 border-r">
                        <div className="flex items-center gap-2">
                          <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                            {excelCol}
                          </span>
                        </div>
                      </td>
                      {availableDbFields.map((field) => {
                        const isChecked = mapping?.dbField === field.key;
                        const isOtherColumnMapped = localMappings.some(
                          (m) => m.excelColumn !== excelCol && m.dbField === field.key
                        );

                        return (
                          <td
                            key={`${excelCol}-${field.key}`}
                            className="p-3 text-center"
                          >
                            <div className="flex justify-center">
                              <Checkbox
                                checked={isChecked}
                                disabled={isOtherColumnMapped && !isChecked}
                                onCheckedChange={(checked) =>
                                  handleCheckboxChange(excelCol, field.key, checked as boolean)
                                }
                                className={
                                  isChecked && field.required
                                    ? 'border-green-500 data-[state=checked]:bg-green-500'
                                    : ''
                                }
                              />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Field Descriptions */}
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">Informazioni sui Campi</h4>
        <div className="grid gap-2 text-xs">
          {DB_FIELDS.filter((f) => f.options || f.type === 'enum').map((field) => (
            <div key={field.key} className="text-muted-foreground">
              <strong>{field.label}:</strong>{' '}
              {field.options
                ? `Valori consentiti: ${field.options.join(', ')}`
                : field.description}
              {field.example && (
                <span className="text-muted-foreground/70"> (Es: {field.example})</span>
              )}
            </div>
          ))}
          {DB_FIELDS.filter((f) => f.type === 'decimal' || f.type === 'integer').length > 0 && (
            <div className="text-muted-foreground">
              <strong>Numeri:</strong> Usa il punto (.) come separatore decimale
            </div>
          )}
        </div>
      </div>

      {/* Composed Field Dialog */}
      <Dialog open={isComposedDialogOpen} onOpenChange={setIsComposedDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crea Campo Composto</DialogTitle>
            <DialogDescription>
              Seleziona un campo del database e 2 o più colonne Excel da combinare.
              Ad esempio, puoi combinare "Codice Famiglia" e "Codice Articolo" per il campo "code".
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Campo Database di Destinazione
              </label>
              <Select value={selectedDbField || ''} onValueChange={setSelectedDbField}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona un campo..." />
                </SelectTrigger>
                <SelectContent>
                  {DB_FIELDS.map((field) => (
                    <SelectItem key={field.key} value={field.key}>
                      <div className="flex items-center gap-2">
                        <span>{field.label}</span>
                        {field.required && (
                          <Badge variant="destructive" className="text-xs">
                            Obbligatorio
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedDbField && (
                <p className="text-xs text-muted-foreground mt-1">
                  {DB_FIELDS.find((f) => f.key === selectedDbField)?.description}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Separatore (opzionale)
              </label>
              <Input
                placeholder="Es: - oppure _ (lascia vuoto per nessun separatore)"
                value={separator}
                onChange={(e) => setSeparator(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Carattere o stringa da inserire tra le colonne concatenate
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Seleziona Colonne da Combinare (minimo 2)
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-3 border rounded-lg bg-muted/20">
                {excelColumns.map((col) => (
                  <div key={col} className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedColumns.includes(col)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedColumns([...selectedColumns, col]);
                        } else {
                          setSelectedColumns(selectedColumns.filter((c) => c !== col));
                        }
                      }}
                    />
                    <span className="text-sm font-mono">{col}</span>
                  </div>
                ))}
              </div>
            </div>

            {selectedColumns.length > 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Anteprima:</strong> {selectedColumns.join(separator ? ` ${separator} ` : ' ')}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsComposedDialogOpen(false);
                setSelectedDbField(null);
                setSelectedColumns([]);
                setSeparator('');
              }}
            >
              Annulla
            </Button>
            <Button
              onClick={handleCreateComposedField}
              disabled={selectedColumns.length < 2 || !selectedDbField}
            >
              <Plus className="h-4 w-4 mr-2" />
              Crea Campo Composto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
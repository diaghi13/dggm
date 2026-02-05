"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import type { ColumnMapping, ParsedRow } from "../product-import-dialog";

interface PreviewStepProps {
  file: File;
  mappings: ColumnMapping[];
  onDataParsed: (data: ParsedRow[]) => void;
  parsedData: ParsedRow[];
}

export function PreviewStep({
  file,
  mappings,
  onDataParsed,
  parsedData,
}: PreviewStepProps) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!file || mappings.length === 0) return;

    const parseFile = async () => {
      setIsLoading(true);
      try {
        const reader = new FileReader();

        reader.onload = (e) => {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          // Parse all rows
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
          }) as any[][];
          const headers = jsonData[0] as string[];
          const dataRows = jsonData.slice(1);

          // Map and validate each row
          const parsedRows = dataRows
            .map((row, index) => {
              const rowData: Record<string, any> = {};
              const errors: string[] = [];

              // Map columns based on mappings
              mappings.forEach((mapping) => {
                if (mapping.dbField) {
                  let value: any;

                  // Handle composed fields
                  if (mapping.isComposed && mapping.excelColumns) {
                    // Combine multiple columns
                    const values = mapping.excelColumns.map((col) => {
                      const colIndex = headers.indexOf(col);
                      return colIndex !== -1 ? row[colIndex] : "";
                    });
                    value = values.join(mapping.separator || "");
                  } else {
                    // Single column mapping
                    const colIndex = headers.indexOf(mapping.excelColumn);
                    if (colIndex !== -1) {
                      value = row[colIndex];
                    }
                  }

                  rowData[mapping.dbField] = value;

                  // Validate required fields
                  if (
                    mapping.required &&
                    (value === undefined || value === null || value === "")
                  ) {
                    errors.push(
                      `Campo obbligatorio "${mapping.dbField}" mancante`,
                    );
                  }

                  // Validate specific field types
                  if (value !== undefined && value !== null && value !== "") {
                    if (mapping.dbField === "type") {
                      const validTypes = [
                        "product",
                        "kit",
                        "raw_material",
                        "service",
                      ];
                      if (!validTypes.includes(String(value).toLowerCase())) {
                        errors.push(
                          `Tipo non valido: "${value}". Valori consentiti: ${validTypes.join(", ")}`,
                        );
                      }
                    }

                    if (
                      mapping.dbField === "price" ||
                      mapping.dbField === "cost"
                    ) {
                      const numValue = parseFloat(
                        String(value).replace(",", "."),
                      );
                      if (isNaN(numValue)) {
                        errors.push(
                          `${mapping.dbField} non è un numero valido: "${value}"`,
                        );
                      }
                    }

                    if (mapping.dbField === "is_active") {
                      const strValue = String(value).toLowerCase();
                      const validValues = [
                        "true",
                        "false",
                        "1",
                        "0",
                        "si",
                        "no",
                        "yes",
                        "no",
                      ];
                      if (!validValues.includes(strValue)) {
                        errors.push(
                          `is_active non valido: "${value}". Valori consentiti: true/false, 1/0, si/no`,
                        );
                      }
                    }

                    if (
                      mapping.dbField === "min_stock" ||
                      mapping.dbField === "max_stock"
                    ) {
                      const numValue = parseInt(String(value), 10);
                      if (isNaN(numValue) || numValue < 0) {
                        errors.push(
                          `${mapping.dbField} deve essere un numero intero >= 0`,
                        );
                      }
                    }
                  }
                }
              });

              // Skip completely empty rows
              if (
                Object.keys(rowData).length === 0 ||
                Object.values(rowData).every(
                  (v) => v === undefined || v === null || v === "",
                )
              ) {
                return null;
              }

              return {
                rowIndex: index + 2, // +2 because we skip header and array is 0-indexed
                data: rowData,
                errors: errors.length > 0 ? errors : undefined,
              };
            })
            .filter((row) => row !== null) as ParsedRow[];

          const parsed: ParsedRow[] = parsedRows;

          onDataParsed(parsed);
          setIsLoading(false);
        };

        reader.readAsBinaryString(file);
      } catch (error) {
        console.error("Error parsing file:", error);
        setIsLoading(false);
      }
    };

    parseFile();
  }, [file, mappings, onDataParsed]);

  const validRows = parsedData.filter((row) => !row.errors);
  const invalidRows = parsedData.filter((row) => row.errors);

  const mappedFields = mappings.filter((m) => m.dbField !== null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">
            Parsing dati in corso...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border bg-card">
          <div className="text-2xl font-bold">{parsedData.length}</div>
          <div className="text-sm text-muted-foreground">Righe Totali</div>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {validRows.length}
          </div>
          <div className="text-sm text-muted-foreground">Righe Valide</div>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <div className="text-2xl font-bold text-destructive">
            {invalidRows.length}
          </div>
          <div className="text-sm text-muted-foreground">Righe con Errori</div>
        </div>
      </div>

      {/* Alerts */}
      {invalidRows.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>{invalidRows.length} righe contengono errori.</strong>{" "}
            Verifica i dati evidenziati in rosso nella tabella sottostante. Le
            righe con errori non saranno importate.
          </AlertDescription>
        </Alert>
      )}

      {validRows.length > 0 && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong>
              {validRows.length} righe pronte per l&apos;importazione.
            </strong>
          </AlertDescription>
        </Alert>
      )}

      {/* Preview Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm">Anteprima Dati</h4>
          <Badge variant="secondary" className="text-xs">
            Mostrando {Math.min(parsedData.length, 50)} di {parsedData.length}{" "}
            righe
          </Badge>
        </div>
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 z-20 bg-muted/50">
                <TableRow>
                  <TableHead className="w-16 sticky left-0 bg-muted/50 z-30 border-r">
                    Riga
                  </TableHead>
                  <TableHead className="w-16 sticky left-16 bg-muted/50 z-30 border-r">
                    Stato
                  </TableHead>
                  {mappedFields.map((mapping) => (
                    <TableHead
                      key={`${mapping.excelColumn}-${mapping.dbField}`}
                      className="bg-muted/50"
                    >
                      {mapping.dbField}
                      {mapping.required && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          *
                        </Badge>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedData.slice(0, 50).map((row) => (
                  <TableRow
                    key={row.rowIndex}
                    className={row.errors ? "bg-destructive/5" : ""}
                  >
                    <TableCell className="font-mono text-xs sticky left-0 bg-inherit z-10 border-r">
                      {row.rowIndex}
                    </TableCell>
                    <TableCell className="sticky left-16 bg-inherit z-10 border-r">
                      {row.errors ? (
                        <XCircle className="h-4 w-4 text-destructive" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      )}
                    </TableCell>
                    {mappedFields.map((mapping) => {
                      const value = row.data[mapping.dbField!];
                      const hasError = row.errors?.some((err) =>
                        err.includes(mapping.dbField!),
                      );
                      return (
                        <TableCell
                          key={`${row.rowIndex}-${mapping.excelColumn}-${mapping.dbField}`}
                          className={
                            hasError ? "text-destructive font-medium" : ""
                          }
                        >
                          {value !== undefined && value !== null && value !== ""
                            ? String(value)
                            : "-"}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Error Details */}
      {invalidRows.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Dettagli Errori</h4>
          <ScrollArea className="h-[200px] rounded-md border">
            <div className="p-4 space-y-3">
              {invalidRows.map((row) => (
                <div
                  key={row.rowIndex}
                  className="p-3 rounded-lg bg-destructive/5 border border-destructive/20"
                >
                  <div className="font-semibold text-sm mb-1">
                    Riga {row.rowIndex}
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    {row.errors?.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

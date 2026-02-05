'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FileUploadStepProps {
  file: File | null;
  onFileSelect: (file: File, columns: string[]) => void;
  onColumnsExtracted: (columns: string[]) => void;
}

export function FileUploadStep({
  file,
  onFileSelect,
  onColumnsExtracted,
}: FileUploadStepProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const selectedFile = acceptedFiles[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          // Get the first row as headers
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          const headers = (jsonData[0] as string[]) || [];

          // Filter out empty headers
          const validHeaders = headers.filter((h) => h && h.trim() !== '');

          onFileSelect(selectedFile, validHeaders);
          onColumnsExtracted(validHeaders);
        } catch (error) {
          console.error('Error reading file:', error);
          alert('Errore durante la lettura del file. Assicurati che sia un file Excel valido.');
        }
      };

      reader.readAsBinaryString(selectedFile);
    },
    [onFileSelect, onColumnsExtracted]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleRemoveFile = () => {
    onFileSelect(null as any, []);
  };

  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Formato richiesto:</strong> File Excel (.xlsx, .xls) o CSV con
          intestazioni nella prima riga.
          <br />
          <strong>Dimensione massima:</strong> 10 MB
        </AlertDescription>
      </Alert>

      {!file ? (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
            transition-colors duration-200
            ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
            }
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-semibold">
                {isDragActive
                  ? 'Rilascia il file qui'
                  : 'Trascina il file Excel qui'}
              </p>
              <p className="text-sm text-muted-foreground">
                oppure clicca per selezionare
              </p>
            </div>
            <Button type="button" variant="outline">
              Seleziona File
            </Button>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-6 bg-muted/30">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <FileSpreadsheet className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemoveFile}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h4 className="font-semibold text-sm">Suggerimenti:</h4>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>La prima riga deve contenere i nomi delle colonne</li>
          <li>Assicurati che i dati siano formattati correttamente</li>
          <li>Le colonne obbligatorie devono essere presenti e compilate</li>
          <li>I codici prodotto devono essere univoci</li>
        </ul>
      </div>
    </div>
  );
}
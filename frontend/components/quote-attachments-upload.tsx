'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, Download, FileText, Image as ImageIcon, FileSpreadsheet, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { quotesApi } from '@/lib/api/quotes';
import { toast } from 'sonner';
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

interface Attachment {
  id: number;
  filename: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  file_size_human: string;
  url: string;
  type: string;
  description?: string;
  sort_order: number;
}

interface QuoteAttachmentsUploadProps {
  quoteId: number;
  attachments: Attachment[];
  onAttachmentsChange: () => void;
  readOnly?: boolean;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return ImageIcon;
  if (mimeType.includes('pdf')) return FileText;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet;
  return File;
};

export function QuoteAttachmentsUpload({ quoteId, attachments, onAttachmentsChange, readOnly = false }: QuoteAttachmentsUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<Attachment | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File troppo grande', {
          description: `${file.name} supera i 10MB`,
        });
        continue;
      }

      setUploading(true);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('collection', 'attachments');
        formData.append('type', 'document');

        await quotesApi.uploadMedia(quoteId, formData);

        toast.success('Allegato caricato', {
          description: `${file.name} è stato aggiunto al preventivo`,
        });

        onAttachmentsChange();
      } catch (error: any) {
        toast.error('Errore upload', {
          description: error.response?.data?.message || `Impossibile caricare ${file.name}`,
        });
      } finally {
        setUploading(false);
      }
    }
  }, [quoteId, onAttachmentsChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: readOnly || uploading,
    maxSize: 10 * 1024 * 1024,
  });

  const handleDownload = useCallback(async (attachment: Attachment) => {
    try {
      const blob = await quotesApi.downloadMedia(attachment.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.original_filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Download completato');
    } catch (error: any) {
      toast.error('Errore download', {
        description: error.response?.data?.message || 'Impossibile scaricare il file',
      });
    }
  }, []);

  const handleDelete = useCallback(async () => {
    if (!attachmentToDelete) return;

    try {
      await quotesApi.deleteMedia(attachmentToDelete.id);

      toast.success('Allegato eliminato', {
        description: `${attachmentToDelete.original_filename} è stato rimosso`,
      });

      onAttachmentsChange();
      setDeleteDialogOpen(false);
      setAttachmentToDelete(null);
    } catch (error: any) {
      toast.error('Errore', {
        description: error.response?.data?.message || 'Impossibile eliminare l\'allegato',
      });
    }
  }, [attachmentToDelete, onAttachmentsChange]);

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
              : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
            }
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Upload className={`w-6 h-6 ${isDragActive ? 'text-blue-500' : 'text-slate-400 dark:text-slate-500'}`} />
            </div>
            {uploading ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">Caricamento in corso...</p>
            ) : isDragActive ? (
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Rilascia i file qui</p>
            ) : (
              <>
                <p className="text-sm text-slate-900 dark:text-slate-100 font-medium">
                  Trascina file qui o clicca per selezionare
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Dimensione massima: 10MB
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Allegati ({attachments.length})
          </Label>
          <div className="space-y-2">
            {attachments.map((attachment) => {
              const FileIcon = getFileIcon(attachment.mime_type);

              return (
                <Card key={attachment.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                      <FileIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {attachment.original_filename}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {attachment.file_size_human}
                      </p>
                      {attachment.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                          {attachment.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDownload(attachment)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {!readOnly && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600"
                          onClick={() => {
                            setAttachmentToDelete(attachment);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina Allegato</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare <span className="font-semibold text-slate-900 dark:text-slate-100">{attachmentToDelete?.original_filename}</span>?
              <br />
              <span className="text-red-600 font-medium">Questa azione non può essere annullata.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAttachmentToDelete(null)}>
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

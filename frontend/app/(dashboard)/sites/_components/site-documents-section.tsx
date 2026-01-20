'use client';

import { useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  File,
  Download,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Trash2,
  FileImage,
  Folder,
  ClipboardList,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { sitesApi } from '@/lib/api/sites';
import { toast } from 'sonner';
import { DdtPendingAlert } from '@/components/ddt-pending-alert';
import { SiteDdtsTable } from '@/app/(dashboard)/sites/_components/site-ddts-table';
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

interface Media {
  id: number;
  collection_name: string;
  name: string;
  file_name: string;
  mime_type: string;
  size: number;
  human_readable_size: string;
  url: string;
  type: string;
  description?: string;
  created_at: string;
}

interface SiteDocumentsSectionProps {
  siteId: number;
  media: Media[];
  onMediaChange: () => void;
  readOnly?: boolean;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return ImageIcon;
  if (mimeType.includes('pdf')) return FileText;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet;
  if (mimeType.includes('word') || mimeType.includes('document')) return FileText;
  if (mimeType.includes('dwg') || mimeType.includes('drawing')) return FileImage;
  return File;
};

const collections = [
  {
    key: 'ddts',
    label: 'DDT',
    icon: Truck,
    description: 'Documenti di trasporto',
    isDdt: true,
  },
  {
    key: 'documents',
    label: 'Documenti',
    icon: Folder,
    description: 'Contratti, permessi, certificati',
    accepts: '.pdf,.doc,.docx,.xls,.xlsx',
  },
  {
    key: 'photos',
    label: 'Foto',
    icon: ImageIcon,
    description: 'Foto avanzamento lavori',
    accepts: 'image/*',
  },
  {
    key: 'technical_drawings',
    label: 'Disegni Tecnici',
    icon: FileImage,
    description: 'Planimetrie, schemi, disegni CAD',
    accepts: '.pdf,.jpg,.jpeg,.png,.xls,.xlsx,.dwg',
  },
  {
    key: 'reports',
    label: 'Report',
    icon: ClipboardList,
    description: 'Report SAL, consuntivi',
    accepts: '.pdf,.xls,.xlsx',
  },
];

export function SiteDocumentsSection({
  siteId,
  media,
  onMediaChange,
  readOnly = false,
}: SiteDocumentsSectionProps) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<Media | null>(null);
  const [activeCollection, setActiveCollection] = useState('documents');
  const [showDdts, setShowDdts] = useState(false);

  // Fetch DDTs
  const { data: ddtData } = useQuery({
    queryKey: ['site-ddts', siteId],
    queryFn: () => sitesApi.getDdts(siteId),
  });

  const pendingDdtsCount = ddtData?.meta?.pending || 0;

  // Confirm all DDTs mutation
  const confirmAllMutation = useMutation({
    mutationFn: () => {
      const pendingDdts = ddtData?.data?.filter((d: any) => d.status === 'issued' || d.status === 'in_transit') || [];
      const ddtIds = pendingDdts.map((d: any) => d.id);
      return sitesApi.confirmMultipleDdts(siteId, ddtIds);
    },
    onSuccess: () => {
      toast.success('DDT confermati', {
        description: 'Tutti i DDT sono stati confermati con successo.',
      });
      queryClient.invalidateQueries({ queryKey: ['site-ddts', siteId] });
      queryClient.invalidateQueries({ queryKey: ['site-materials', siteId] });
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description: error.response?.data?.message || 'Impossibile confermare i DDT',
      });
    },
  });

  const getMediaByCollection = (collectionKey: string) => {
    return media.filter((m) => m.collection_name === collectionKey);
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[], collectionKey: string) => {
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
          formData.append('collection', collectionKey);

          // Determine type based on file
          let type = 'document';
          if (file.type.startsWith('image/')) {
            type = 'image';
          } else if (collectionKey === 'technical_drawings') {
            type = 'drawing';
          }
          formData.append('type', type);

          await sitesApi.uploadMedia(siteId, formData);

          toast.success('File caricato', {
            description: `${file.name} è stato aggiunto al cantiere`,
          });

          onMediaChange();
        } catch (error: any) {
          toast.error('Errore upload', {
            description: error.response?.data?.message || `Impossibile caricare ${file.name}`,
          });
        } finally {
          setUploading(false);
        }
      }
    },
    [siteId, onMediaChange]
  );

  const handleDownload = useCallback(async (mediaItem: Media) => {
    try {
      const blob = await sitesApi.downloadMedia(mediaItem.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = mediaItem.file_name;
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
    if (!mediaToDelete) return;

    try {
      await sitesApi.deleteMedia(mediaToDelete.id);

      toast.success('File eliminato', {
        description: `${mediaToDelete.file_name} è stato rimosso`,
      });

      onMediaChange();
      setDeleteDialogOpen(false);
      setMediaToDelete(null);
    } catch (error: any) {
      toast.error('Errore', {
        description: error.response?.data?.message || "Impossibile eliminare il file",
      });
    }
  }, [mediaToDelete, onMediaChange]);

  const renderCollectionContent = (collection: typeof collections[0]) => {
    const collectionMedia = getMediaByCollection(collection.key);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop: (files) => onDrop(files, collection.key),
      disabled: readOnly || uploading,
      maxSize: 10 * 1024 * 1024,
      accept: collection.accepts ? { [collection.accepts]: [] } : undefined,
    });

    return (
      <div className="space-y-4">
        {!readOnly && (
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                  : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
              }
              ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Upload
                  className={`w-6 h-6 ${
                    isDragActive ? 'text-blue-500' : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
              </div>
              {uploading ? (
                <p className="text-sm text-slate-600 dark:text-slate-400">Caricamento in corso...</p>
              ) : isDragActive ? (
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  Rilascia i file qui
                </p>
              ) : (
                <>
                  <p className="text-sm text-slate-900 dark:text-slate-100 font-medium">
                    Trascina file qui o clicca per selezionare
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {collection.description} • Max 10MB
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {collectionMedia.length > 0 ? (
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              File ({collectionMedia.length})
            </Label>
            <div className="grid grid-cols-1 gap-2">
              {collectionMedia.map((mediaItem) => {
                const FileIcon = getFileIcon(mediaItem.mime_type);

                return (
                  <Card key={mediaItem.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                        <FileIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {mediaItem.file_name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {mediaItem.human_readable_size} •{' '}
                          {new Date(mediaItem.created_at).toLocaleDateString('it-IT')}
                        </p>
                        {mediaItem.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                            {mediaItem.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDownload(mediaItem)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {!readOnly && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                            onClick={() => {
                              setMediaToDelete(mediaItem);
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
        ) : (
          <div className="text-center py-8">
            <collection.icon className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Nessun file caricato</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* DDT Pending Alert */}
      {pendingDdtsCount > 0 && (
        <DdtPendingAlert
          pendingCount={pendingDdtsCount}
          onViewAll={() => setActiveCollection('ddts')}
          onConfirmAll={() => confirmAllMutation.mutate()}
          isConfirming={confirmAllMutation.isPending}
        />
      )}

      {/* Tabs con DDT come prima tab */}
      <Tabs value={activeCollection} onValueChange={setActiveCollection}>
        <TabsList className="grid w-full grid-cols-5">
          {collections.map((collection) => {
            const count = collection.isDdt
              ? (ddtData?.meta?.total || 0)
              : getMediaByCollection(collection.key).length;
            const CollectionIcon = collection.icon;

            return (
              <TabsTrigger key={collection.key} value={collection.key} className="gap-2">
                <CollectionIcon className="h-4 w-4" />
                <span>{collection.label}</span>
                {count > 0 && (
                  <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    collection.isDdt && pendingDdtsCount > 0
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  }`}>
                    {count}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* DDT Tab Content */}
        <TabsContent value="ddts">
          <SiteDdtsTable siteId={siteId} />
        </TabsContent>

        {/* Other collections */}
        {collections.filter(c => !c.isDdt).map((collection) => (
          <TabsContent key={collection.key} value={collection.key}>
            {renderCollectionContent(collection)}
          </TabsContent>
        ))}
      </Tabs>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare il file?</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare <strong>{mediaToDelete?.file_name}</strong>?
              Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

"use client";

import { useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Image as ImageIcon,
  FileCheck,
  BookOpen,
  FileBox,
  FileImage,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { productMediaApi, type UploadMediaRequest } from "@/lib/api/product-media";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EditMediaDialog } from "./edit-media-dialog";
import { CollectionContent } from "./collection-content";
import { UploadMediaDialog } from "./upload-media-dialog";

interface ProductMediaSectionProps {
  productId: number;
  media: {
    images: App.Data.ProductMediaData[];
    technical_sheets: App.Data.ProductMediaData[];
    certifications: App.Data.ProductMediaData[];
    manuals: App.Data.ProductMediaData[];
    drawings: App.Data.ProductMediaData[];
    documents: App.Data.ProductMediaData[];
  };
  readOnly?: boolean;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

type CollectionKey =
  | "images"
  | "technical_sheets"
  | "certifications"
  | "manuals"
  | "drawings"
  | "documents";

const collections: Array<{
  key: CollectionKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  accepts: string;
  maxSize: number;
  maxFiles: number;
}> = [
  {
    key: "images",
    label: "Immagini",
    icon: ImageIcon,
    description: "Foto del prodotto",
    accepts: "image/jpeg,image/png,image/webp",
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 20,
  },
  {
    key: "technical_sheets",
    label: "Schede Tecniche",
    icon: FileText,
    description: "Schede tecniche e specifiche",
    accepts: ".pdf,.doc,.docx,.xls,.xlsx",
    maxSize: 20 * 1024 * 1024, // 20MB
    maxFiles: 10,
  },
  {
    key: "certifications",
    label: "Certificazioni",
    icon: FileCheck,
    description: "Certificati e conformità",
    accepts: ".pdf,.doc,.docx,.xls,.xlsx",
    maxSize: 20 * 1024 * 1024, // 20MB
    maxFiles: 10,
  },
  {
    key: "manuals",
    label: "Manuali",
    icon: BookOpen,
    description: "Manuali utente e installazione",
    accepts: ".pdf,.doc,.docx,.xls,.xlsx",
    maxSize: 20 * 1024 * 1024, // 20MB
    maxFiles: 10,
  },
  {
    key: "drawings",
    label: "Disegni Tecnici",
    icon: FileImage,
    description: "Disegni CAD e planimetrie",
    accepts: ".pdf,.dwg,.dxf",
    maxSize: 50 * 1024 * 1024, // 50MB
    maxFiles: 10,
  },
  {
    key: "documents",
    label: "Documenti",
    icon: FileBox,
    description: "Altri documenti",
    accepts: ".pdf,.doc,.docx,.xls,.xlsx",
    maxSize: 20 * 1024 * 1024, // 20MB
    maxFiles: 10,
  },
];

export function ProductMediaSection({
  productId,
  media,
  readOnly = false,
}: ProductMediaSectionProps) {
  const queryClient = useQueryClient();
  // uploading is only used by the inline CollectionContent dropzone
  const [uploading, setUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mediaToDelete, setMediaToDelete] =
    useState<App.Data.ProductMediaData | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [mediaToEdit, setMediaToEdit] =
    useState<App.Data.ProductMediaData | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [activeCollection, setActiveCollection] =
    useState<CollectionKey>("images");

  const uploadMutation = useMutation({
    mutationFn: (request: UploadMediaRequest) =>
      productMediaApi.uploadMedia(productId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      toast.success("File caricato con successo");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error("Errore upload", {
        description:
          err.response?.data?.message || "Impossibile caricare il file",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ mediaId }: { mediaId: number }) =>
      productMediaApi.deleteMedia(productId, mediaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      toast.success("File eliminato con successo");
      setDeleteDialogOpen(false);
      setMediaToDelete(null);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error("Errore", {
        description:
          err.response?.data?.message || "Impossibile eliminare il file",
      });
    },
  });

  const handleDrop = useCallback(
    async (collectionKey: CollectionKey, acceptedFiles: File[]) => {
      const collection = collections.find((c) => c.key === collectionKey);
      if (!collection) return;

      const currentCount = media[collectionKey].length;

      for (const file of acceptedFiles) {
        if (currentCount >= collection.maxFiles) {
          toast.error("Limite raggiunto", {
            description: `Puoi caricare massimo ${collection.maxFiles} file in questa collezione`,
          });
          break;
        }

        if (file.size > collection.maxSize) {
          toast.error("File troppo grande", {
            description: `${file.name} supera il limite di ${formatFileSize(collection.maxSize)}`,
          });
          continue;
        }

        setUploading(true);
        try {
          await uploadMutation.mutateAsync({
            file,
            collection_name: collectionKey,
          });
        } finally {
          setUploading(false);
        }
      }
    },
    [media, uploadMutation],
  );

  const handleDownload = useCallback(
    async (mediaItem: App.Data.ProductMediaData) => {
      try {
        const blob = await productMediaApi.downloadMedia(
          productId,
          mediaItem.id!,
        );
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = mediaItem.file_name || "download";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Download completato");
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error("Errore download", {
          description:
            err.response?.data?.message || "Impossibile scaricare il file",
        });
      }
    },
    [productId],
  );

  const handleDelete = useCallback(async () => {
    if (!mediaToDelete?.id) return;
    deleteMutation.mutate({ mediaId: mediaToDelete.id });
  }, [mediaToDelete, deleteMutation]);

  return (
    <div className="space-y-6">
      {!readOnly && (
        <div className="flex justify-end">
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Carica File
          </Button>
        </div>
      )}
      <Tabs
        value={activeCollection}
        onValueChange={(v) => setActiveCollection(v as CollectionKey)}
      >
        <TabsList className="grid w-full grid-cols-6">
          {collections.map((collection) => {
            const count = media[collection.key]?.length || 0;
            const CollectionIcon = collection.icon;

            return (
              <TabsTrigger
                key={collection.key}
                value={collection.key}
                className="gap-2"
              >
                <CollectionIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{collection.label}</span>
                {count > 0 && (
                  <span className="ml-1 rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                    {count}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {collections.map((collection) => (
          <TabsContent key={collection.key} value={collection.key}>
            <CollectionContent
              collection={collection}
              media={media[collection.key] || []}
              readOnly={readOnly}
              uploading={uploading}
              onDrop={(files) => handleDrop(collection.key, files)}
              onDownload={handleDownload}
              onEdit={(mediaItem) => {
                setMediaToEdit(mediaItem);
                setEditDialogOpen(true);
              }}
              onDelete={(mediaItem) => {
                setMediaToDelete(mediaItem);
                setDeleteDialogOpen(true);
              }}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare il file?</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare{" "}
              <strong>{mediaToDelete?.file_name}</strong>? Questa azione non può
              essere annullata.
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

      {/* Upload Media Dialog */}
      <UploadMediaDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        productId={productId}
        collection={collections.find((c) => c.key === activeCollection)!}
        currentCount={media[activeCollection]?.length || 0}
        onSuccess={() => setUploadDialogOpen(false)}
      />

      {/* Edit Media Dialog */}
      {mediaToEdit && (
        <EditMediaDialog
          productId={productId}
          media={mediaToEdit}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={() => {
            setEditDialogOpen(false);
            setMediaToEdit(null);
          }}
        />
      )}
    </div>
  );
}

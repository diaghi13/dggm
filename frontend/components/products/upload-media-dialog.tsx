"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  X,
  Loader2,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { productMediaApi } from "@/lib/api/product-media";
import { toast } from "sonner";
import { handleMutationError } from "@/lib/utils/handle-mutation-error";

interface UploadMediaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: number;
  collection: {
    key: string;
    label: string;
    description: string;
    accepts: string;
    maxSize: number;
    maxFiles: number;
  };
  currentCount: number;
  onSuccess?: () => void;
}

interface FormState {
  description: string;
  is_primary: boolean;
  use_in_quotes: boolean;
  use_in_projects: boolean;
  document_type: string;
  valid_until: string;
}

const defaultForm: FormState = {
  description: "",
  is_primary: false,
  use_in_quotes: false,
  use_in_projects: false,
  document_type: "",
  valid_until: "",
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

function FileTypeIcon({
  mimeType,
  className,
}: {
  mimeType: string;
  className?: string;
}) {
  if (mimeType.startsWith("image/"))
    return <FileImage className={className} />;
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType.includes("csv")
  )
    return <FileSpreadsheet className={className} />;
  if (mimeType.includes("word") || mimeType.includes("text"))
    return <FileText className={className} />;
  return <File className={className} />;
}

export function UploadMediaDialog({
  open,
  onOpenChange,
  productId,
  collection,
  currentCount,
  onSuccess,
}: UploadMediaDialogProps) {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);

  const isImage = collection.key === "images";
  const isDocument = collection.key !== "images";
  const isAtLimit = currentCount >= collection.maxFiles;

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!selectedFile) throw new Error("Nessun file selezionato");
      return productMediaApi.uploadMedia(productId, {
        file: selectedFile,
        collection_name: collection.key as
          | "images"
          | "technical_sheets"
          | "certifications"
          | "manuals"
          | "drawings"
          | "documents",
        description: form.description || undefined,
        is_primary: isImage ? form.is_primary : undefined,
        use_in_quotes: form.use_in_quotes,
        use_in_projects: isImage ? form.use_in_projects : undefined,
        document_type: isDocument ? form.document_type || undefined : undefined,
        valid_until: isDocument ? form.valid_until || undefined : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      queryClient.invalidateQueries({ queryKey: ["product-media", productId] });
      toast.success("File caricato con successo");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      handleMutationError(error, "Impossibile caricare il file");
    },
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      if (file.size > collection.maxSize) {
        toast.error("File troppo grande", {
          description: `Il file supera il limite di ${formatFileSize(collection.maxSize)}`,
        });
        return;
      }
      setSelectedFile(file);
    },
    [collection.maxSize],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: isAtLimit || uploadMutation.isPending,
    maxSize: collection.maxSize,
    multiple: false,
    accept:
      collection.accepts === "*"
        ? {}
        : collection.accepts.split(",").reduce(
            (acc, type) => {
              acc[type.trim()] = [];
              return acc;
            },
            {} as Record<string, string[]>,
          ),
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && uploadMutation.isPending) return;
    if (!newOpen) {
      setSelectedFile(null);
      setForm(defaultForm);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Carica {collection.label}</DialogTitle>
          <DialogDescription>
            {collection.description} · Max {formatFileSize(collection.maxSize)}{" "}
            · {currentCount}/{collection.maxFiles} file
          </DialogDescription>
        </DialogHeader>

        {/* Phase 1: no file selected → show dropzone */}
        {!selectedFile && (
          <div
            {...getRootProps()}
            className={[
              "border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors",
              isDragActive
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600",
              isAtLimit ? "opacity-50 cursor-not-allowed" : "",
            ].join(" ")}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Upload
                  className={`w-7 h-7 ${isDragActive ? "text-blue-500" : "text-slate-400 dark:text-slate-500"}`}
                />
              </div>
              {isAtLimit ? (
                <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                  Limite di {collection.maxFiles} file raggiunto
                </p>
              ) : isDragActive ? (
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  Rilascia il file qui
                </p>
              ) : (
                <>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Trascina un file qui o clicca per selezionare
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {collection.accepts === "*"
                      ? "Tutti i tipi di file"
                      : collection.accepts.replace(/\./g, "").toUpperCase()}{" "}
                    · max {formatFileSize(collection.maxSize)}
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Phase 2: file selected → show preview + metadata form */}
        {selectedFile && (
          <div className="space-y-4">
            {/* File preview card */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="w-10 h-10 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                <FileTypeIcon
                  mimeType={selectedFile.type}
                  className="w-5 h-5 text-slate-500 dark:text-slate-400"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                disabled={uploadMutation.isPending}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors disabled:opacity-50"
                aria-label="Rimuovi file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="upload-description">
                Descrizione{" "}
                <span className="text-slate-400 font-normal">(opzionale)</span>
              </Label>
              <Textarea
                id="upload-description"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Aggiungi una descrizione..."
                rows={2}
                disabled={uploadMutation.isPending}
              />
            </div>

            {/* Image-specific toggles */}
            {isImage && (
              <div className="space-y-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="upload-is-primary" className="text-sm">
                      Immagine principale
                    </Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Immagine predefinita del prodotto
                    </p>
                  </div>
                  <Switch
                    id="upload-is-primary"
                    checked={form.is_primary}
                    onCheckedChange={(v) =>
                      setForm((f) => ({ ...f, is_primary: v }))
                    }
                    disabled={uploadMutation.isPending}
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="upload-use-in-quotes" className="text-sm">
                      Includi nei preventivi
                    </Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Allegata al PDF del preventivo
                    </p>
                  </div>
                  <Switch
                    id="upload-use-in-quotes"
                    checked={form.use_in_quotes}
                    onCheckedChange={(v) =>
                      setForm((f) => ({ ...f, use_in_quotes: v }))
                    }
                    disabled={uploadMutation.isPending}
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label
                      htmlFor="upload-use-in-projects"
                      className="text-sm"
                    >
                      Includi nei progetti
                    </Label>
                  </div>
                  <Switch
                    id="upload-use-in-projects"
                    checked={form.use_in_projects}
                    onCheckedChange={(v) =>
                      setForm((f) => ({ ...f, use_in_projects: v }))
                    }
                    disabled={uploadMutation.isPending}
                  />
                </div>
              </div>
            )}

            {/* Document-specific fields */}
            {isDocument && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div>
                    <Label
                      htmlFor="upload-use-in-quotes-doc"
                      className="text-sm"
                    >
                      Includi nei preventivi
                    </Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Allegato al PDF del preventivo
                    </p>
                  </div>
                  <Switch
                    id="upload-use-in-quotes-doc"
                    checked={form.use_in_quotes}
                    onCheckedChange={(v) =>
                      setForm((f) => ({ ...f, use_in_quotes: v }))
                    }
                    disabled={uploadMutation.isPending}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="upload-document-type">
                    Tipo documento{" "}
                    <span className="text-slate-400 font-normal">
                      (opzionale)
                    </span>
                  </Label>
                  <Input
                    id="upload-document-type"
                    value={form.document_type}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, document_type: e.target.value }))
                    }
                    placeholder="es. Certificato CE, Scheda di sicurezza..."
                    disabled={uploadMutation.isPending}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="upload-valid-until">
                    Valido fino al{" "}
                    <span className="text-slate-400 font-normal">
                      (opzionale)
                    </span>
                  </Label>
                  <Input
                    id="upload-valid-until"
                    type="date"
                    value={form.valid_until}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, valid_until: e.target.value }))
                    }
                    disabled={uploadMutation.isPending}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={uploadMutation.isPending}
          >
            Annulla
          </Button>
          <Button
            type="button"
            onClick={() => uploadMutation.mutate()}
            disabled={!selectedFile || uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Caricamento...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Carica
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

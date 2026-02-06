"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UploadMediaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection: {
    key: string;
    label: string;
    description: string;
    accepts: string;
    maxSize: number;
    maxFiles: number;
  };
  currentCount: number;
  uploading: boolean;
  onDrop: (files: File[]) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

export function UploadMediaDialog({
  open,
  onOpenChange,
  collection,
  currentCount,
  uploading,
  onDrop,
}: UploadMediaDialogProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: uploading || currentCount >= collection.maxFiles,
    maxSize: collection.maxSize,
    accept: collection.accepts.split(",").reduce(
      (acc, type) => {
        acc[type.trim()] = [];
        return acc;
      },
      {} as Record<string, string[]>,
    ),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Carica {collection.label}</DialogTitle>
          <DialogDescription>
            {collection.description} • Max {formatFileSize(collection.maxSize)}{" "}
            per file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
              ${
                isDragActive
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                  : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600"
              }
              ${uploading || currentCount >= collection.maxFiles ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Upload
                  className={`w-8 h-8 ${
                    isDragActive
                      ? "text-blue-500"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                />
              </div>
              {uploading ? (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Caricamento in corso...
                </p>
              ) : currentCount >= collection.maxFiles ? (
                <div>
                  <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                    Limite raggiunto
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Hai raggiunto il massimo di {collection.maxFiles} file
                  </p>
                </div>
              ) : isDragActive ? (
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  Rilascia i file qui
                </p>
              ) : (
                <>
                  <div>
                    <p className="text-base text-slate-900 dark:text-slate-100 font-medium mb-1">
                      Trascina file qui o clicca per selezionare
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {currentCount}/{collection.maxFiles} file caricati
                    </p>
                  </div>
                  <Button type="button" size="lg">
                    <Upload className="mr-2 h-5 w-5" />
                    Seleziona File
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p>• Puoi selezionare più file contemporaneamente</p>
            <p>
              • Dimensione massima per file:{" "}
              {formatFileSize(collection.maxSize)}
            </p>
            <p>• Massimo {collection.maxFiles} file per questa categoria</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useQuery } from "@tanstack/react-query";
import { companySettingsApi } from "@/lib/api/settings";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { ImageIcon, X, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface StepImagesProps {
  onComplete: () => void;
  onSkip: () => void;
}

type UploadType = "logo" | "stamp";

function ImageDropzone({
  type,
  title,
  description,
  existingUrl,
  isStamp,
}: {
  type: UploadType;
  title: string;
  description: string;
  existingUrl?: string;
  isStamp?: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setFile(accepted[0]);
      const url = URL.createObjectURL(accepted[0]);
      setPreview(url);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxSize: 2 * 1024 * 1024,
    multiple: false,
    onDropRejected: () => {
      toast.error("File non valido. Max 2MB, solo immagini.");
    },
  });

  const removeFile = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  };

  const displayUrl = preview ?? existingUrl;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {title}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {description}
        </p>
      </div>

      {displayUrl ? (
        <div className="relative w-40 h-40 mx-auto">
          <div
            className={cn(
              "w-full h-full rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center",
              isStamp &&
                "bg-[repeating-conic-gradient(#e5e7eb_0%_25%,white_0%_50%)_0_0/16px_16px] dark:bg-[repeating-conic-gradient(#374151_0%_25%,#1e293b_0%_50%)_0_0/16px_16px]",
              !isStamp && "bg-slate-50 dark:bg-slate-800",
            )}
          >
            <img
              src={displayUrl}
              alt={title}
              className="max-w-full max-h-full object-contain p-2"
            />
          </div>
          {file && (
            <button
              onClick={removeFile}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            "w-40 h-40 mx-auto rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors",
            isDragActive
              ? "border-slate-500 dark:border-slate-400 bg-slate-50 dark:bg-slate-800"
              : "hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50",
          )}
        >
          <input {...getInputProps()} />
          <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          <div className="text-center px-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Trascina qui
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              o clicca
            </p>
          </div>
        </div>
      )}

      {file && (
        <UploadButton
          file={file}
          type={type}
          onSuccess={removeFile}
          onUploadStart={() => setUploading(true)}
          onUploadEnd={() => setUploading(false)}
        />
      )}
    </div>
  );
}

function UploadButton({
  file,
  type,
  onSuccess,
  onUploadStart,
  onUploadEnd,
}: {
  file: File;
  type: UploadType;
  onSuccess: () => void;
  onUploadStart: () => void;
  onUploadEnd: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const upload = async () => {
    setLoading(true);
    onUploadStart();
    try {
      const formData = new FormData();
      if (type === "logo") {
        formData.append("logo", file);
        await apiClient.post("/settings/company/logo", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        formData.append("image", file);
        await apiClient.post("/settings/company/image/stamp", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      toast.success(
        type === "logo" ? "Logo caricato" : "Timbro caricato",
      );
      onSuccess();
    } catch {
      toast.error("Errore nel caricamento del file");
    } finally {
      setLoading(false);
      onUploadEnd();
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={upload}
      disabled={loading}
      className="w-full"
    >
      {loading ? (
        <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
      ) : (
        <Upload className="w-3 h-3 mr-1.5" />
      )}
      Carica
    </Button>
  );
}

export function StepImages({ onComplete, onSkip }: StepImagesProps) {
  const { data: existing } = useQuery({
    queryKey: ["company-settings"],
    queryFn: companySettingsApi.get,
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Logo e immagini
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Carica il logo e il timbro aziendale. Puoi farlo in seguito dalle impostazioni.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <ImageDropzone
          type="logo"
          title="Logo aziendale"
          description="PNG, JPG o SVG. Max 2MB."
          existingUrl={existing?.["company.logo"]}
        />
        <ImageDropzone
          type="stamp"
          title="Timbro & Firma"
          description="PNG con sfondo trasparente consigliato."
          existingUrl={existing?.["company.stamp"]}
          isStamp
        />
      </div>

      <div className="pt-6 flex items-center justify-between">
        <Button variant="outline" onClick={onSkip}>
          Salta
        </Button>
        <Button onClick={onComplete}>Continua</Button>
      </div>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Image as ImageIcon,
  FileText,
  Loader2,
  Paperclip,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { productMediaApi } from "@/lib/api/product-media";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface MediaSelectorProps {
  productId: number;
  /** Current explicit selection as array of IDs. Empty array = none. */
  value: number[];
  onChange: (value: number[]) => void;
}

const DOCUMENT_COLLECTIONS = [
  "technical_sheets",
  "certifications",
  "manuals",
  "drawings",
  "documents",
] as const;

export function MediaSelector({
  productId,
  value,
  onChange,
}: MediaSelectorProps) {
  const [open, setOpen] = useState(true);

  const {
    data: allMedia,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["product-media", productId],
    queryFn: () => productMediaApi.getAllMedia(productId),
    enabled: !!productId,
    staleTime: 30_000,
  });

  // Candidates: images + documents with use_in_quotes=true, excluding PDF conversions
  const candidateImages = useMemo(
    () =>
      allMedia?.images.filter((m) => m.use_in_quotes && !m.is_pdf_conversion) ??
      [],
    [allMedia?.images],
  );

  const candidateDocuments = useMemo(
    () =>
      DOCUMENT_COLLECTIONS.flatMap((col) =>
        (allMedia?.[col] ?? []).filter(
          (m) => m.use_in_quotes && !m.is_pdf_conversion,
        ),
      ),
    [allMedia],
  );

  const allCandidates = useMemo(
    () => [...candidateImages, ...candidateDocuments],
    [candidateImages, candidateDocuments],
  );

  // Simple logic: value is always an explicit array of IDs
  // [] = none, [1,2,3] = those specific IDs
  const effectiveIds: number[] = value;

  const totalSelected = effectiveIds.length;
  const totalCandidates = allCandidates.length;

  // Don't render anything if product has no media candidates
  // Use isFetching too: cached data may be stale/empty while a background refetch is in progress
  if (!isLoading && !isFetching && totalCandidates === 0) {
    return null;
  }

  const toggle = (mediaId: number, checked: boolean) => {
    const next = checked
      ? [...value, mediaId]
      : value.filter((id) => id !== mediaId);
    onChange(next);
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      // Select all explicitly (not null)
      const allIds = allCandidates.map((m) => m.id!).filter(Boolean);
      onChange(allIds);
    } else {
      onChange([]); // empty = include nothing
    }
  };

  const allChecked =
    effectiveIds.length > 0 &&
    allCandidates.every((m) => effectiveIds.includes(m.id!));
  const someChecked = !allChecked && totalSelected > 0;

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header / toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Media allegati al preventivo
          </span>
          {isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
          ) : (
            <Badge
              variant={totalSelected === 0 ? "secondary" : "default"}
              className="text-xs"
            >
              {totalSelected}/{totalCandidates}
            </Badge>
          )}
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        )}
      </button>

      {/* Expanded content */}
      {open && (
        <div className="p-3 space-y-3 border-t border-slate-200 dark:border-slate-700">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Caricamento media...
            </div>
          )}

          {!isLoading && totalCandidates > 0 && (
            <>
              {/* Select all */}
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Checkbox
                  id="media-select-all"
                  checked={allChecked}
                  data-state={
                    someChecked
                      ? "indeterminate"
                      : allChecked
                        ? "checked"
                        : "unchecked"
                  }
                  onCheckedChange={(checked) => toggleAll(!!checked)}
                />
                <Label
                  htmlFor="media-select-all"
                  className="text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  {allChecked ? "Deseleziona tutto" : "Seleziona tutto"}
                </Label>
              </div>

              {/* Images */}
              {candidateImages.length > 0 && (
                <div className="space-y-1.5">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    <ImageIcon className="w-3.5 h-3.5" />
                    Immagini
                  </p>
                  {candidateImages.map((m) => (
                    <MediaRow
                      key={m.id}
                      media={m}
                      checked={effectiveIds.includes(m.id!)}
                      onToggle={toggle}
                    />
                  ))}
                </div>
              )}

              {/* Documents */}
              {candidateDocuments.length > 0 && (
                <div className="space-y-1.5">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    <FileText className="w-3.5 h-3.5" />
                    Documenti
                  </p>
                  {candidateDocuments.map((m) => (
                    <MediaRow
                      key={m.id}
                      media={m}
                      checked={effectiveIds.includes(m.id!)}
                      onToggle={toggle}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function MediaRow({
  media,
  checked,
  onToggle,
}: {
  media: App.Data.ProductMediaData;
  checked: boolean;
  onToggle: (id: number, checked: boolean) => void;
}) {
  const isImage =
    media.collection_name === "images" ||
    (media.mime_type?.startsWith("image/") ?? false);
  const isPdf = media.pdf_url != null || media.mime_type === "application/pdf";
  const needsConversion = !isImage && !isPdf;

  return (
    <label
      htmlFor={`media-${media.id}`}
      className="flex items-center gap-2.5 p-2 rounded cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
    >
      <Checkbox
        id={`media-${media.id}`}
        checked={checked}
        onCheckedChange={(v) => onToggle(media.id!, !!v)}
      />

      {/* Thumbnail for images */}
      {media.thumb_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={media.thumb_url}
          alt={media.file_name ?? ""}
          className="w-8 h-8 rounded object-cover border border-slate-200 dark:border-slate-700 shrink-0"
        />
      ) : (
        <div className="w-8 h-8 rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-slate-400" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate leading-tight">
          {media.description || media.file_name}
        </p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
          {media.collection_name.replace("_", " ")}
          {isPdf && (
            <span className="ml-1 text-green-600 dark:text-green-400">
              · PDF pronto
            </span>
          )}
          {needsConversion && (
            <span className="ml-1 text-amber-500">· conversione in coda</span>
          )}
        </p>
      </div>
    </label>
  );
}

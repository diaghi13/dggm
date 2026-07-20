"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  productMediaApi,
  type UpdateMediaRequest,
} from "@/lib/api/product-media";
import { toast } from "sonner";
import { handleMutationError } from "@/lib/utils/handle-mutation-error";

interface EditMediaDialogProps {
  productId: number;
  media: App.Data.ProductMediaData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditMediaDialog({
  productId,
  media,
  open,
  onOpenChange,
  onSuccess,
}: EditMediaDialogProps) {
  const queryClient = useQueryClient();

  // Initialize with media values directly
  const [formData, setFormData] = useState<UpdateMediaRequest>({
    description: media.description || "",
    is_primary: media.is_primary || false,
    use_in_quotes: media.use_in_quotes || false,
    use_in_projects: media.use_in_projects || false,
    document_type: media.document_type || "",
    valid_until: media.valid_until || "",
    sort_order: media.sort_order || 0,
  });

  const [validUntilDate, setValidUntilDate] = useState<Date | undefined>(
    media.valid_until ? new Date(media.valid_until) : undefined,
  );

  const isImage = media.collection_name === "images";
  const isDocument = [
    "technical_sheets",
    "certifications",
    "manuals",
    "drawings",
    "documents",
  ].includes(media.collection_name);

  const updateMutation = useMutation({
    mutationFn: (request: UpdateMediaRequest) =>
      productMediaApi.updateMedia(productId, media.id!, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      toast.success("Proprietà aggiornate con successo");
      onSuccess?.();
    },
    onError: (error) => {
      handleMutationError(error, "Impossibile aggiornare le proprietà");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: UpdateMediaRequest = {
      ...formData,
      valid_until: validUntilDate
        ? validUntilDate.toISOString().split("T")[0]
        : undefined,
    };

    updateMutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifica Proprietà</DialogTitle>
          <DialogDescription>
            Aggiorna le proprietà di <strong>{media.file_name}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrizione</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Aggiungi una descrizione..."
              rows={3}
            />
          </div>

          {/* Image-specific fields */}
          {isImage && (
            <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is_primary">Immagine Principale</Label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sarà l&apos;immagine predefinita del prodotto
                  </p>
                </div>
                <Switch
                  id="is_primary"
                  checked={formData.is_primary || false}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_primary: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="use_in_quotes">Includi nei Preventivi</Label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Allegata al PDF del preventivo
                  </p>
                </div>
                <Switch
                  id="use_in_quotes"
                  checked={formData.use_in_quotes || false}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, use_in_quotes: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="use_in_projects">Includi nei Progetti</Label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Usata nella documentazione dei progetti
                  </p>
                </div>
                <Switch
                  id="use_in_projects"
                  checked={formData.use_in_projects || false}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, use_in_projects: checked })
                  }
                />
              </div>
            </div>
          )}

          {/* Document-specific fields */}
          {isDocument && (
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="use_in_quotes_doc">
                  Includi nei Preventivi
                </Label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Allegato al PDF del preventivo
                </p>
              </div>
              <Switch
                id="use_in_quotes_doc"
                checked={formData.use_in_quotes || false}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, use_in_quotes: checked })
                }
              />
            </div>
          )}

          {isDocument && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="document_type">Tipo Documento</Label>
                <Input
                  id="document_type"
                  value={formData.document_type || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, document_type: e.target.value })
                  }
                  placeholder="es. Certificato CE, Scheda di sicurezza..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valid_until">Valido Fino Al</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={
                    validUntilDate
                      ? validUntilDate.toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) => {
                    if (e.target.value) {
                      setValidUntilDate(new Date(e.target.value));
                    } else {
                      setValidUntilDate(undefined);
                    }
                  }}
                  placeholder="YYYY-MM-DD"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Opzionale: per certificati e documenti con scadenza
                </p>
              </div>
            </div>
          )}

          {/* Sort Order */}
          <div className="space-y-2">
            <Label htmlFor="sort_order">Ordine di Visualizzazione</Label>
            <Input
              id="sort_order"
              type="number"
              value={formData.sort_order || 0}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  sort_order: parseInt(e.target.value) || 0,
                })
              }
              placeholder="0"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              I file sono ordinati dal numero più basso a quello più alto
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Annulla
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Salvataggio..." : "Salva Modifiche"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

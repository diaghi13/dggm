"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { GitBranch, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { handleMutationError } from "@/lib/utils/handle-mutation-error";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { quotesApi } from "@/lib/api/quotes";
import type { Quote } from "@/lib/types";

interface CreateRevisionModalProps {
  quote: Quote;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newQuote: Quote) => void;
}

export function CreateRevisionModal({
  quote,
  open,
  onOpenChange,
  onSuccess,
}: CreateRevisionModalProps) {
  const [revisionNotes, setRevisionNotes] = useState("");

  const reviseMutation = useMutation({
    mutationFn: () =>
      quotesApi.revise(quote.id!, revisionNotes.trim() || undefined),
    onSuccess: (newQuote) => {
      toast.success("Revisione creata", {
        description: `${newQuote.code} — Rev ${newQuote.version} creata con successo`,
      });
      setRevisionNotes("");
      onOpenChange(false);
      onSuccess(newQuote);
    },
    onError: (error) => {
      handleMutationError(error, "Impossibile creare la revisione");
    },
  });

  const nextVersion = (quote.version ?? 1) + 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <GitBranch className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Crea Revisione
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 text-sm text-slate-700 dark:text-slate-300">
            Stai creando la{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              Rev {nextVersion}
            </span>{" "}
            di{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {quote.code}
            </span>
            . La versione corrente verrà marcata come obsoleta.
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="revision-notes"
              className="text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Motivo della revisione{" "}
              <span className="text-slate-400 dark:text-slate-500 font-normal">
                (opzionale)
              </span>
            </Label>
            <Textarea
              id="revision-notes"
              placeholder="Es. Aggiornamento prezzi materiali, modifica tempi di consegna..."
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              rows={3}
              className="resize-none bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setRevisionNotes("");
                onOpenChange(false);
              }}
              disabled={reviseMutation.isPending}
              className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Annulla
            </Button>
            <Button
              onClick={() => reviseMutation.mutate()}
              disabled={reviseMutation.isPending}
            >
              {reviseMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <GitBranch className="h-4 w-4 mr-2" />
              )}
              Crea Revisione
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

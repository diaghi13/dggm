"use client";

import { useMutation } from "@tanstack/react-query";
import { CheckCheck, Loader2, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { quotesApi } from "@/lib/api/quotes";
import { Quote } from "@/lib/types";

interface SendQuoteModalProps {
  quote: Quote | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSent: () => void;
}

export function SendQuoteModal({
  quote,
  open,
  onOpenChange,
  onSent,
}: SendQuoteModalProps) {
  const sendMutation = useMutation({
    mutationFn: (id: number) => quotesApi.send(id),
    onSuccess: (result) => {
      if (result.warning) {
        toast.warning(result.warning);
      } else {
        toast.success("Preventivo inviato al cliente");
      }
      onOpenChange(false);
      onSent();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error("Errore nell'invio", {
        description:
          err.response?.data?.message || "Impossibile inviare il preventivo",
      });
    },
  });

  const markAsSentMutation = useMutation({
    mutationFn: (id: number) => quotesApi.markAsSent(id),
    onSuccess: () => {
      toast.success("Preventivo segnato come inviato");
      onOpenChange(false);
      onSent();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error("Errore", {
        description:
          err.response?.data?.message ||
          "Impossibile aggiornare lo stato del preventivo",
      });
    },
  });

  const isPending = sendMutation.isPending || markAsSentMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/60 shrink-0">
                <Send className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                  Invia preventivo
                </DialogTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {quote?.code}
                  </span>
                  {quote?.title && (
                    <span className="ml-1 truncate">— {quote.title}</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Option cards */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Send email */}
          <button
            type="button"
            disabled={isPending}
            onClick={() => quote?.id && sendMutation.mutate(quote.id)}
            className="group relative flex flex-col gap-4 p-5 rounded-xl border-2 text-left
              transition-all duration-150 cursor-pointer
              bg-white dark:bg-slate-900
              border-slate-200 dark:border-slate-700
              hover:border-blue-400 dark:hover:border-blue-500
              hover:bg-blue-50 dark:hover:bg-blue-950/40
              focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400
              disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-900 disabled:hover:border-slate-200 dark:disabled:hover:border-slate-700"
          >
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/60 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/60 transition-colors duration-150">
                {sendMutation.isPending ? (
                  <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />
                ) : (
                  <Send className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                )}
              </div>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                {sendMutation.isPending ? "Invio in corso…" : "Invia email"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Invia il preventivo via email al cliente con link di accesso.
              </p>
            </div>
          </button>

          {/* Mark as sent */}
          <button
            type="button"
            disabled={isPending}
            onClick={() => quote?.id && markAsSentMutation.mutate(quote.id)}
            className="group relative flex flex-col gap-4 p-5 rounded-xl border-2 text-left
              transition-all duration-150 cursor-pointer
              bg-white dark:bg-slate-900
              border-slate-200 dark:border-slate-700
              hover:border-emerald-400 dark:hover:border-emerald-500
              hover:bg-emerald-50 dark:hover:bg-emerald-950/40
              focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400
              disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-900 disabled:hover:border-slate-200 dark:disabled:hover:border-slate-700"
          >
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/60 transition-colors duration-150">
                {markAsSentMutation.isPending ? (
                  <Loader2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 animate-spin" />
                ) : (
                  <CheckCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                {markAsSentMutation.isPending
                  ? "Aggiornamento…"
                  : "Segna come inviato"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Aggiorna lo stato senza inviare email. Utile se hai già contattato il cliente.
              </p>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex justify-start">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 gap-1.5"
          >
            <X className="h-3.5 w-3.5" />
            Annulla
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

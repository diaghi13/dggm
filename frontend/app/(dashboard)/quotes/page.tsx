"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { quotesApi } from "@/lib/api/quotes";
import { Quote } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Search, FileText } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SendQuoteModal } from "@/components/quotes/send-quote-modal";
import { DataTable } from "@/components/shared/data-table/data-table";
import { createQuotesColumns } from "@/app/(dashboard)/quotes/_components/quotes-columns";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner";

export default function QuotesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [selectedSendQuote, setSelectedSendQuote] = useState<Quote | null>(null);

  const queryClient = useQueryClient();

  const duplicateMutation = useMutation({
    mutationFn: (id: number) => quotesApi.duplicate(id),
    onSuccess: (newQuote) => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Preventivo duplicato", {
        description: `Creato ${newQuote.code}`,
      });
      router.push(`/quotes/${newQuote.id}/edit`);
    },
    onError: () => toast.error("Errore nella duplicazione"),
  });

  const handleDuplicate = (quote: Quote) => {
    if (!quote.id) return;
    duplicateMutation.mutate(quote.id);
  };

  // Define columns
  const columns = useMemo(
    () =>
      createQuotesColumns(
        (quote) => {
          // Safety check: non aprire il dialog se il preventivo non può essere eliminato
          if (
            quote.status !== "draft" ||
            quote.sent_date ||
            quote.approved_date ||
            quote.project_id
          ) {
            return;
          }
          setSelectedQuote(quote);
          setIsDeleteDialogOpen(true);
        },
        (quote) => {
          router.push(`/quotes/${quote.id}`);
        },
        handleDuplicate,
        (quote) => router.push(`/quotes/${quote.id}/edit`),
        (quote) => {
          setSelectedSendQuote(quote);
          setIsSendModalOpen(true);
        },
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router],
  );

  const { data, isLoading } = useQuery({
    queryKey: ["quotes", { page, search, status: statusFilter }],
    queryFn: () =>
      quotesApi.getAll({
        page,
        search,
        status: statusFilter !== "all" ? statusFilter : undefined,
        per_page: 15,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: quotesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      setIsDeleteDialogOpen(false);
      setSelectedQuote(null);
      toast.success("Preventivo eliminato", {
        description: "Il preventivo è stato rimosso dal sistema",
      });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Preventivi"
        description="Gestisci preventivi e offerte commerciali"
        icon={FileText}
        actions={
          <Button onClick={() => router.push("/quotes/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Nuovo Preventivo
          </Button>
        }
      />

      {/* Filtri in Card */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <Input
              placeholder="Cerca per codice, titolo o cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 h-11 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700">
              <SelectValue placeholder="Stato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli stati</SelectItem>
              <SelectItem value="draft">Bozza</SelectItem>
              <SelectItem value="sent">Inviato</SelectItem>
              <SelectItem value="approved">Approvato</SelectItem>
              <SelectItem value="rejected">Rifiutato</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        storageKey="quotes-table"
        onRowClick={(quote) => router.push(`/quotes/${quote.id}`)}
        emptyState={
          <EmptyState
            icon={FileText}
            title="Nessun preventivo trovato"
            description="Inizia creando il tuo primo preventivo"
            actionLabel="Nuovo Preventivo"
            onAction={() => router.push("/quotes/new")}
          />
        }
      />

      {data && data.meta.last_page > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-slate-600">
            Mostrando <span className="font-medium">{data.meta.from}</span> a{" "}
            <span className="font-medium">{data.meta.to}</span> di{" "}
            <span className="font-medium">{data.meta.total}</span> preventivi
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="border-slate-300"
            >
              Precedente
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === data.meta.last_page}
              className="border-slate-300"
            >
              Successiva
            </Button>
          </div>
        </div>
      )}

      <SendQuoteModal
        quote={selectedSendQuote}
        open={isSendModalOpen}
        onOpenChange={setIsSendModalOpen}
        onSent={() => {
          queryClient.invalidateQueries({ queryKey: ["quotes"] });
          setSelectedSendQuote(null);
        }}
      />

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-900">
              Elimina Preventivo
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              Sei sicuro di voler eliminare il preventivo{" "}
              <span className="font-semibold text-slate-900">
                {selectedQuote?.code}
              </span>
              ?
              <br />
              <span className="text-red-600 font-medium">
                Questa azione non può essere annullata.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setSelectedQuote(null)}
              className="border-slate-300"
            >
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                selectedQuote?.id && deleteMutation.mutate(selectedQuote.id)
              }
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Elimina Preventivo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

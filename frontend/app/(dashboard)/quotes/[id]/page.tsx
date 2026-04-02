"use client";

import React from "react";
import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { quotesApi } from "@/lib/api/quotes";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  FileText,
  Calendar,
  MapPin,
  FileDown,
  Eye,
  Settings,
  Briefcase,
  Mail,
  CheckCircle2,
  XCircle,
  Edit,
  Loader2,
  Copy,
  RotateCcw,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { PdfViewer } from "@/components/features/pdf/pdf-viewer";
import { QuoteAttachmentsUpload } from "@/app/(dashboard)/quotes/_components/quote-attachments-upload";
import type { QuoteItem } from "@/lib/types";
import { CurrencyDisplay } from "@/components/ui/currency-input";

const statusColors: Record<string, string> = {
  draft:
    "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200",
  sent: "bg-blue-100 text-blue-700 border-blue-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  expired: "bg-orange-100 text-orange-700 border-orange-200",
  converted: "bg-purple-100 text-purple-700 border-purple-200",
};

const statusLabels: Record<string, string> = {
  draft: "Bozza",
  sent: "Inviato",
  approved: "Approvato",
  rejected: "Rifiutato",
  expired: "Scaduto",
  converted: "Convertito",
};

const quoteTypeColors: Record<string, string> = {
  sale: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600",
  rental:
    "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700",
  event:
    "bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-700",
};

const quoteTypeLabels: Record<string, string> = {
  sale: "Vendita",
  rental: "Noleggio",
  event: "Evento",
};

// Helper function to build hierarchical items tree
function buildItemsTree(items: QuoteItem[]) {
  const itemsMap = new Map<number, QuoteItem & { children: QuoteItem[] }>();
  const rootItems: (QuoteItem & { children: QuoteItem[] })[] = [];

  // Create a map of all items
  items.forEach((item) => {
    if (item.id !== undefined) {
      itemsMap.set(item.id, { ...item, children: [] });
    }
  });

  // Build the tree structure
  items.forEach((item) => {
    if (item.id === undefined) return;

    const mappedItem = itemsMap.get(item.id);
    if (!mappedItem) return;

    if (item.parent_id === null || item.parent_id === undefined) {
      rootItems.push(mappedItem);
    } else {
      const parent = itemsMap.get(item.parent_id);
      if (parent) {
        parent.children.push(mappedItem);
      } else {
        // If parent not found, treat as root
        rootItems.push(mappedItem);
      }
    }
  });

  return rootItems;
}

const billingUnitLabel: Record<string, string> = {
  unit: "pz",
  hour: "ora",
  day: "gg",
  week: "sett",
  month: "mese",
  flat: "fisso",
};

const hasRentalItems = (items: QuoteItem[]): boolean =>
  items.some(
    (i) =>
      i.billing_unit &&
      i.billing_unit !== "unit" &&
      i.billing_unit !== "flat",
  );

// Helper function to render items tree recursively
function renderItemsTree(
  items: QuoteItem[],
  level: number = 0,
  showRentalColumns: boolean = false,
): React.ReactElement[] {
  const tree = level === 0 ? buildItemsTree(items) : items;
  const elements: React.ReactElement[] = [];

  tree.forEach((item) => {
    const itemTax = item.vat_amount || 0;
    const indent = level * 24; // 24px per level
    const isSection = item.type === "section";

    elements.push(
      <tr
        key={item.id}
        className={`hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors ${
          isSection ? "bg-slate-50/50 dark:bg-slate-900/20" : ""
        }`}
      >
        <td className="px-4 py-3">
          <div
            className="flex items-start gap-2"
            style={{ paddingLeft: `${indent}px` }}
          >
            {/* Level indicator */}
            {level > 0 && (
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                L{level}
              </div>
            )}

            {/* Item content */}
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <p
                  className={`${isSection ? "font-bold text-base" : "font-medium"} text-slate-900 dark:text-slate-100`}
                >
                  {item.description}
                </p>
                {isSection && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    SEZIONE
                  </Badge>
                )}
                {item.children && item.children.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0"
                  >
                    {item.children.length} sotto-voci
                  </Badge>
                )}
              </div>
              {item.code && (
                <p className="text-xs text-slate-500">Cod. {item.code}</p>
              )}
              {item.notes && (
                <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                  {item.notes}
                </p>
              )}
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-center">
          {!isSection && (
            <>
              <span className="font-medium">{item.quantity || 1}</span>
              {item.unit && (
                <span className="text-xs text-slate-500 ml-1">{item.unit}</span>
              )}
            </>
          )}
        </td>
        {showRentalColumns && (
          <td className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
            {!isSection &&
            item.billing_unit &&
            item.billing_unit !== "unit" ? (
              <span className="inline-flex items-center gap-1">
                <span className="font-medium">
                  {billingUnitLabel[item.billing_unit] ?? item.billing_unit}
                </span>
                {item.duration != null && (
                  <span className="text-slate-400">× {item.duration}</span>
                )}
              </span>
            ) : (
              <span className="text-slate-300 dark:text-slate-600">—</span>
            )}
          </td>
        )}
        <td className="px-4 py-3 text-right font-medium">
          {!isSection && <CurrencyDisplay value={item.unit_price || 0} />}
        </td>
        <td className="px-4 py-3 text-right">
          {!isSection && item.discount_percentage > 0 ? (
            <div className="text-red-600 dark:text-red-400">
              <span className="text-xs">-{item.discount_percentage}%</span>
              <br />
              <span className="font-medium text-sm">
                -<CurrencyDisplay value={item.discount_amount || 0} showCurrency={false} />
              </span>
            </div>
          ) : (
            !isSection && <span className="text-slate-400">-</span>
          )}
        </td>
        <td className="px-4 py-3 text-right">
          {!isSection && (
            <div className="space-y-1">
              <span className="font-medium text-blue-600 dark:text-blue-400">
                {item.vat_rate || 0}%
              </span>
              <br />
              <span className="text-xs text-slate-500">
                <CurrencyDisplay value={itemTax} />
              </span>
            </div>
          )}
        </td>
        <td className="px-4 py-3 text-right">
          <div className="space-y-1">
            <p
              className={`font-bold ${isSection ? "text-lg" : "text-base"} text-slate-900 dark:text-slate-100`}
            >
              <CurrencyDisplay value={item.total_with_vat || 0} />
            </p>
            {!isSection && (
              <p className="text-xs text-slate-500">(IVA incl.)</p>
            )}
          </div>
        </td>
      </tr>,
    );

    // Recursively render children
    if (item.children && item.children.length > 0) {
      elements.push(
        ...renderItemsTree(item.children, level + 1, showRentalColumns),
      );
    }
  });

  return elements;
}

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const quoteId = parseInt(params.id as string);

  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);

  const { data: quote, isLoading } = useQuery({
    queryKey: ["quote", quoteId],
    queryFn: () => quotesApi.getById(quoteId),
    enabled: !!quoteId,
  });

  const changeStatusMutation = useMutation({
    mutationFn: (status: string) => quotesApi.changeStatus(quoteId, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quote", quoteId] });
      queryClient.invalidateQueries({ queryKey: ["quotes"] });

      if (data.status === "converted" && data.project_id) {
        toast.success("Preventivo convertito in progetto", {
          description: `Il progetto ${data.project?.code || ""} è stato creato con successo`,
        });
      } else {
        toast.success("Stato aggiornato", {
          description:
            "Lo stato del preventivo è stato modificato con successo",
        });
      }
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error("Errore cambio stato", {
        description:
          err.response?.data?.message ||
          "Impossibile cambiare lo stato del preventivo",
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: () => quotesApi.approve(quoteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote", quoteId] });
      toast.success("Preventivo approvato");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error("Errore", {
        description:
          err.response?.data?.message || "Impossibile approvare il preventivo",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => quotesApi.reject(quoteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote", quoteId] });
      toast.success("Preventivo rifiutato");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error("Errore", {
        description:
          err.response?.data?.message || "Impossibile rifiutare il preventivo",
      });
    },
  });

  const sendMutation = useMutation({
    mutationFn: () => quotesApi.send(quoteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote", quoteId] });
      toast.success("Preventivo inviato al cliente");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error("Errore", {
        description:
          err.response?.data?.message || "Impossibile inviare il preventivo",
      });
    },
  });

  const convertToProjectMutation = useMutation({
    mutationFn: () => quotesApi.convertToProject(quoteId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quote", quoteId] });
      toast.success("Preventivo convertito in progetto", {
        description: "Sei stato reindirizzato al nuovo progetto creato",
      });
      router.push(`/projects/${data.project_id}`);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error("Errore", {
        description:
          err.response?.data?.message ||
          "Impossibile convertire il preventivo in progetto",
      });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: () => quotesApi.duplicate(quoteId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Preventivo duplicato", {
        description: `Creato nuovo preventivo ${data.code}`,
      });
      router.push(`/quotes/${data.id}/edit`);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error("Errore", {
        description: err.response?.data?.message || "Impossibile duplicare il preventivo",
      });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: () => quotesApi.changeStatus(quoteId, "draft"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote", quoteId] });
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Preventivo ripristinato a Bozza");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error("Errore", {
        description: err.response?.data?.message || "Impossibile ripristinare il preventivo",
      });
    },
  });

  const handleLoadPdf = useCallback(async () => {
    if (pdfBlob || loadingPdf) return;

    setLoadingPdf(true);
    try {
      const blob = await quotesApi.downloadPdf(quoteId);
      setPdfBlob(blob);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error("Errore caricamento PDF", {
        description:
          err.response?.data?.message || "Impossibile caricare l'anteprima PDF",
      });
    } finally {
      setLoadingPdf(false);
    }
  }, [quoteId, pdfBlob, loadingPdf]);

  const handleDownloadPdf = useCallback(async () => {
    if (!quote || downloadingPdf) return;

    setDownloadingPdf(true);
    try {
      const blob = await quotesApi.downloadPdf(quoteId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Preventivo-${quote.code}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("PDF scaricato");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error("Errore", {
        description:
          err.response?.data?.message || "Impossibile scaricare il PDF",
      });
    } finally {
      setDownloadingPdf(false);
    }
  }, [quote, quoteId, downloadingPdf]);

  const handleBack = useCallback(() => {
    router.push("/quotes");
  }, [router]);

  const handleEdit = useCallback(() => {
    router.push(`/quotes/${quoteId}/edit`);
  }, [router, quoteId]);

  const flatItems = quote?.items ?? [];
  const showRentalColumns =
    quote?.quote_type !== "sale" || hasRentalItems(flatItems);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Caricamento preventivo...</p>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Preventivo non trovato</h2>
          <p className="text-slate-600 mb-6">
            Il preventivo richiesto non esiste o è stato eliminato
          </p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Torna ai Preventivi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <span>{quote.code}</span>
            <Badge
              className={`${statusColors[quote.status]} font-medium text-xs border`}
            >
              {statusLabels[quote.status]}
            </Badge>
            {quote.quote_type && (
              <Badge
                className={`${quoteTypeColors[quote.quote_type]} font-medium text-xs border`}
              >
                {quoteTypeLabels[quote.quote_type]}
              </Badge>
            )}
            {quote.project_id && quote.project && (
              <Badge
                className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium text-xs border cursor-pointer hover:bg-emerald-100 transition-colors"
                onClick={() => router.push(`/projects/${quote.project_id}`)}
              >
                🏗️ {quote.project?.code}
              </Badge>
            )}
          </div>
        }
        description={quote.title}
        actions={
          <TooltipProvider>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleBack}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Indietro</TooltipContent>
              </Tooltip>

              {!["approved", "converted"].includes(quote.status) && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handleEdit}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Modifica</TooltipContent>
                </Tooltip>
              )}

              {quote.status === "draft" && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => sendMutation.mutate()}
                      disabled={sendMutation.isPending}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Invia al cliente</TooltipContent>
                </Tooltip>
              )}

              {(quote.status === "sent" || quote.status === "rejected") && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => approveMutation.mutate()}
                      disabled={approveMutation.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Approva</TooltipContent>
                </Tooltip>
              )}

              {quote.status === "sent" && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => rejectMutation.mutate()}
                      disabled={rejectMutation.isPending}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Rifiuta</TooltipContent>
                </Tooltip>
              )}

              {(quote.status === "rejected" || quote.status === "expired" || quote.status === "approved") && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowRestoreDialog(true)}
                      disabled={restoreMutation.isPending}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Ripristina a Bozza</TooltipContent>
                </Tooltip>
              )}

              {quote.status === "approved" && !quote.project_id && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => convertToProjectMutation.mutate()}
                      disabled={convertToProjectMutation.isPending}
                    >
                      <Briefcase className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Converti in Progetto</TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => duplicateMutation.mutate()}
                    disabled={duplicateMutation.isPending}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Duplica preventivo</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    onClick={handleDownloadPdf}
                    disabled={downloadingPdf}
                  >
                    {downloadingPdf ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileDown className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Scarica PDF</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        }
      />

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">
            <FileText className="mr-2 h-4 w-4" />
            Dettagli
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="mr-2 h-4 w-4" />
            Anteprima PDF
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Riepilogo Generale */}
              <Card className="border-2">
                <CardHeader className="bg-slate-50 dark:bg-slate-900/50">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5" />
                    Riepilogo Preventivo
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs text-slate-500 uppercase tracking-wider">
                        Titolo
                      </Label>
                      <p className="text-lg font-semibold mt-1">
                        {quote.title}
                      </p>
                    </div>
                    {quote.description && (
                      <div>
                        <Label className="text-xs text-slate-500 uppercase tracking-wider">
                          Descrizione
                        </Label>
                        <p className="font-medium whitespace-pre-wrap text-slate-700 dark:text-slate-300 mt-1">
                          {quote.description}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Cliente e Riferimenti */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Cliente e Riferimenti
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {quote.customer && (
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                        <Label className="text-xs text-slate-500 uppercase tracking-wider">
                          Cliente
                        </Label>
                        <p className="font-semibold text-base mt-1">
                          {quote.customer.display_name ||
                            quote.customer.company_name ||
                            `${quote.customer.first_name || ""} ${quote.customer.last_name || ""}`.trim() ||
                            "Cliente senza nome"}
                        </p>
                        {quote.customer.email && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            📧 {quote.customer.email}
                          </p>
                        )}
                        {quote.customer.phone && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            📞 {quote.customer.phone}
                          </p>
                        )}
                      </div>
                    )}
                    {!quote.customer && (
                      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                        <Label className="text-xs text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                          Cliente
                        </Label>
                        <p className="font-semibold text-base mt-1 text-amber-900 dark:text-amber-100">
                          ⚠️ Nessun cliente associato
                        </p>
                      </div>
                    )}
                    {quote.projectManager && (
                      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                        <Label className="text-xs text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                          Project Manager
                        </Label>
                        <p className="font-semibold text-base mt-1">
                          {quote.projectManager.name}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          📧 {quote.projectManager.email}
                        </p>
                      </div>
                    )}
                    {quote.priceList && (
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                        <Label className="text-xs text-slate-500 uppercase tracking-wider">
                          Listino Prezzi
                        </Label>
                        <p className="font-medium mt-1">
                          {quote.priceList.name}
                        </p>
                      </div>
                    )}
                    {quote.paymentTerm && (
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                        <Label className="text-xs text-slate-500 uppercase tracking-wider">
                          Condizioni di Pagamento
                        </Label>
                        <p className="font-medium mt-1">
                          {quote.paymentTerm.name}
                        </p>
                      </div>
                    )}
                    {quote.financialResource && (
                      <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30">
                        <Label className="text-xs text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                          Risorsa Finanziaria
                        </Label>
                        <p className="font-medium mt-1">
                          {quote.financialResource.name}
                        </p>
                        {quote.financialResource.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            {quote.financialResource.description}
                          </p>
                        )}
                      </div>
                    )}
                    {quote.warrantyType && (
                      <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                        <Label className="text-xs text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                          Garanzia
                        </Label>
                        <p className="font-medium mt-1">
                          {quote.warrantyType.name}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Ubicazione Lavori */}
              {(quote.address ||
                quote.city ||
                quote.province ||
                quote.postal_code) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Ubicazione Lavori
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {quote.address && (
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                          <Label className="text-xs text-slate-500 uppercase tracking-wider">
                            Indirizzo
                          </Label>
                          <p className="font-medium text-base mt-1">
                            {quote.address}
                          </p>
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-3">
                        {quote.city && (
                          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                            <Label className="text-xs text-slate-500 uppercase tracking-wider">
                              Città
                            </Label>
                            <p className="font-medium mt-1">{quote.city}</p>
                          </div>
                        )}
                        {quote.province && (
                          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                            <Label className="text-xs text-slate-500 uppercase tracking-wider">
                              Provincia
                            </Label>
                            <p className="font-medium mt-1">{quote.province}</p>
                          </div>
                        )}
                        {quote.postal_code && (
                          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                            <Label className="text-xs text-slate-500 uppercase tracking-wider">
                              CAP
                            </Label>
                            <p className="font-medium mt-1">
                              {quote.postal_code}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Timeline e Date */}
              {(quote.issue_date ||
                quote.expiry_date ||
                quote.work_start_date ||
                quote.work_end_date ||
                quote.work_start_description ||
                quote.work_duration_description) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Timeline e Pianificazione
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {quote.issue_date && (
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                          <Label className="text-xs text-slate-500 uppercase tracking-wider">
                            Data Emissione
                          </Label>
                          <p className="font-semibold text-base mt-1">
                            {new Date(quote.issue_date).toLocaleDateString(
                              "it-IT",
                            )}
                          </p>
                        </div>
                      )}
                      {quote.expiry_date && (
                        <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30">
                          <Label className="text-xs text-orange-700 dark:text-orange-400 uppercase tracking-wider">
                            Scadenza Preventivo
                          </Label>
                          <p className="font-semibold text-base mt-1">
                            {new Date(quote.expiry_date).toLocaleDateString(
                              "it-IT",
                            )}
                          </p>
                        </div>
                      )}
                      {quote.work_start_date && (
                        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                          <Label className="text-xs text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                            Inizio Lavori
                          </Label>
                          <p className="font-semibold text-base mt-1">
                            {new Date(quote.work_start_date).toLocaleDateString(
                              "it-IT",
                            )}
                          </p>
                        </div>
                      )}
                      {quote.work_end_date && (
                        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                          <Label className="text-xs text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                            Fine Lavori
                          </Label>
                          <p className="font-semibold text-base mt-1">
                            {new Date(quote.work_end_date).toLocaleDateString(
                              "it-IT",
                            )}
                          </p>
                        </div>
                      )}
                      {quote.work_start_description && (
                        <div className="col-span-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                          <Label className="text-xs text-slate-500 uppercase tracking-wider">
                            Note Inizio
                          </Label>
                          <p className="font-medium mt-1">
                            {quote.work_start_description}
                          </p>
                        </div>
                      )}
                      {quote.work_duration_description && (
                        <div className="col-span-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                          <Label className="text-xs text-slate-500 uppercase tracking-wider">
                            Durata Stimata
                          </Label>
                          <p className="font-medium mt-1">
                            {quote.work_duration_description}
                          </p>
                        </div>
                      )}
                      {(quote.quote_type === "event" ||
                        quote.quote_type === "rental") &&
                        quote.event_days != null && (
                          <div className="col-span-2 p-3 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
                            <Label className="text-xs text-violet-700 dark:text-violet-400 uppercase tracking-wider">
                              Durata
                            </Label>
                            <p className="font-semibold text-base mt-1 text-violet-900 dark:text-violet-100">
                              {quote.event_days} gg
                            </p>
                          </div>
                        )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Voci del Preventivo - NESTED ITEMS */}
              {quote.items && quote.items.length > 0 && (
                <Card className="border-2 border-slate-200 dark:border-slate-700">
                  <CardHeader className="bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Voci del Preventivo ({quote.items.length})
                      </CardTitle>
                      {quote.vat_included_in_prices && (
                        <Badge
                          variant="secondary"
                          className="text-xs font-normal"
                        >
                          Prezzi con IVA inclusa
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-100 dark:bg-slate-800/50 border-y border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Descrizione
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Q.tà
                            </th>
                            {showRentalColumns && (
                              <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                                Fatturazione
                              </th>
                            )}
                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Prezzo Unit.
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Sconto
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              IVA %
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Totale
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {renderItemsTree(quote.items, 0, showRentalColumns)}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Allegati */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Allegati
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <QuoteAttachmentsUpload
                    quoteId={quoteId}
                    attachments={quote.attachments ?? []}
                    onAttachmentsChange={() =>
                      queryClient.invalidateQueries({
                        queryKey: ["quote", quoteId],
                      })
                    }
                  />
                </CardContent>
              </Card>

              {/* Note e Termini */}
              {(quote.notes ||
                quote.terms_and_conditions ||
                quote.footer_text) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Note e Condizioni
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {quote.notes && (
                      <div>
                        <Label className="text-sm text-slate-500">Note</Label>
                        <p className="font-medium whitespace-pre-wrap">
                          {quote.notes}
                        </p>
                      </div>
                    )}
                    {quote.terms_and_conditions && (
                      <div>
                        <Label className="text-sm text-slate-500">
                          Termini e Condizioni
                        </Label>
                        <p className="font-medium whitespace-pre-wrap">
                          {quote.terms_and_conditions}
                        </p>
                      </div>
                    )}
                    {quote.footer_text && (
                      <div>
                        <Label className="text-sm text-slate-500">
                          Testo Footer
                        </Label>
                        <p className="font-medium whitespace-pre-wrap">
                          {quote.footer_text}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              {/* Totali */}
              <Card className="border-2 border-slate-200 dark:border-slate-700 sticky top-6">
                <CardHeader className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                  <CardTitle className="text-lg">Riepilogo Importi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-6">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">
                      Imponibile
                    </span>
                    <span className="font-semibold text-lg">
                      <CurrencyDisplay value={quote.subtotal} />
                    </span>
                  </div>
                  {quote.discount_percentage > 0 && (
                    <div className="flex justify-between items-center py-2 border-y border-slate-100 dark:border-slate-800">
                      <span className="text-slate-600 dark:text-slate-400">
                        Sconto ({quote.discount_percentage}%)
                      </span>
                      <span className="font-semibold text-lg text-red-600 dark:text-red-400">
                        -<CurrencyDisplay value={quote.discount_amount} showCurrency={false} />
                      </span>
                    </div>
                  )}
                  <div className="py-2 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">
                        IVA Totale
                      </span>
                      <span className="font-semibold text-lg text-blue-600 dark:text-blue-400">
                        <CurrencyDisplay value={quote.tax_amount} />
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 italic">
                      Somma delle IVA calcolate su ogni voce
                    </p>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-lg font-bold">Totale Preventivo</span>
                    <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      <CurrencyDisplay value={quote.total_amount} />
                    </span>
                  </div>
                  {quote.deposits && quote.deposits.length > 0 ? (
                    <div className="mt-4 space-y-1">
                      <Label className="text-xs text-slate-500 uppercase tracking-wider">
                        Piano Pagamenti
                      </Label>
                      {quote.deposits.map((dep, idx) => (
                        <div
                          key={dep.id ?? idx}
                          className="flex items-center justify-between py-2 px-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 gap-2"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-amber-900 dark:text-amber-100 truncate">
                              {dep.description}
                            </p>
                            {dep.due_event && (
                              <p className="text-xs text-amber-700 dark:text-amber-400">
                                {dep.due_event}
                              </p>
                            )}
                            {dep.due_date && (
                              <p className="text-xs text-amber-700 dark:text-amber-400">
                                {new Date(dep.due_date).toLocaleDateString("it-IT")}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
                              <CurrencyDisplay value={dep.amount ?? 0} />
                            </p>
                            {dep.percentage != null && (
                              <p className="text-xs text-amber-700 dark:text-amber-400">
                                {dep.percentage}%
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                      {(() => {
                        const paid = quote.deposits.reduce((s, d) => s + (d.amount ?? 0), 0);
                        const saldo = (quote.total_amount ?? 0) - paid;
                        return saldo > 0.01 ? (
                          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                              Saldo finale
                            </span>
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              <CurrencyDisplay value={saldo} />
                            </span>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  ) : (quote.deposit_percentage || quote.deposit_amount) ? (
                    <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <Label className="text-xs text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                        Caparra Richiesta
                      </Label>
                      <div className="flex justify-between items-center mt-2">
                        {quote.deposit_percentage && (
                          <span className="text-sm text-amber-700 dark:text-amber-300">
                            {quote.deposit_percentage}%
                          </span>
                        )}
                        <span className="font-bold text-lg text-amber-900 dark:text-amber-100">
                          <CurrencyDisplay value={quote.deposit_amount || 0} />
                        </span>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              {/* Date e Stato */}
              <Card>
                <CardHeader>
                  <CardTitle>Date e Stato</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {quote.issue_date && (
                    <div className="p-2 rounded bg-slate-50 dark:bg-slate-900/50">
                      <Label className="text-xs text-slate-500 uppercase tracking-wider">
                        Emissione
                      </Label>
                      <p className="font-medium mt-1">
                        {new Date(quote.issue_date).toLocaleDateString("it-IT")}
                      </p>
                    </div>
                  )}
                  {quote.expiry_date && (
                    <div className="p-2 rounded bg-orange-50 dark:bg-orange-950/30">
                      <Label className="text-xs text-orange-700 dark:text-orange-400 uppercase tracking-wider">
                        Scadenza
                      </Label>
                      <p className="font-medium mt-1">
                        {new Date(quote.expiry_date).toLocaleDateString(
                          "it-IT",
                        )}
                      </p>
                    </div>
                  )}
                  {quote.sent_date && (
                    <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/30">
                      <Label className="text-xs text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                        Invio
                      </Label>
                      <p className="font-medium mt-1">
                        {new Date(quote.sent_date).toLocaleDateString("it-IT")}
                      </p>
                    </div>
                  )}
                  {quote.approved_date && (
                    <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/30">
                      <Label className="text-xs text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                        Approvazione
                      </Label>
                      <p className="font-medium mt-1">
                        {new Date(quote.approved_date).toLocaleDateString(
                          "it-IT",
                        )}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Opzioni Visualizzazione PDF */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Opzioni Visualizzazione
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {/* <div className="flex items-center gap-2">
                      {quote.tax_included ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-slate-300" />
                      )}
                      <span>Includi IVA nel Preventivo</span>
                    </div> */}
                    <div className="flex items-center gap-2">
                      {quote.show_unit_prices ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-slate-300" />
                      )}
                      <span>Mostra Prezzi Unitari</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {quote.show_product_codes ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-slate-300" />
                      )}
                      <span>Mostra Codici Prodotto</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {quote.show_vat ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-slate-300" />
                      )}
                      <span>Mostra Colonna e Totale Aliquota IVA</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {quote.tax_included ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-slate-300" />
                      )}
                      <span>Aggiungi IVA al Preventivo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {quote.include_terms_and_conditions ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-slate-300" />
                      )}
                      <span>Includi Termini e Condizioni</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {quote.show_section_totals ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-slate-300" />
                      )}
                      <span>Mostra Totali per Sezione</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-6" onFocus={handleLoadPdf}>
          {pdfBlob ? (
            <PdfViewer file={pdfBlob} onDownload={handleDownloadPdf} />
          ) : (
            <Card className="p-12">
              <div className="flex flex-col items-center gap-4">
                {loadingPdf ? (
                  <>
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
                    <p className="text-sm text-slate-500">
                      Caricamento anteprima PDF...
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                      <Eye className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-500">
                      Clicca qui per caricare l&apos;anteprima
                    </p>
                    <Button onClick={handleLoadPdf} variant="outline">
                      <Eye className="mr-2 h-4 w-4" />
                      Carica Anteprima
                    </Button>
                  </>
                )}
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-orange-500" />
              Ripristina preventivo a Bozza
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                {quote.status === "approved" ? (
                  <>
                    <p>
                      Stai per riportare in bozza il preventivo{" "}
                      <strong className="text-slate-900 dark:text-slate-100">
                        {quote.code}
                      </strong>{" "}
                      che è attualmente <strong>approvato</strong>.
                    </p>
                    <div className="rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30 p-3 space-y-1">
                      <p className="font-medium text-orange-800 dark:text-orange-300">
                        ⚠️ Attenzione
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-orange-700 dark:text-orange-400">
                        <li>Il preventivo è già stato accettato dal cliente</li>
                        {quote.sent_date && (
                          <li>
                            È stato inviato il{" "}
                            {new Date(quote.sent_date).toLocaleDateString("it-IT")}
                          </li>
                        )}
                        {quote.project_id && (
                          <li>
                            È associato al progetto{" "}
                            <strong>{quote.project?.code}</strong> — il progetto
                            non verrà eliminato
                          </li>
                        )}
                        <li>
                          Tornando a Bozza il preventivo potrà essere modificato
                          e dovrà essere reinviato al cliente
                        </li>
                      </ul>
                    </div>
                    <p>Sei sicuro di voler procedere?</p>
                  </>
                ) : (
                  <p>
                    Il preventivo{" "}
                    <strong className="text-slate-900 dark:text-slate-100">
                      {quote.code}
                    </strong>{" "}
                    verrà ripristinato allo stato di{" "}
                    <strong>Bozza</strong> e potrà essere modificato e reinviato.
                    Continuare?
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => restoreMutation.mutate()}
              className={
                quote.status === "approved"
                  ? "bg-orange-600 hover:bg-orange-700 text-white"
                  : undefined
              }
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Ripristina a Bozza
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

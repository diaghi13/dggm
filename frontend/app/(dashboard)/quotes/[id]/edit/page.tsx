"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { quotesApi } from "@/lib/api/quotes";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { QuoteFormData, QuoteItem } from "@/lib/types";
import { sanitizeOrphanedChildren } from "@/components/quote-items/utils";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { QuoteForm } from "@/components/quotes/quote-form";
import { PageHeader } from "@/components/layout/page-header";

export default function EditQuotePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const quoteId = parseInt(params.id as string);
  const isMounted = useRef(false);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [formData, setFormData] = useState<QuoteFormData>({
    title: "",
    customer_id: 0,
    project_manager_id: null,
    description: null,
    address: null,
    city: null,
    province: null,
    postal_code: null,
    status: "draft",
    issue_date: new Date().toISOString().split("T")[0],
    expiry_date: null,
    price_list_id: null,
    payment_term_id: null,
    financial_resource_id: null,
    warranty_type_id: null,
    subtotal: 0,
    discount_percentage: 0,
    discount_amount: 0,
    tax_percentage: 22,
    tax_amount: 0,
    total_amount: 0,
    deposit_percentage: null,
    deposit_amount: null,
    deposits: [],
    work_start_description: null,
    work_start_date: null,
    work_duration_description: null,
    work_end_date: null,
    tax_included: false,
    show_unit_prices: true,
    show_product_codes: true,
    show_vat: true,
    show_section_totals: false,
    vat_included_in_prices: false,
    include_terms_and_conditions: true,
    notes: null,
    terms_and_conditions: null,
    footer_text: null,
    items: [],
  });

  const { navigateWithConfirm } = useUnsavedChanges({
    hasUnsavedChanges,
    message:
      "Hai modifiche non salvate. Vuoi davvero lasciare questa pagina? Le modifiche andranno perse.",
  });

  const { data: quote, isLoading } = useQuery({
    queryKey: ["quote", quoteId],
    queryFn: () => quotesApi.getById(quoteId),
    enabled: !!quoteId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: QuoteFormData) => quotesApi.update(quoteId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote", quoteId] });
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      setHasUnsavedChanges(false);
      toast.success("Preventivo aggiornato", {
        description: "Le modifiche sono state salvate con successo",
      });
      router.push(`/quotes/${quoteId}`);
    },
    onError: (error: any) => {
      // eslint-disable-line @typescript-eslint/no-explicit-any
      const apiErrors = error.response?.data?.errors;
      const description = apiErrors
        ? (Object.values(apiErrors) as string[][])
            .flat()
            .slice(0, 4)
            .join(" • ")
        : (error.response?.data?.message ?? "Impossibile salvare le modifiche");
      toast.error("Errore di validazione", { description });
    },
  });

  // Inizializza formData quando il preventivo viene caricato
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!quote) return;

    setFormData({
      code: quote.code,
      title: quote.title,
      customer_id: quote.customer_id,
      project_manager_id: quote.project_manager_id,
      description: quote.description,
      address: quote.address,
      city: quote.city,
      province: quote.province,
      postal_code: quote.postal_code,
      status: quote.status,
      quote_type: quote.quote_type,
      issue_date: quote.issue_date,
      expiry_date: quote.expiry_date,
      price_list_id: quote.price_list_id,
      payment_term_id: quote.payment_term_id,
      financial_resource_id: quote.financial_resource_id,
      warranty_type_id: quote.warranty_type_id,
      subtotal: quote.subtotal,
      discount_percentage: quote.discount_percentage,
      discount_amount: quote.discount_amount,
      tax_percentage: quote.tax_percentage,
      tax_amount: quote.tax_amount,
      total_amount: quote.total_amount,
      deposit_percentage: quote.deposit_percentage,
      deposit_amount: quote.deposit_amount,
      balance_label: quote.balance_label ?? null,
      work_start_description: quote.work_start_description,
      work_start_date: quote.work_start_date,
      work_duration_description: quote.work_duration_description,
      work_end_date: quote.work_end_date,
      tax_included: quote.tax_included,
      show_unit_prices: quote.show_unit_prices,
      show_product_codes: quote.show_product_codes,
      show_vat: quote.show_vat,
      show_section_totals: quote.show_section_totals,
      vat_included_in_prices: quote.vat_included_in_prices,
      include_terms_and_conditions: quote.include_terms_and_conditions,
      notes: quote.notes,
      terms_and_conditions: quote.terms_and_conditions,
      footer_text: quote.footer_text,
      items: quote.items || [],
      deposits: quote.deposits || [],
    });
    // NON attiviamo hasUnsavedChanges al primo caricamento
    setHasUnsavedChanges(false);
  }, [quote]);

  // Mark component as mounted after first render to enable dirty tracking
  useEffect(() => {
    const timer = setTimeout(() => {
      isMounted.current = true;
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleInputChange = useCallback(
    (field: keyof QuoteFormData, value: any) => {
      // eslint-disable-line @typescript-eslint/no-explicit-any
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (isMounted.current) {
        setHasUnsavedChanges(true);
      }
    },
    [],
  );

  const handleItemsChange = useCallback((items: QuoteItem[]) => {
    setFormData((prev) => ({ ...prev, items }));
    if (isMounted.current) {
      setHasUnsavedChanges(true);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!formData.title || !formData.customer_id) {
      toast.error("Campi obbligatori mancanti", {
        description: "Inserisci almeno titolo e cliente",
      });
      return;
    }

    const sanitizedItems = sanitizeOrphanedChildren(formData.items || []);
    updateMutation.mutate({ ...formData, items: sanitizedItems });
  }, [formData, updateMutation]);

  const handleBack = useCallback(() => {
    navigateWithConfirm(`/quotes/${quoteId}`);
  }, [navigateWithConfirm, quoteId]);

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
          <p className="text-slate-600 mb-6">Preventivo non trovato</p>
          <Button onClick={() => router.push("/quotes")} variant="outline">
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
        title={`Modifica Preventivo ${quote.code}`}
        description={quote.title}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={updateMutation.isPending}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Annulla
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                updateMutation.isPending ||
                !formData.title ||
                !formData.customer_id
              }
            >
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? "Salvataggio..." : "Salva Modifiche"}
            </Button>
          </div>
        }
      />

      <QuoteForm
        formData={formData}
        onChange={handleInputChange}
        onItemsChange={handleItemsChange}
        quoteId={quoteId}
      />
    </div>
  );
}

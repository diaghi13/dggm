"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { quotesApi } from "@/lib/api/quotes";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { QuoteFormData, QuoteItem } from "@/lib/types";
import { sanitizeOrphanedChildren } from "@/components/quote-items/utils";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { useSetting } from "@/hooks/use-settings";
import { useDefaultPriceList } from "@/hooks/use-price-lists";
import { QuoteForm } from "@/components/quotes/quote-form";
import { PageHeader } from "@/components/layout/page-header";
import { QuoteTypeSelectionDialog } from "@/components/quotes/quote-type-selection-dialog";

export default function NewQuotePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMounted = useRef(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [selectedQuoteType, setSelectedQuoteType] = useState<
    "sale" | "rental" | "event" | null
  >(null);

  // Load all quote defaults from settings (loaded via auth/me into Zustand store)
  const showUnitPricesDefault = useSetting<boolean>("quotes.show_unit_prices_by_default", true);
  const showProductCodesDefault = useSetting<boolean>("quotes.show_product_codes_by_default", true);
  const showVatDefault = useSetting<boolean>("quotes.show_vat_by_default", true);
  const showSectionTotalsDefault = useSetting<boolean>("quotes.show_section_totals_by_default", true);
  const vatIncludedDefault = useSetting<boolean>("quotes.vat_included_in_prices_by_default", false);
  const taxIncludedDefault = useSetting<boolean>("quotes.tax_included_by_default", false);
  const includeTermsDefault = useSetting<boolean>("quotes.include_terms_and_conditions_by_default", true);
  const defaultNotes = useSetting<string>("quotes.default_notes", "");
  const defaultValidityDays = useSetting<number>("quotes.default_validity_days", 30);
  const termsTemplate = useSetting<string>("quotes.terms_and_conditions_template", "");

  // Calcola la data di scadenza dai giorni di validità predefiniti
  const defaultExpiryDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + (defaultValidityDays || 30));
    return d.toISOString().split("T")[0];
  })();

  // Load default price list
  const { data: defaultPriceList } = useDefaultPriceList();

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
    quote_type: "sale",
    issue_date: new Date().toISOString().split("T")[0],
    expiry_date: defaultExpiryDate,
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
    balance_label: null,
    deposits: [],
    work_start_description: null,
    work_start_date: null,
    work_duration_description: null,
    work_end_date: null,
    tax_included: taxIncludedDefault ?? false,
    show_unit_prices: showUnitPricesDefault ?? true,
    show_product_codes: showProductCodesDefault ?? true,
    show_vat: showVatDefault ?? true,
    show_section_totals: showSectionTotalsDefault ?? true,
    vat_included_in_prices: vatIncludedDefault ?? false,
    include_terms_and_conditions: includeTermsDefault ?? true,
    notes: defaultNotes || null,
    terms_and_conditions: termsTemplate || null,
    footer_text: null,
    items: [],
  });

  const { navigateWithConfirm } = useUnsavedChanges({
    hasUnsavedChanges,
    message:
      "Hai modifiche non salvate. Vuoi davvero lasciare questa pagina? Il preventivo non verrà creato.",
  });

  const createMutation = useMutation({
    mutationFn: quotesApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      setHasUnsavedChanges(false);
      toast.success("Preventivo creato con successo", {
        description: `Il preventivo ${data.code} è stato creato`,
      });
      router.push(`/quotes/${data.id}`);
    },
    onError: (error: any) => {
      const apiErrors = error.response?.data?.errors;
      const description = apiErrors
        ? (Object.values(apiErrors) as string[][])
            .flat()
            .slice(0, 4)
            .join(" • ")
        : (error.response?.data?.message ?? "Impossibile creare il preventivo");
      toast.error("Errore di validazione", { description });
    },
  });

  const handleInputChange = useCallback(
    (field: keyof QuoteFormData, value: any) => {
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

  // Mark component as mounted after first render to enable dirty tracking
  useEffect(() => {
    const timer = setTimeout(() => {
      isMounted.current = true;
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Apply default price list when available
  useEffect(() => {
    if (defaultPriceList?.id && !formData.price_list_id) {
      setFormData((prev) => ({
        ...prev,
        price_list_id: defaultPriceList.id,
      }));
    }
  }, [defaultPriceList?.id, formData.price_list_id]);

  const handleSave = useCallback(async () => {
    if (!formData.title || !formData.customer_id) {
      toast.error("Campi obbligatori mancanti", {
        description: "Inserisci almeno titolo e cliente",
      });
      return;
    }

    const sanitizedItems = sanitizeOrphanedChildren(formData.items || []);
    createMutation.mutate({ ...formData, items: sanitizedItems });
  }, [formData, createMutation]);

  const handleBack = useCallback(() => {
    navigateWithConfirm("/quotes");
  }, [navigateWithConfirm]);

  const handleTypeSelect = useCallback(
    (type: "sale" | "rental" | "event") => {
      setSelectedQuoteType(type);
      setFormData((prev) => ({ ...prev, quote_type: type }));
    },
    [],
  );

  const handleTypeCancel = useCallback(() => {
    router.push("/quotes");
  }, [router]);

  return (
    <>
      <QuoteTypeSelectionDialog
        open={selectedQuoteType === null}
        onSelect={handleTypeSelect}
        onCancel={handleTypeCancel}
      />

      {selectedQuoteType !== null && (
    <div className="space-y-6">
      <PageHeader
        title="Nuovo Preventivo"
        description="Crea un nuovo preventivo per un cliente"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={createMutation.isPending}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                createMutation.isPending ||
                !formData.title ||
                !formData.customer_id
              }
            >
              <Save className="h-4 w-4 mr-2" />
              {createMutation.isPending ? "Salvataggio..." : "Salva Preventivo"}
            </Button>
          </div>
        }
      />

      <QuoteForm
        formData={formData}
        onChange={handleInputChange}
        onItemsChange={handleItemsChange}
      />
    </div>
      )}
    </>
  );
}

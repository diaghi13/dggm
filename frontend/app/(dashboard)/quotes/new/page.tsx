"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { quotesApi } from "@/lib/api/quotes";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { QuoteFormData, QuoteItem } from "@/lib/types";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { useSetting } from "@/hooks/use-settings";
import { useDefaultPriceList } from "@/hooks/use-price-lists";
import { QuoteForm } from "@/components/quotes/quote-form";
import { PageHeader } from "@/components/layout/page-header";

export default function NewQuotePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMounted = useRef(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load settings for defaults
  const showProductCodesDefault = useSetting<boolean>(
    "quotes.show_product_codes_by_default",
    true,
  );
  const showVatDefault = useSetting<boolean>(
    "quotes.show_vat_by_default",
    true,
  );
  const vatIncludedDefault = useSetting<boolean>(
    "quotes.vat_included_in_prices_by_default",
    false,
  );
  const termsTemplate = useSetting<string>(
    "quotes.terms_and_conditions_template",
    "",
  );

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
    work_start_description: null,
    work_start_date: null,
    work_duration_description: null,
    work_end_date: null,
    tax_included: false,
    show_unit_prices: true,
    show_product_codes: showProductCodesDefault,
    show_vat: showVatDefault,
    vat_included_in_prices: vatIncludedDefault,
    include_terms_and_conditions: true,
    notes: null,
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
      toast.error("Errore", {
        description:
          error.response?.data?.message || "Impossibile creare il preventivo",
      });
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

    createMutation.mutate(formData);
  }, [formData, createMutation]);

  const handleBack = useCallback(() => {
    navigateWithConfirm("/quotes");
  }, [navigateWithConfirm]);

  return (
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
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customersApi } from "@/lib/api/customers";
import { priceListsApi } from "@/lib/api/price-lists";
import { paymentTermsApi } from "@/lib/api/payment-terms";
import { warrantyTypesApi } from "@/lib/api/warranty-types";
import { financialResourcesApi } from "@/lib/api/financial-resources";
import { usersApi } from "@/lib/api/users";
import { Button } from "@/components/ui/button";
import { CurrencyDisplay } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  FileText,
  MapPin,
  CreditCard,
  Settings,
  Briefcase,
  Plus,
  ChevronDown,
  Users,
  Package,
  Receipt,
  Eye,
  Hash,
  Pencil,
  Check,
  Calendar,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  ShoppingCart,
  CalendarDays,
  RefreshCw,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { handleMutationError } from "@/lib/utils/handle-mutation-error";
import { QuoteDeposit, QuoteFormData, QuoteItem } from "@/lib/types";
import { CustomerForm } from "@/components/customer-form";
import { QuoteItemsBuilder } from "@/components/quote-items";
import { ComboboxSelect } from "@/components/combobox-select";
import { useSetting } from "@/hooks/use-settings";
import { useGenerateCode } from "@/hooks/use-generate-code";
import { QuoteAttachmentsUpload } from "@/app/(dashboard)/quotes/_components/quote-attachments-upload";

interface QuoteFormProps {
  formData: QuoteFormData;
  onChange: (field: keyof QuoteFormData, value: unknown) => void;
  onItemsChange: (items: QuoteItem[]) => void;
  quoteId?: number;
  /** Getter function (field) => error string | undefined — from useFieldErrors hook */
  fieldError?: (field: string) => string | undefined;
}

// Helper per convertire date ISO 8601 a formato yyyy-MM-dd per input date
const formatDateForInput = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  // Estrae solo la parte yyyy-MM-dd dalla data ISO 8601
  return dateString.split("T")[0];
};

export function QuoteForm({
  formData,
  onChange,
  onItemsChange,
  quoteId,
  fieldError,
}: QuoteFormProps) {
  const queryClient = useQueryClient();
  const [isCreateCustomerDialogOpen, setIsCreateCustomerDialogOpen] =
    useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [priceListSearch, setPriceListSearch] = useState("");
  const [paymentTermSearch, setPaymentTermSearch] = useState("");
  const [warrantyTypeSearch, setWarrantyTypeSearch] = useState("");
  const [lastDiscountFieldChanged, setLastDiscountFieldChanged] = useState<
    "percentage" | "amount" | null
  >(null);
  const [isEditingDiscountPercentage, setIsEditingDiscountPercentage] =
    useState(false);
  const [isEditingDiscountAmount, setIsEditingDiscountAmount] = useState(false);
  const [isWorkOpen, setIsWorkOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [defaultVatRate, setDefaultVatRate] = useState(22);
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  // Settings
  const defaultValidityDays = useSetting<number>(
    "quotes.default_validity_days",
    30,
  );

  // Auto-generate code for new quotes (only if code is empty)
  const shouldGenerateCode = !quoteId && !formData.code;
  const { data: generatedCodeData } = useGenerateCode("quote", undefined, {
    enabled: shouldGenerateCode,
    refetchOnMount: false,
  });

  // Apply generated code when available
  useEffect(() => {
    if (generatedCodeData?.code && !formData.code && shouldGenerateCode) {
      onChange("code", generatedCodeData.code);
    }
  }, [generatedCodeData?.code, formData.code, shouldGenerateCode, onChange]);

  // Extract progressive (last part) and prefix (everything before last dash)
  const getCodeParts = useCallback((code: string | undefined) => {
    if (!code) return { prefix: "", progressive: "" };
    const lastDashIndex = code.lastIndexOf("-");
    if (lastDashIndex === -1) return { prefix: "", progressive: code };
    return {
      prefix: code.substring(0, lastDashIndex + 1), // Include the dash
      progressive: code.substring(lastDashIndex + 1),
    };
  }, []);

  const [progressive, setProgressive] = useState(() => {
    const parts = getCodeParts(formData.code);
    return parts.progressive;
  });

  const [codePrefix, setCodePrefix] = useState(() => {
    const parts = getCodeParts(formData.code);
    return parts.prefix;
  });

  // Update progressive and prefix when code changes from external source (e.g., loaded from API)
  useEffect(() => {
    const parts = getCodeParts(formData.code);
    if (parts.prefix && parts.prefix !== codePrefix) {
      // Prefix changed (e.g., year changed or new quote loaded)
      setCodePrefix(parts.prefix);
      setProgressive(parts.progressive);
    } else if (!progressive && parts.progressive) {
      // Initial load
      setProgressive(parts.progressive);
    }
  }, [formData.code, getCodeParts, codePrefix, progressive]);

  // Update full code when progressive changes (manual editing)
  useEffect(() => {
    if (progressive && codePrefix) {
      const newCode = `${codePrefix}${progressive}`;
      if (formData.code !== newCode) {
        onChange("code", newCode);
      }
    }
  }, [progressive, codePrefix, onChange]); // Removed formData.code to avoid loop

  // Effect per generare la data di scadenza se non esiste
  useEffect(() => {
    if (formData.issue_date && !formData.expiry_date && defaultValidityDays) {
      const issueDate = new Date(formData.issue_date);
      const expiryDate = new Date(issueDate);
      expiryDate.setDate(expiryDate.getDate() + defaultValidityDays);
      onChange("expiry_date", expiryDate.toISOString().split("T")[0]);
    }
  }, [
    formData.issue_date,
    formData.expiry_date,
    defaultValidityDays,
    onChange,
  ]);

  // Effect per sincronizzare sconto % e sconto € sul totale items
  useEffect(() => {
    // Calcola totale imponibile dagli items (senza IVA)
    const itemsTotal = (formData.items || [])
      .filter((item) => item.type !== "section")
      .reduce((sum, item) => sum + (item.total || 0), 0);

    if (itemsTotal === 0) return;

    // Se è stato modificato discount_percentage, calcola discount_amount
    if (
      lastDiscountFieldChanged === "percentage" &&
      formData.discount_percentage !== undefined
    ) {
      const calculatedAmount =
        (itemsTotal * (formData.discount_percentage || 0)) / 100;
      if (Math.abs((formData.discount_amount || 0) - calculatedAmount) > 0.01) {
        onChange("discount_amount", parseFloat(calculatedAmount.toFixed(2)));
        // Use setTimeout to avoid synchronous setState in effect
        setTimeout(() => setLastDiscountFieldChanged(null), 0);
      }
    }
    // Se è stato modificato discount_amount, calcola discount_percentage
    else if (
      lastDiscountFieldChanged === "amount" &&
      formData.discount_amount !== undefined
    ) {
      const calculatedPercentage =
        ((formData.discount_amount || 0) / itemsTotal) * 100;
      if (
        Math.abs((formData.discount_percentage || 0) - calculatedPercentage) >
        0.0001
      ) {
        onChange(
          "discount_percentage",
          parseFloat(calculatedPercentage.toFixed(4)),
        );
        // Use setTimeout to avoid synchronous setState in effect
        setTimeout(() => setLastDiscountFieldChanged(null), 0);
      }
    }
  }, [
    formData.discount_percentage,
    formData.discount_amount,
    formData.items,
    lastDiscountFieldChanged,
    onChange,
  ]);

  const { data: customersData, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ["customers", { is_active: true, search: customerSearch }],
    queryFn: () =>
      customersApi.getAll({
        is_active: true,
        search: customerSearch,
        per_page: 50,
      }),
  });

  const { data: priceListsData, isLoading: isLoadingPriceLists } = useQuery({
    queryKey: ["price-lists", { is_active: true, search: priceListSearch }],
    queryFn: () =>
      priceListsApi.getAll({
        is_active: true,
        search: priceListSearch,
        per_page: 50,
      }),
  });

  // Auto-select default price list for new quotes
  const { data: defaultPriceList } = useQuery({
    queryKey: ["price-list-default"],
    queryFn: () => priceListsApi.getDefault(),
    enabled: !quoteId && !formData.price_list_id,
  });

  useEffect(() => {
    if (defaultPriceList && !formData.price_list_id) {
      onChange("price_list_id", defaultPriceList.id);
    }
  }, [defaultPriceList, formData.price_list_id, onChange]);

  const { data: paymentTermsData, isLoading: isLoadingPaymentTerms } = useQuery(
    {
      queryKey: [
        "payment-terms",
        { is_active: true, search: paymentTermSearch },
      ],
      queryFn: () =>
        paymentTermsApi.getAll({
          is_active: true,
          search: paymentTermSearch,
          per_page: 50,
        }),
    },
  );

  const { data: warrantyTypesData, isLoading: isLoadingWarrantyTypes } =
    useQuery({
      queryKey: [
        "warranty-types",
        { is_active: true, search: warrantyTypeSearch },
      ],
      queryFn: () =>
        warrantyTypesApi.getAll({
          is_active: true,
          search: warrantyTypeSearch,
        }),
    });

  const {
    data: financialResourcesData,
    isLoading: isLoadingFinancialResources,
  } = useQuery({
    queryKey: ["financial-resources", { is_active: true }],
    queryFn: () => financialResourcesApi.getActive(),
  });

  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users", { search: userSearch }],
    queryFn: () => usersApi.getAll({ search: userSearch, per_page: 50 }),
  });

  const createCustomerMutation = useMutation({
    mutationFn: customersApi.create,
    onSuccess: (newCustomer) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setIsCreateCustomerDialogOpen(false);
      onChange("customer_id", newCustomer.id);
      toast.success("Cliente creato con successo", {
        description: `${newCustomer.display_name} è stato aggiunto`,
      });
    },
    onError: (error) => {
      handleMutationError(error, "Impossibile creare il cliente");
    },
  });

  return (
    <>
      <div className="space-y-6">
        {/* Layout a due colonne per le info principali */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonna principale - 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Due card affiancate: Info Base + Cliente/Team/Listino */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Informazioni Base */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Informazioni Base
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Tipologia Preventivo — non modificabile dopo la creazione */}
                  <div className="space-y-2">
                    <Label>Tipologia</Label>
                    {(() => {
                      const type = formData.quote_type ?? "sale";
                      const config = {
                        sale: {
                          icon: ShoppingCart,
                          label: "Vendita",
                          className:
                            "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700",
                        },
                        rental: {
                          icon: Package,
                          label: "Noleggio",
                          className:
                            "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
                        },
                        event: {
                          icon: CalendarDays,
                          label: "Evento",
                          className:
                            "bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-700",
                        },
                      } as const;
                      const { icon: Icon, label, className } =
                        config[type as keyof typeof config] ?? config.sale;
                      return (
                        <Badge
                          variant="outline"
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border ${className}`}
                        >
                          <Icon className="h-4 w-4" />
                          {label}
                        </Badge>
                      );
                    })()}
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      La tipologia non può essere modificata dopo la creazione
                    </p>
                  </div>

                  {/* Codice Preventivo */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="progressive"
                      className="flex items-center gap-2"
                    >
                      <Hash className="h-4 w-4" />
                      Codice Preventivo
                    </Label>
                    <div className="flex items-start gap-2">
                      {/* Prefisso completo (readonly) */}
                      <div className="flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 font-mono text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                        {codePrefix || "..."}
                      </div>
                      {/* Progressivo (editabile) — wrapper div isola l'errore dal flex */}
                      <div className="flex-1">
                        <Input
                          id="progressive"
                          value={progressive}
                          onChange={(e) => setProgressive(e.target.value)}
                          placeholder="0001"
                          className="font-mono text-sm w-full"
                          maxLength={20}
                          error={fieldError?.("code")}
                        />
                      </div>
                    </div>
                    {!fieldError?.("code") && (
                      <p className="text-xs text-slate-500">
                        Solo il progressivo è editabile
                      </p>
                    )}
                  </div>

                  {/* Oggetto (ex Titolo) */}
                  <div className="space-y-2">
                    <Label htmlFor="title">
                      Oggetto <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => onChange("title", e.target.value)}
                      placeholder="es. Ristrutturazione Appartamento"
                      className="text-base font-medium"
                      error={fieldError?.("title")}
                    />
                  </div>

                  {/* Descrizione */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrizione</Label>
                    <Textarea
                      id="description"
                      value={formData.description || ""}
                      onChange={(e) => onChange("description", e.target.value)}
                      placeholder="Descrizione dettagliata del preventivo"
                      rows={3}
                    />
                  </div>

                  {/* Date */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="issue_date">
                        Data Emissione <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="issue_date"
                        type="date"
                        value={formatDateForInput(formData.issue_date)}
                        onChange={(e) => onChange("issue_date", e.target.value)}
                        error={fieldError?.("issue_date")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expiry_date">Data Scadenza</Label>
                      <Input
                        id="expiry_date"
                        type="date"
                        value={formatDateForInput(formData.expiry_date)}
                        onChange={(e) =>
                          onChange("expiry_date", e.target.value)
                        }
                        error={fieldError?.("expiry_date")}
                      />
                      {defaultValidityDays && (
                        <p className="text-xs text-slate-500">
                          Calcolata automaticamente (+{defaultValidityDays}gg)
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Cliente, Team e Listino */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Cliente e Team
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="customer_id">
                        Cliente <span className="text-red-500">*</span>
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCreateCustomerDialogOpen(true)}
                        className="h-7 gap-1 text-xs"
                      >
                        <Plus className="h-3 w-3" />
                        Nuovo
                      </Button>
                    </div>
                    <ComboboxSelect
                      options={
                        customersData?.data.map((customer) => ({
                          value: customer.id.toString(),
                          label: customer.display_name,
                          description:
                            customer.type === "company"
                              ? customer.vat_number || undefined
                              : customer.email || undefined,
                        })) || []
                      }
                      value={formData.customer_id?.toString()}
                      onValueChange={(value) =>
                        onChange("customer_id", value ? parseInt(value) : null)
                      }
                      onSearchChange={setCustomerSearch}
                      placeholder="Seleziona cliente"
                      searchPlaceholder="Cerca cliente..."
                      emptyText="Nessun cliente trovato"
                      loading={isLoadingCustomers}
                      error={fieldError?.("customer_id")}
                    />
                  </div>

                  {/* Dettagli Cliente Selezionato */}
                  {formData.customer_id &&
                    customersData?.data &&
                    (() => {
                      const selectedCustomer = customersData.data.find(
                        (c) => c.id === formData.customer_id,
                      );
                      if (!selectedCustomer) return null;

                      return (
                        <div className="rounded-lg border bg-muted/50 p-3 space-y-2 text-sm">
                          <div className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                            Dettagli Cliente
                          </div>
                          <div className="grid gap-2">
                            {selectedCustomer.type === "company" &&
                              selectedCustomer.vat_number && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    P.IVA:
                                  </span>
                                  <span className="font-medium">
                                    {selectedCustomer.vat_number}
                                  </span>
                                </div>
                              )}
                            {selectedCustomer.tax_code && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Cod. Fiscale:
                                </span>
                                <span className="font-medium">
                                  {selectedCustomer.tax_code}
                                </span>
                              </div>
                            )}
                            {selectedCustomer.email && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Email:
                                </span>
                                <span className="font-medium text-xs">
                                  {selectedCustomer.email}
                                </span>
                              </div>
                            )}
                            {selectedCustomer.phone && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Tel:
                                </span>
                                <span className="font-medium">
                                  {selectedCustomer.phone}
                                </span>
                              </div>
                            )}
                            {selectedCustomer.address && (
                              <div className="flex flex-col gap-1">
                                <span className="text-muted-foreground">
                                  Indirizzo:
                                </span>
                                <span className="font-medium">
                                  {selectedCustomer.address}
                                  {selectedCustomer.city &&
                                    `, ${selectedCustomer.city}`}
                                  {selectedCustomer.province &&
                                    ` (${selectedCustomer.province})`}
                                  {selectedCustomer.postal_code &&
                                    ` - ${selectedCustomer.postal_code}`}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                  <div className="space-y-2">
                    <Label htmlFor="project_manager_id">Project Manager</Label>
                    <ComboboxSelect
                      options={
                        usersData?.data.map((user: App.Data.UserData) => ({
                          value: user.id?.toString() || "",
                          label: user.name || "",
                          description: user.email,
                        })) || []
                      }
                      value={formData.project_manager_id?.toString()}
                      onValueChange={(value) =>
                        onChange(
                          "project_manager_id",
                          value ? parseInt(value) : null,
                        )
                      }
                      onSearchChange={setUserSearch}
                      placeholder="Seleziona PM"
                      searchPlaceholder="Cerca utente..."
                      emptyText="Nessun utente trovato"
                      loading={isLoadingUsers}
                    />
                  </div>

                  {/* Listino Prezzi */}
                  <div className="space-y-2">
                    <Label htmlFor="price_list_id">
                      Listino Prezzi <span className="text-red-500">*</span>
                    </Label>
                    <ComboboxSelect
                      options={
                        priceListsData?.data.map((priceList) => ({
                          value: priceList.id!.toString(),
                          label: priceList.name || "",
                          description: priceList.description || undefined,
                        })) || []
                      }
                      value={formData.price_list_id?.toString()}
                      onValueChange={(value) =>
                        onChange(
                          "price_list_id",
                          value ? parseInt(value) : null,
                        )
                      }
                      onSearchChange={setPriceListSearch}
                      placeholder="Seleziona listino"
                      searchPlaceholder="Cerca listino..."
                      emptyText="Nessun listino trovato"
                      loading={isLoadingPriceLists}
                      error={fieldError?.("price_list_id")}
                    />
                    {!quoteId && defaultPriceList === null && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Nessun listino di default configurato. Vai in Impostazioni → Listini.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Giorni Utilizzo (solo per noleggio/evento) */}
            {(formData.quote_type === "rental" ||
              formData.quote_type === "event") && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Giorni Utilizzo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    // Auto-calcola da date lavori se impostate
                    const autoCalcDays =
                      formData.work_start_date && formData.work_end_date
                        ? Math.max(
                            1,
                            Math.round(
                              (new Date(formData.work_end_date).getTime() -
                                new Date(formData.work_start_date).getTime()) /
                                (1000 * 60 * 60 * 24),
                            ),
                          )
                        : null;

                    return (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Input
                            id="event_days"
                            type="number"
                            min="1"
                            max="3650"
                            value={formData.event_days ?? ""}
                            onChange={(e) =>
                              onChange(
                                "event_days",
                                e.target.value
                                  ? parseInt(e.target.value)
                                  : null,
                              )
                            }
                            placeholder={
                              autoCalcDays
                                ? `${autoCalcDays} (da date lavori)`
                                : "es. 3"
                            }
                            className="max-w-40"
                          />
                          {formData.event_days && (
                            <button
                              type="button"
                              onClick={() => onChange("event_days", null)}
                              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
                            >
                              Reset (auto)
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formData.event_days
                            ? "Override manuale — le voci senza durata esplicita useranno questo valore"
                            : autoCalcDays
                              ? `Auto: ${autoCalcDays}gg (da date lavori) — le voci senza durata esplicita useranno questo valore`
                              : "Se non impostato, le voci useranno la durata specificata singolarmente"}
                        </p>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Indirizzo Cantiere */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Indirizzo Cantiere
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Indirizzo</Label>
                  <Input
                    id="address"
                    value={formData.address || ""}
                    onChange={(e) => onChange("address", e.target.value)}
                    placeholder="Via/Piazza"
                    error={fieldError?.("address")}
                  />
                </div>

                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-6 space-y-2">
                    <Label htmlFor="city">Città</Label>
                    <Input
                      id="city"
                      value={formData.city || ""}
                      onChange={(e) => onChange("city", e.target.value)}
                      placeholder="Città"
                      error={fieldError?.("city")}
                    />
                  </div>

                  <div className="col-span-3 space-y-2">
                    <Label htmlFor="postal_code">CAP</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code || ""}
                      onChange={(e) => onChange("postal_code", e.target.value)}
                      placeholder="00000"
                      error={fieldError?.("postal_code")}
                    />
                  </div>

                  <div className="col-span-3 space-y-2">
                    <Label htmlFor="province">Provincia</Label>
                    <Input
                      id="province"
                      value={formData.province || ""}
                      onChange={(e) => onChange("province", e.target.value)}
                      placeholder="PR"
                      maxLength={2}
                      className="uppercase"
                      error={fieldError?.("province")}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Voci del Preventivo - Priorità alta */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Voci del Preventivo
                  </CardTitle>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-normal text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        IVA default
                      </Label>
                      <Select
                        value={defaultVatRate.toString()}
                        onValueChange={(v) => setDefaultVatRate(parseFloat(v))}
                      >
                        <SelectTrigger className="h-8 w-24 text-sm border-slate-300 dark:border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0%</SelectItem>
                          <SelectItem value="4">4%</SelectItem>
                          <SelectItem value="5">5%</SelectItem>
                          <SelectItem value="10">10%</SelectItem>
                          <SelectItem value="22">22%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor="vat_included_in_prices"
                        className="text-sm font-normal text-slate-600 dark:text-slate-400 cursor-pointer"
                      >
                        Prezzi con IVA inclusa
                      </Label>
                      <Switch
                        id="vat_included_in_prices"
                        checked={formData.vat_included_in_prices || false}
                        onCheckedChange={(checked) =>
                          onChange("vat_included_in_prices", checked)
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <QuoteItemsBuilder
                  items={(formData.items as QuoteItem[]) || []}
                  onChange={onItemsChange as (items: QuoteItem[]) => void}
                  priceListId={formData.price_list_id}
                  showUnitPrices={formData.show_unit_prices ?? true}
                  quoteType={formData.quote_type}
                  defaultVatRate={defaultVatRate}
                  effectiveEventDays={
                    formData.event_days ??
                    (formData.work_start_date && formData.work_end_date
                      ? Math.max(
                          1,
                          Math.round(
                            (new Date(formData.work_end_date).getTime() -
                              new Date(formData.work_start_date).getTime()) /
                              (1000 * 60 * 60 * 24),
                          ),
                        )
                      : null)
                  }
                />
              </CardContent>
            </Card>

            {/* Pagamento, Garanzia e Risorsa Finanziaria */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Condizioni Commerciali
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="payment_term_id">
                      Termine di Pagamento
                    </Label>
                    <ComboboxSelect
                      options={
                        paymentTermsData?.data.map((term) => ({
                          value: term.id!.toString(),
                          label: term.name || "",
                          description: term.description || undefined,
                        })) || []
                      }
                      value={formData.payment_term_id?.toString()}
                      onValueChange={(value) =>
                        onChange(
                          "payment_term_id",
                          value ? parseInt(value) : null,
                        )
                      }
                      onSearchChange={setPaymentTermSearch}
                      placeholder="Seleziona termine"
                      searchPlaceholder="Cerca termine..."
                      emptyText="Nessun termine trovato"
                      loading={isLoadingPaymentTerms}
                      error={fieldError?.("payment_term_id")}
                    />
                    {formData.payment_term_id &&
                      (() => {
                        const selectedTerm = paymentTermsData?.data.find(
                          (term) => term.id === formData.payment_term_id,
                        );
                        if (selectedTerm) {
                          return (
                            <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                              <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-1">
                                {selectedTerm.name}
                              </p>
                              {selectedTerm.description && (
                                <p className="text-xs text-blue-700 dark:text-blue-300">
                                  {selectedTerm.description}
                                </p>
                              )}
                              {selectedTerm.days && (
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                  📅 {selectedTerm.days} giorni
                                </p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })()}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="financial_resource_id">
                      Risorsa Finanziaria
                    </Label>
                    <ComboboxSelect
                      value={formData.financial_resource_id?.toString() || ""}
                      options={
                        financialResourcesData?.map((pm) => {
                          const details = pm.details as Record<
                            string,
                            unknown
                          > | null;
                          return {
                            value: pm.id?.toString() || "",
                            label: pm.name,
                            description:
                              pm.type === "bank_account"
                                ? `🏦 ${(details?.bank_name as string) || "Banca"}`
                                : pm.type === "cash"
                                  ? `💰 ${(details?.location as string) || "Cassa"}`
                                  : `💳 ${(details?.provider as string) || "Carta"}`,
                          };
                        }) || []
                      }
                      onValueChange={(value) =>
                        onChange(
                          "financial_resource_id",
                          value ? parseInt(value) : null,
                        )
                      }
                      placeholder="Seleziona risorsa"
                      searchPlaceholder="Cerca risorsa..."
                      emptyText="Nessuna risorsa trovata"
                      loading={isLoadingFinancialResources}
                    />

                    {/* Dettagli Risorsa Finanziaria Selezionata */}
                    {formData.financial_resource_id &&
                      (() => {
                        const selectedMethod = financialResourcesData?.find(
                          (pm) => pm.id === formData.financial_resource_id,
                        );
                        if (!selectedMethod) return null;

                        return (
                          <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 space-y-1.5 text-sm border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-2 font-medium text-blue-900 dark:text-blue-100">
                              {selectedMethod.type === "bank_account" && "🏦"}
                              {selectedMethod.type === "cash" && "💰"}
                              {selectedMethod.type === "card" && "💳"}
                              <span>{selectedMethod.name}</span>
                              {selectedMethod.is_default && (
                                <span className="text-xs bg-blue-200 dark:bg-blue-900 px-1.5 py-0.5 rounded">
                                  Predefinito
                                </span>
                              )}
                            </div>

                            {selectedMethod.type === "bank_account" &&
                              selectedMethod.details && (
                                <div className="text-blue-700 dark:text-blue-300 space-y-0.5">
                                  {(() => {
                                    const details =
                                      selectedMethod.details as unknown as Record<
                                        string,
                                        unknown
                                      >;
                                    return (
                                      <>
                                        {details.bank_name && (
                                          <div>
                                            Banca: {String(details.bank_name)}
                                          </div>
                                        )}
                                        {details.iban && (
                                          <div className="font-mono text-xs">
                                            IBAN: {String(details.iban)}
                                          </div>
                                        )}
                                        {details.account_holder && (
                                          <div>
                                            Intestatario:{" "}
                                            {String(details.account_holder)}
                                          </div>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                              )}

                            {selectedMethod.type === "cash" &&
                              selectedMethod.details && (
                                <div className="text-blue-700 dark:text-blue-300">
                                  {(() => {
                                    const details =
                                      selectedMethod.details as unknown as Record<
                                        string,
                                        unknown
                                      >;
                                    return details.location ? (
                                      <>Presso: {String(details.location)}</>
                                    ) : null;
                                  })()}
                                </div>
                              )}

                            {selectedMethod.type === "card" &&
                              selectedMethod.details && (
                                <div className="text-blue-700 dark:text-blue-300">
                                  {(() => {
                                    const details =
                                      selectedMethod.details as unknown as Record<
                                        string,
                                        unknown
                                      >;
                                    return (
                                      <>
                                        {details.card_type &&
                                          details.provider && (
                                            <div>
                                              {String(details.card_type)} -{" "}
                                              {String(details.provider)}
                                            </div>
                                          )}
                                        {details.last_digits && (
                                          <div className="font-mono text-xs">
                                            **** {String(details.last_digits)}
                                          </div>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                              )}
                          </div>
                        );
                      })()}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warranty_type_id">Garanzia</Label>
                  <ComboboxSelect
                    options={
                      warrantyTypesData?.data.map((type) => ({
                        value: type.id!.toString(),
                        label: `${type.name || ""}${type.years ? ` (${type.years}a)` : ""}`,
                        description: type.description || undefined,
                      })) || []
                    }
                    value={formData.warranty_type_id?.toString()}
                    onValueChange={(value) =>
                      onChange(
                        "warranty_type_id",
                        value ? parseInt(value) : null,
                      )
                    }
                    onSearchChange={setWarrantyTypeSearch}
                    placeholder="Seleziona garanzia"
                    searchPlaceholder="Cerca garanzia..."
                    emptyText="Nessuna garanzia trovata"
                    loading={isLoadingWarrantyTypes}
                  />
                </div>

                {/* Dettagli Garanzia Selezionata */}
                {formData.warranty_type_id &&
                  (() => {
                    const selectedWarranty = warrantyTypesData?.data.find(
                      (type) => type.id === formData.warranty_type_id,
                    );
                    if (!selectedWarranty) return null;

                    return (
                      <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-3 space-y-2 text-sm border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 font-medium text-green-900 dark:text-green-100">
                          <span>{selectedWarranty.name}</span>
                          {selectedWarranty.years && (
                            <span className="text-xs bg-green-200 dark:bg-green-900 px-1.5 py-0.5 rounded">
                              {selectedWarranty.years}{" "}
                              {selectedWarranty.years === 1 ? "anno" : "anni"}
                            </span>
                          )}
                        </div>
                        {selectedWarranty.description && (
                          <p className="text-green-700 dark:text-green-300 whitespace-pre-wrap">
                            {selectedWarranty.description}
                          </p>
                        )}
                      </div>
                    );
                  })()}
              </CardContent>
            </Card>
          </div>

          {/* Colonna laterale - 1/3 */}
          <div className="space-y-6">
            {/* Riepilogo Totali */}
            <Card className="bg-white dark:bg-slate-800 border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Hash className="h-4 w-4" />
                  Riepilogo Importi
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  // Calcola totale imponibile dagli items (senza IVA)
                  const itemsTotal = (formData.items || [])
                    .filter((item) => item.type !== "section")
                    .reduce((sum, item) => sum + (item.total || 0), 0);

                  // Calcola IVA dagli items
                  const itemsVat = (formData.items || [])
                    .filter((item) => item.type !== "section")
                    .reduce((sum, item) => sum + (item.vat_amount || 0), 0);

                  // Sconto documento (applicato sull'imponibile)
                  const discountAmount = formData.discount_amount || 0;

                  // Proporzione sconto per ricalcolare IVA
                  const discountRatio =
                    itemsTotal > 0
                      ? (itemsTotal - discountAmount) / itemsTotal
                      : 1;

                  // IVA dopo sconto documento (proporzionale)
                  const vatAfterDiscount = itemsVat * discountRatio;

                  // Imponibile dopo sconto
                  const imponibile = itemsTotal - discountAmount;

                  // Totale finale
                  const grandTotal = imponibile + vatAfterDiscount;

                  return (
                    <div className="space-y-3">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-1.5 border-b">
                          <span className="text-muted-foreground">
                            Totale articoli:
                          </span>
                          <span className="font-medium">
                            <CurrencyDisplay value={itemsTotal} />
                          </span>
                        </div>

                        {/* Sconto Percentuale */}
                        <div className="flex items-center justify-between py-1.5 border-b gap-2">
                          <span className="text-muted-foreground">
                            Sconto %:
                          </span>
                          <div className="flex items-center gap-2">
                            {isEditingDiscountPercentage ? (
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={formData.discount_percentage || ""}
                                onChange={(e) => {
                                  setLastDiscountFieldChanged("percentage");
                                  onChange(
                                    "discount_percentage",
                                    e.target.value
                                      ? parseFloat(e.target.value)
                                      : 0,
                                  );
                                }}
                                className="h-7 w-20 text-right"
                                autoFocus
                              />
                            ) : (
                              <span
                                className={
                                  formData.discount_percentage
                                    ? "font-medium text-red-600 dark:text-red-400"
                                    : "text-muted-foreground"
                                }
                              >
                                {formData.discount_percentage || 0}%
                              </span>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setIsEditingDiscountPercentage(
                                  !isEditingDiscountPercentage,
                                )
                              }
                              className="h-7 w-7 p-0"
                            >
                              {isEditingDiscountPercentage ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : (
                                <Pencil className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Sconto Importo */}
                        <div className="flex items-center justify-between py-1.5 border-b gap-2">
                          <span className="text-muted-foreground">
                            Sconto €:
                          </span>
                          <div className="flex items-center gap-2">
                            {isEditingDiscountAmount ? (
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.discount_amount || ""}
                                onChange={(e) => {
                                  setLastDiscountFieldChanged("amount");
                                  onChange(
                                    "discount_amount",
                                    e.target.value
                                      ? parseFloat(e.target.value)
                                      : 0,
                                  );
                                }}
                                className="h-7 w-24 text-right"
                                autoFocus
                              />
                            ) : (
                              <span
                                className={
                                  discountAmount > 0
                                    ? "font-medium text-red-600 dark:text-red-400"
                                    : "text-muted-foreground"
                                }
                              >
                                <CurrencyDisplay value={discountAmount} />
                              </span>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setIsEditingDiscountAmount(
                                  !isEditingDiscountAmount,
                                )
                              }
                              className="h-7 w-7 p-0"
                            >
                              {isEditingDiscountAmount ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : (
                                <Pencil className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="flex justify-between py-1.5 border-b font-medium">
                          <span>Imponibile:</span>
                          <span><CurrencyDisplay value={imponibile} /></span>
                        </div>

                        {vatAfterDiscount > 0 && (
                          <div className="flex justify-between py-1.5 border-b">
                            <span className="text-muted-foreground">IVA:</span>
                            <span className="font-medium">
                              <CurrencyDisplay value={vatAfterDiscount} />
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between py-2 text-lg font-bold border-t-2">
                          <span>TOTALE:</span>
                          <span className="text-primary">
                            <CurrencyDisplay value={grandTotal} bold />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Stato Preventivo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Settings className="h-4 w-4" />
                  Stato Preventivo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Label htmlFor="status" className="text-sm">
                    Seleziona stato:
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => onChange("status", value)}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Bozza</SelectItem>
                      <SelectItem value="sent">Inviato</SelectItem>
                      <SelectItem value="approved">Approvato</SelectItem>
                      <SelectItem value="rejected">Rifiutato</SelectItem>
                      <SelectItem value="expired">Scaduto</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Badge descrittivo stato corrente */}
                  <div className="mt-4">
                    {formData.status === "draft" && (
                      <Badge
                        variant="secondary"
                        className="w-full justify-center py-2 text-sm font-medium"
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Bozza - In lavorazione
                      </Badge>
                    )}
                    {formData.status === "sent" && (
                      <Badge
                        variant="default"
                        className="w-full justify-center py-2 text-sm font-medium bg-blue-500 hover:bg-blue-600"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Inviato - In attesa di risposta
                      </Badge>
                    )}
                    {formData.status === "approved" && (
                      <Badge
                        variant="default"
                        className="w-full justify-center py-2 text-sm font-medium bg-green-500 hover:bg-green-600"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Approvato - Confermato
                      </Badge>
                    )}
                    {formData.status === "rejected" && (
                      <Badge
                        variant="destructive"
                        className="w-full justify-center py-2 text-sm font-medium"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rifiutato - Annullato
                      </Badge>
                    )}
                    {formData.status === "expired" && (
                      <Badge
                        variant="secondary"
                        className="w-full justify-center py-2 text-sm font-medium bg-orange-100 dark:bg-orange-900 text-orange-900 dark:text-orange-100"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Scaduto - Oltre i termini
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Opzioni Visualizzazione PDF */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Eye className="h-4 w-4" />
                  Opzioni Visualizzazione PDF
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* <div className="flex items-center justify-between py-2">
                  <Label htmlFor="tax_included" className="cursor-pointer">
                    Includi IVA nel Preventivo
                  </Label>
                  <Switch
                    id="tax_included"
                    checked={formData.tax_included || false}
                    onCheckedChange={(checked) =>
                      onChange("tax_included", checked)
                    }
                  />
                </div> */}

                <div className="flex items-center justify-between py-2">
                  <Label htmlFor="show_unit_prices" className="cursor-pointer">
                    Mostra Prezzi Unitari
                  </Label>
                  <Switch
                    id="show_unit_prices"
                    checked={formData.show_unit_prices || false}
                    onCheckedChange={(checked) => {
                      onChange("show_unit_prices", checked);
                      const syncItemToGlobal = (item: QuoteItem, showUnitPrices: boolean): QuoteItem => ({
                        ...item,
                        hide_unit_price: item._price_explicit ? item.hide_unit_price : !showUnitPrices,
                        children: item.children?.map((child) => syncItemToGlobal(child, showUnitPrices)),
                      });
                      const syncedItems = (formData.items || []).map((item) => syncItemToGlobal(item, checked));
                      onChange("items", syncedItems);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <Label
                    htmlFor="show_product_codes"
                    className="cursor-pointer"
                  >
                    Mostra Codici Prodotto
                  </Label>
                  <Switch
                    id="show_product_codes"
                    checked={formData.show_product_codes || false}
                    onCheckedChange={(checked) =>
                      onChange("show_product_codes", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <Label htmlFor="show_vat" className="cursor-pointer">
                    Mostra Colonna e Totale Aliquota IVA
                  </Label>
                  <Switch
                    id="show_vat"
                    checked={formData.show_vat || false}
                    onCheckedChange={(checked) => onChange("show_vat", checked)}
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <Label htmlFor="tax_included" className="cursor-pointer">
                    Aggiungi IVA al Preventivo
                  </Label>
                  <Switch
                    id="tax_included"
                    checked={formData.tax_included || false}
                    onCheckedChange={(checked) =>
                      onChange("tax_included", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <Label
                    htmlFor="include_terms_and_conditions"
                    className="cursor-pointer"
                  >
                    Includi Termini e Condizioni
                  </Label>
                  <Switch
                    id="include_terms_and_conditions"
                    checked={formData.include_terms_and_conditions || false}
                    onCheckedChange={(checked) =>
                      onChange("include_terms_and_conditions", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <Label
                    htmlFor="show_section_totals"
                    className="cursor-pointer"
                  >
                    Mostra Totali per Sezione
                  </Label>
                  <Switch
                    id="show_section_totals"
                    checked={formData.show_section_totals || false}
                    onCheckedChange={(checked) =>
                      onChange("show_section_totals", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sezioni Avanzate - Card Collapsabili */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Opzioni Avanzate
          </h3>

          {/* Pianificazione Lavori */}
          <Collapsible open={isWorkOpen} onOpenChange={setIsWorkOpen}>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Briefcase className="h-4 w-4" />
                      Pianificazione Lavori
                    </CardTitle>
                    <ChevronDown
                      className={`h-5 w-5 transition-transform ${isWorkOpen ? "rotate-180" : ""}`}
                    />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="work_start_date">Data Inizio</Label>
                      <Input
                        id="work_start_date"
                        type="date"
                        value={formatDateForInput(formData.work_start_date)}
                        onChange={(e) =>
                          onChange("work_start_date", e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="work_end_date">Data Fine</Label>
                      <Input
                        id="work_end_date"
                        type="date"
                        value={formatDateForInput(formData.work_end_date)}
                        onChange={(e) =>
                          onChange("work_end_date", e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="work_start_description">
                        Descrizione Inizio
                      </Label>
                      <Input
                        id="work_start_description"
                        value={formData.work_start_description || ""}
                        onChange={(e) =>
                          onChange("work_start_description", e.target.value)
                        }
                        placeholder="es. Entro 15 giorni dall'accettazione"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="work_duration_description">
                        Durata Lavori
                      </Label>
                      <Input
                        id="work_duration_description"
                        value={formData.work_duration_description || ""}
                        onChange={(e) =>
                          onChange("work_duration_description", e.target.value)
                        }
                        placeholder="es. 30 giorni lavorativi"
                      />
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Acconti / Piano Pagamenti */}
          {(() => {
            // Calcola il totale live dagli items per i preventivi non ancora salvati (total_amount = 0)
            const itemsSubtotal = (formData.items || [])
              .filter((item) => item.type !== "section")
              .reduce((sum, item) => sum + (item.total || 0), 0);
            const itemsVat = (formData.items || [])
              .filter((item) => item.type !== "section")
              .reduce((sum, item) => sum + (item.vat_amount || 0), 0);
            const discountAmt = formData.discount_amount || 0;
            const discountRatio = itemsSubtotal > 0 ? (itemsSubtotal - discountAmt) / itemsSubtotal : 1;
            const liveTotal = itemsSubtotal - discountAmt + itemsVat * discountRatio;
            const total = (formData.total_amount || 0) > 0 ? formData.total_amount! : liveTotal;
            const deposits: QuoteDeposit[] = formData.deposits || [];
            const totalDepositAmount = deposits.reduce(
              (s, d) => s + (d.amount || 0),
              0,
            );
            const totalDepositPct = deposits.reduce(
              (s, d) => s + (d.percentage || 0),
              0,
            );
            const saldoFinale = total - totalDepositAmount;
            const isOverLimit = totalDepositPct > 100;

            const updateDeposit = (
              index: number,
              field: keyof QuoteDeposit,
              value: unknown,
            ) => {
              const updated = [...deposits];
              const dep = { ...updated[index], [field]: value };

              if (field === "percentage") {
                const pct = (value as number) || 0;
                dep.is_fixed_amount = false;
                dep.amount =
                  Math.round((total * pct) / 100 * 100) / 100;
              } else if (field === "amount") {
                const amt = (value as number) || 0;
                dep.is_fixed_amount = true;
                dep.percentage =
                  total > 0
                    ? Math.round((amt / total) * 10000) / 100
                    : 0;
              }

              updated[index] = dep;
              onChange("deposits", updated);
            };

            const addDeposit = () => {
              onChange("deposits", [
                ...deposits,
                {
                  description: "",
                  percentage: null,
                  amount: null,
                  is_fixed_amount: false,
                  due_date: null,
                  due_event: null,
                },
              ]);
              setIsDepositOpen(true);
            };

            const removeDeposit = (index: number) => {
              onChange(
                "deposits",
                deposits.filter((_, i) => i !== index),
              );
            };

            return (
              <Collapsible
                open={isDepositOpen}
                onOpenChange={setIsDepositOpen}
              >
                <Card>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <CreditCard className="h-4 w-4" />
                          Piano Pagamenti
                          {deposits.length > 0 && (
                            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                              ({deposits.length}{" "}
                              {deposits.length === 1 ? "acconto" : "acconti"})
                            </span>
                          )}
                        </CardTitle>
                        <ChevronDown
                          className={`h-5 w-5 transition-transform ${isDepositOpen ? "rotate-180" : ""}`}
                        />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-3">
                      {deposits.length > 0 && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-[1fr_80px_110px_110px_110px_36px] gap-2 px-1">
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              Descrizione <span className="text-red-500">*</span>
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">%</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">Importo (€)</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">Scadenza</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">Evento</span>
                            <span />
                          </div>

                          {deposits.map((dep, index) => (
                            <div
                              key={index}
                              className="grid grid-cols-[1fr_80px_110px_110px_110px_36px] gap-2 items-center p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                            >
                              <Input
                                placeholder="es. Acconto alla firma"
                                value={dep.description}
                                onChange={(e) => updateDeposit(index, "description", e.target.value)}
                                className="h-8 text-sm"
                              />
                              <Input
                                type="number" min="0" max="100" step="0.01" placeholder="30"
                                value={dep.percentage ?? ""}
                                onChange={(e) => updateDeposit(index, "percentage", e.target.value ? parseFloat(e.target.value) : null)}
                                className="h-8 text-sm"
                              />
                              <Input
                                type="number" min="0" step="0.01" placeholder="0.00"
                                value={dep.amount ?? ""}
                                onChange={(e) => updateDeposit(index, "amount", e.target.value ? parseFloat(e.target.value) : null)}
                                className="h-8 text-sm"
                              />
                              <Input
                                type="date"
                                value={dep.due_date ?? ""}
                                onChange={(e) => updateDeposit(index, "due_date", e.target.value || null)}
                                className="h-8 text-sm"
                              />
                              <Input
                                placeholder="es. al collaudo"
                                value={dep.due_event ?? ""}
                                onChange={(e) => updateDeposit(index, "due_event", e.target.value || null)}
                                className="h-8 text-sm"
                              />
                              <button
                                type="button"
                                onClick={() => removeDeposit(index)}
                                className="flex items-center justify-center h-8 w-8 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {isOverLimit && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          <span>La somma delle percentuali ({totalDepositPct.toFixed(2)}%) supera il 100%.</span>
                        </div>
                      )}

                      {deposits.length > 0 && (
                        <div className="flex flex-col gap-1 pt-1 border-t border-slate-200 dark:border-slate-700">
                          <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                            <span>Totale acconti ({totalDepositPct.toFixed(1)}%)</span>
                            <span className="font-medium">
                              {totalDepositAmount.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-slate-100">
                            <span>{formData.balance_label || "Saldo finale"} {totalDepositPct <= 100 && <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({(100 - totalDepositPct).toFixed(1)}%)</span>}</span>
                            <span className={saldoFinale < 0 ? "text-red-600 dark:text-red-400" : ""}>
                              {saldoFinale.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-slate-500 dark:text-slate-400 shrink-0 whitespace-nowrap">
                          Dicitura saldo:
                        </Label>
                        <Input
                          value={formData.balance_label || ""}
                          onChange={(e) => onChange("balance_label", e.target.value || null)}
                          placeholder="Saldo finale"
                          className="h-7 text-xs"
                        />
                      </div>

                      <Button type="button" variant="outline" size="sm" onClick={addDeposit} className="w-full border-dashed">
                        <Plus className="h-4 w-4 mr-2" />
                        Aggiungi acconto
                      </Button>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })()}

          {/* Note e Testi */}
          <Collapsible open={isNotesOpen} onOpenChange={setIsNotesOpen}>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4" />
                      Note e Testi
                    </CardTitle>
                    <ChevronDown
                      className={`h-5 w-5 transition-transform ${isNotesOpen ? "rotate-180" : ""}`}
                    />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="notes">Note</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes || ""}
                      onChange={(e) => onChange("notes", e.target.value)}
                      placeholder="Note interne o per il cliente"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="terms_and_conditions">
                      Termini e Condizioni
                    </Label>
                    <Textarea
                      id="terms_and_conditions"
                      value={formData.terms_and_conditions || ""}
                      onChange={(e) =>
                        onChange("terms_and_conditions", e.target.value)
                      }
                      placeholder="Termini e condizioni del preventivo"
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="footer_text">Testo Footer</Label>
                    <Textarea
                      id="footer_text"
                      value={formData.footer_text || ""}
                      onChange={(e) => onChange("footer_text", e.target.value)}
                      placeholder="Testo da mostrare nel footer del PDF"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Allegati */}
          {quoteId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" />
                  Allegati
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QuoteAttachmentsUpload
                  quoteId={quoteId}
                  attachments={formData.attachments ?? []}
                  onAttachmentsChange={() =>
                    queryClient.invalidateQueries({
                      queryKey: ["quote", quoteId],
                    })
                  }
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialog Creazione Cliente */}
      <Dialog
        open={isCreateCustomerDialogOpen}
        onOpenChange={setIsCreateCustomerDialogOpen}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuovo Cliente</DialogTitle>
            <DialogDescription>
              Crea un nuovo cliente da associare al preventivo
            </DialogDescription>
          </DialogHeader>
          <CustomerForm
            id="create-customer-form"
            onSubmit={(data) => createCustomerMutation.mutate(data)}
            isLoading={createCustomerMutation.isPending}
          />
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateCustomerDialogOpen(false)}
              disabled={createCustomerMutation.isPending}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              form="create-customer-form"
              disabled={createCustomerMutation.isPending}
            >
              {createCustomerMutation.isPending
                ? "Creazione..."
                : "Crea Cliente"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

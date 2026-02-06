"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PriceList, PriceListFormData } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FormSection } from "@/components/form-section";
import {
  DollarSign,
  Settings,
  Calendar,
  Filter,
  Percent,
} from "lucide-react";

const priceListSchema = z
  .object({
    name: z.string().min(1, "Il nome è obbligatorio"),
    code: z
      .string()
      .min(1, "Il codice è obbligatorio")
      .max(50, "Il codice non può superare 50 caratteri")
      .regex(
        /^[A-Z0-9_]+$/,
        "Il codice può contenere solo lettere maiuscole, numeri e underscore",
      ),
    description: z.string().optional().nullable(),
    calculation_mode: z.enum(["automatic", "manual"]),
    adjustment_type: z.enum(["percentage", "fixed", "none"]),
    adjustment_value: z
      .union([z.number(), z.nan(), z.undefined(), z.null()])
      .optional()
      .nullable(),
    applies_to: z.enum(["sale", "rental", "both"]),
    category_id: z
      .union([z.number(), z.nan(), z.undefined(), z.null()])
      .optional()
      .nullable(),
    department_filter: z.string().optional().nullable(),
    valid_from: z.string().optional().nullable(),
    valid_to: z.string().optional().nullable(),
    is_active: z.boolean().optional(),
    is_default: z.boolean().optional(),
    priority: z
      .union([z.number().min(0), z.nan(), z.undefined(), z.null()])
      .optional()
      .nullable(),
    generate_items: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.valid_to && data.valid_from) {
        return new Date(data.valid_to) >= new Date(data.valid_from);
      }
      return true;
    },
    {
      message: "La data di fine validità deve essere successiva alla data di inizio",
      path: ["valid_to"],
    },
  )
  .refine(
    (data) => {
      if (data.adjustment_type !== "none") {
        return data.adjustment_value !== undefined && data.adjustment_value !== null && !isNaN(data.adjustment_value);
      }
      return true;
    },
    {
      message: "Il valore di aggiustamento è obbligatorio quando il tipo non è 'nessuno'",
      path: ["adjustment_value"],
    },
  );

type PriceListFormValues = z.infer<typeof priceListSchema>;

interface PriceListFormProps {
  id?: string;
  priceList?: PriceList;
  onSubmit: (data: PriceListFormData) => void;
  isLoading?: boolean;
}

export function PriceListForm({
  id = "price-list-form",
  priceList,
  onSubmit,
  isLoading,
}: PriceListFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PriceListFormValues>({
    resolver: zodResolver(priceListSchema),
    defaultValues: priceList
      ? {
          name: priceList.name,
          code: priceList.code,
          description: priceList.description || undefined,
          calculation_mode: priceList.calculation_mode,
          adjustment_type: priceList.adjustment_type,
          adjustment_value: priceList.adjustment_value || undefined,
          applies_to: priceList.applies_to,
          category_id: priceList.category_id || undefined,
          department_filter: priceList.department_filter || undefined,
          valid_from: priceList.valid_from || undefined,
          valid_to: priceList.valid_to || undefined,
          is_active: priceList.is_active ?? true,
          is_default: priceList.is_default ?? false,
          priority: priceList.priority || 0,
          generate_items: false,
        }
      : {
          name: "",
          code: "",
          calculation_mode: "automatic",
          adjustment_type: "percentage",
          applies_to: "sale",
          is_active: true,
          is_default: false,
          priority: 0,
          generate_items: true,
        },
  });

  const calculationMode = watch("calculation_mode");
  const adjustmentType = watch("adjustment_type");
  const isActive = watch("is_active");
  const isDefault = watch("is_default");

  const handleFormSubmit = (data: PriceListFormValues) => {
    // Clean adjustment_value
    let adjustmentValue = null;
    if (
      data.adjustment_type !== "none" &&
      data.adjustment_value !== undefined &&
      data.adjustment_value !== null &&
      !isNaN(data.adjustment_value)
    ) {
      adjustmentValue = data.adjustment_value;
    }

    // Clean priority
    let priority = 0;
    if (
      data.priority !== undefined &&
      data.priority !== null &&
      !isNaN(data.priority)
    ) {
      priority = data.priority;
    }

    const formData: PriceListFormData = {
      name: data.name,
      code: data.code,
      description: data.description || null,
      calculation_mode: data.calculation_mode,
      adjustment_type: data.adjustment_type,
      adjustment_value: adjustmentValue,
      applies_to: data.applies_to,
      category_id: undefined, // TODO: Implement category selection
      department_filter: data.department_filter || null,
      valid_from: data.valid_from || null,
      valid_to: data.valid_to || null,
      is_active: data.is_active ?? true,
      is_default: data.is_default ?? false,
      priority,
      generate_items: data.generate_items ?? true,
    };

    onSubmit(formData);
  };

  return (
    <form id={id} onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Informazioni Base */}
      <FormSection title="Informazioni Base" icon={DollarSign}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="code" className="required">
              Codice
            </Label>
            <Input
              id="code"
              {...register("code")}
              placeholder="BASE_2026"
              disabled={!!priceList || isLoading}
              className="uppercase"
            />
            {errors.code && (
              <p className="text-sm text-red-500">{errors.code.message}</p>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Identificativo univoco del listino. Utilizzato per riferimenti interni e API. 
              Es: BASE_2026, SCONTI_ESTATE, LISTINO_VIP
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="required">
              Nome Listino
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Listino Base 2026"
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Nome leggibile mostrato agli utenti. Es: &quot;Listino Sconti Estate 2026&quot;
            </p>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Descrizione</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Listino con prezzi scontati per la stagione estiva..."
              rows={2}
              disabled={isLoading}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Descrizione dettagliata dello scopo del listino e quando utilizzarlo
            </p>
          </div>
        </div>
      </FormSection>

      {/* Configurazione Calcolo */}
      <FormSection title="Configurazione Calcolo" icon={Settings}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="calculation_mode" className="required">
              Modalità Calcolo
            </Label>
            <Select
              value={calculationMode}
              onValueChange={(value) =>
                setValue("calculation_mode", value as "automatic" | "manual")
              }
              disabled={isLoading}
            >
              <SelectTrigger id="calculation_mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="automatic">Automatico</SelectItem>
                <SelectItem value="manual">Manuale</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              <strong>Automatico:</strong> I prezzi vengono calcolati automaticamente applicando l&apos;aggiustamento configurato al costo base di ogni prodotto.
              <br />
              <strong>Manuale:</strong> I prezzi devono essere inseriti manualmente per ogni prodotto.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="applies_to" className="required">
              Applica A
            </Label>
            <Select
              value={watch("applies_to")}
              onValueChange={(value) => setValue("applies_to", value as "sale" | "rental" | "both")}
              disabled={isLoading}
            >
              <SelectTrigger id="applies_to">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sale">Vendita</SelectItem>
                <SelectItem value="rental">Noleggio</SelectItem>
                <SelectItem value="both">Entrambi</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Specifica se questo listino si applica alla <strong>vendita</strong> di prodotti, al <strong>noleggio</strong>, o a entrambe le modalità
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjustment_type" className="required">
              Tipo Aggiustamento
            </Label>
            <Select
              value={adjustmentType}
              onValueChange={(value) =>
                setValue("adjustment_type", value as "percentage" | "fixed" | "none")
              }
              disabled={isLoading}
            >
              <SelectTrigger id="adjustment_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentuale</SelectItem>
                <SelectItem value="fixed">Valore Fisso</SelectItem>
                <SelectItem value="none">Nessuno</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              <strong>Percentuale:</strong> Aggiunge una % al costo (es. costo 100€ + 20% = prezzo 120€)
              <br />
              <strong>Valore Fisso:</strong> Aggiunge un importo fisso (es. costo 100€ + 15€ = prezzo 115€)
              <br />
              <strong>Nessuno:</strong> Il prezzo finale corrisponde al costo base del prodotto
            </p>
          </div>

          {adjustmentType !== "none" && (
            <div className="space-y-2">
              <Label htmlFor="adjustment_value" className="required">
                Valore Aggiustamento
              </Label>
              <div className="relative">
                <Input
                  id="adjustment_value"
                  type="number"
                  step="0.01"
                  {...register("adjustment_value", { valueAsNumber: true })}
                  placeholder={
                    adjustmentType === "percentage" ? "15.00" : "10.00"
                  }
                  disabled={isLoading}
                />
                {adjustmentType === "percentage" && (
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                )}
              </div>
              {errors.adjustment_value && (
                <p className="text-sm text-red-500">
                  {errors.adjustment_value.message}
                </p>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {adjustmentType === "percentage" 
                  ? "Percentuale da aggiungere al costo. Es: 25 = +25% di ricarico" 
                  : "Importo fisso in euro da aggiungere al costo. Es: 10 = +10€"}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="priority">Priorità</Label>
            <Input
              id="priority"
              type="number"
              min="0"
              {...register("priority", { valueAsNumber: true })}
              placeholder="0"
              disabled={isLoading}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ordine di applicazione quando più listini sono validi contemporaneamente. 
              <strong>0 = massima priorità</strong> (viene applicato per primo). 
              Numeri più alti hanno priorità inferiore.
            </p>
          </div>
        </div>
      </FormSection>

      {/* Periodo Validità */}
      <FormSection title="Periodo Validità" icon={Calendar}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="valid_from">Valido Dal</Label>
            <Input
              id="valid_from"
              type="date"
              {...register("valid_from")}
              disabled={isLoading}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Data di inizio validità del listino. Se non specificata, il listino è valido da subito
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valid_to">Valido Al</Label>
            <Input
              id="valid_to"
              type="date"
              {...register("valid_to")}
              disabled={isLoading}
            />
            {errors.valid_to && (
              <p className="text-sm text-red-500">{errors.valid_to.message}</p>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Data di fine validità. Se non specificata, il listino rimane valido indefinitamente
            </p>
          </div>
        </div>
      </FormSection>

      {/* Stato e Opzioni */}
      <FormSection title="Stato e Opzioni" icon={Filter}>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="is_active" className="text-base font-medium">
                Listino Attivo
              </Label>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Solo i listini attivi vengono considerati dal sistema per il calcolo dei prezzi. 
                Disattiva temporaneamente un listino senza eliminarlo.
              </p>
            </div>
            <Switch
              id="is_active"
              checked={isActive ?? true}
              onCheckedChange={(checked) => setValue("is_active", checked)}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="is_default" className="text-base font-medium">
                Listino Predefinito
              </Label>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Il listino predefinito viene utilizzato automaticamente quando nessun altro listino 
                specifico è applicabile al cliente o alla situazione. <strong>Può esistere un solo listino predefinito</strong>.
              </p>
            </div>
            <Switch
              id="is_default"
              checked={isDefault ?? false}
              onCheckedChange={(checked) => setValue("is_default", checked)}
              disabled={isLoading}
            />
          </div>

          {!priceList && calculationMode === "automatic" && (
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div className="space-y-0.5">
                <Label
                  htmlFor="generate_items"
                  className="text-base font-medium"
                >
                  Genera Prezzi Automaticamente
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Alla creazione del listino, genera automaticamente i prezzi per tutti i prodotti esistenti 
                  applicando le regole di aggiustamento configurate. Puoi modificare i prezzi manualmente in seguito.
                </p>
              </div>
              <Switch
                id="generate_items"
                checked={watch("generate_items") ?? true}
                onCheckedChange={(checked) =>
                  setValue("generate_items", checked)
                }
                disabled={isLoading}
              />
            </div>
          )}
        </div>
      </FormSection>
    </form>
  );
}

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type {
  FinancialResource,
  FinancialResourceFormData,
} from "@/lib/api/financial-resources";
import { Button } from "@/components/ui/button";
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
import { Building2, Wallet, CreditCard } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { FormSection } from "@/components/form-section";

// Helper type per details
type DetailsRecord = Record<string, string | undefined>;

const financialResourceSchema = z
  .object({
    type: z.enum(["bank_account", "cash", "card"], {
      message: "Tipo obbligatorio",
    }),
    name: z.string().min(1, "Nome obbligatorio"),
    description: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    is_active: z.boolean().optional(),
    is_default: z.boolean().optional(),
    sort_order: z.number().optional().nullable(),
    // Bank account fields
    iban: z.string().optional().nullable(),
    swift: z.string().optional().nullable(),
    bank_name: z.string().optional().nullable(),
    account_holder: z.string().optional().nullable(),
    branch: z.string().optional().nullable(),
    // Cash fields
    location: z.string().optional().nullable(),
    // Card fields
    card_type: z.string().optional().nullable(),
    provider: z.string().optional().nullable(),
    last_digits: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    // Validazione per conto bancario
    if (data.type === "bank_account") {
      if (!data.iban) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "IBAN obbligatorio per conto bancario",
          path: ["iban"],
        });
      }
      if (!data.bank_name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Nome banca obbligatorio",
          path: ["bank_name"],
        });
      }
      if (!data.account_holder) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Intestatario obbligatorio",
          path: ["account_holder"],
        });
      }
    }

    // Validazione per cassa
    if (data.type === "cash" && !data.location) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ubicazione obbligatoria per cassa",
        path: ["location"],
      });
    }

    // Validazione per carta
    if (data.type === "card") {
      if (!data.card_type) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tipo carta obbligatorio",
          path: ["card_type"],
        });
      }
      if (!data.provider) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Provider obbligatorio",
          path: ["provider"],
        });
      }
    }
  });

type FormValues = z.infer<typeof financialResourceSchema>;

interface FinancialResourceFormProps {
  resource?: FinancialResource;
  onSubmit: (data: FinancialResourceFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  serverErrors?: (field: string) => string | undefined;
}

export function FinancialResourceForm({
  resource,
  onSubmit,
  onCancel,
  isLoading,
  serverErrors,
}: FinancialResourceFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(financialResourceSchema),
    defaultValues: {
      type: resource?.type || "bank_account",
      name: resource?.name || "",
      description: resource?.description || "",
      notes: resource?.notes || "",
      is_active: resource?.is_active ?? true,
      is_default: resource?.is_default ?? false,
      sort_order: resource?.sort_order || 0,
      // Bank account
      iban: (resource?.details as unknown as DetailsRecord)?.["iban"] || "",
      swift: (resource?.details as unknown as DetailsRecord)?.["swift"] || "",
      bank_name:
        (resource?.details as unknown as DetailsRecord)?.["bank_name"] || "",
      account_holder:
        (resource?.details as unknown as DetailsRecord)?.["account_holder"] ||
        "",
      branch: (resource?.details as unknown as DetailsRecord)?.["branch"] || "",
      // Cash
      location:
        (resource?.details as unknown as DetailsRecord)?.["location"] || "",
      // Card
      card_type:
        (resource?.details as unknown as DetailsRecord)?.["card_type"] || "",
      provider:
        (resource?.details as unknown as DetailsRecord)?.["provider"] || "",
      last_digits:
        (resource?.details as unknown as DetailsRecord)?.["last_digits"] || "",
    },
  });

  const type = watch("type");
  const isActive = watch("is_active");
  const isDefault = watch("is_default");

  const handleFormSubmit = (data: FormValues) => {
    // Costruisci details basato sul tipo
    const details: Record<string, unknown> = {};

    if (data.type === "bank_account") {
      details.iban = data.iban;
      details.swift = data.swift;
      details.bank_name = data.bank_name;
      details.account_holder = data.account_holder;
      details.branch = data.branch;
    } else if (data.type === "cash") {
      details.location = data.location;
    } else if (data.type === "card") {
      details.card_type = data.card_type;
      details.provider = data.provider;
      details.last_digits = data.last_digits;
    }

    onSubmit({
      type: data.type,
      name: data.name,
      description: data.description || undefined,
      notes: data.notes || undefined,
      details,
      is_active: data.is_active ?? true,
      is_default: data.is_default ?? false,
      sort_order: data.sort_order || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <FormSection
        title="Informazioni Generali"
        icon={
          type === "bank_account"
            ? Building2
            : type === "cash"
              ? Wallet
              : CreditCard
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tipo */}
          <div className="space-y-2">
            <Label htmlFor="type">
              Tipo <span className="text-red-500">*</span>
            </Label>
            <Select
              value={type}
              onValueChange={(value) =>
                setValue("type", value as "bank_account" | "cash" | "card")
              }
              disabled={!!resource}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleziona tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_account">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Conto Bancario
                  </div>
                </SelectItem>
                <SelectItem value="cash">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Cassa
                  </div>
                </SelectItem>
                <SelectItem value="card">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Carta/POS
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-500">{errors.type.message}</p>
            )}
          </div>

          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nome <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="es. Conto Corrente Principale"
              error={serverErrors?.("name") ?? errors.name}
            />
          </div>

          {/* Descrizione */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Descrizione</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Descrizione opzionale..."
              rows={2}
            />
          </div>
        </div>
      </FormSection>

      {/* Campi specifici per Conto Bancario */}
      {type === "bank_account" && (
        <FormSection title="Dettagli Conto Bancario" icon={Building2}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bank_name">
                Nome Banca <span className="text-red-500">*</span>
              </Label>
              <Input
                id="bank_name"
                {...register("bank_name")}
                placeholder="es. Intesa Sanpaolo"
                error={serverErrors?.("bank_name") ?? errors.bank_name}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_holder">
                Intestatario <span className="text-red-500">*</span>
              </Label>
              <Input
                id="account_holder"
                {...register("account_holder")}
                placeholder="es. DGGM S.r.l."
                error={serverErrors?.("account_holder") ?? errors.account_holder}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="iban">
                IBAN <span className="text-red-500">*</span>
              </Label>
              <Input
                id="iban"
                {...register("iban")}
                placeholder="IT60X0542811101000000123456"
                className="font-mono"
                error={serverErrors?.("iban") ?? errors.iban}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="swift">SWIFT/BIC (opzionale)</Label>
              <Input
                id="swift"
                {...register("swift")}
                placeholder="es. BPMIITM1XXX"
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch">Filiale (opzionale)</Label>
              <Input
                id="branch"
                {...register("branch")}
                placeholder="es. Agenzia Centro"
              />
            </div>
          </div>
        </FormSection>
      )}

      {/* Campi specifici per Cassa */}
      {type === "cash" && (
        <FormSection title="Dettagli Cassa" icon={Wallet}>
          <div className="space-y-2">
            <Label htmlFor="location">
              Ubicazione <span className="text-red-500">*</span>
            </Label>
            <Input
              id="location"
              {...register("location")}
              placeholder="es. Sede Principale - Via Roma 123, Milano"
              error={serverErrors?.("location") ?? errors.location}
            />
          </div>
        </FormSection>
      )}

      {/* Campi specifici per Carta/POS */}
      {type === "card" && (
        <FormSection title="Dettagli Carta/POS" icon={CreditCard}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="card_type">
                Tipo Carta <span className="text-red-500">*</span>
              </Label>
              <Input
                id="card_type"
                {...register("card_type")}
                placeholder="es. Visa, Mastercard"
                error={serverErrors?.("card_type") ?? errors.card_type}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">
                Provider <span className="text-red-500">*</span>
              </Label>
              <Input
                id="provider"
                {...register("provider")}
                placeholder="es. Nexi, SumUp"
                error={serverErrors?.("provider") ?? errors.provider}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_digits">Ultime 4 cifre (opzionale)</Label>
              <Input
                id="last_digits"
                {...register("last_digits")}
                placeholder="1234"
                maxLength={4}
                className="font-mono"
              />
            </div>
          </div>
        </FormSection>
      )}

      {/* Note */}
      <FormSection title="Note Aggiuntive">
        <div className="space-y-2">
          <Label htmlFor="notes">Note</Label>
          <Textarea
            id="notes"
            {...register("notes")}
            placeholder="Note interne..."
            rows={3}
          />
        </div>
      </FormSection>

      {/* Opzioni */}
      <FormSection title="Opzioni">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Attivo</Label>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Risorsa disponibile per l&apos;uso
              </p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={(checked) => setValue("is_active", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Imposta come Preferito</Label>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Metodo preferito per questo tipo
              </p>
            </div>
            <Switch
              checked={isDefault}
              onCheckedChange={(checked) => setValue("is_default", checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sort_order">Ordinamento</Label>
            <Input
              id="sort_order"
              type="number"
              {...register("sort_order", { valueAsNumber: true })}
              placeholder="0"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Numero più basso = priorità più alta
            </p>
          </div>
        </div>
      </FormSection>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Annulla
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvataggio..." : resource ? "Aggiorna" : "Crea"}
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Resolver } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { financialResourcesApi } from "@/lib/api/financial-resources";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Building2, Wallet, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type PaymentType = "bank_account" | "cash" | "card";

const PAYMENT_TYPES: {
  value: PaymentType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "bank_account", label: "Banca", icon: Building2 },
  { value: "cash", label: "Cassa", icon: Wallet },
  { value: "card", label: "Carta", icon: CreditCard },
];

const baseSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio"),
});

const bankDetailsSchema = z.object({
  iban: z.string().min(1, "L'IBAN è obbligatorio"),
  bank_name: z.string().min(1, "Il nome della banca è obbligatorio"),
  account_holder: z.string().min(1, "L'intestatario è obbligatorio"),
  swift: z.string().optional(),
  location: z.string().optional(),
  card_type: z.string().optional(),
  provider: z.string().optional(),
  last_digits: z.string().optional(),
});

const cashDetailsSchema = z.object({
  iban: z.string().optional(),
  bank_name: z.string().optional(),
  account_holder: z.string().optional(),
  swift: z.string().optional(),
  location: z.string().min(1, "L'ubicazione è obbligatoria"),
  card_type: z.string().optional(),
  provider: z.string().optional(),
  last_digits: z.string().optional(),
});

const cardDetailsSchema = z.object({
  iban: z.string().optional(),
  bank_name: z.string().optional(),
  account_holder: z.string().optional(),
  swift: z.string().optional(),
  location: z.string().optional(),
  card_type: z.string().min(1, "Il tipo di carta è obbligatorio"),
  provider: z.string().min(1, "Il provider è obbligatorio"),
  last_digits: z.string().optional(),
});

type FormValues = z.infer<typeof baseSchema> & {
  details: {
    iban?: string;
    bank_name?: string;
    account_holder?: string;
    swift?: string;
    location?: string;
    card_type?: string;
    provider?: string;
    last_digits?: string;
  };
};

function buildSchema(type: PaymentType) {
  if (type === "bank_account") {
    return baseSchema.extend({ details: bankDetailsSchema });
  }
  if (type === "cash") {
    return baseSchema.extend({ details: cashDetailsSchema });
  }
  return baseSchema.extend({ details: cardDetailsSchema });
}

interface StepPaymentProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function StepPayment({ onComplete, onSkip }: StepPaymentProps) {
  const [selectedType, setSelectedType] = useState<PaymentType>("bank_account");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(buildSchema(selectedType)) as Resolver<FormValues>,
    defaultValues: {
      name: "",
      details: {
        iban: "",
        bank_name: "",
        account_holder: "",
        swift: "",
        location: "",
        card_type: "",
        provider: "",
        last_digits: "",
      },
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const details: Record<string, string> = {};
      if (selectedType === "bank_account") {
        details.iban = values.details.iban ?? "";
        details.bank_name = values.details.bank_name ?? "";
        details.account_holder = values.details.account_holder ?? "";
        if (values.details.swift) details.swift = values.details.swift;
      } else if (selectedType === "cash") {
        details.location = values.details.location ?? "";
      } else {
        details.card_type = values.details.card_type ?? "";
        details.provider = values.details.provider ?? "";
        if (values.details.last_digits) details.last_digits = values.details.last_digits;
      }
      return financialResourcesApi.create({
        type: selectedType,
        name: values.name,
        is_active: true,
        is_default: true,
        details,
      });
    },
    onSuccess: () => {
      toast.success("Risorsa finanziaria creata con successo");
      onComplete();
    },
    onError: () => {
      toast.error("Errore nella creazione della risorsa finanziaria");
    },
  });

  const handleTypeChange = (type: PaymentType) => {
    setSelectedType(type);
    reset({
      name: "",
      details: {
        iban: "",
        bank_name: "",
        account_holder: "",
        swift: "",
        location: "",
        card_type: "",
        provider: "",
        last_digits: "",
      },
    });
  };

  const detailsErrors = errors.details as
    | {
        iban?: { message?: string };
        bank_name?: { message?: string };
        account_holder?: { message?: string };
        location?: { message?: string };
        card_type?: { message?: string };
        provider?: { message?: string };
      }
    | undefined;

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Modalità di pagamento
          </h2>
          <Badge variant="outline" className="text-xs font-normal">
            Opzionale
          </Badge>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Aggiungi come vuoi ricevere i pagamenti dai tuoi clienti. Potrai
          aggiungerne altre in seguito.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {PAYMENT_TYPES.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => handleTypeChange(value)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors text-sm font-medium",
              selectedType === value
                ? "border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-700 dark:hover:text-slate-300",
            )}
          >
            <Icon className="w-6 h-6" />
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">
            Nome <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            {...register("name")}
            placeholder={
              selectedType === "bank_account"
                ? "Conto corrente principale"
                : selectedType === "cash"
                  ? "Cassa principale"
                  : "Terminale POS"
            }
          />
          {errors.name && (
            <p className="text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        {selectedType === "bank_account" && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="iban">
                IBAN <span className="text-red-500">*</span>
              </Label>
              <Input
                id="iban"
                {...register("details.iban")}
                placeholder="IT60 X054 2811 1010 0000 0123 456"
              />
              {detailsErrors?.iban && (
                <p className="text-xs text-red-500">{detailsErrors.iban.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bank_name">
                Nome banca <span className="text-red-500">*</span>
              </Label>
              <Input
                id="bank_name"
                {...register("details.bank_name")}
                placeholder="Intesa Sanpaolo"
              />
              {detailsErrors?.bank_name && (
                <p className="text-xs text-red-500">{detailsErrors.bank_name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="account_holder">
                Intestatario <span className="text-red-500">*</span>
              </Label>
              <Input
                id="account_holder"
                {...register("details.account_holder")}
                placeholder="DGGM S.r.l."
              />
              {detailsErrors?.account_holder && (
                <p className="text-xs text-red-500">{detailsErrors.account_holder.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="swift">SWIFT</Label>
              <Input
                id="swift"
                {...register("details.swift")}
                placeholder="BCITITMM"
              />
            </div>
          </>
        )}

        {selectedType === "cash" && (
          <div className="space-y-1.5">
            <Label htmlFor="location">
              Ubicazione <span className="text-red-500">*</span>
            </Label>
            <Input
              id="location"
              {...register("details.location")}
              placeholder="Sede principale - Via Roma 1, Milano"
            />
            {detailsErrors?.location && (
              <p className="text-xs text-red-500">{detailsErrors.location.message}</p>
            )}
          </div>
        )}

        {selectedType === "card" && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="card_type">
                Tipo carta <span className="text-red-500">*</span>
              </Label>
              <Input
                id="card_type"
                {...register("details.card_type")}
                placeholder="Visa / Mastercard"
              />
              {detailsErrors?.card_type && (
                <p className="text-xs text-red-500">{detailsErrors.card_type.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="provider">
                Provider <span className="text-red-500">*</span>
              </Label>
              <Input
                id="provider"
                {...register("details.provider")}
                placeholder="Nexi, SumUp, ..."
              />
              {detailsErrors?.provider && (
                <p className="text-xs text-red-500">{detailsErrors.provider.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="last_digits">Ultime 4 cifre</Label>
              <Input
                id="last_digits"
                {...register("details.last_digits")}
                placeholder="1234"
                maxLength={4}
              />
            </div>
          </>
        )}

        <div className="pt-2 flex items-center justify-between">
          <Button type="button" variant="outline" onClick={onSkip}>
            Salta per ora
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Crea e continua
          </Button>
        </div>
      </form>
    </div>
  );
}

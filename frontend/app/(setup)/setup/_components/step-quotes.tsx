"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { settingsApi } from "@/lib/api/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const schema = z.object({
  code_prefix: z.string().min(1, "Il prefisso è obbligatorio"),
  default_validity_days: z
    .string()
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, {
      message: "Inserisci un numero valido",
    }),
  default_notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface StepQuotesProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function StepQuotes({ onComplete, onSkip }: StepQuotesProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code_prefix: "PREV",
      default_validity_days: "30",
      default_notes: "",
    },
  });

  const prefix = watch("code_prefix") || "PREV";

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      settingsApi.bulkUpdate([
        { key: "quotes.code_prefix", value: values.code_prefix },
        {
          key: "quotes.default_validity_days",
          value: values.default_validity_days,
        },
        { key: "quotes.default_notes", value: values.default_notes ?? "" },
      ]),
    onSuccess: () => {
      toast.success("Impostazioni preventivi salvate");
      onComplete();
    },
    onError: () => {
      toast.error("Errore nel salvataggio delle impostazioni");
    },
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Impostazioni preventivi
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Configura il formato e le opzioni predefinite dei preventivi.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="code_prefix">Prefisso preventivo</Label>
          <Input
            id="code_prefix"
            {...register("code_prefix")}
            placeholder="PREV"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Es:{" "}
            <span className="font-mono text-slate-700 dark:text-slate-300">
              {prefix}-2026-0001
            </span>
          </p>
          {errors.code_prefix && (
            <p className="text-xs text-red-500">{errors.code_prefix.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="default_validity_days">
            Validità preventivo (giorni)
          </Label>
          <Input
            id="default_validity_days"
            type="number"
            min={1}
            {...register("default_validity_days")}
            placeholder="30"
            className="max-w-40"
          />
          {errors.default_validity_days && (
            <p className="text-xs text-red-500">
              {errors.default_validity_days.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="default_notes">Note predefinite sui preventivi</Label>
          <Textarea
            id="default_notes"
            {...register("default_notes")}
            placeholder="Inserisci le note che appariranno di default su ogni preventivo..."
            rows={4}
          />
        </div>

        <div className="pt-2 flex items-center justify-between">
          <Button type="button" variant="outline" onClick={onSkip}>
            Salta
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Salva e continua
          </Button>
        </div>
      </form>
    </div>
  );
}

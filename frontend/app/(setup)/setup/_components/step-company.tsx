"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { companySettingsApi } from "@/lib/api/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

const schema = z.object({
  name: z.string().min(1, "Il nome azienda è obbligatorio"),
  vat: z.string().optional(),
  fiscal_code: z.string().optional(),
  address: z.string().optional(),
  postal_code: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface StepCompanyProps {
  onComplete: () => void;
}

export function StepCompany({ onComplete }: StepCompanyProps) {
  const { data: existing, isLoading } = useQuery({
    queryKey: ["company-settings"],
    queryFn: companySettingsApi.get,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      vat: "",
      fiscal_code: "",
      address: "",
      postal_code: "",
      city: "",
      province: "",
      country: "Italia",
      phone: "",
      email: "",
      website: "",
    },
  });

  useEffect(() => {
    if (existing) {
      reset({
        name: existing["company.name"] ?? "",
        vat: existing["company.vat"] ?? "",
        fiscal_code: existing["company.fiscal_code"] ?? "",
        address: existing["company.address"] ?? "",
        postal_code: existing["company.postal_code"] ?? "",
        city: existing["company.city"] ?? "",
        province: existing["company.province"] ?? "",
        country: existing["company.country"] ?? "Italia",
        phone: existing["company.phone"] ?? "",
        email: existing["company.email"] ?? "",
        website: existing["company.website"] ?? "",
      });
    }
  }, [existing, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      companySettingsApi.update({
        "company.name": values.name,
        "company.vat": values.vat ?? "",
        "company.fiscal_code": values.fiscal_code ?? "",
        "company.address": values.address ?? "",
        "company.postal_code": values.postal_code ?? "",
        "company.city": values.city ?? "",
        "company.province": values.province ?? "",
        "company.country": values.country ?? "Italia",
        "company.phone": values.phone ?? "",
        "company.email": values.email ?? "",
        "company.website": values.website ?? "",
      }),
    onSuccess: () => {
      toast.success("Dati azienda salvati");
      onComplete();
    },
    onError: () => {
      toast.error("Errore nel salvataggio dei dati");
    },
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Dati azienda
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Inserisci le informazioni della tua azienda. Potrai modificarle in seguito.
        </p>
      </div>

      <form id="step-company-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">
            Nome Azienda <span className="text-red-500">*</span>
          </Label>
          <Input id="name" {...register("name")} placeholder="DGGM S.r.l." />
          {errors.name && (
            <p className="text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="vat">Partita IVA</Label>
            <Input id="vat" {...register("vat")} placeholder="IT12345678901" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fiscal_code">Codice Fiscale</Label>
            <Input
              id="fiscal_code"
              {...register("fiscal_code")}
              placeholder="12345678901"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="address">Indirizzo</Label>
          <Input
            id="address"
            {...register("address")}
            placeholder="Via Roma 1"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="postal_code">CAP</Label>
            <Input
              id="postal_code"
              {...register("postal_code")}
              placeholder="20121"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-1">
            <Label htmlFor="city">Città</Label>
            <Input id="city" {...register("city")} placeholder="Milano" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="province">Provincia</Label>
            <Input id="province" {...register("province")} placeholder="MI" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="country">Paese</Label>
          <Input id="country" {...register("country")} placeholder="Italia" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefono</Label>
            <Input
              id="phone"
              {...register("phone")}
              placeholder="+39 02 1234567"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="info@azienda.it"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="website">Sito web</Label>
          <Input
            id="website"
            {...register("website")}
            placeholder="https://www.azienda.it"
          />
        </div>

        <div className="pt-2 flex justify-end">
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

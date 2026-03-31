"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import apiClient from "@/lib/api/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, User } from "lucide-react";
import type { ApiResponse } from "@/lib/types";

const profileSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio").max(255),
  phone: z.string().max(50).nullable().optional(),
  tax_code: z.string().max(50).nullable().optional(),
  fiscal_code: z.string().max(50).nullable().optional(),
  address: z.string().max(255).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  province: z.string().max(10).nullable().optional(),
  postal_code: z.string().max(20).nullable().optional(),
  country: z.string().max(100).nullable().optional(),
  iban: z.string().max(50).nullable().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function MyProfilePage() {
  const { globalUser, user } = useAuthStore();

  const defaultValues: ProfileFormValues = {
    name: globalUser?.name ?? user?.name ?? "",
    phone: null,
    tax_code: null,
    fiscal_code: null,
    address: null,
    city: null,
    province: null,
    postal_code: null,
    country: null,
    iban: null,
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  const email = globalUser?.email ?? user?.email ?? "";

  const mutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const response = await apiClient.patch<ApiResponse<unknown>>("/my/profile", data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Profilo aggiornato", {
        description: "Le tue informazioni sono state salvate con successo",
      });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error("Errore", {
        description: err.response?.data?.message ?? "Impossibile aggiornare il profilo",
      });
    },
  });

  const onSubmit = (data: ProfileFormValues) => {
    mutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 dark:bg-slate-700 text-white">
          <User className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Il mio profilo
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gestisci le tue informazioni personali globali
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Personal info */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Informazioni personali</CardTitle>
            <CardDescription>
              Queste informazioni sono condivise tra tutte le aziende a cui appartieni
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">
                  Nome completo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  {...register("name")}
                  className="h-9"
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  readOnly
                  disabled
                  className="h-9 opacity-60"
                />
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  L&apos;email non può essere modificata
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Telefono</Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="+39 000 000 0000"
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="iban">IBAN</Label>
                <Input
                  id="iban"
                  {...register("iban")}
                  placeholder="IT00 X000 0000 0000 0000 0000 000"
                  className="h-9 font-mono"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fiscal info */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Dati fiscali</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="tax_code">Codice Fiscale</Label>
                <Input
                  id="tax_code"
                  {...register("tax_code")}
                  placeholder="RSSMRA80A01H501U"
                  className="h-9 uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fiscal_code">Partita IVA</Label>
                <Input
                  id="fiscal_code"
                  {...register("fiscal_code")}
                  placeholder="IT12345678901"
                  className="h-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Indirizzo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="address">Via/Piazza</Label>
              <Input
                id="address"
                {...register("address")}
                placeholder="Via Roma 1"
                className="h-9"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-1">
                <Label htmlFor="postal_code">CAP</Label>
                <Input
                  id="postal_code"
                  {...register("postal_code")}
                  placeholder="00100"
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="city">Città</Label>
                <Input
                  id="city"
                  {...register("city")}
                  placeholder="Roma"
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="province">Provincia</Label>
                <Input
                  id="province"
                  {...register("province")}
                  placeholder="RM"
                  maxLength={2}
                  className="h-9 uppercase"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="country">Paese</Label>
              <Input
                id="country"
                {...register("country")}
                placeholder="Italia"
                className="h-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            disabled={mutation.isPending || !isDirty}
            className="min-w-[120px]"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvataggio...
              </>
            ) : (
              "Salva modifiche"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

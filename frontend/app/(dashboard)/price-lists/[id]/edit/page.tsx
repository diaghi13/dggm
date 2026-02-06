"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { priceListsApi } from "@/lib/api/price-lists";
import { PriceListFormData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, DollarSign, Save } from "lucide-react";
import { toast } from "sonner";
import { PriceListForm } from "../../_components/price-list-form";

export default function EditPriceListPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);
  const queryClient = useQueryClient();

  const { data: priceList, isLoading } = useQuery({
    queryKey: ["price-list", id],
    queryFn: () => priceListsApi.getById(id),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<PriceListFormData>) =>
      priceListsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-list", id] });
      queryClient.invalidateQueries({ queryKey: ["price-lists"] });
      toast.success("Listino aggiornato con successo");
      router.push(`/price-lists/${id}`);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message || "Errore durante l'aggiornamento",
      );
    },
  });

  const handleSubmit = (data: PriceListFormData) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-center">
          <DollarSign className="h-12 w-12 mx-auto mb-4 text-slate-400 dark:text-slate-600 animate-pulse" />
          <p className="text-slate-600 dark:text-slate-400">
            Caricamento listino...
          </p>
        </div>
      </div>
    );
  }

  if (!priceList) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-center">
          <DollarSign className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <p className="text-slate-600 dark:text-slate-400">
            Listino non trovato
          </p>
          <Button asChild className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna indietro
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/price-lists/${id}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Modifica Listino
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {priceList.name} ({priceList.code})
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Informazioni Listino
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PriceListForm
            id="edit-price-list-form"
            priceList={priceList}
            onSubmit={handleSubmit}
            isLoading={updateMutation.isPending}
          />
        </CardContent>
      </Card>

      {/* Footer Actions */}
      <div className="flex justify-end gap-2 sticky bottom-0 bg-white dark:bg-slate-950 p-4 border-t border-slate-200 dark:border-slate-800">
        <Button
          variant="outline"
          onClick={() => router.push(`/price-lists/${id}`)}
          disabled={updateMutation.isPending}
        >
          Annulla
        </Button>
        <Button
          type="submit"
          form="edit-price-list-form"
          disabled={updateMutation.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          {updateMutation.isPending ? "Salvataggio..." : "Salva Modifiche"}
        </Button>
      </div>
    </div>
  );
}

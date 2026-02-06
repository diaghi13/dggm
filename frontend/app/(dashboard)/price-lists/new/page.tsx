"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { priceListsApi } from "@/lib/api/price-lists";
import { PriceListFormData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, DollarSign } from "lucide-react";
import { PriceListForm } from "../_components/price-list-form";
import { PageHeader } from "@/components/layout/page-header";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function NewPriceListPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: priceListsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["price-lists"] });
      toast.success("Listino creato con successo");
      router.push(`/price-lists/${data.id}`);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message || "Errore durante la creazione",
      );
    },
  });

  const handleSubmit = (data: PriceListFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nuovo Listino Prezzi"
        description="Crea un nuovo listino per gestire i prezzi dei prodotti"
        icon={DollarSign}
        actions={
          <Button
            variant="outline"
            onClick={() => router.push("/price-lists")}
            disabled={createMutation.isPending}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Indietro
          </Button>
        }
      />

      <Card className="p-6">
        <PriceListForm
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending}
        />

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/price-lists")}
            disabled={createMutation.isPending}
          >
            Annulla
          </Button>
          <Button
            type="submit"
            form="price-list-form"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "Creazione..." : "Crea Listino"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

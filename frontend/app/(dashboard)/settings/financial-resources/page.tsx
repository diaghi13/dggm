"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table/data-table";
import { createFinancialResourcesColumns } from "@/components/financial-resources-columns";
import { FinancialResourceForm } from "@/components/financial-resource-form";
import { useFieldErrors } from "@/lib/hooks/use-field-errors";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useFinancialResources } from "@/hooks/use-financial-resources";
import {
  financialResourcesApi,
  type FinancialResource,
  type FinancialResourceFormData,
} from "@/lib/api/financial-resources";

export default function FinancialResourcesPage() {
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedResource, setSelectedResource] =
    useState<FinancialResource | null>(null);

  // Fetch resources
  const { data: resources = [], isLoading } = useFinancialResources();

  // Create mutation
  const createMutation = useMutation({
    mutationFn: financialResourcesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-resources"] });
      setIsCreateOpen(false);
      toast.success("Risorsa Creata", {
        description: "La risorsa finanziaria è stata creata con successo",
      });
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description:
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "Impossibile creare la risorsa",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: FinancialResourceFormData;
    }) => financialResourcesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-resources"] });
      setIsEditOpen(false);
      setSelectedResource(null);
      toast.success("Risorsa Aggiornata", {
        description: "La risorsa finanziaria è stata aggiornata con successo",
      });
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description:
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "Impossibile aggiornare la risorsa",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: financialResourcesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-resources"] });
      setIsDeleteOpen(false);
      setSelectedResource(null);
      toast.success("Risorsa Eliminata", {
        description: "La risorsa finanziaria è stata eliminata con successo",
      });
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description:
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "Impossibile eliminare la risorsa",
      });
    },
  });

  const handleCreate = (data: FinancialResourceFormData) => {
    createMutation.mutate(data);
  };

  const handleEdit = (resource: FinancialResource) => {
    setSelectedResource(resource);
    setIsEditOpen(true);
  };

  const handleUpdate = (data: FinancialResourceFormData) => {
    if (selectedResource?.id) {
      updateMutation.mutate({ id: selectedResource.id, data });
    }
  };

  const handleDelete = (resource: FinancialResource) => {
    setSelectedResource(resource);
    setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (selectedResource?.id) {
      deleteMutation.mutate(selectedResource.id);
    }
  };

  const createFieldErrors = useFieldErrors(createMutation.error);
  const updateFieldErrors = useFieldErrors(updateMutation.error);

  const columns = createFinancialResourcesColumns(handleEdit, handleDelete);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-slate-600 dark:text-slate-400" />
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Risorse Finanziarie
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestisci conti bancari, casse e metodi di pagamento
            dell&apos;azienda
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuova Risorsa
        </Button>
      </div>

      <DataTable<FinancialResource, unknown>
        columns={columns}
        data={resources}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Cerca per nome..."
        storageKey="financial-resources-table"
      />

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuova Risorsa Finanziaria</DialogTitle>
            <DialogDescription>
              Aggiungi un nuovo conto bancario, cassa o metodo di pagamento
            </DialogDescription>
          </DialogHeader>
          <FinancialResourceForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateOpen(false)}
            isLoading={createMutation.isPending}
            serverErrors={createFieldErrors}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifica Risorsa Finanziaria</DialogTitle>
            <DialogDescription>
              Aggiorna i dettagli della risorsa finanziaria
            </DialogDescription>
          </DialogHeader>
          {selectedResource && (
            <FinancialResourceForm
              resource={selectedResource}
              onSubmit={handleUpdate}
              onCancel={() => {
                setIsEditOpen(false);
                setSelectedResource(null);
              }}
              isLoading={updateMutation.isPending}
              serverErrors={updateFieldErrors}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare la risorsa{" "}
              <strong>{selectedResource?.name}</strong>?
              <br />
              Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedResource(null)}>
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? "Eliminazione..." : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

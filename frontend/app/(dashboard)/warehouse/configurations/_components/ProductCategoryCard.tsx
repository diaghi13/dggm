"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "@/lib/api/products";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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

type Category = App.Domains.Product.Data.ProductCategoryData & { id: number };

const EMPTY_FORM = {
  name: "",
  code: "",
  description: "" as string | null,
  color: "" as string | null,
  sort_order: 0,
  is_active: true,
};

type FormState = typeof EMPTY_FORM;

export function ProductCategoryCard() {
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["product-categories"],
    queryFn: () => productsApi.getCategories(),
    select: (data) => (data as Category[]).filter((c) => c.id != null),
  });

  const deletingItem = items.find((c) => c.id === deleteId);

  const createMutation = useMutation({
    mutationFn: (data: FormState) =>
      productsApi.createCategory({
        name: data.name,
        code: data.code,
        description: data.description || undefined,
        color: data.color || undefined,
        sort_order: data.sort_order,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      toast.success("Categoria creata con successo");
      setDialogOpen(false);
    },
    onError: () => toast.error("Errore durante la creazione della categoria"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormState }) =>
      productsApi.updateCategory(id, {
        name: data.name,
        code: data.code,
        description: data.description || undefined,
        color: data.color || undefined,
        sort_order: data.sort_order,
        is_active: data.is_active,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      toast.success("Categoria aggiornata con successo");
      setDialogOpen(false);
    },
    onError: () => toast.error("Errore durante l'aggiornamento"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productsApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      toast.success("Categoria eliminata");
      setDeleteId(null);
    },
    onError: () =>
      toast.error("Impossibile eliminare: categoria in uso da prodotti"),
  });

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(item: Category) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      code: item.code,
      description: item.description ?? "",
      color: item.color ?? "",
      sort_order: item.sort_order ?? 0,
      is_active: item.is_active ?? true,
    });
    setDialogOpen(true);
  }

  function handleSubmit() {
    if (!form.name.trim() || !form.code.trim()) return;
    if (editingId !== null) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Categorie prodotto</CardTitle>
            <CardDescription>
              Classificazione dei prodotti per tipo
            </CardDescription>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1.5" />
            Aggiungi
          </Button>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Caricamento...
            </p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Nessuna categoria — clicca Aggiungi per iniziare
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-medium pl-6">Nome</TableHead>
                  <TableHead className="text-xs font-medium">Codice</TableHead>
                  <TableHead className="text-xs font-medium w-16 text-center hidden sm:table-cell">
                    Ord.
                  </TableHead>
                  <TableHead className="text-xs font-medium">Stato</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-2">
                        {item.color ? (
                          <span
                            className="h-3 w-3 rounded-full shrink-0 border border-border/50"
                            style={{ backgroundColor: item.color }}
                          />
                        ) : (
                          <span className="h-3 w-3 rounded-full shrink-0 bg-slate-200 dark:bg-slate-700" />
                        )}
                        <span className="font-medium">{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {item.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground hidden sm:table-cell">
                      {item.sort_order ?? 0}
                    </TableCell>
                    <TableCell>
                      {item.is_active === false ? (
                        <Badge variant="secondary" className="text-xs">Inattiva</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800">Attiva</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(item)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && setDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId !== null ? "Modifica categoria" : "Nuova categoria"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cat-name">Nome *</Label>
                <Input
                  id="cat-name"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="es. Elettrico"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cat-code">Codice *</Label>
                <Input
                  id="cat-code"
                  value={form.code}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))
                  }
                  placeholder="es. ELETT"
                  maxLength={50}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cat-description">Descrizione</Label>
              <Textarea
                id="cat-description"
                value={form.description ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value || null }))
                }
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Colore</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.color || "#6366f1"}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, color: e.target.value }))
                    }
                    className="h-9 w-12 cursor-pointer rounded-md border border-input bg-background p-1 shrink-0"
                  />
                  <Input
                    value={form.color ?? ""}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, color: e.target.value || null }))
                    }
                    placeholder="#6366f1"
                    maxLength={7}
                    className="font-mono flex-1"
                  />
                  {form.color && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => setForm((p) => ({ ...p, color: null }))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cat-sort">Ordinamento</Label>
                <Input
                  id="cat-sort"
                  type="text"
                  inputMode="numeric"
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      sort_order: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="cat-active"
                checked={form.is_active}
                onCheckedChange={(v) => setForm((p) => ({ ...p, is_active: v }))}
              />
              <Label htmlFor="cat-active">Attiva</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSaving}
            >
              Annulla
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSaving || !form.name.trim() || !form.code.trim()}
            >
              {isSaving ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare{" "}
              <strong>{deletingItem?.name}</strong>? L&apos;operazione non può
              essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteId !== null && deleteMutation.mutate(deleteId)
              }
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Eliminazione..." : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

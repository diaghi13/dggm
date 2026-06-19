"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
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

type Brand = App.Domains.Product.Data.ProductBrandData & { id: number };

const EMPTY_FORM = {
  name: "",
  description: "" as string | null,
  website: "" as string | null,
  is_active: true,
};

type FormState = typeof EMPTY_FORM;

export function ProductBrandCard() {
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["product-brands", { per_page: 200 }],
    queryFn: () => productsApi.getBrands({ per_page: 200 }),
    select: (data) => (data as Brand[]).filter((b) => b.id != null),
  });

  const deletingItem = items.find((b) => b.id === deleteId);

  const createMutation = useMutation({
    mutationFn: (data: FormState) =>
      productsApi.createBrand({
        name: data.name,
        description: data.description || undefined,
        website: data.website || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-brands"] });
      toast.success("Brand creato con successo");
      setDialogOpen(false);
    },
    onError: () => toast.error("Errore durante la creazione del brand"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormState }) =>
      productsApi.updateBrand(id, {
        name: data.name,
        description: data.description || undefined,
        website: data.website || undefined,
        is_active: data.is_active,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-brands"] });
      toast.success("Brand aggiornato con successo");
      setDialogOpen(false);
    },
    onError: () => toast.error("Errore durante l'aggiornamento del brand"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productsApi.deleteBrand(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-brands"] });
      toast.success("Brand eliminato");
      setDeleteId(null);
    },
    onError: () => toast.error("Impossibile eliminare: brand in uso da prodotti"),
  });

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(item: Brand) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description ?? "",
      website: item.website ?? "",
      is_active: item.is_active ?? true,
    });
    setDialogOpen(true);
  }

  function handleSubmit() {
    if (!form.name.trim()) return;
    if (editingId !== null) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const editingItem = items.find((b) => b.id === editingId);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Brand</CardTitle>
            <CardDescription>Marchi e produttori dei prodotti</CardDescription>
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
              Nessun brand — clicca Aggiungi per iniziare
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-medium pl-6">Nome</TableHead>
                  <TableHead className="text-xs font-medium">Codice</TableHead>
                  <TableHead className="text-xs font-medium hidden sm:table-cell">Sito web</TableHead>
                  <TableHead className="text-xs font-medium">Stato</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium pl-6">{item.name}</TableCell>
                    <TableCell>
                      {item.code ? (
                        <Badge variant="outline" className="font-mono text-xs">
                          {item.code}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden sm:table-cell max-w-[160px] truncate">
                      {item.website ? (
                        <span className="truncate block">{item.website.replace(/^https?:\/\//, "")}</span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {item.is_active === false ? (
                        <Badge variant="secondary" className="text-xs">Inattivo</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800">Attivo</Badge>
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
              {editingId !== null ? "Modifica brand" : "Nuovo brand"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="brand-name">Nome *</Label>
              <Input
                id="brand-name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="es. Bosch"
              />
            </div>

            {editingId !== null && editingItem?.code && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Codice (auto-generato)
                </Label>
                <Badge variant="outline" className="font-mono">
                  {editingItem.code}
                </Badge>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="brand-website">Sito web</Label>
              <Input
                id="brand-website"
                value={form.website ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, website: e.target.value || null }))
                }
                placeholder="https://..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="brand-description">Descrizione</Label>
              <Textarea
                id="brand-description"
                value={form.description ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value || null }))
                }
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="brand-active"
                checked={form.is_active}
                onCheckedChange={(v) => setForm((p) => ({ ...p, is_active: v }))}
              />
              <Label htmlFor="brand-active">Attivo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
              Annulla
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving || !form.name.trim()}>
              {isSaving ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina brand</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare <strong>{deletingItem?.name}</strong>?
              L&apos;operazione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId !== null && deleteMutation.mutate(deleteId)}
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

"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, ArrowLeft } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "@/lib/api/products";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type UnitType = App.Domains.Product.Data.ProductUnitTypeData & { id: number };

const EMPTY_FORM = {
  code: "",
  name_it: "",
  symbol_it: "",
  name_en: "",
  symbol_en: "",
  category: "" as string | null,
  sort_order: 0,
  is_active: true,
};

type FormState = typeof EMPTY_FORM;

export default function UnitTypesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["product-unit-types"],
    queryFn: () => productsApi.getUnitTypes(true),
    select: (data) => (data as UnitType[]).filter((u) => u.id != null),
  });

  const deletingItem = items.find((u) => u.id === deleteId);
  const editingItem = items.find((u) => u.id === editingId);

  const createMutation = useMutation({
    mutationFn: (data: FormState) =>
      productsApi.createUnitType({
        code: data.code,
        name_it: data.name_it,
        symbol_it: data.symbol_it,
        name_en: data.name_en,
        symbol_en: data.symbol_en,
        category: data.category || undefined,
        sort_order: data.sort_order,
        is_active: data.is_active,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-unit-types"] });
      toast.success("Unità di misura creata");
      setDialogOpen(false);
    },
    onError: () => toast.error("Errore durante la creazione"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormState }) =>
      productsApi.updateUnitType(id, {
        name_it: data.name_it,
        symbol_it: data.symbol_it,
        name_en: data.name_en,
        symbol_en: data.symbol_en,
        category: data.category || undefined,
        sort_order: data.sort_order,
        is_active: data.is_active,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-unit-types"] });
      toast.success("Unità di misura aggiornata");
      setDialogOpen(false);
    },
    onError: () => toast.error("Errore durante l'aggiornamento"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productsApi.deleteUnitType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-unit-types"] });
      toast.success("Unità di misura eliminata");
      setDeleteId(null);
    },
    onError: () =>
      toast.error("Impossibile eliminare: unità di misura in uso da prodotti"),
  });

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(item: UnitType) {
    setEditingId(item.id);
    setForm({
      code: item.code,
      name_it: item.name_it,
      symbol_it: item.symbol_it,
      name_en: item.name_en,
      symbol_en: item.symbol_en,
      category: item.category ?? "",
      sort_order: item.sort_order ?? 0,
      is_active: item.is_active ?? true,
    });
    setDialogOpen(true);
  }

  function handleSubmit() {
    if (
      !form.name_it.trim() ||
      !form.symbol_it.trim() ||
      !form.name_en.trim() ||
      !form.symbol_en.trim()
    )
      return;
    if (editingId === null && !form.code.trim()) return;
    if (editingId !== null) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isFormValid =
    form.name_it.trim() &&
    form.symbol_it.trim() &&
    form.name_en.trim() &&
    form.symbol_en.trim() &&
    (editingId !== null || form.code.trim());

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Unità di misura</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestisci le unità di misura usate nei prodotti
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Unità di misura</CardTitle>
            <CardDescription>
              Chilogrammi, metri, pezzi e altre unità usate nei prodotti
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
              Nessuna unità — clicca Aggiungi per iniziare
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-medium pl-6">
                    Nome
                  </TableHead>
                  <TableHead className="text-xs font-medium hidden sm:table-cell">
                    English
                  </TableHead>
                  <TableHead className="text-xs font-medium">Codice</TableHead>
                  <TableHead className="text-xs font-medium hidden md:table-cell">
                    Categoria
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
                        <span className="font-medium">{item.name_it}</span>
                        <Badge
                          variant="secondary"
                          className="font-mono text-xs"
                        >
                          {item.symbol_it}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {item.name_en}{" "}
                        <span className="font-mono">({item.symbol_en})</span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {item.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                      {item.category ?? "—"}
                    </TableCell>
                    <TableCell>
                      {item.is_active === false ? (
                        <Badge variant="secondary" className="text-xs">
                          Inattiva
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-xs text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800"
                        >
                          Attiva
                        </Badge>
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
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => !open && setDialogOpen(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId !== null
                ? "Modifica unità di misura"
                : "Nuova unità di misura"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {editingId === null ? (
              <div className="space-y-1.5">
                <Label htmlFor="ut-code">Codice *</Label>
                <Input
                  id="ut-code"
                  value={form.code}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      code: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="es. KG"
                  maxLength={10}
                  className="font-mono"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Codice (non modificabile)
                </Label>
                <div>
                  <Badge variant="outline" className="font-mono">
                    {editingItem?.code}
                  </Badge>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ut-name-it">Nome italiano *</Label>
                <Input
                  id="ut-name-it"
                  value={form.name_it}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name_it: e.target.value }))
                  }
                  placeholder="es. Chilogrammo"
                  maxLength={50}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ut-sym-it">Simbolo *</Label>
                <Input
                  id="ut-sym-it"
                  value={form.symbol_it}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, symbol_it: e.target.value }))
                  }
                  placeholder="es. kg"
                  maxLength={10}
                  className="font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ut-name-en">Nome inglese *</Label>
                <Input
                  id="ut-name-en"
                  value={form.name_en}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name_en: e.target.value }))
                  }
                  placeholder="es. Kilogram"
                  maxLength={50}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ut-sym-en">Simbolo EN *</Label>
                <Input
                  id="ut-sym-en"
                  value={form.symbol_en}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, symbol_en: e.target.value }))
                  }
                  placeholder="es. kg"
                  maxLength={10}
                  className="font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ut-category">Categoria</Label>
                <Input
                  id="ut-category"
                  value={form.category ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      category: e.target.value || null,
                    }))
                  }
                  placeholder="es. weight"
                  maxLength={20}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ut-sort">Ordinamento</Label>
                <Input
                  id="ut-sort"
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
                id="ut-active"
                checked={form.is_active}
                onCheckedChange={(v) =>
                  setForm((p) => ({ ...p, is_active: v }))
                }
              />
              <Label htmlFor="ut-active">Attiva</Label>
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
              disabled={isSaving || !isFormValid}
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
            <AlertDialogTitle>Elimina unità di misura</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare{" "}
              <strong>{deletingItem?.name_it}</strong>? L&apos;operazione non
              può essere annullata.
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
    </div>
  );
}

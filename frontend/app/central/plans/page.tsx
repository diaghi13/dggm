"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { landlordApi, AdminPlan } from "@/lib/api/landlord";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import {
  Plus,
  Pencil,
  Trash2,
  CreditCard,
  Users,
  CheckCircle2,
  XCircle,
  PackageSearch,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

// ─── Feature definitions ───────────────────────────────────────────────────

const AVAILABLE_FEATURES = [
  { key: "warehouse", label: "Magazzino" },
  { key: "workers", label: "Operai" },
  { key: "rental", label: "Noleggio" },
  { key: "quotes", label: "Preventivi" },
  { key: "projects", label: "Cantieri" },
  { key: "customers", label: "Clienti" },
  { key: "suppliers", label: "Fornitori" },
  { key: "invoicing", label: "Fatturazione" },
  { key: "reports", label: "Report" },
  { key: "time_tracking", label: "Timbrature GPS" },
] as const;

const FEATURE_COLORS: Record<string, string> = {
  warehouse: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  workers: "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300",
  rental: "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300",
  quotes: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300",
  projects: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300",
  customers: "bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300",
  suppliers: "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300",
  invoicing: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  reports: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300",
  time_tracking: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300",
};

// ─── Zod schema ───────────────────────────────────────────────────────────

const planSchema = z.object({
  name: z.string().min(1, "Nome richiesto"),
  slug: z
    .string()
    .min(1, "Slug richiesto")
    .regex(/^[a-z0-9-]+$/, "Solo minuscole, numeri e trattini"),
  description: z.string().optional(),
  price: z.number().min(0).optional().nullable(),
  price_yearly: z.number().min(0).optional().nullable(),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0),
  features: z.array(
    z.object({
      feature_key: z.string(),
      price: z.number().min(0).optional().nullable(),
      price_yearly: z.number().min(0).optional().nullable(),
    }),
  ),
});

type PlanFormValues = z.infer<typeof planSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function featureLabelFor(key: string): string {
  return AVAILABLE_FEATURES.find((f) => f.key === key)?.label ?? key;
}

// ─── Feature badge ────────────────────────────────────────────────────────

function FeatureBadge({ featureKey }: { featureKey: string }) {
  const cls =
    FEATURE_COLORS[featureKey] ??
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {featureLabelFor(featureKey)}
    </span>
  );
}

// ─── Plan form dialog ─────────────────────────────────────────────────────

interface PlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: AdminPlan | null;
  onSuccess: () => void;
}

function PlanDialog({ open, onOpenChange, plan, onSuccess }: PlanDialogProps) {
  const isEdit = !!plan;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      price: undefined,
      price_yearly: undefined,
      is_active: true,
      sort_order: 0,
      features: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "features",
  });

  // Fix: reset form whenever `plan` prop changes (handles stale edit data)
  useEffect(() => {
    if (plan) {
      reset({
        name: plan.name,
        slug: plan.slug,
        description: plan.description ?? "",
        price: plan.price ?? undefined,
        price_yearly: plan.price_yearly ?? undefined,
        is_active: plan.is_active,
        sort_order: plan.sort_order,
        features: plan.features.map((f) => ({
          feature_key: f.feature_key,
          price: f.price ?? undefined,
          price_yearly: f.price_yearly ?? undefined,
        })),
      });
    } else {
      reset({
        name: "",
        slug: "",
        description: "",
        price: undefined,
        price_yearly: undefined,
        is_active: true,
        sort_order: 0,
        features: [],
      });
    }
  }, [plan, reset]);

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      reset({
        name: "",
        slug: "",
        description: "",
        price: undefined,
        price_yearly: undefined,
        is_active: true,
        sort_order: 0,
        features: [],
      });
    }
    onOpenChange(val);
  };

  const createMutation = useMutation({
    mutationFn: (data: PlanFormValues) =>
      landlordApi.createPlan({
        ...data,
        price: data.price ?? null,
        price_yearly: data.price_yearly ?? null,
        description: data.description || undefined,
        features: data.features.map((f) => ({
          feature_key: f.feature_key,
          price: f.price ?? null,
          price_yearly: f.price_yearly ?? null,
        })),
      }),
    onSuccess: () => {
      toast.success("Piano creato con successo");
      onSuccess();
      handleOpenChange(false);
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      toast.error(e.response?.data?.message ?? "Errore durante la creazione del piano");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: PlanFormValues) =>
      landlordApi.updatePlan(plan!.id, {
        ...data,
        price: data.price ?? null,
        price_yearly: data.price_yearly ?? null,
        description: data.description || undefined,
        features: data.features.map((f) => ({
          feature_key: f.feature_key,
          price: f.price ?? null,
          price_yearly: f.price_yearly ?? null,
        })),
      }),
    onSuccess: () => {
      toast.success("Piano aggiornato con successo");
      onSuccess();
      handleOpenChange(false);
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      toast.error(e.response?.data?.message ?? "Errore durante l'aggiornamento del piano");
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const watchedName = watch("name");
  const watchedPrice = watch("price") ?? 0;
  const watchedPriceYearly = watch("price_yearly");
  const watchedFeatures = watch("features") ?? [];

  const totalMonthly =
    (watchedPrice ?? 0) +
    watchedFeatures.reduce((sum, f) => sum + (f.price ?? 0), 0);

  const totalYearly =
    watchedPriceYearly != null
      ? (watchedPriceYearly ?? 0) +
        watchedFeatures.reduce((sum, f) => sum + (f.price_yearly ?? f.price ?? 0), 0)
      : null;

  // Savings on BASE plan only (not combined with addons)
  const basePlanSavings =
    watchedPriceYearly != null && watchedPrice > 0
      ? Math.round((1 - watchedPriceYearly / (watchedPrice * 12)) * 100)
      : null;

  // Helper to compute savings % for a single addon
  const calcAddonSavings = (monthly: number | null | undefined, yearly: number | null | undefined): number | null => {
    if (!monthly || !yearly || monthly <= 0) { return null; }
    const pct = Math.round((1 - yearly / (monthly * 12)) * 100);
    return pct > 0 ? pct : null;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setValue("name", name);
    if (!isEdit) {
      setValue("slug", generateSlug(name));
    }
  };

  const onSubmit = (data: PlanFormValues) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {isEdit ? "Modifica Piano" : "Nuovo Piano"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <Label
              htmlFor="name"
              className="text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Nome <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register("name")}
              onChange={handleNameChange}
              value={watchedName}
              placeholder="Piano Base"
              className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <Label
              htmlFor="slug"
              className="text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Slug <span className="text-red-500">*</span>
            </Label>
            <Input
              id="slug"
              {...register("slug")}
              placeholder="piano-base"
              className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 font-mono text-sm"
            />
            {errors.slug && (
              <p className="text-xs text-red-500">{errors.slug.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label
              htmlFor="description"
              className="text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Descrizione
            </Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Descrizione opzionale del piano..."
              rows={2}
              className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 resize-none"
            />
          </div>

          {/* Price + Yearly price + Sort order */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="price"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Prezzo mensile (€/mese)
              </Label>
              <Controller
                control={control}
                name="price"
                render={({ field }) => (
                  <Input
                    id="price"
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="Gratuito"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? null : parseFloat(e.target.value),
                      )
                    }
                    className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                  />
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="price_yearly"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Prezzo annuale (€/anno)
              </Label>
              <Controller
                control={control}
                name="price_yearly"
                render={({ field }) => (
                  <Input
                    id="price_yearly"
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="Non offerto"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? null : parseFloat(e.target.value),
                      )
                    }
                    className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                  />
                )}
              />
              {basePlanSavings !== null && basePlanSavings > 0 && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  -{basePlanSavings}% rispetto al mensile (solo piano base)
                </p>
              )}
            </div>
          </div>

          {/* Sort order */}
          <div className="space-y-1.5">
            <Label
              htmlFor="sort_order"
              className="text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Ordine
            </Label>
            <Controller
              control={control}
              name="sort_order"
              render={({ field }) => (
                <Input
                  id="sort_order"
                  type="number"
                  min={0}
                  step={1}
                  value={field.value}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                />
              )}
            />
          </div>

          {/* Active switch */}
          <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 p-3">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Attivo
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                I piani inattivi non sono visibili ai nuovi tenant
              </p>
            </div>
            <Controller
              control={control}
              name="is_active"
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>

          {/* Features with per-feature addon pricing */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Funzionalità incluse
            </Label>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Imposta un prezzo addon opzionale per le funzionalità a pagamento separato
            </p>
            <div className="flex flex-col gap-2 rounded-lg border border-slate-200 dark:border-slate-700 p-3">
              {AVAILABLE_FEATURES.map((feat) => {
                const isChecked = fields.some((f) => f.feature_key === feat.key);
                const fieldEntry = fields.find((f) => f.feature_key === feat.key);
                return (
                  <div
                    key={feat.key}
                    className="flex items-center gap-3 p-2 rounded border border-slate-200 dark:border-slate-700"
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          append({ feature_key: feat.key, price: undefined });
                        } else {
                          const idx = fields.findIndex(
                            (f) => f.feature_key === feat.key,
                          );
                          if (idx >= 0) remove(idx);
                        }
                      }}
                    />
                    <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">
                      {feat.label}
                    </span>
                    {isChecked && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-500">€</span>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            placeholder="0.00"
                            className="w-20 h-7 text-xs bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                            value={fieldEntry?.price ?? ""}
                            onChange={(e) => {
                              const idx = fields.findIndex(
                                (f) => f.feature_key === feat.key,
                              );
                              if (idx >= 0) {
                                update(idx, {
                                  feature_key: feat.key,
                                  price:
                                    e.target.value === ""
                                      ? undefined
                                      : parseFloat(e.target.value),
                                  price_yearly: fieldEntry?.price_yearly,
                                });
                              }
                            }}
                          />
                          <span className="text-xs text-slate-400">/m</span>
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-500">€</span>
                            <Input
                              type="number"
                              min={0}
                              step={0.01}
                              placeholder="0.00"
                              className="w-20 h-7 text-xs bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                              value={fieldEntry?.price_yearly ?? ""}
                              onChange={(e) => {
                                const idx = fields.findIndex(
                                  (f) => f.feature_key === feat.key,
                                );
                                if (idx >= 0) {
                                  update(idx, {
                                    feature_key: feat.key,
                                    price: fieldEntry?.price,
                                    price_yearly:
                                      e.target.value === ""
                                        ? undefined
                                        : parseFloat(e.target.value),
                                  });
                                }
                              }}
                            />
                            <span className="text-xs text-slate-400">/a</span>
                          </div>
                          {(() => {
                            const addonSavings = calcAddonSavings(fieldEntry?.price, fieldEntry?.price_yearly);
                            return addonSavings !== null ? (
                              <span className="text-xs text-green-600 dark:text-green-400">
                                -{addonSavings}%
                              </span>
                            ) : null;
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Computed total */}
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-4 py-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Totale mensile
              </span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {totalMonthly > 0 ? `€${totalMonthly.toFixed(2)}/mese` : "Gratuito"}
              </span>
            </div>
            {totalYearly !== null && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Totale annuale
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {totalYearly > 0 ? `€${totalYearly.toFixed(2)}/anno` : "Gratuito"}
                </span>
              </div>
            )}
            {totalYearly !== null && (
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Il risparmio % è indicato separatamente per piano base e ogni add-on
              </p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
              className="border-slate-300 dark:border-slate-600"
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isPending ? "Salvataggio..." : isEdit ? "Aggiorna Piano" : "Crea Piano"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────

export default function PlansPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AdminPlan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<AdminPlan | null>(null);

  const { data: plans, isLoading } = useQuery({
    queryKey: ["central-plans"],
    queryFn: landlordApi.getAdminPlans,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => landlordApi.deletePlan(id),
    onSuccess: () => {
      toast.success("Piano eliminato con successo");
      queryClient.invalidateQueries({ queryKey: ["central-plans"] });
      setDeletingPlan(null);
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      toast.error(e.response?.data?.message ?? "Impossibile eliminare il piano");
      setDeletingPlan(null);
    },
  });

  const handleEdit = (plan: AdminPlan) => {
    setEditingPlan(plan);
    setDialogOpen(true);
  };

  const handleNewPlan = () => {
    setEditingPlan(null);
    setDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["central-plans"] });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Gestione Piani
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Configura i piani di abbonamento disponibili per i tenant
          </p>
        </div>
        <Button
          onClick={handleNewPlan}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuovo Piano
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-8 w-20 rounded" />
              </div>
            ))}
          </div>
        ) : !plans || plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <PackageSearch className="h-8 w-8 text-slate-400 dark:text-slate-600" />
            </div>
            <p className="text-base font-medium text-slate-900 dark:text-slate-100">
              Nessun piano configurato
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Crea il primo piano di abbonamento
            </p>
            <Button
              onClick={handleNewPlan}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              Nuovo Piano
            </Button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Piano
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">
                  Prezzo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">
                  Funzionalità
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                  Tenant
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Stato
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {plans.map((plan) => {
                const featureKeys = plan.features?.map((f) => f.feature_key) ?? [];
                const visibleFeatures = featureKeys.slice(0, 3);
                const extraCount = featureKeys.length - visibleFeatures.length;
                const canDelete = plan.tenant_count === 0;
                const addonTotal = plan.features.reduce(
                  (sum, f) => sum + (f.price ?? 0),
                  0,
                );
                const basePrice = plan.price ?? 0;
                const totalPrice = basePrice + addonTotal;

                return (
                  <tr
                    key={plan.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {/* Name + slug */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400">
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {plan.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            {plan.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <div className="flex flex-col gap-1">
                        {plan.price != null ? (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                            €{plan.price.toFixed(2)}/mese
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            Gratuito
                          </span>
                        )}
                        {plan.price_yearly != null && (
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300">
                            €{plan.price_yearly.toFixed(2)}/anno
                            {plan.price != null && plan.price > 0 && (() => {
                              const s = Math.round((1 - plan.price_yearly / (plan.price * 12)) * 100);
                              return s > 0 ? (
                                <span className="bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 px-1 rounded-full">
                                  -{s}%
                                </span>
                              ) : null;
                            })()}
                          </span>
                        )}
                        {addonTotal > 0 && (
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            + €{addonTotal.toFixed(2)} addons
                          </span>
                        )}
                        {totalPrice > 0 && addonTotal > 0 && (
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                            Tot. €{totalPrice.toFixed(2)}/mese
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Features */}
                    <td className="px-4 py-4 hidden md:table-cell">
                      <div className="flex flex-wrap items-center gap-1">
                        {featureKeys.length === 0 ? (
                          <span className="text-xs text-slate-400 dark:text-slate-600 italic">
                            Nessuna
                          </span>
                        ) : (
                          <>
                            {visibleFeatures.map((key) => (
                              <FeatureBadge key={key} featureKey={key} />
                            ))}
                            {extraCount > 0 && (
                              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                +{extraCount} altri
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </td>

                    {/* Tenant count */}
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <Users className="h-3.5 w-3.5" />
                        <span className="text-sm font-medium">{plan.tenant_count}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      {plan.is_active ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400">
                          <CheckCircle2 className="h-3 w-3" />
                          Attivo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          <XCircle className="h-3 w-3" />
                          Inattivo
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(plan)}
                          className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                          title="Modifica piano"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeletingPlan(plan)}
                          disabled={!canDelete}
                          className="h-8 w-8 p-0 text-slate-500 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed"
                          title={
                            canDelete
                              ? "Elimina piano"
                              : "Ci sono tenant attivi su questo piano"
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary row */}
      {plans && plans.length > 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400 px-1">
          {plans.length} {plans.length === 1 ? "piano configurato" : "piani configurati"}{" "}
          • {plans.filter((p) => p.is_active).length} attivi
        </p>
      )}

      {/* Create/Edit Dialog */}
      <PlanDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingPlan(null);
        }}
        plan={editingPlan}
        onSuccess={handleDialogSuccess}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deletingPlan}
        onOpenChange={(open) => {
          if (!open) setDeletingPlan(null);
        }}
      >
        <AlertDialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Elimina Piano
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
              Sei sicuro di voler eliminare il piano{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {deletingPlan?.name}
              </span>
              ? Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-300 dark:border-slate-600">
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingPlan) deleteMutation.mutate(deletingPlan.id);
              }}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending ? "Eliminazione..." : "Elimina Piano"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

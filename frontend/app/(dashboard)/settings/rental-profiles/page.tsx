"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { rentalProfilesApi } from "@/lib/api/rental-profiles";
import type { RentalProfile } from "@/lib/types";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  TrendingDown,
  ArrowLeft,
  BarChart2,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// ─── Zod schema ───────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1, "Nome obbligatorio"),
  sector: z.string().min(1, "Settore obbligatorio"),
  exponent_curve: z.number().min(0.3).max(1.0),
  decay_strength: z.number().min(0).max(0.9),
  max_duration_reference: z.number().min(7).max(365),
  duration_offset: z.number().min(0).max(1.0),
  max_period_cap_days: z.number().min(30).max(365),
  is_default: z.boolean(),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

// ─── SVG Curve helpers ─────────────────────────────────────────────────────────

interface CurveParams {
  exponent_curve: number;
  decay_strength: number;
  max_duration_reference: number;
  duration_offset: number;
  max_period_cap_days: number;
}

function computeMultiplier(d: number, p: CurveParams): number {
  if (d <= 0) return 0;
  if (d === 1) return 1.0;

  const {
    exponent_curve,
    decay_strength,
    max_duration_reference,
    duration_offset,
    max_period_cap_days,
  } = p;

  const calcRaw = (days: number): number => {
    const power = Math.pow(days, exponent_curve);
    const logRef = Math.log(Math.max(max_duration_reference, 2));
    const decayFactor = 1 - (Math.log(days) / logRef) * decay_strength;
    return power * Math.max(0, decayFactor) + duration_offset;
  };

  const capValue = calcRaw(
    Math.min(max_period_cap_days, max_duration_reference - 1),
  );
  const raw = calcRaw(d);
  return d > max_period_cap_days ? Math.min(raw, capValue) : raw;
}

function buildPolylinePoints(
  p: CurveParams,
  width: number,
  height: number,
): string {
  const steps = 30;
  const maxDays = 90;
  const padding = 10;

  const rawPoints: { mult: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const day = 1 + (i / steps) * (maxDays - 1);
    rawPoints.push({ mult: computeMultiplier(day, p) });
  }

  const multValues = rawPoints.map((rp) => rp.mult);
  const maxMult = Math.max(...multValues);
  const minMult = Math.min(...multValues);
  const range = maxMult - minMult || 1;
  const drawHeight = height - padding * 2;

  return rawPoints
    .map((rp, i) => {
      const x = (i / steps) * width;
      const y = height - padding - ((rp.mult - minMult) / range) * drawHeight;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

// ─── Curve Preview component ──────────────────────────────────────────────────

function CurvePreview({
  params,
  height = 120,
}: {
  params: CurveParams;
  height?: number;
}) {
  const width = 260;
  const points = buildPolylinePoints(params, width, height);

  return (
    <div className="w-full rounded-md bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height + 18}`}
        className="w-full"
        aria-label="Anteprima curva di prezzo"
      >
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={0}
            y1={(height * (1 - f)).toFixed(1)}
            x2={width}
            y2={(height * (1 - f)).toFixed(1)}
            stroke="currentColor"
            strokeOpacity="0.1"
            strokeWidth="1"
          />
        ))}

        {/* Curve */}
        <polyline
          points={points}
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="dark:stroke-blue-400"
        />

        {/* Axis labels */}
        <text
          x="2"
          y={height + 14}
          fontSize="10"
          fill="currentColor"
          fillOpacity="0.5"
        >
          1 gg
        </text>
        <text
          x={width - 28}
          y={height + 14}
          fontSize="10"
          fill="currentColor"
          fillOpacity="0.5"
        >
          90 gg
        </text>
      </svg>
    </div>
  );
}

// ─── Inline curve preview driven by form watch ────────────────────────────────

function LiveCurvePreview({
  control,
}: {
  control: ReturnType<typeof useForm<FormValues>>["control"];
}) {
  const values = useWatch({ control });

  const params: CurveParams = {
    exponent_curve: values.exponent_curve ?? 0.69,
    decay_strength: values.decay_strength ?? 0.27,
    max_duration_reference: values.max_duration_reference ?? 30,
    duration_offset: values.duration_offset ?? 0.15,
    max_period_cap_days: values.max_period_cap_days ?? 90,
  };

  return <CurvePreview params={params} height={100} />;
}

// ─── Profile Card ─────────────────────────────────────────────────────────────

interface ProfileCardProps {
  profile: RentalProfile;
  onEdit: (profile: RentalProfile) => void;
  onDelete: (profile: RentalProfile) => void;
  onRecalculate: (profile: RentalProfile) => void;
  isRecalculating: boolean;
}

function ProfileCard({
  profile,
  onEdit,
  onDelete,
  onRecalculate,
  isRecalculating,
}: ProfileCardProps) {
  const params: CurveParams = {
    exponent_curve: profile.exponent_curve,
    decay_strength: profile.decay_strength,
    max_duration_reference: profile.max_duration_reference,
    duration_offset: profile.duration_offset,
    max_period_cap_days: profile.max_period_cap_days,
  };

  return (
    <Card className="flex flex-col border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge
            variant="outline"
            className="font-mono text-xs border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400"
          >
            {profile.sector}
          </Badge>
          {profile.is_default && (
            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300 dark:border-amber-700 text-xs">
              Predefinito
            </Badge>
          )}
          <Badge
            className={
              profile.is_active
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs"
                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 text-xs"
            }
          >
            {profile.is_active ? "Attivo" : "Inattivo"}
          </Badge>
        </div>

        {/* Profile name */}
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-tight">
          {profile.name}
        </h3>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 pt-0 flex-1">
        {/* Parameters */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">
              Curva esponente
            </span>
            <span className="font-mono text-slate-700 dark:text-slate-300">
              {profile.exponent_curve}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">
              Decadimento
            </span>
            <span className="font-mono text-slate-700 dark:text-slate-300">
              {profile.decay_strength}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">
              Ref. durata max
            </span>
            <span className="font-mono text-slate-700 dark:text-slate-300">
              {profile.max_duration_reference} gg
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Offset</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">
              {profile.duration_offset}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">
              Cap giorni
            </span>
            <span className="font-mono text-slate-700 dark:text-slate-300">
              {profile.max_period_cap_days} gg
            </span>
          </div>
        </div>

        {/* SVG Curve Preview */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
          <CurvePreview params={params} height={120} />
        </div>

        {/* Action buttons */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(profile)}
          >
            <Edit2 className="h-3.5 w-3.5 mr-1" />
            Modifica
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRecalculate(profile)}
            disabled={isRecalculating}
            title="Ricalcola prezzi collegati"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRecalculating ? "animate-spin" : ""}`}
            />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(profile)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function RentalProfilesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<RentalProfile | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<RentalProfile | null>(null);
  const [recalculatingId, setRecalculatingId] = useState<number | null>(null);

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["rental-profiles"],
    queryFn: rentalProfilesApi.getAll,
  });

  // ─── Form ─────────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      sector: "",
      exponent_curve: 0.69,
      decay_strength: 0.27,
      max_duration_reference: 30,
      duration_offset: 0.15,
      max_period_cap_days: 90,
      is_default: false,
      is_active: true,
    },
  });

  const isDefaultValue = watch("is_default");
  const isActiveValue = watch("is_active");

  // ─── Mutations ────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: rentalProfilesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rental-profiles"] });
      closeDialog();
      toast.success("Profilo noleggio creato con successo");
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(
        axiosError?.response?.data?.message || "Errore durante la creazione",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<RentalProfile> }) =>
      rentalProfilesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rental-profiles"] });
      closeDialog();
      toast.success("Profilo noleggio aggiornato con successo");
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(
        axiosError?.response?.data?.message || "Errore durante l'aggiornamento",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: rentalProfilesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rental-profiles"] });
      setDeleteTarget(null);
      toast.success("Profilo noleggio eliminato");
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { status?: number; data?: { message?: string } };
      };
      if (axiosError?.response?.status === 422) {
        toast.error(
          "Impossibile eliminare: il profilo è in uso da uno o più listini prezzi",
        );
      } else {
        toast.error(
          axiosError?.response?.data?.message ||
            "Errore durante l'eliminazione",
        );
      }
      setDeleteTarget(null);
    },
  });

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingProfile(null);
    reset({
      name: "",
      sector: "",
      exponent_curve: 0.69,
      decay_strength: 0.27,
      max_duration_reference: 30,
      duration_offset: 0.15,
      max_period_cap_days: 90,
      is_default: false,
      is_active: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (profile: RentalProfile) => {
    setEditingProfile(profile);
    reset({
      name: profile.name,
      sector: profile.sector,
      exponent_curve: profile.exponent_curve,
      decay_strength: profile.decay_strength,
      max_duration_reference: profile.max_duration_reference,
      duration_offset: profile.duration_offset,
      max_period_cap_days: profile.max_period_cap_days,
      is_default: profile.is_default,
      is_active: profile.is_active,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingProfile(null);
  };

  const onSubmit = (values: FormValues) => {
    if (editingProfile) {
      updateMutation.mutate({ id: editingProfile.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleRecalculate = async (profile: RentalProfile) => {
    setRecalculatingId(profile.id);
    try {
      await rentalProfilesApi.recalculate(profile.id);
      toast.success("Ricalcolo avviato in background");
    } catch {
      toast.error("Errore durante l'avvio del ricalcolo");
    } finally {
      setRecalculatingId(null);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="container mx-auto py-6">
      <div className="flex gap-0 md:gap-6">
        <SettingsSidebar activeTab="rental-profiles" onTabChange={() => {}} />
        <main className="flex-1 min-w-0 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/settings-index")}
            aria-label="Torna alle impostazioni"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <TrendingDown className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              Profili Noleggio
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Configura i parametri della curva di prezzo per settore
            </p>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Profilo
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-16 text-slate-500 dark:text-slate-400">
          Caricamento profili...
        </div>
      )}

      {/* Empty state */}
      {!isLoading && profiles.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
          <BarChart2 className="h-12 w-12 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
            Nessun profilo noleggio
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Crea il primo profilo per configurare la curva di prezzo del
            noleggio
          </p>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Crea Profilo
          </Button>
        </div>
      )}

      {/* Profiles grid */}
      {!isLoading && profiles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
              onRecalculate={handleRecalculate}
              isRecalculating={recalculatingId === profile.id}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">
              {editingProfile
                ? "Modifica Profilo Noleggio"
                : "Nuovo Profilo Noleggio"}
            </DialogTitle>
            <DialogDescription>
              {editingProfile
                ? "Aggiorna i parametri della curva di prezzo per questo profilo"
                : "Configura i parametri della curva di prezzo per il nuovo profilo settoriale"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-2">
            {/* Name */}
            <div className="space-y-1.5">
              <Label
                htmlFor="name"
                className="text-slate-700 dark:text-slate-300"
              >
                Nome *
              </Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Es: Profilo AV Standard"
                className="bg-white dark:bg-slate-900"
              />
              {errors.name && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Sector */}
            <div className="space-y-1.5">
              <Label
                htmlFor="sector"
                className="text-slate-700 dark:text-slate-300"
              >
                Settore *
              </Label>
              <Input
                id="sector"
                {...register("sector")}
                placeholder="es: av_service, electrical, construction"
                className="font-mono bg-white dark:bg-slate-900"
              />
              {errors.sector && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {errors.sector.message}
                </p>
              )}
            </div>

            {/* Numeric params grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="exponent_curve"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Esponente curva
                  <span className="ml-1 text-xs text-slate-400">(0.3–1.0)</span>
                </Label>
                <Input
                  id="exponent_curve"
                  type="number"
                  step="0.01"
                  min="0.3"
                  max="1.0"
                  {...register("exponent_curve", { valueAsNumber: true })}
                  className="font-mono bg-white dark:bg-slate-900"
                />
                {errors.exponent_curve && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {errors.exponent_curve.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="decay_strength"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Forza decadimento
                  <span className="ml-1 text-xs text-slate-400">(0–0.9)</span>
                </Label>
                <Input
                  id="decay_strength"
                  type="number"
                  step="0.01"
                  min="0"
                  max="0.9"
                  {...register("decay_strength", { valueAsNumber: true })}
                  className="font-mono bg-white dark:bg-slate-900"
                />
                {errors.decay_strength && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {errors.decay_strength.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="max_duration_reference"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Ref. max durata (gg)
                  <span className="ml-1 text-xs text-slate-400">(7–365)</span>
                </Label>
                <Input
                  id="max_duration_reference"
                  type="number"
                  step="1"
                  min="7"
                  max="365"
                  {...register("max_duration_reference", {
                    valueAsNumber: true,
                  })}
                  className="font-mono bg-white dark:bg-slate-900"
                />
                {errors.max_duration_reference && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {errors.max_duration_reference.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="duration_offset"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Offset durata
                  <span className="ml-1 text-xs text-slate-400">(0–1.0)</span>
                </Label>
                <Input
                  id="duration_offset"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1.0"
                  {...register("duration_offset", { valueAsNumber: true })}
                  className="font-mono bg-white dark:bg-slate-900"
                />
                {errors.duration_offset && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {errors.duration_offset.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 col-span-2">
                <Label
                  htmlFor="max_period_cap_days"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Cap giorni
                  <span className="ml-1 text-xs text-slate-400">(30–365)</span>
                </Label>
                <Input
                  id="max_period_cap_days"
                  type="number"
                  step="1"
                  min="30"
                  max="365"
                  {...register("max_period_cap_days", { valueAsNumber: true })}
                  className="font-mono bg-white dark:bg-slate-900"
                />
                {errors.max_period_cap_days && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {errors.max_period_cap_days.message}
                  </p>
                )}
              </div>
            </div>

            {/* Switches */}
            <div className="flex gap-6">
              <div className="flex items-center gap-3">
                <Switch
                  id="is_default"
                  checked={isDefaultValue}
                  onCheckedChange={(checked) => setValue("is_default", checked)}
                />
                <Label
                  htmlFor="is_default"
                  className="cursor-pointer text-slate-700 dark:text-slate-300"
                >
                  Profilo predefinito
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="is_active"
                  checked={isActiveValue}
                  onCheckedChange={(checked) => setValue("is_active", checked)}
                />
                <Label
                  htmlFor="is_active"
                  className="cursor-pointer text-slate-700 dark:text-slate-300"
                >
                  Attivo
                </Label>
              </div>
            </div>

            {/* Live curve preview */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Anteprima curva (in tempo reale)
              </p>
              <LiveCurvePreview control={control} />
              <p className="text-xs text-slate-400 dark:text-slate-500">
                La curva mostra il moltiplicatore di prezzo dal giorno 1 al
                giorno 90
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                disabled={isSaving}
              >
                Annulla
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving
                  ? "Salvataggio..."
                  : editingProfile
                    ? "Aggiorna"
                    : "Crea Profilo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 dark:text-slate-100">
              Elimina profilo noleggio
            </AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare il profilo{" "}
              <strong className="text-slate-900 dark:text-slate-100">
                &quot;{deleteTarget?.name}&quot;
              </strong>
              ? Questa azione non può essere annullata. Se il profilo è
              associato a un listino prezzi, l&apos;operazione non riuscirà.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white"
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.id)
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Eliminazione..." : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        </main>
      </div>
    </div>
  );
}

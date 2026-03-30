"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "@/lib/api/settings";
import type { Setting } from "@/lib/api/settings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, RefreshCw, Calculator, Clock, TrendingUp, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import { formatCurrency } from "@/components/ui/currency-input";

// ─── Setting keys ─────────────────────────────────────────────────────────────

const BREAKEVEN_KEYS = ["rental.break_even_days", "rental.margin_percentage"] as const;
const CURVE_KEYS = [
  "rental.exponent_curve",
  "rental.decay_strength",
  "rental.max_duration_reference",
  "rental.duration_offset",
  "rental.max_period_cap_days",
] as const;
const GENERAL_KEYS = [
  "rental.hours_per_day",
  "rental.commercial_index",
  "rental.premium_multiplier",
] as const;
const SCARCITY_KEYS = [
  "rental.scarcity_enabled",
  "rental.scarcity_threshold",
  "rental.scarcity_multiplier",
] as const;

const ALL_KEYS = [...BREAKEVEN_KEYS, ...CURVE_KEYS, ...GENERAL_KEYS, ...SCARCITY_KEYS];

// ─── Labels/descriptions ──────────────────────────────────────────────────────

const META: Record<string, { label: string; description: string; unit?: string; isToggle?: boolean }> = {
  "rental.break_even_days": {
    label: "Giorni di Breakeven",
    description: "Numero di giorni di noleggio necessari per recuperare il costo d'acquisto",
    unit: "giorni",
  },
  "rental.margin_percentage": {
    label: "Margine desiderato %",
    description: "Margine di profitto aggiunto al prezzo giornaliero oltre il breakeven",
    unit: "%",
  },
  "rental.exponent_curve": {
    label: "Esponente curva",
    description: "Controlla la velocità di crescita della curva sconti per durata (tipico: 0.60-0.75)",
  },
  "rental.decay_strength": {
    label: "Forza decay",
    description: "Quanto aumenta lo sconto all'aumentare della durata (0=no decay, 0.5=forte)",
  },
  "rental.max_duration_reference": {
    label: "Durata riferimento (giorni)",
    description: "Durata di riferimento per normalizzare la curva di decay",
    unit: "giorni",
  },
  "rental.duration_offset": {
    label: "Offset durata",
    description: "Offset base aggiunto al moltiplicatore (previene prezzi troppo bassi)",
  },
  "rental.max_period_cap_days": {
    label: "Cap massimo (giorni)",
    description: "Oltre questo numero di giorni il moltiplicatore rimane costante",
    unit: "giorni",
  },
  "rental.hours_per_day": {
    label: "Ore per giornata",
    description: "Numero di ore in una giornata lavorativa (usato per calcolo tariffa oraria)",
    unit: "ore",
  },
  "rental.commercial_index": {
    label: "Indice commerciale",
    description: "Moltiplicatore globale applicato a tutti i prezzi (1.0 = nessun effetto)",
  },
  "rental.premium_multiplier": {
    label: "Moltiplicatore Premium",
    description: "Sovrapprice per prodotti contrassegnati come premium",
  },
  "rental.scarcity_enabled": {
    label: "Scarcity pricing",
    description: "Aumenta automaticamente il prezzo quando la disponibilità è bassa",
    isToggle: true,
  },
  "rental.scarcity_threshold": {
    label: "Soglia scarcity",
    description: "Percentuale di disponibilità sotto cui scatta il sovrapprezzo (es. 0.30 = 30%)",
  },
  "rental.scarcity_multiplier": {
    label: "Moltiplicatore scarcity",
    description: "Sovrapprezzo applicato in condizione di scarcity (es. 1.10 = +10%)",
  },
};

// ─── Curve preview helper ─────────────────────────────────────────────────────

function computeMultiplier(
  d: number,
  exp: number,
  decay: number,
  maxRef: number,
  offset: number,
  capDays: number
): number {
  if (d <= 0) return 0;
  if (d === 1) return 1.0;
  const effectiveD = Math.min(d, capDays);
  const decayFactor = 1 - (Math.log(effectiveD) / Math.log(maxRef)) * decay;
  return Math.pow(effectiveD, exp) * decayFactor + offset;
}

interface PreviewProps {
  values: Record<string, string>;
}

function FormulaPreview({ values }: PreviewProps) {
  const breakEven = parseFloat(values["rental.break_even_days"] || "40");
  const margin = parseFloat(values["rental.margin_percentage"] || "20");
  const exp = parseFloat(values["rental.exponent_curve"] || "0.69");
  const decay = parseFloat(values["rental.decay_strength"] || "0.27");
  const maxRef = parseFloat(values["rental.max_duration_reference"] || "30");
  const offset = parseFloat(values["rental.duration_offset"] || "0.15");
  const capDays = parseFloat(values["rental.max_period_cap_days"] || "90");
  const hoursPerDay = parseFloat(values["rental.hours_per_day"] || "8");
  const commercial = parseFloat(values["rental.commercial_index"] || "1.0");
  const premium = parseFloat(values["rental.premium_multiplier"] || "1.15");

  const sampleCost = 1000;
  const daily = (sampleCost / breakEven) * (1 + margin / 100) * commercial;
  const hourly = daily / hoursPerDay;
  const halfDay = daily * 0.7;
  const weekly = daily * computeMultiplier(7, exp, decay, maxRef, offset, capDays);
  const monthly = daily * computeMultiplier(30, exp, decay, maxRef, offset, capDays);
  const seasonal = daily * computeMultiplier(90, exp, decay, maxRef, offset, capDays);

  const fmt = (n: number) => `€\u00a0${formatCurrency(n)}`;

  return (
    <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Anteprima formula (costo acquisto: {fmt(sampleCost)})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {[
            { label: "Oraria", value: fmt(hourly) },
            { label: "Mezza giornata", value: fmt(halfDay) },
            { label: "Giornaliero", value: fmt(daily) },
            { label: "Settimanale", value: fmt(weekly) },
            { label: "Mensile", value: fmt(monthly) },
            { label: "Stagionale", value: fmt(seasonal) },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">{label}</div>
              <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">{value}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-blue-600 dark:text-blue-400 text-center">
          Formula giornaliero: {fmt(sampleCost)} / {breakEven}gg × (1 + {margin}%) × {commercial} = {fmt(daily)}
          {premium !== 1.0 && (
            <span className="ml-2">· Premium: {fmt(daily * premium)}/gg</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Section component ────────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  keys: readonly string[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

function SettingsSection({ title, description, icon, keys, values, onChange }: SectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {keys.map((key) => {
          const meta = META[key];
          if (!meta) return null;
          const value = values[key] ?? "";

          if (meta.isToggle) {
            return (
              <div key={key} className="flex items-center justify-between gap-4">
                <div>
                  <Label className="text-sm font-medium">{meta.label}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
                </div>
                <Switch
                  checked={value === "1" || value === "true"}
                  onCheckedChange={(checked) => onChange(key, checked ? "1" : "0")}
                />
              </div>
            );
          }

          return (
            <div key={key} className="grid grid-cols-2 gap-4 items-start">
              <div>
                <Label htmlFor={key} className="text-sm font-medium">
                  {meta.label}
                  {meta.unit && (
                    <Badge variant="outline" className="ml-2 text-xs font-normal">
                      {meta.unit}
                    </Badge>
                  )}
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
              </div>
              <Input
                id={key}
                type="number"
                step="0.01"
                value={value}
                onChange={(e) => onChange(key, e.target.value)}
                className="max-w-[160px]"
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RentalEngineSettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["settings", "rental"],
    queryFn: () => settingsApi.getByGroup("rental"),
  });

  // Initialise local state once settings loaded
  useEffect(() => {
    if (settings.length === 0) return;
    const map: Record<string, string> = {};
    settings.forEach((s: Setting) => {
      map[s.key] = s.value ?? "";
    });
    setValues(map);
    setDirty(false);
  }, [settings]);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const promises = ALL_KEYS.map((key) => {
        if (values[key] === undefined) return Promise.resolve();
        return settingsApi.updateByKey(key, values[key], { group: "rental" });
      });
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "rental"] });
      setDirty(false);
      toast.success("Impostazioni salvate", {
        description: "I prezzi di noleggio verranno ricalcolati automaticamente in background",
      });
    },
    onError: () => {
      toast.error("Errore nel salvataggio");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex gap-0 md:gap-6">
        <SettingsSidebar activeTab="rental-engine" onTabChange={() => {}} />
        <main className="flex-1 min-w-0 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/settings-index")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Motore di Noleggio
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Parametri della formula di calcolo automatico prezzi noleggio
          </p>
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={!dirty || saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salva
        </Button>
      </div>

      {/* Live preview */}
      <FormulaPreview values={values} />

      {/* Sections */}
      <SettingsSection
        title="Formula Breakeven"
        description="Questi due parametri determinano il prezzo giornaliero base: costo / giorni × (1 + margine%)"
        icon={<Calculator className="h-4 w-4 text-amber-600" />}
        keys={BREAKEVEN_KEYS}
        values={values}
        onChange={handleChange}
      />

      <SettingsSection
        title="Curva temporale (sconti per durata)"
        description="Parametri della curva power-decay che determina quanto diminuisce il prezzo per noleggi più lunghi"
        icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
        keys={CURVE_KEYS}
        values={values}
        onChange={handleChange}
      />

      <SettingsSection
        title="Tariffe e moltiplicatori"
        description="Parametri generali applicati a tutte le tariffe"
        icon={<Clock className="h-4 w-4 text-green-600" />}
        keys={GENERAL_KEYS}
        values={values}
        onChange={handleChange}
      />

      <SettingsSection
        title="Scarcity pricing"
        description="Aumento automatico del prezzo quando la disponibilità in magazzino è bassa"
        icon={<AlertTriangle className="h-4 w-4 text-orange-600" />}
        keys={SCARCITY_KEYS}
        values={values}
        onChange={handleChange}
      />

      <Separator />

      <div className="flex justify-end">
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={!dirty || saveMutation.isPending}
          size="lg"
        >
          {saveMutation.isPending ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salva impostazioni
        </Button>
      </div>
    </main>
    </div>
    </div>
  );
}

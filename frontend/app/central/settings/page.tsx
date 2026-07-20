"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { handleMutationError } from "@/lib/utils/handle-mutation-error";
import Link from "next/link";
import {
  Bell,
  CreditCard,
  DatabaseZap,
  Globe,
  KeyRound,
  Settings,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { landlordApi } from "@/lib/api/landlord";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionId = "general" | "log-maintenance" | "plans" | "payments" | "oauth-api" | "subscription-config";

interface SectionDef {
  id: SectionId;
  label: string;
  icon: React.ElementType;
  type: "implemented" | "placeholder" | "link";
  href?: string;
}

// ─── Sidebar definition ───────────────────────────────────────────────────────

const groups: Array<{ title: string; items: SectionDef[] }> = [
  {
    title: "Sistema",
    items: [
      { id: "general", label: "Generale", icon: Globe, type: "placeholder" },
      { id: "log-maintenance", label: "Log & Manutenzione", icon: DatabaseZap, type: "implemented" },
    ],
  },
  {
    title: "Abbonamenti",
    items: [
      { id: "plans", label: "Piani", icon: CreditCard, type: "link", href: "/central/plans" },
      { id: "subscription-config", label: "Configurazione", icon: Bell, type: "implemented" },
      { id: "payments", label: "Pagamenti", icon: Wallet, type: "placeholder" },
    ],
  },
  {
    title: "Integrazioni",
    items: [
      { id: "oauth-api", label: "OAuth & API", icon: KeyRound, type: "placeholder" },
    ],
  },
];

// ─── Placeholder card ─────────────────────────────────────────────────────────

function PlaceholderSection({ icon: Icon }: { icon: React.ElementType }) {
  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardContent className="py-16 text-center">
        <Icon className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
        <p className="text-slate-500 dark:text-slate-400 font-medium">Prossimamente</p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
          Questa sezione sarà disponibile nelle prossime versioni.
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Log & Manutenzione section ───────────────────────────────────────────────

const LOG_FIELDS: Array<{ key: string; label: string; description: string; defaultVal: string }> = [
  {
    key: "logs.system_error_retention_days",
    label: "Errori di sistema",
    description: "Giorni di conservazione per system_error_logs",
    defaultVal: "30",
  },
  {
    key: "logs.email_log_retention_days",
    label: "Log email",
    description: "Giorni di conservazione per email_logs (invii documenti)",
    defaultVal: "90",
  },
  {
    key: "logs.failed_jobs_retention_days",
    label: "Job falliti",
    description: "Giorni di conservazione per failed_jobs nella coda",
    defaultVal: "30",
  },
];

function LogMaintenanceSection() {
  const queryClient = useQueryClient();

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["landlord-settings"],
    queryFn: () => landlordApi.getSettings(),
  });

  // Local controlled state for each field
  const [localValues, setLocalValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(LOG_FIELDS.map((f) => [f.key, f.defaultVal]))
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync local state when data loads
  useEffect(() => {
    if (!settingsData?.data) return;
    setLocalValues((prev) => {
      const next = { ...prev };
      for (const field of LOG_FIELDS) {
        const remote = settingsData.data.find((s) => s.key === field.key)?.value;
        if (remote != null) next[field.key] = remote;
      }
      return next;
    });
  }, [settingsData]);

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      landlordApi.updateSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landlord-settings"] });
      toast.success("Impostazione salvata");
    },
    onError: (error) => handleMutationError(error, "Errore durante il salvataggio"),
  });

  const handleBlur = (key: string, defaultVal: string) => {
    const val = localValues[key].trim();

    // Validate: must be a positive integer
    if (val === "" || !/^\d+$/.test(val) || parseInt(val) < 1) {
      setErrors((e) => ({ ...e, [key]: "Inserisci un numero intero maggiore di 0" }));
      // Reset to last saved value
      const saved = settingsData?.data?.find((s) => s.key === key)?.value ?? defaultVal;
      setLocalValues((v) => ({ ...v, [key]: saved }));
      return;
    }

    setErrors((e) => ({ ...e, [key]: "" }));

    const saved = settingsData?.data?.find((s) => s.key === key)?.value ?? defaultVal;
    if (val !== saved) {
      updateMutation.mutate({ key, value: val });
    }
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardHeader>
        <CardTitle className="text-slate-900 dark:text-slate-100">
          Retention dei Log
        </CardTitle>
        <CardDescription className="text-slate-500 dark:text-slate-400">
          Definisce per quanti giorni vengono conservati i log prima della pulizia
          automatica (ogni notte alle 02:30).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                <div className="h-9 w-64 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          LOG_FIELDS.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label
                htmlFor={field.key}
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                {field.label}
              </Label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {field.description}
              </p>
              <div className="flex items-center gap-2 max-w-xs">
                <Input
                  id={field.key}
                  type="text"
                  inputMode="numeric"
                  value={localValues[field.key] ?? ""}
                  disabled={updateMutation.isPending}
                  onChange={(e) =>
                    setLocalValues((v) => ({ ...v, [field.key]: e.target.value }))
                  }
                  onBlur={() => handleBlur(field.key, field.defaultVal)}
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
                <span className="text-sm text-slate-500 dark:text-slate-400 shrink-0">giorni</span>
              </div>
              {errors[field.key] && (
                <p className="text-xs text-red-500 dark:text-red-400">{errors[field.key]}</p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// ─── Subscription Config section ─────────────────────────────────────────────

const SUBSCRIPTION_FIELDS: Array<{
  key: string;
  label: string;
  description: string;
  defaultVal: string;
  type: "number" | "text";
  suffix?: string;
}> = [
  {
    key: "subscription.grace_period_days",
    label: "Giorni di grazia dopo scadenza",
    description: "Numero di giorni concessi dopo la scadenza prima della sospensione",
    defaultVal: "7",
    type: "number",
    suffix: "giorni",
  },
  {
    key: "subscription.banner_days_before",
    label: "Mostra avviso N giorni prima",
    description: "Quanti giorni prima della scadenza mostrare il banner di rinnovo",
    defaultVal: "14",
    type: "number",
    suffix: "giorni",
  },
  {
    key: "subscription.reminder_days_monthly",
    label: "Reminder abbonamento mensile",
    description: "Giorni prima della scadenza in cui inviare reminder (separati da virgola)",
    defaultVal: "7,3,2,1",
    type: "text",
  },
  {
    key: "subscription.reminder_days_yearly",
    label: "Reminder abbonamento annuale",
    description: "Giorni prima della scadenza in cui inviare reminder (separati da virgola)",
    defaultVal: "30,14,7,3,1",
    type: "text",
  },
  {
    key: "subscription.reminder_days_trial",
    label: "Reminder periodo trial",
    description: "Giorni prima della scadenza del trial in cui inviare reminder (separati da virgola)",
    defaultVal: "3,1",
    type: "text",
  },
];

function SubscriptionConfigSection() {
  const queryClient = useQueryClient();

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["landlord-settings"],
    queryFn: () => landlordApi.getSettings(),
  });

  const [localValues, setLocalValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(SUBSCRIPTION_FIELDS.map((f) => [f.key, f.defaultVal]))
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!settingsData?.data) return;
    setLocalValues((prev) => {
      const next = { ...prev };
      for (const field of SUBSCRIPTION_FIELDS) {
        const remote = settingsData.data.find((s) => s.key === field.key)?.value;
        if (remote != null) next[field.key] = remote;
      }
      return next;
    });
  }, [settingsData]);

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      landlordApi.updateSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landlord-settings"] });
      toast.success("Impostazione salvata");
    },
    onError: (error) => handleMutationError(error, "Errore durante il salvataggio"),
  });

  const handleBlur = (key: string, field: (typeof SUBSCRIPTION_FIELDS)[number]) => {
    const val = localValues[key].trim();

    if (field.type === "number") {
      if (val === "" || !/^\d+$/.test(val) || parseInt(val) < 0) {
        setErrors((e) => ({ ...e, [key]: "Inserisci un numero intero non negativo" }));
        const saved = settingsData?.data?.find((s) => s.key === key)?.value ?? field.defaultVal;
        setLocalValues((v) => ({ ...v, [key]: saved }));
        return;
      }
    } else {
      // text: validate comma-separated integers
      const parts = val.split(",").map((p) => p.trim());
      const valid = parts.every((p) => /^\d+$/.test(p) && parseInt(p) > 0);
      if (!valid || val === "") {
        setErrors((e) => ({
          ...e,
          [key]: "Inserisci numeri interi positivi separati da virgola (es: 7,3,1)",
        }));
        const saved = settingsData?.data?.find((s) => s.key === key)?.value ?? field.defaultVal;
        setLocalValues((v) => ({ ...v, [key]: saved }));
        return;
      }
    }

    setErrors((e) => ({ ...e, [key]: "" }));

    const saved = settingsData?.data?.find((s) => s.key === key)?.value ?? field.defaultVal;
    if (val !== saved) {
      updateMutation.mutate({ key, value: val });
    }
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardHeader>
        <CardTitle className="text-slate-900 dark:text-slate-100">
          Configurazione Abbonamenti
        </CardTitle>
        <CardDescription className="text-slate-500 dark:text-slate-400">
          Parametri per la gestione dei rinnovi, grace period e notifiche di scadenza.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                <div className="h-9 w-64 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          SUBSCRIPTION_FIELDS.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label
                htmlFor={field.key}
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                {field.label}
              </Label>
              <p className="text-xs text-slate-500 dark:text-slate-400">{field.description}</p>
              <div className="flex items-center gap-2 max-w-xs">
                <Input
                  id={field.key}
                  type="text"
                  inputMode={field.type === "number" ? "numeric" : "text"}
                  value={localValues[field.key] ?? ""}
                  disabled={updateMutation.isPending}
                  onChange={(e) =>
                    setLocalValues((v) => ({ ...v, [field.key]: e.target.value }))
                  }
                  onBlur={() => handleBlur(field.key, field)}
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
                {field.suffix && (
                  <span className="text-sm text-slate-500 dark:text-slate-400 shrink-0">
                    {field.suffix}
                  </span>
                )}
              </div>
              {errors[field.key] && (
                <p className="text-xs text-red-500 dark:text-red-400">{errors[field.key]}</p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CentralSettingsPage() {
  const [activeSection, setActiveSection] = useState<SectionId>("log-maintenance");

  const activeDef =
    groups.flatMap((g) => g.items).find((i) => i.id === activeSection) ??
    groups[0].items[0];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-slate-600 dark:text-slate-400 flex-shrink-0" />
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Impostazioni Sistema
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Configurazione globale della piattaforma
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6 items-start">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 sticky top-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
          <nav className="p-2 space-y-4">
            {groups.map((group) => (
              <div key={group.title}>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-1">
                  {group.title}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;

                    if (item.type === "link" && item.href) {
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                            "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          )}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          {item.label}
                        </Link>
                      );
                    }

                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={cn(
                          "w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors text-left",
                          isActive
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        )}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeSection === "log-maintenance" && <LogMaintenanceSection />}
          {activeSection === "subscription-config" && <SubscriptionConfigSection />}
          {activeSection === "general" && <PlaceholderSection icon={activeDef.icon} />}
          {activeSection === "payments" && <PlaceholderSection icon={activeDef.icon} />}
          {activeSection === "oauth-api" && <PlaceholderSection icon={activeDef.icon} />}
        </div>
      </div>
    </div>
  );
}

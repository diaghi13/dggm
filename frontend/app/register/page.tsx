"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { authApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import {
  Check,
  Building2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const step1Schema = z
  .object({
    name: z.string().min(2, "Nome obbligatorio"),
    email: z.string().email("Email non valida"),
    password: z.string().min(8, "Minimo 8 caratteri"),
    password_confirmation: z.string(),
    company_name: z.string().min(2, "Nome azienda obbligatorio"),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: "Le password non coincidono",
    path: ["password_confirmation"],
  });

type Step1Data = z.infer<typeof step1Schema>;

// Feature key → Italian label
const featureLabels: Record<string, string> = {
  customers: "Clienti & Fornitori",
  suppliers: "Fornitori",
  quotes: "Preventivi",
  projects: "Cantieri & Progetti",
  warehouse: "Magazzino & DDT",
  workers: "Personale & Presenze",
  rental: "Noleggio & Listini",
  invoicing: "Fatturazione",
  reports: "Report",
  time_tracking: "Timbrature GPS",
};

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["public-plans"],
    queryFn: () => authApi.getPublicPlans(),
  });

  const form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
      company_name: "",
    },
  });

  const onStep1Submit = (data: Step1Data) => {
    setStep1Data(data);
    setStep(2);
  };

  const selectedPlanData = plans.find((p) => p.id === selectedPlanId);
  const hasYearlyOption = selectedPlanData?.price_yearly != null;

  const includedFeatures =
    selectedPlanData?.features?.filter(
      (f) => f.price === null || f.price === 0,
    ) ?? [];
  const optionalAddons =
    selectedPlanData?.features?.filter((f) => f.price && f.price > 0) ?? [];

  const calcSavings = (monthly: number | null | undefined, yearly: number | null | undefined): number | null => {
    if (!monthly || !yearly || monthly <= 0) { return null; }
    const pct = Math.round((1 - yearly / (monthly * 12)) * 100);
    return pct > 0 ? pct : null;
  };

  const getAddonPrice = (addon: { price: number | null; price_yearly: number | null }) => {
    if (billingCycle === "yearly" && addon.price_yearly != null) {
      return addon.price_yearly;
    }
    return addon.price ?? 0;
  };

  // Monthly base + addons (always monthly price)
  const basePriceMonthly = selectedPlanData?.price ?? 0;
  const addonsTotalMonthly = Array.from(selectedAddons).reduce((sum, key) => {
    const f = optionalAddons.find((a) => a.feature_key === key);
    return sum + (f?.price ?? 0);
  }, 0);

  // Yearly base + addons (yearly price if available, else monthly * 12)
  const basePriceYearly =
    selectedPlanData?.price_yearly != null
      ? selectedPlanData.price_yearly
      : (selectedPlanData?.price ?? 0) * 12;
  const addonsTotalYearly = Array.from(selectedAddons).reduce((sum, key) => {
    const f = optionalAddons.find((a) => a.feature_key === key);
    return sum + (f ? (f.price_yearly ?? (f.price ?? 0) * 12) : 0);
  }, 0);

  // Active billing display values (for backward-compat usage in addon list)
  const addonsTotal = Array.from(selectedAddons).reduce((sum, key) => {
    const f = optionalAddons.find((a) => a.feature_key === key);
    return sum + (f ? getAddonPrice(f) : 0);
  }, 0);

  const basePrice =
    billingCycle === "yearly" && selectedPlanData?.price_yearly != null
      ? selectedPlanData.price_yearly
      : (selectedPlanData?.price ?? 0);
  const runningTotal = basePrice + addonsTotal;
  const priceLabel = billingCycle === "yearly" ? "/anno" : "/mese";

  const toggleAddon = (featureKey: string) => {
    setSelectedAddons((prev) => {
      const next = new Set(prev);
      if (next.has(featureKey)) {
        next.delete(featureKey);
      } else {
        next.add(featureKey);
      }
      return next;
    });
  };

  // When selecting a new plan, reset addon selections and billing cycle
  const handlePlanSelect = (planId: number) => {
    setSelectedPlanId(planId);
    setSelectedAddons(new Set());
    setBillingCycle("monthly");
  };

  const handleRegister = async () => {
    if (!step1Data || !selectedPlanId) {
      toast.error("Seleziona un piano per continuare");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await authApi.register({
        ...step1Data,
        plan_id: selectedPlanId,
        billing_cycle: billingCycle,
        addons: Array.from(selectedAddons),
      });
      const { global_user, tenants, global_token } = response.data;

      if (global_user) {
        useAuthStore.setState({
          globalUser: global_user,
          globalToken: global_token ?? null,
          availableTenants: tenants ?? [],
        });
      }

      toast.success("Registrazione completata!");
      router.push("/pending-activation");
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { message?: string; errors?: { email?: string[] } } };
      };
      const msg =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.errors?.email?.[0] ||
        "Registrazione fallita";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-slate-900 dark:bg-slate-700 rounded flex items-center justify-center mb-4">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Crea il tuo account
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Inizia con 30 giorni di prova gratuita
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {([1, 2] as const).map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  step === s
                    ? "bg-blue-600 text-white"
                    : step > s
                      ? "bg-green-500 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400",
                )}
              >
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              <span
                className={cn(
                  "text-sm",
                  step === s
                    ? "text-slate-900 dark:text-slate-100 font-medium"
                    : "text-slate-500 dark:text-slate-400",
                )}
              >
                {s === 1 ? "Dati account" : "Scegli piano"}
              </span>
              {s < 2 && <ChevronRight className="w-4 h-4 text-slate-400" />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg">Informazioni account</CardTitle>
              <CardDescription>
                Inserisci i tuoi dati e il nome della tua azienda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={form.handleSubmit(onStep1Submit)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>Nome completo</Label>
                    <Input
                      {...form.register("name")}
                      placeholder="Mario Rossi"
                    />
                    {form.formState.errors.name && (
                      <p className="text-xs text-red-500">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Email aziendale</Label>
                    <Input
                      {...form.register("email")}
                      type="email"
                      placeholder="mario@azienda.it"
                    />
                    {form.formState.errors.email && (
                      <p className="text-xs text-red-500">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      {...form.register("password")}
                      type="password"
                      placeholder="••••••••"
                    />
                    {form.formState.errors.password && (
                      <p className="text-xs text-red-500">
                        {form.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Conferma password</Label>
                    <Input
                      {...form.register("password_confirmation")}
                      type="password"
                      placeholder="••••••••"
                    />
                    {form.formState.errors.password_confirmation && (
                      <p className="text-xs text-red-500">
                        {form.formState.errors.password_confirmation.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Nome azienda</Label>
                    <Input
                      {...form.register("company_name")}
                      placeholder="Rossi Costruzioni SRL"
                    />
                    {form.formState.errors.company_name && (
                      <p className="text-xs text-red-500">
                        {form.formState.errors.company_name.message}
                      </p>
                    )}
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  Continua <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
              <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
                Hai già un account?{" "}
                <Link
                  href="/login"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Accedi
                </Link>
              </p>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {/* Plan selection */}
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg">Scegli il tuo piano</CardTitle>
                <CardDescription>
                  Potrai cambiare piano in qualsiasi momento
                </CardDescription>
                {/* Billing cycle toggle — shown only if selected plan has yearly pricing */}
                {hasYearlyOption && (
                  <div className="flex items-center gap-0 justify-center mt-3">
                    <button
                      type="button"
                      onClick={() => setBillingCycle("monthly")}
                      className={cn(
                        "px-4 py-2 rounded-l-lg border text-sm font-medium transition-colors",
                        billingCycle === "monthly"
                          ? "bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100"
                          : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700",
                      )}
                    >
                      Mensile
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingCycle("yearly")}
                      className={cn(
                        "px-4 py-2 rounded-r-lg border-t border-b border-r text-sm font-medium transition-colors flex items-center gap-1.5",
                        billingCycle === "yearly"
                          ? "bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100"
                          : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700",
                      )}
                    >
                      Annuale
                      {selectedPlanData?.price_yearly != null && selectedPlanData?.price != null && selectedPlanData.price > 0 && (
                        <span className={cn(
                          "text-xs px-1.5 py-0.5 rounded-full font-semibold",
                          billingCycle === "yearly"
                            ? "bg-green-500 text-white"
                            : "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400",
                        )}>
                          -{Math.round((1 - selectedPlanData.price_yearly / (selectedPlanData.price * 12)) * 100)}%
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {plansLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {plans.map((plan) => {
                      const planIncluded = plan.features?.filter(
                        (f) => f.price === null || f.price === 0,
                      );
                      const planAddons = plan.features?.filter(
                        (f) => f.price && f.price > 0,
                      );
                      return (
                        <div
                          key={plan.id}
                          onClick={() => handlePlanSelect(plan.id)}
                          className={cn(
                            "border rounded-lg p-4 cursor-pointer transition-all",
                            selectedPlanId === plan.id
                              ? "border-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-500"
                              : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600",
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div
                                  className={cn(
                                    "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                                    selectedPlanId === plan.id
                                      ? "border-blue-600"
                                      : "border-slate-300 dark:border-slate-600",
                                  )}
                                >
                                  {selectedPlanId === plan.id && (
                                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                                  )}
                                </div>
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                                  {plan.name}
                                </h3>
                              </div>

                              {/* Included features */}
                              {planIncluded && planIncluded.length > 0 && (
                                <div className="mt-2 ml-6 flex flex-wrap gap-1.5">
                                  {planIncluded.map((f) => (
                                    <span
                                      key={f.feature_key}
                                      className="inline-flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full"
                                    >
                                      <Check className="w-3 h-3 text-green-500" />
                                      {featureLabels[f.feature_key] ??
                                        f.feature_key}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Optional addons indicator */}
                              {planAddons && planAddons.length > 0 && (
                                <div className="mt-1.5 ml-6 flex flex-wrap gap-1.5">
                                  {planAddons.map((f) => {
                                    const addonDisplayPrice = getAddonPrice(f);
                                    const addonSuffix = billingCycle === "yearly" && f.price_yearly != null ? "/anno" : "/mese";
                                    return (
                                      <span
                                        key={f.feature_key}
                                        className="inline-flex items-center gap-1 text-xs bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800"
                                      >
                                        <Plus className="w-2.5 h-2.5" />
                                        {featureLabels[f.feature_key] ??
                                          f.feature_key}{" "}
                                        €{addonDisplayPrice.toFixed(2)}{addonSuffix}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                            <div className="text-right ml-4 flex-shrink-0">
                              {billingCycle === "yearly" && plan.price_yearly != null ? (
                                <div className="flex flex-col items-end gap-0.5">
                                  <div className="flex items-center gap-1.5">
                                    {calcSavings(plan.price, plan.price_yearly) !== null && (
                                      <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400">
                                        -{calcSavings(plan.price, plan.price_yearly)}%
                                      </span>
                                    )}
                                    <span className="font-bold text-slate-900 dark:text-slate-100">
                                      €{plan.price_yearly.toFixed(2)}
                                      <span className="text-xs font-normal text-slate-500">
                                        /anno
                                      </span>
                                    </span>
                                  </div>
                                  {plan.price != null && plan.price > 0 && (
                                    <span className="text-xs text-slate-400 line-through">
                                      €{(plan.price * 12).toFixed(2)}/anno
                                    </span>
                                  )}
                                </div>
                              ) : plan.price ? (
                                <span className="font-bold text-slate-900 dark:text-slate-100">
                                  €{plan.price.toFixed(2)}
                                  <span className="text-xs font-normal text-slate-500">
                                    /mese
                                  </span>
                                </span>
                              ) : (
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                  Su richiesta
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Optional add-ons section — shown only when the selected plan has addons */}
            {selectedPlanId && optionalAddons.length > 0 && (
              <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Add-on opzionali</CardTitle>
                  <CardDescription>
                    Aggiungi funzionalità extra al tuo piano base
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {optionalAddons.map((addon) => {
                      const isSelected = selectedAddons.has(addon.feature_key);
                      return (
                        <div
                          key={addon.feature_key}
                          onClick={() => toggleAddon(addon.feature_key)}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                            isSelected
                              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 dark:border-indigo-500"
                              : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600",
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() =>
                                toggleAddon(addon.feature_key)
                              }
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {featureLabels[addon.feature_key] ??
                                addon.feature_key}
                            </span>
                          </div>
                          <div className="flex flex-col items-end gap-0.5">
                            {billingCycle === "yearly" && addon.price_yearly != null ? (
                              <>
                                <div className="flex items-center gap-1.5">
                                  {calcSavings(addon.price, addon.price_yearly) !== null && (
                                    <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400">
                                      -{calcSavings(addon.price, addon.price_yearly)}%
                                    </span>
                                  )}
                                  <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                    +€{addon.price_yearly.toFixed(2)}/anno
                                  </span>
                                </div>
                                {addon.price != null && addon.price > 0 && (
                                  <span className="text-xs text-slate-400 line-through">
                                    +€{(addon.price * 12).toFixed(2)}/anno
                                  </span>
                                )}
                              </>
                            ) : billingCycle === "yearly" ? (
                              <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                +€{((addon.price ?? 0) * 12).toFixed(2)}/anno
                              </span>
                            ) : (
                              <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                +€{(addon.price ?? 0).toFixed(2)}/mese
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Included features reminder */}
                  {includedFeatures.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                        Già incluse nel piano:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {includedFeatures.map((f) => (
                          <span
                            key={f.feature_key}
                            className="inline-flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full"
                          >
                            <Check className="w-3 h-3 text-green-500" />
                            {featureLabels[f.feature_key] ?? f.feature_key}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Running total */}
            {selectedPlanId && (
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 space-y-2">
                {/* Monthly line */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Mensile
                    {selectedAddons.size > 0 && (
                      <span className="ml-1 text-xs">
                        (€{basePriceMonthly.toFixed(2)} base + €{addonsTotalMonthly.toFixed(2)} add-on)
                      </span>
                    )}
                  </span>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {(basePriceMonthly + addonsTotalMonthly) > 0
                      ? `€${(basePriceMonthly + addonsTotalMonthly).toFixed(2)}/mese`
                      : "Gratuito"}
                  </span>
                </div>

                {/* Yearly line — only if selected plan has yearly pricing */}
                {selectedPlanData?.price_yearly != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      Annuale
                      {selectedAddons.size > 0 && (
                        <span className="ml-1 text-xs">
                          (€{basePriceYearly.toFixed(2)} base + €{addonsTotalYearly.toFixed(2)} add-on)
                        </span>
                      )}
                    </span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {(basePriceYearly + addonsTotalYearly) > 0
                        ? `€${(basePriceYearly + addonsTotalYearly).toFixed(2)}/anno`
                        : "Gratuito"}
                    </span>
                  </div>
                )}

                {/* Separator + active total */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Totale {billingCycle === "yearly" ? "annuale" : "mensile"}
                  </p>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {runningTotal > 0 ? (
                      <>
                        €{runningTotal.toFixed(2)}
                        <span className="text-xs font-normal text-slate-500">
                          {priceLabel}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-medium text-slate-500">
                        Su richiesta
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Indietro
              </Button>
              <Button
                onClick={handleRegister}
                disabled={!selectedPlanId || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Creazione...
                  </>
                ) : (
                  "Crea account"
                )}
              </Button>
            </div>

            <p className="text-center text-xs text-slate-500 dark:text-slate-400">
              L&apos;account sarà attivo dopo la ricezione del pagamento tramite
              bonifico bancario. Riceverai una email di conferma.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

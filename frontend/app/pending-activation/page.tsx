"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Clock, RefreshCw, LogOut, Building2, Mail, CreditCard, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import type { ApiResponse } from "@/lib/types";

const POLL_INTERVAL_SECONDS = 30;

interface TenantStatusResponse {
  subscription_status: string;
  tenant_id: string;
  tenant_name: string;
}

export default function PendingActivationPage() {
  const { availableTenants, setCurrentTenant, refreshUser, logout, currentTenant, settings } =
    useAuthStore();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  const [countdown, setCountdown] = useState(POLL_INTERVAL_SECONDS);
  const countdownRef = useRef(POLL_INTERVAL_SECONDS);
  const isMountedRef = useRef(true);

  // Use the first available tenant (or the currentTenant if any)
  const tenantId = currentTenant?.id ?? availableTenants[0]?.id ?? null;
  const tenantName = currentTenant?.name ?? availableTenants[0]?.name ?? null;

  // IBAN from company settings (Task 3)
  const iban = settings?.global?.["company.iban"] as string | undefined;

  const checkStatus = useCallback(async () => {
    if (!tenantId || !isMountedRef.current) return;

    setIsChecking(true);
    try {
      const response = await apiClient.get<ApiResponse<TenantStatusResponse>>(
        `/auth/tenant-status/${tenantId}`
      );
      const { subscription_status } = response.data.data;

      if (subscription_status === "active") {
        // Refresh user data so availableTenants is updated with the now-active tenant
        await refreshUser();
        // Read fresh state after refresh to find the active tenant
        const freshTenants = useAuthStore.getState().availableTenants;
        const activatedTenant =
          freshTenants.find(
            (t) =>
              t.id === tenantId &&
              (t.subscription_status === "active" || t.subscription_status === "trial")
          ) ?? freshTenants.find((t) => t.id === tenantId);
        if (activatedTenant) {
          setCurrentTenant(activatedTenant);
          toast.success("Abbonamento attivo! Accesso al sistema...");
          router.push("/dashboard");
        } else {
          toast.success("Abbonamento attivo! Effettua di nuovo il login.");
          router.push("/login");
        }
      } else if (subscription_status === "suspended") {
        toast.error("Account sospeso. Contatta il supporto.");
      } else {
        // Still pending — reset countdown
        if (isMountedRef.current) {
          countdownRef.current = POLL_INTERVAL_SECONDS;
          setCountdown(POLL_INTERVAL_SECONDS);
        }
      }
    } catch {
      toast.error("Impossibile verificare lo stato. Riprova tra qualche minuto.");
      if (isMountedRef.current) {
        countdownRef.current = POLL_INTERVAL_SECONDS;
        setCountdown(POLL_INTERVAL_SECONDS);
      }
    } finally {
      if (isMountedRef.current) {
        setIsChecking(false);
      }
    }
  }, [tenantId, availableTenants, currentTenant, setCurrentTenant, refreshUser, router]);

  // Auto-poll every POLL_INTERVAL_SECONDS seconds
  useEffect(() => {
    if (!tenantId) return;

    isMountedRef.current = true;
    countdownRef.current = POLL_INTERVAL_SECONDS;
    setCountdown(POLL_INTERVAL_SECONDS);

    // Tick the countdown every second
    const tickInterval = setInterval(() => {
      if (!isMountedRef.current) return;
      countdownRef.current -= 1;
      setCountdown(countdownRef.current);

      if (countdownRef.current <= 0) {
        countdownRef.current = POLL_INTERVAL_SECONDS;
        setCountdown(POLL_INTERVAL_SECONDS);
        checkStatus();
      }
    }, 1000);

    return () => {
      isMountedRef.current = false;
      clearInterval(tickInterval);
    };
  }, [tenantId, checkStatus]);

  const handleCheckNow = async () => {
    // Reset countdown, then check immediately
    countdownRef.current = POLL_INTERVAL_SECONDS;
    setCountdown(POLL_INTERVAL_SECONDS);
    await checkStatus();
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            DGGM ERP
          </span>
        </div>
        <ThemeToggle />
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg space-y-6">
          {/* Status card */}
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <CardTitle className="text-xl text-slate-900 dark:text-slate-100">
                Account in fase di attivazione
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                {tenantName ? (
                  <>
                    L&apos;account per <strong>{tenantName}</strong> è in attesa
                    di attivazione.
                  </>
                ) : (
                  "Il tuo account è in attesa di attivazione."
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Il sistema verrà attivato manualmente dal nostro team dopo la
                ricezione del pagamento. Di solito entro{" "}
                <strong>1-2 giorni lavorativi</strong>.
              </p>

              {!tenantId ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Nessun account da verificare. Contatta il supporto.
                </p>
              ) : (
                <>
                  {/* Countdown indicator */}
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {isChecking ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Verifica in corso...
                      </span>
                    ) : (
                      <>Prossimo controllo in {countdown} secondi</>
                    )}
                  </p>

                  <Button
                    onClick={handleCheckNow}
                    disabled={isChecking}
                    className="w-full"
                  >
                    {isChecking ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifica in corso...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Controlla ora
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment instructions */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-slate-500" />
                Istruzioni per il pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <p>
                Effettua un bonifico bancario con le seguenti informazioni:
              </p>
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-4 space-y-2 font-mono text-xs">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400 dark:text-slate-500 font-sans text-xs">
                    Beneficiario
                  </span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    DGGM SRL
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400 dark:text-slate-500 font-sans text-xs">
                    IBAN
                  </span>
                  <span className="font-medium text-slate-900 dark:text-slate-100 text-right">
                    {iban ?? "Contattaci per le coordinate bancarie"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400 dark:text-slate-500 font-sans text-xs">
                    Causale
                  </span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    DGGM ERP {tenantName ?? "Abbonamento"}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Dopo il pagamento, clicca &quot;Controlla ora&quot; o attendi la
                nostra email di conferma.
              </p>
            </CardContent>
          </Card>

          {/* Support */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Hai bisogno di aiuto?
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Contattaci a{" "}
                    <a
                      href="mailto:support@dggm.it"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      support@dggm.it
                    </a>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Esci dall&apos;account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

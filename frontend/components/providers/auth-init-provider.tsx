"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { LoadingScreen } from "@/components/loading-screen";

/**
 * Verifica il token una sola volta al mount dell'app.
 * Non gestisce redirect — ogni pagina/layout decide cosa fare.
 */
export function AuthInitProvider({ children }: { children: React.ReactNode }) {
  const { refreshUser, hasHydrated, setAuthChecked } = useAuthStore();
  const done = useRef(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!hasHydrated) return;
    if (done.current) return;
    done.current = true;

    // Se è un landlord admin puro (nessun tenant selezionato), salta refreshUser():
    // non esiste auth_token cookie (nessun tenant user), /auth/me restituirebbe 401.
    // L'autenticazione avviene tramite globalToken (Bearer) per le route /central.
    const { globalToken, globalUser, currentTenant, availableTenants } = useAuthStore.getState();
    if (globalToken && globalUser?.is_landlord_admin && !currentTenant) {
      setAuthChecked();
      setChecking(false);
      return;
    }

    // Skip refreshUser() if there is no currentTenant and no active/trial tenants.
    // This covers the pending-activation case where the auth_token cookie may not
    // exist yet (bootstrap still running) and there is no tenant context to use.
    // Without this guard, refreshUser() would get a 401 → clearAuth() → infinite loop.
    if (!currentTenant) {
      const hasActiveTenant = availableTenants.some(
        (t) => t.subscription_status === "active" || t.subscription_status === "trial"
      );
      if (!hasActiveTenant) {
        setAuthChecked();
        setChecking(false);
        return;
      }
    }

    // Verifica sempre con il backend: il vero stato auth è nel cookie httpOnly,
    // non nel localStorage. Se il token è scaduto/invalido (es. dopo DB reset)
    // refreshUser() chiama clearAuth() + logout per pulire il cookie httpOnly.
    refreshUser()
      .catch(() => { /* clearAuth() già chiamato dentro refreshUser() */ })
      .finally(() => {
        setAuthChecked(); // segnala a DashboardLayout che la verifica è completa
        setChecking(false);
      });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated]);

  if (checking) {
    return <LoadingScreen message="Caricamento..." />;
  }

  return <>{children}</>;
}

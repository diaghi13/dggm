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

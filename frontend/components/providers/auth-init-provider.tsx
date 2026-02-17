"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { LoadingScreen } from "@/components/loading-screen";

/**
 * Provider che inizializza lo stato auth al mount dell'app
 * Chiama refreshUser() per ottenere i dati aggiornati da auth/me
 */
export function AuthInitProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, refreshUser, hasHydrated } = useAuthStore();
  const hasInitialized = useRef(false);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    // Aspetta che Zustand abbia completato l'hydration dal localStorage
    if (!hasHydrated) {
      return;
    }

    // Evita chiamate duplicate
    if (hasInitialized.current) {
      return;
    }

    // Se l'utente è autenticato, aggiorna i dati da auth/me
    if (isAuthenticated) {
      hasInitialized.current = true;
      setIsInitializing(true);

      refreshUser()
        .catch(() => {
          // Se fallisce, clearAuth è già stato chiamato in refreshUser()
          // Il DashboardLayout vedrà isAuthenticated: false e reindirizzerà
        })
        .finally(() => {
          setIsInitializing(false);
        });
    }
  }, [isAuthenticated, refreshUser, hasHydrated]);

  // Mostra loading mentre verifica l'autenticazione
  if (isInitializing) {
    return <LoadingScreen message="Verifica autenticazione..." />;
  }

  return <>{children}</>;
}

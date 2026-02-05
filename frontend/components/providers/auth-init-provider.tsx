"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Provider che inizializza lo stato auth al mount dell'app
 * Chiama refreshUser() per ottenere i dati aggiornati da auth/me
 */
export function AuthInitProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, refreshUser, hasHydrated } = useAuthStore();
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Aspetta che Zustand abbia completato l'hydration dal localStorage
    if (!hasHydrated) {
      console.log("⏳ Waiting for auth store hydration...");
      return;
    }

    // Evita chiamate duplicate
    if (hasInitialized.current) {
      return;
    }

    // Se l'utente è autenticato, aggiorna i dati da auth/me
    if (isAuthenticated) {
      console.log("🔄 User is authenticated, refreshing data from auth/me...");
      hasInitialized.current = true;

      refreshUser().catch((error) => {
        console.error("❌ Failed to refresh user data:", error);
        // Se fallisce, l'utente verrà reindirizzato al login
      });
    } else {
      console.log("👤 User not authenticated, skipping refresh");
    }
  }, [isAuthenticated, refreshUser, hasHydrated]);

  return <>{children}</>;
}

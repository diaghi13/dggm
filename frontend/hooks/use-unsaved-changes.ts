"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

interface UseUnsavedChangesOptions {
  hasUnsavedChanges: boolean;
  message?: string;
  onNavigationAttempt?: () => boolean; // Return false to prevent navigation
}

/**
 * Hook per gestire le modifiche non salvate
 * Mostra un avviso quando l'utente tenta di lasciare la pagina con modifiche non salvate
 */
export function useUnsavedChanges({
  hasUnsavedChanges,
  message = "Hai modifiche non salvate. Vuoi davvero lasciare questa pagina? Le modifiche andranno perse.",
  onNavigationAttempt,
}: UseUnsavedChangesOptions) {
  const router = useRouter();
  const isNavigatingRef = useRef(false);

  // Previeni chiusura/refresh browser
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !isNavigatingRef.current) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges, message]);

  // Funzione per confermare navigazione
  const confirmNavigation = useCallback(() => {
    if (!hasUnsavedChanges) return true;

    // Chiama callback personalizzato se fornito
    if (onNavigationAttempt) {
      return onNavigationAttempt();
    }

    // Mostra conferma di default
    return window.confirm(message);
  }, [hasUnsavedChanges, message, onNavigationAttempt]);

  // Funzione per navigare con conferma
  const navigateWithConfirm = useCallback(
    (path: string) => {
      if (confirmNavigation()) {
        isNavigatingRef.current = true;
        router.push(path);
      }
    },
    [confirmNavigation, router],
  );

  return {
    confirmNavigation,
    navigateWithConfirm,
  };
}

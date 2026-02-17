"use client";

import { useEffect } from "react";
import { useThemeSettings } from "@/hooks/use-settings";

/**
 * Componente che applica le impostazioni UI dinamiche all'applicazione
 */
export function UISettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { primaryColor, secondaryColor } = useThemeSettings();

  useEffect(() => {
    // Rimuovi eventuali style tag esistenti
    const existingStyle = document.getElementById("dynamic-theme-colors");
    if (existingStyle) {
      existingStyle.remove();
    }

    if (!primaryColor) {
      return;
    }

    // Crea un nuovo style tag con !important per override
    const style = document.createElement("style");
    style.id = "dynamic-theme-colors";

    style.textContent = `
      :root {
        --primary: ${primaryColor} !important;
        --ring: ${primaryColor} !important;
        --chart-1: ${primaryColor} !important;
        --sidebar-primary: ${primaryColor} !important;
        --sidebar-ring: ${primaryColor} !important;
      }
      
      .dark {
        --primary: ${primaryColor} !important;
        --ring: ${primaryColor} !important;
        --chart-1: ${primaryColor} !important;
        --sidebar-primary: ${primaryColor} !important;
        --sidebar-ring: ${primaryColor} !important;
      }
    `;

    document.head.appendChild(style);
  }, [primaryColor, secondaryColor]);

  return <>{children}</>;
}

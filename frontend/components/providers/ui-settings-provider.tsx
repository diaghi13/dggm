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
    console.log(
      "🎨 UISettingsProvider - using theme.primary_color:",
      primaryColor,
    );
    console.log(
      "🎨 UISettingsProvider - using theme.secondary_color:",
      secondaryColor,
    );

    // Rimuovi eventuali style tag esistenti
    const existingStyle = document.getElementById("dynamic-theme-colors");
    if (existingStyle) {
      existingStyle.remove();
    }

    if (!primaryColor) {
      console.warn("⚠️ primaryColor is undefined, skipping color application");
      return;
    }

    // Crea un nuovo style tag con !important per override
    const style = document.createElement("style");
    style.id = "dynamic-theme-colors";

    console.log(
      "🎨 Applying HEX color directly (no conversion):",
      primaryColor,
    );

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
    console.log("✅ Dynamic theme colors applied with HEX!");
  }, [primaryColor, secondaryColor]);

  return <>{children}</>;
}

import { useAuthStore } from "@/stores/auth-store";

/**
 * Hook per ottenere una singola setting per chiave
 * Legge direttamente dallo store auth (dati già caricati da auth/me)
 * @param key - La chiave della setting (es. "app.name")
 * @param defaultValue - Valore di default se la setting non esiste
 */
export function useSetting<T = string>(
  key: string,
  defaultValue?: T,
): T | undefined {
  const settings = useAuthStore((state) => state.settings);

  if (!settings?.global) return defaultValue;

  const value = settings.global[key];
  if (value === undefined) return defaultValue;

  return value as T;
}

/**
 * Hook per ottenere tutte le global settings
 */
export function useSettings() {
  const settings = useAuthStore((state) => state.settings);
  return settings?.global || {};
}

/**
 * Hook per ottenere settings per gruppo
 * @param group - Il gruppo di settings (es. "company", "ui", "theme")
 */
export function useSettingsByGroup(group: string) {
  const settings = useAuthStore((state) => state.settings);

  if (!settings?.global) return {};

  // Filtra le settings che iniziano con il prefisso del gruppo
  const prefix = `${group}.`;
  const groupSettings: Record<string, string | number | boolean> = {};

  Object.entries(settings.global).forEach(([key, value]) => {
    if (key.startsWith(prefix)) {
      groupSettings[key] = value;
    }
  });

  return groupSettings;
}

/**
 * Hook per verificare se una feature flag è abilitata
 * Legge direttamente dallo store auth (dati già caricati da auth/me)
 * @param flag - Il nome della feature flag (es. "features.enable_semantic_search")
 */
export function useFeatureFlag(flag: string): boolean {
  const features = useAuthStore((state) => state.features);
  return features.includes(flag);
}

/**
 * Hook per ottenere tutte le feature flags abilitate
 */
export function useFeatureFlags(): string[] {
  return useAuthStore((state) => state.features);
}

/**
 * Hook per settings UI specifiche
 */
export function useUISettings() {
  const primaryColor = useSetting<string>("ui.primary_color", "#0e172b");
  const theme = useSetting<string>("ui.theme", "light");
  const itemsPerPage = useSetting<number>("ui.items_per_page", 15);
  const dateFormat = useSetting<string>("ui.date_format", "DD/MM/YYYY");

  return {
    primaryColor,
    theme,
    itemsPerPage,
    dateFormat,
  };
}

/**
 * Hook per settings tema
 */
export function useThemeSettings() {
  const primaryColor = useSetting<string>("theme.primary_color", "#0e172b");
  const secondaryColor = useSetting<string>("theme.secondary_color", "#f5f5f5");
  const logoUrl = useSetting<string>("theme.logo_url", "/images/logo.png");
  const faviconUrl = useSetting<string>("theme.favicon_url", "/favicon.ico");

  return {
    primaryColor,
    secondaryColor,
    logoUrl,
    faviconUrl,
  };
}

/**
 * Hook per ottenere settings app
 */
export function useAppSettings() {
  const name = useSetting<string>("app.name", "DGGM ERP");
  const locale = useSetting<string>("app.locale", "it");
  const timezone = useSetting<string>("app.timezone", "Europe/Rome");

  return {
    name,
    locale,
    timezone,
  };
}

/**
 * Hook per ottenere settings pricing e rental
 */
export function usePricingSettings() {
  const defaultMarkup = useSetting<number>(
    "pricing.default_markup_percent",
    30,
  );
  const dailyRatePercent = useSetting<number>("rental.daily_rate_percent", 15);
  const weeklyMultiplier = useSetting<number>(
    "rental.weekly_multiplier",
    2.6457513110645906,
  );
  const monthlyMultiplier = useSetting<number>(
    "rental.monthly_multiplier",
    5.477225575051661,
  );

  return {
    defaultMarkup,
    dailyRatePercent,
    weeklyMultiplier,
    monthlyMultiplier,
  };
}

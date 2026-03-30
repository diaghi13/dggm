import { apiClient } from "./client";

// Setting Types (aligned with backend)
export type SettingType =
  | "string"
  | "number"
  | "boolean"
  | "json"
  | "email"
  | "url"
  | "color"
  | "file"
  | "enum"
  | "date"
  | "datetime";

export interface Setting {
  id: number;
  key: string;
  value: string;
  type: SettingType;
  group: string;
  user_id: number | null;
  is_public: boolean;
  description: string | null;
  validation_rules: string[] | null;
  allowed_values: string[] | null;
  min_value: number | null;
  max_value: number | null;
  default_value: string | null;
  order: number;
  is_feature_flag: boolean;
  created_at: string;
  updated_at: string;
}

export interface SettingTypeInfo {
  value: SettingType;
  label: string;
  validation: string[];
}

export interface SettingGroup {
  group: string;
  count: number;
  settings: Setting[];
}

export interface SettingFilters {
  group?: string;
  user_id?: number | null;
  is_public?: boolean;
  search?: string;
}

export interface CreateSettingData {
  key: string;
  value: string;
  type: SettingType;
  group: string;
  user_id?: number | null;
  is_public?: boolean;
  description?: string | null;
  validation_rules?: string[] | null;
  allowed_values?: string[] | null;
  min_value?: number | null;
  max_value?: number | null;
  default_value?: string | null;
  order?: number;
  is_feature_flag?: boolean;
}

export interface CompanySetting {
  "company.name": string;
  "company.vat": string;
  "company.fiscal_code": string;
  "company.address": string;
  "company.city": string;
  "company.province": string;
  "company.postal_code": string;
  "company.country": string;
  "company.phone": string;
  "company.email": string;
  "company.website": string;
  "company.logo"?: string;
  "company.stamp"?: string;
  "company.sigla"?: string;
  "company.quote_template"?: string;
}

// General System Settings API
export const settingsApi = {
  // Get all settings with filters
  getAll: async (filters?: SettingFilters) => {
    const params = new URLSearchParams();
    if (filters?.group) params.append("group", filters.group);
    if (filters?.user_id !== undefined) {
      params.append(
        "user_id",
        filters.user_id === null ? "null" : String(filters.user_id),
      );
    }
    if (filters?.is_public !== undefined)
      params.append("is_public", String(filters.is_public));
    if (filters?.search) params.append("search", filters.search);

    const query = params.toString();
    const response = await apiClient.get(
      `/settings${query ? `?${query}` : ""}`,
    );
    return response.data.data as Setting[];
  },

  // Get settings grouped by category
  getGrouped: async (userId?: number | null) => {
    const params = new URLSearchParams();
    if (userId !== undefined) {
      params.append("user_id", userId === null ? "null" : String(userId));
    }

    const query = params.toString();
    const response = await apiClient.get(
      `/settings/grouped${query ? `?${query}` : ""}`,
    );
    return response.data.data as SettingGroup[];
  },

  // Get settings by group
  getByGroup: async (group: string) => {
    const response = await apiClient.get(`/settings?group=${group}`);
    return response.data.data as Setting[];
  },

  // Get single setting by key
  getByKey: async (key: string, userId?: number | null) => {
    const params = new URLSearchParams();
    if (userId !== undefined) {
      params.append("user_id", userId === null ? "null" : String(userId));
    }

    const query = params.toString();
    const response = await apiClient.get(
      `/settings/key/${key}${query ? `?${query}` : ""}`,
    );
    return response.data.data as { key: string; value: string };
  },

  // Get single setting by ID
  get: async (id: number) => {
    const response = await apiClient.get(`/settings/${id}`);
    return response.data.data as Setting;
  },

  // Create new setting
  create: async (data: CreateSettingData) => {
    const response = await apiClient.post("/settings", data);
    return response.data.data as Setting;
  },

  // Update setting by ID
  update: async (id: number, data: Partial<CreateSettingData>) => {
    const response = await apiClient.put(`/settings/${id}`, data);
    return response.data.data as Setting;
  },

  // Update setting by key (simplified)
  updateByKey: async (
    key: string,
    value: string,
    options?: { user_id?: number | null; group?: string; is_public?: boolean },
  ) => {
    const response = await apiClient.post(`/settings/key/${key}`, {
      value,
      ...options,
    });
    return response.data.data as Setting;
  },

  // Delete setting
  delete: async (id: number) => {
    const response = await apiClient.delete(`/settings/${id}`);
    return response.data;
  },

  // Reset to default value
  reset: async (id: number) => {
    const response = await apiClient.post(`/settings/${id}/reset`);
    return response.data.data as Setting;
  },

  // Get available setting types
  getTypes: async () => {
    const response = await apiClient.get("/settings/types");
    return response.data.data as SettingTypeInfo[];
  },

  // Bulk update settings in a single request
  bulkUpdate: async (settings: Array<{ key: string; value: string }>) => {
    const response = await apiClient.post("/settings/batch", { settings });
    return response.data;
  },
};

// Company Settings API - Uses standard settings with "company" group
export const companySettingsApi = {
  get: async () => {
    const settings = await settingsApi.getByGroup("company");
    // Convert array of settings to object with key-value pairs
    const companyData: Record<string, string> = {};
    settings.forEach((setting) => {
      companyData[setting.key] = setting.value;
    });
    return companyData as unknown as CompanySetting;
  },

  update: async (data: Partial<CompanySetting>) => {
    // Bulk update all company settings
    const updates = Object.entries(data).map(([key, value]) => ({
      key,
      value: String(value),
    }));
    await settingsApi.bulkUpdate(updates);
    return data;
  },
};

// Feature Flags API
export const featureFlagsApi = {
  // Get all feature flags
  getAll: async () => {
    const response = await apiClient.get("/settings/feature-flags");
    return response.data.data as Setting[];
  },

  // Get only enabled feature flags
  getEnabled: async () => {
    const response = await apiClient.get("/settings/feature-flags/enabled");
    return response.data.data as string[];
  },

  // Toggle feature flag (enable/disable)
  toggle: async (feature: string, enabled: boolean) => {
    const response = await apiClient.post(
      `/settings/feature-flags/${feature}/toggle`,
      { enabled },
    );
    return response.data.data as Setting;
  },

  // Check if a feature flag is enabled
  isEnabled: async (key: string): Promise<boolean> => {
    try {
      const enabled = await featureFlagsApi.getEnabled();
      return enabled.includes(key);
    } catch {
      return false;
    }
  },
};

// Predefined setting groups for UI organization (aligned with backend)
export const SETTING_GROUPS = {
  GENERAL: {
    key: "general",
    label: "Generali",
    description: "Impostazioni generali del sistema",
    icon: "Settings",
  },
  COMPANY: {
    key: "company",
    label: "Azienda",
    description: "Informazioni e dati aziendali",
    icon: "Building2",
  },
  THEME: {
    key: "theme",
    label: "Tema",
    description: "Personalizzazione colori, logo e favicon",
    icon: "Palette",
  },
  UI: {
    key: "ui",
    label: "Interfaccia",
    description: "Aspetto e comportamento dell'interfaccia utente",
    icon: "Layout",
  },
  WAREHOUSE: {
    key: "warehouse",
    label: "Magazzino",
    description: "Gestione inventario e movimenti",
    icon: "Package",
  },
  EMAIL: {
    key: "email",
    label: "Email",
    description: "Configurazione server email e notifiche",
    icon: "Mail",
  },
  NOTIFICATIONS: {
    key: "notifications",
    label: "Notifiche",
    description: "Impostazioni notifiche e avvisi",
    icon: "Bell",
  },
  FILES: {
    key: "files",
    label: "File",
    description: "Gestione file e caricamenti",
    icon: "FileText",
  },
  PRICING: {
    key: "pricing",
    label: "Prezzi & Noleggio",
    description: "Configurazione prezzi prodotti e tariffe noleggio",
    icon: "DollarSign",
  },
  QUOTES: {
    key: "quotes",
    label: "Preventivi",
    description: "Template, impostazioni predefinite e opzioni di esportazione",
    icon: "Receipt",
  },
  FEATURES: {
    key: "features",
    label: "Funzionalità",
    description: "Abilitazione e configurazione feature flags",
    icon: "Flag",
  },
} as const;

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, UserSettings, TenantInfo, GlobalUser } from "@/lib/types";
import { authApi } from "@/lib/api/auth";

interface AuthState {
  user: User | null;
  settings: UserSettings | null;
  features: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;
  isAuthChecked: boolean; // true dopo che AuthInitProvider ha completato la verifica del token

  // Multi-tenant state
  globalUser: GlobalUser | null;
  globalToken: string | null;
  currentTenant: TenantInfo | null;
  availableTenants: TenantInfo[];

  setAuth: (user: User, settings?: UserSettings, features?: string[]) => void;
  clearAuth: () => void;
  login: (email: string, password: string) => Promise<{ tenants: TenantInfo[]; hasTenants: boolean }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setHasHydrated: (hydrated: boolean) => void;
  setAuthChecked: () => void;

  // Multi-tenant actions
  setGlobalAuth: (globalUser: GlobalUser, tenants: TenantInfo[]) => void;
  setGlobalToken: (token: string | null) => void;
  setCurrentTenant: (tenant: TenantInfo) => void;
  switchTenant: (tenant: TenantInfo) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      settings: null,
      features: [],
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,
      isAuthChecked: false,

      // Multi-tenant state
      globalUser: null,
      globalToken: null,
      currentTenant: null,
      availableTenants: [],

      setAuth: (user, settings, features) => {
        set({
          user,
          settings: settings || null,
          features: features || [],
          isAuthenticated: true,
        });
      },

      clearAuth: () => {
        set({
          user: null,
          settings: null,
          features: [],
          isAuthenticated: false,
          globalUser: null,
          globalToken: null,
          currentTenant: null,
          availableTenants: [],
        });
      },

      setHasHydrated: (hydrated) => {
        set({ hasHydrated: hydrated });
      },

      setAuthChecked: () => {
        set({ isAuthChecked: true });
      },

      setGlobalAuth: (globalUser, tenants) => {
        set({
          globalUser,
          availableTenants: tenants,
          isAuthenticated: true,
        });
      },

      setGlobalToken: (token) => {
        set({ globalToken: token });
      },

      setCurrentTenant: (tenant) => {
        set({ currentTenant: tenant });
      },

      switchTenant: (tenant) => {
        // Clear user data so refreshUser() will load the new tenant's user
        set({
          currentTenant: tenant,
          user: null,
          settings: null,
          features: [],
        });
        // After switch, refreshUser will pick up the new x-tenant header from the store
        get().refreshUser().catch(console.error);
      },

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login({ email, password });
          const { user, settings, features, tenants, global_user, global_token } = response.data;

          // Always set the tenant user data (httpOnly cookie auth)
          if (user) {
            get().setAuth(user, settings as any, features as any);
          }

          // If GlobalUser data is returned, store it too (multi-tenant identity).
          // Store ALL tenants (including pending/suspended) so the pending-activation
          // page can read the tenant ID to poll. The tenant-switcher UI filters to
          // active/trial tenants independently.
          if (global_user) {
            set({
              globalUser: global_user,
              globalToken: global_token ?? null,
              availableTenants: tenants ?? [],
            });
          }

          return {
            tenants: tenants ?? [],
            hasTenants: (tenants?.length ?? 0) > 0,
          };
        } catch (error) {
          get().clearAuth();
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          // Backend will clear the httpOnly cookie
          await authApi.logout();
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          get().clearAuth();
        }
      },

      refreshUser: async () => {
        try {
          const authData = await authApi.me();
          set({
            user: authData.user,
            settings: authData.settings,
            features: authData.features,
            isAuthenticated: true,
          });
          // If /me returns tenant list and global user, update them
          if (authData.global_user) {
            set({ globalUser: authData.global_user });
          }
          if (authData.tenants) {
            // Store ALL tenants (including pending/suspended) so the pending-activation
            // page can read the tenant ID. The tenant-switcher UI filters independently.
            set({ availableTenants: authData.tenants });
          }
        } catch (error: any) {
          console.error("Failed to refresh user:", error);
          get().clearAuth();
          // Se il token è invalido (401), chiama logout per cancellare il cookie httpOnly.
          // /auth/logout è ora una route pubblica che cancella sempre il cookie.
          if (error?.response?.status === 401) {
            try { await authApi.logout(); } catch { /* ignora */ }
          }
          throw error;
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        // Only persist user data, settings and features (token is in httpOnly cookie)
        user: state.user,
        settings: state.settings,
        features: state.features,
        isAuthenticated: state.isAuthenticated,
        // Persist tenant info so page refreshes keep the selected tenant
        globalUser: state.globalUser,
        globalToken: state.globalToken,
        currentTenant: state.currentTenant,
        availableTenants: state.availableTenants,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

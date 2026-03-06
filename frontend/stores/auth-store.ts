import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, UserSettings } from "@/lib/types";
import { authApi } from "@/lib/api/auth";

interface AuthState {
  user: User | null;
  settings: UserSettings | null;
  features: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;
  isAuthChecked: boolean; // true dopo che AuthInitProvider ha completato la verifica del token

  setAuth: (user: User, settings?: UserSettings, features?: string[]) => void;
  clearAuth: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setHasHydrated: (hydrated: boolean) => void;
  setAuthChecked: () => void;
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
        });
      },

      setHasHydrated: (hydrated) => {
        set({ hasHydrated: hydrated });
      },

      setAuthChecked: () => {
        set({ isAuthChecked: true });
      },

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login({ email, password });
          // Token is now in httpOnly cookie, we only store user data
          get().setAuth(response.data.user);
          // After login, fetch full user data with settings and features
          await get().refreshUser();
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
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

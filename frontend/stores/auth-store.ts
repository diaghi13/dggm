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

  setAuth: (user: User, settings?: UserSettings, features?: string[]) => void;
  clearAuth: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setHasHydrated: (hydrated: boolean) => void;
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
          console.log("🔍 auth/me response:", authData);
          console.log("🔍 settings received:", authData.settings);
          console.log("🔍 settings.global:", authData.settings?.global);
          set({
            user: authData.user,
            settings: authData.settings,
            features: authData.features,
            isAuthenticated: true,
          });
        } catch (error) {
          console.error("Failed to refresh user:", error);
          get().clearAuth();
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

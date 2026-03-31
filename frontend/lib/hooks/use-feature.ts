import { useAuthStore } from "@/stores/auth-store";

/**
 * Hook to check if a feature is available for the current tenant/user.
 *
 * The backend already blocks access with 403 if a feature isn't in the plan,
 * so this hook is primarily for hiding UI elements that aren't relevant.
 *
 * Currently returns `true` for all authenticated users (placeholder).
 * In the future this can be enriched with feature flags from the subscription plan.
 *
 * @param _featureKey - The feature key to check (e.g. "warehouse", "rental", "workers")
 * @returns `true` if the feature should be shown, `false` if it should be hidden
 */
export function useFeature(_featureKey: string): boolean {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Phase 1: always show features when authenticated.
  // The backend enforces the plan limits with 403/402 responses.
  // Once the backend exposes plan features in the auth response,
  // read them from `currentTenant.subscription.plan.features` here.
  return isAuthenticated;
}

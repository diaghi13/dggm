/**
 * Shared singleton holding the current tenant ID in memory.
 * Avoids the async localStorage write timing issue with Zustand persist.
 * Both auth-store and apiClient can import this without circular dependencies.
 */
let _currentTenantId: string | null = null;

export const tenantContext = {
  get: (): string | null => _currentTenantId,
  set: (id: string | null): void => {
    _currentTenantId = id;
  },
};

import { useState, useCallback } from 'react';

/**
 * Hook per gestire stati di loading con callback
 *
 * @example
 * const { isLoading, error, execute } = useLoading();
 *
 * const handleSubmit = async () => {
 *   await execute(async () => {
 *     await api.createUser(data);
 *   });
 * };
 */
export function useLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async <T,>(callback: () => Promise<T>): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await callback();
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    execute,
    reset,
  };
}

/**
 * Hook per gestire multipli stati di loading
 *
 * @example
 * const { setLoading, isLoading } = useMultiLoading();
 *
 * const loadUsers = async () => {
 *   setLoading('users', true);
 *   await api.getUsers();
 *   setLoading('users', false);
 * };
 *
 * // Check specific loading
 * if (isLoading('users')) { ... }
 *
 * // Check any loading
 * if (isLoading()) { ... }
 */
export function useMultiLoading() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = useCallback((key: string, value: boolean) => {
    setLoadingStates((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const isLoading = useCallback((key?: string): boolean => {
    if (key) {
      return loadingStates[key] ?? false;
    }
    return Object.values(loadingStates).some((loading) => loading);
  }, [loadingStates]);

  const reset = useCallback(() => {
    setLoadingStates({});
  }, []);

  return {
    setLoading,
    isLoading,
    reset,
    loadingStates,
  };
}


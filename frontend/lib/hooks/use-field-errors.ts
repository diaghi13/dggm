import { useCallback } from "react";

function extractErrors(error: unknown): Record<string, string[]> | undefined {
  const err = error as { response?: { data?: { errors?: Record<string, string[]> } } } | null;
  return err?.response?.data?.errors ?? undefined;
}

/**
 * Returns a getter function (field) => string | undefined.
 *
 * Usage with API mutation errors:
 *   const fieldError = useFieldErrors(mutation.error);
 *   <Input error={fieldError("title")} />
 *
 * Usage with react-hook-form:
 *   const fieldError = (field: string) => (errors[field] as { message?: string } | undefined)?.message;
 *   <Input error={fieldError("title")} />
 */
export function useFieldErrors(error: unknown): (field: string) => string | undefined {
  const errors = extractErrors(error);
  return useCallback(
    (field: string) => errors?.[field]?.[0],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(errors)]
  );
}

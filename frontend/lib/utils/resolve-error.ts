export type ErrorProp = string | { message?: string } | undefined;

export function resolveError(error: ErrorProp): string | undefined {
  if (!error) return undefined;
  if (typeof error === "string") return error || undefined;
  return error.message || undefined;
}

import { toast } from "sonner";

export function handleMutationError(error: unknown, fallback = "Si è verificato un errore"): void {
  const err = error as { _handled?: boolean; response?: { data?: { message?: string } } };
  if (err?._handled) return;
  const message = err?.response?.data?.message ?? fallback;
  toast.error("Errore", { description: message });
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { settingsApi } from "@/lib/api/settings";
import { companySettingsApi } from "@/lib/api/settings";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function StepComplete() {
  const router = useRouter();
  const { refreshUser } = useAuthStore();
  const [completing, setCompleting] = useState(false);
  const [done, setDone] = useState(false);

  const { data: company } = useQuery({
    queryKey: ["company-settings"],
    queryFn: companySettingsApi.get,
  });

  useEffect(() => {
    let cancelled = false;

    const complete = async () => {
      setCompleting(true);
      try {
        await settingsApi.updateByKey("app.setup_completed", "true");
        await refreshUser();
        if (!cancelled) setDone(true);
      } catch {
        if (!cancelled) toast.error("Errore nel completamento della configurazione");
      } finally {
        if (!cancelled) setCompleting(false);
      }
    };

    complete();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summaryItems = [
    { label: "Azienda", value: company?.["company.name"] },
    { label: "P.IVA", value: company?.["company.vat"] },
    { label: "Città", value: company?.["company.city"] },
    { label: "Email", value: company?.["company.email"] },
    { label: "Telefono", value: company?.["company.phone"] },
    { label: "Sito web", value: company?.["company.website"] },
  ].filter((item) => item.value);

  return (
    <div className="text-center">
      <div className="flex justify-center mb-4">
        {completing ? (
          <Loader2 className="w-16 h-16 text-slate-400 animate-spin" />
        ) : (
          <CheckCircle2
            className={`w-16 h-16 text-green-500 transition-all duration-500 ${
              done ? "scale-100 opacity-100" : "scale-75 opacity-0"
            }`}
            style={{
              animation: done ? "bounce 1s ease-in-out" : undefined,
            }}
          />
        )}
      </div>

      {done && (
        <>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Configurazione completata!
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Il tuo sistema è pronto. Puoi sempre modificare queste impostazioni
            dalla sezione Impostazioni.
          </p>

          {summaryItems.length > 0 && (
            <div className="text-left rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  Riepilogo
                </p>
              </div>
              <dl className="divide-y divide-slate-100 dark:divide-slate-800">
                {summaryItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 px-4 py-2.5"
                  >
                    <dt className="text-xs text-slate-500 dark:text-slate-400 w-24 shrink-0">
                      {item.label}
                    </dt>
                    <dd className="text-sm text-slate-900 dark:text-slate-100 font-medium truncate">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <Button
            size="lg"
            onClick={() => router.push("/dashboard")}
            className="w-full sm:w-auto"
          >
            Vai alla Dashboard
          </Button>
        </>
      )}
    </div>
  );
}

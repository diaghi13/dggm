"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { CheckCircle2, GitBranch, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { quotesApi } from "@/lib/api/quotes";
import { CurrencyDisplay } from "@/components/ui/currency-input";

const statusColors: Record<string, string> = {
  draft:
    "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700",
  sent: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700",
  approved:
    "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700",
  rejected:
    "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700",
  expired:
    "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700",
  converted:
    "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700",
};

const statusLabels: Record<string, string> = {
  draft: "Bozza",
  sent: "Inviato",
  approved: "Approvato",
  rejected: "Rifiutato",
  expired: "Scaduto",
  converted: "Convertito",
};

interface RevisionHistoryTabProps {
  quoteId: number;
}

export function RevisionHistoryTab({ quoteId }: RevisionHistoryTabProps) {
  const router = useRouter();

  const { data: revisions, isLoading } = useQuery({
    queryKey: ["quote-revisions", quoteId],
    queryFn: () => quotesApi.getRevisions(quoteId),
    enabled: !!quoteId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!revisions || revisions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400">
        <GitBranch className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm">Nessuna revisione disponibile</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical timeline line */}
      <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-700" />

      <div className="space-y-1">
        {revisions.map((revision) => {
          const isCurrent = revision.is_current_version;
          const isClickable = revision.id !== quoteId;

          return (
            <div
              key={revision.id}
              className={`relative pl-10 pr-4 py-4 rounded-lg transition-colors ${
                isCurrent
                  ? "bg-primary/5 border border-primary/20"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent"
              } ${isClickable ? "cursor-pointer" : "cursor-default"}`}
              onClick={() => {
                if (isClickable) {
                  router.push(`/quotes/${revision.id}`);
                }
              }}
            >
              {/* Timeline dot */}
              <div
                className={`absolute left-2.5 top-5 w-3 h-3 rounded-full border-2 ${
                  isCurrent
                    ? "bg-primary border-primary"
                    : "bg-white dark:bg-slate-900 border-slate-400 dark:border-slate-500"
                }`}
              />

              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                      Rev {revision.version}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {revision.code}
                    </span>
                    <Badge
                      className={`text-xs border font-normal ${statusColors[revision.status] ?? ""}`}
                    >
                      {statusLabels[revision.status] ?? revision.status}
                    </Badge>
                    {isCurrent && (
                      <span className="flex items-center gap-1 text-xs text-primary font-medium">
                        <CheckCircle2 className="h-3 w-3" />
                        Corrente
                      </span>
                    )}
                  </div>

                  {revision.issue_date && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(revision.issue_date).toLocaleDateString(
                        "it-IT",
                      )}
                    </p>
                  )}

                  {revision.revision_notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                      {revision.revision_notes}
                    </p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    <CurrencyDisplay value={revision.total_amount} />
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

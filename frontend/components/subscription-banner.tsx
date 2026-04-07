"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { X, AlertTriangle, AlertCircle, Clock } from "lucide-react";
import { useState } from "react";
import { tenantSubscriptionApi, type SubscriptionStatusData } from "@/lib/api/subscription";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

type BannerVariant = "warning" | "critical" | "expired" | "trial_warning" | "trial_expired";

interface BannerConfig {
  variant: BannerVariant;
  message: string;
  ctaLabel: string;
  ctaHref: string;
}

function resolveBannerConfig(data: SubscriptionStatusData): BannerConfig | null {
  if (!data.show_renewal_warning) return null;

  const days = data.days_remaining ?? 0;

  if (data.status === "trial") {
    if (days <= 0) {
      return {
        variant: "trial_expired",
        message: "Il tuo periodo di prova è scaduto.",
        ctaLabel: "Contattaci",
        ctaHref: "/dashboard/subscription",
      };
    }
    return {
      variant: "trial_warning",
      message: `Il tuo periodo di prova scade tra ${days} ${days === 1 ? "giorno" : "giorni"}.`,
      ctaLabel: "Attiva abbonamento",
      ctaHref: "/dashboard/subscription",
    };
  }

  if (data.status === "expired") {
    return {
      variant: "expired",
      message: "Il tuo abbonamento è scaduto.",
      ctaLabel: "Rinnova ora",
      ctaHref: "/dashboard/subscription",
    };
  }

  // Active subscription — show renewal warning
  if (days <= 1) {
    return {
      variant: "critical",
      message: `Il tuo abbonamento scade ${days <= 0 ? "oggi" : "domani"}!`,
      ctaLabel: "Rinnova ora",
      ctaHref: "/dashboard/subscription",
    };
  }

  return {
    variant: "warning",
    message: `Il tuo abbonamento scade tra ${days} ${days === 1 ? "giorno" : "giorni"}.`,
    ctaLabel: "Rinnova ora",
    ctaHref: "/dashboard/subscription",
  };
}

const variantStyles: Record<
  BannerVariant,
  { wrapper: string; icon: string; cta: string; dismiss: string }
> = {
  warning: {
    wrapper:
      "bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100",
    icon: "text-yellow-600 dark:text-yellow-400",
    cta: "bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white",
    dismiss: "text-yellow-700 hover:text-yellow-900 dark:text-yellow-300 dark:hover:text-yellow-100",
  },
  critical: {
    wrapper:
      "bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-100",
    icon: "text-orange-600 dark:text-orange-400",
    cta: "bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white",
    dismiss: "text-orange-700 hover:text-orange-900 dark:text-orange-300 dark:hover:text-orange-100",
  },
  expired: {
    wrapper:
      "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100",
    icon: "text-red-600 dark:text-red-400",
    cta: "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white",
    dismiss: "text-red-700 hover:text-red-900 dark:text-red-300 dark:hover:text-red-100",
  },
  trial_warning: {
    wrapper:
      "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100",
    icon: "text-blue-600 dark:text-blue-400",
    cta: "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white",
    dismiss: "text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100",
  },
  trial_expired: {
    wrapper:
      "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100",
    icon: "text-red-600 dark:text-red-400",
    cta: "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white",
    dismiss: "text-red-700 hover:text-red-900 dark:text-red-300 dark:hover:text-red-100",
  },
};

function BannerIcon({ variant, className }: { variant: BannerVariant; className?: string }) {
  if (variant === "warning" || variant === "trial_warning") {
    return <AlertTriangle className={cn("h-4 w-4 shrink-0", className)} />;
  }
  if (variant === "expired" || variant === "trial_expired") {
    return <AlertCircle className={cn("h-4 w-4 shrink-0", className)} />;
  }
  return <Clock className={cn("h-4 w-4 shrink-0", className)} />;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SubscriptionBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { user, isAuthChecked } = useAuthStore();

  const { data } = useQuery({
    queryKey: ["tenant-subscription-status"],
    queryFn: async () => {
      try {
        return await tenantSubscriptionApi.getStatus();
      } catch {
        // Any error (401, 402, 404, 500) → hide the banner silently
        return null;
      }
    },
    // Only fetch when the user is authenticated and auth check is complete
    enabled: isAuthChecked && !!user,
    // Poll every 5 minutes
    refetchInterval: 5 * 60 * 1000,
    retry: false,
  });

  if (dismissed || !data) return null;

  const config = resolveBannerConfig(data);
  if (!config) return null;

  const styles = variantStyles[config.variant];

  return (
    <div
      role="alert"
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 border-b text-sm",
        styles.wrapper
      )}
    >
      <BannerIcon variant={config.variant} className={styles.icon} />

      <p className="flex-1 font-medium">
        {config.message}{" "}
        <span className="font-normal opacity-80">
          {config.variant === "trial_expired" || config.variant === "expired"
            ? "Contattaci per rinnovare."
            : ""}
        </span>
      </p>

      <Link
        href={config.ctaHref}
        className={cn(
          "inline-flex items-center px-3 py-1 rounded text-xs font-semibold shrink-0 transition-colors",
          styles.cta
        )}
      >
        {config.ctaLabel}
      </Link>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Chiudi avviso"
        className={cn("shrink-0 rounded p-0.5 transition-colors", styles.dismiss)}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

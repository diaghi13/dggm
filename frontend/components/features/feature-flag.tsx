"use client";

import { useFeatureFlag } from "@/hooks/use-settings";

/**
 * Componente che mostra i children solo se la feature flag è abilitata
 */
export function FeatureFlag({
  flag,
  children,
  fallback,
}: {
  flag: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const isEnabled = useFeatureFlag(flag);

  if (!isEnabled && fallback) {
    return <>{fallback}</>;
  }

  return isEnabled ? <>{children}</> : null;
}

/**
 * Componente che mostra i children solo se TUTTE le feature flags sono abilitate
 */
export function FeatureFlagAll({
  flags,
  children,
  fallback,
}: {
  flags: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const allEnabled = flags.every((flag) => useFeatureFlag(flag));

  if (!allEnabled && fallback) {
    return <>{fallback}</>;
  }

  return allEnabled ? <>{children}</> : null;
}

/**
 * Componente che mostra i children solo se ALMENO UNA feature flag è abilitata
 */
export function FeatureFlagAny({
  flags,
  children,
  fallback,
}: {
  flags: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const anyEnabled = flags.some((flag) => useFeatureFlag(flag));

  if (!anyEnabled && fallback) {
    return <>{fallback}</>;
  }

  return anyEnabled ? <>{children}</> : null;
}

/**
 * HOC che wrappa un componente con feature flag check
 */
export function withFeatureFlag<P extends object>(
  Component: React.ComponentType<P>,
  flag: string,
  fallback?: React.ReactNode,
) {
  return function FeatureFlaggedComponent(props: P) {
    const isEnabled = useFeatureFlag(flag);

    if (!isEnabled) {
      return fallback ? <>{fallback}</> : null;
    }

    return <Component {...props} />;
  };
}

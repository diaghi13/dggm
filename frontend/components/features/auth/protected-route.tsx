'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/use-permissions';
import { useAuthStore } from '@/stores/auth-store';
import { LoadingScreen } from '@/components/loading-screen';

interface ProtectedRouteProps {
  /**
   * Single permission required to access the route
   */
  permission?: string;

  /**
   * List of permissions - user needs ANY of these
   */
  anyPermission?: string[];

  /**
   * List of permissions - user needs ALL of these
   */
  allPermissions?: string[];

  /**
   * Single role required to access the route
   */
  role?: string;

  /**
   * List of roles - user needs ANY of these
   */
  anyRole?: string[];

  /**
   * Content to render if user has permission
   */
  children: ReactNode;

  /**
   * Path to redirect if user doesn't have permission (default: /dashboard)
   */
  redirectTo?: string;

  /**
   * Custom loading message
   */
  loadingMessage?: string;
}

/**
 * Component to protect routes based on user permissions/roles
 * Redirects to dashboard if user doesn't have required permissions
 *
 * @example
 * // In a page.tsx
 * export default function UsersPage() {
 *   return (
 *     <ProtectedRoute permission="users.view">
 *       <UsersContent />
 *     </ProtectedRoute>
 *   );
 * }
 */
export function ProtectedRoute({
  permission,
  anyPermission,
  allPermissions,
  role,
  anyRole,
  children,
  redirectTo = '/dashboard',
  loadingMessage = 'Verifica permessi...',
}: ProtectedRouteProps) {
  const router = useRouter();
  const { hasHydrated } = useAuthStore();
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
  } = usePermissions();

  useEffect(() => {
    // Wait for auth state to be hydrated
    if (!hasHydrated) return;

    let hasAccess = false;

    // Check permission
    if (permission && hasPermission(permission)) {
      hasAccess = true;
    }

    // Check any permission
    if (anyPermission && hasAnyPermission(anyPermission)) {
      hasAccess = true;
    }

    // Check all permissions
    if (allPermissions && hasAllPermissions(allPermissions)) {
      hasAccess = true;
    }

    // Check role
    if (role && hasRole(role)) {
      hasAccess = true;
    }

    // Check any role
    if (anyRole && hasAnyRole(anyRole)) {
      hasAccess = true;
    }

    // If no checks were specified, deny access
    if (!permission && !anyPermission && !allPermissions && !role && !anyRole) {
      hasAccess = false;
    }

    // Redirect if no access
    if (!hasAccess) {
      router.push(redirectTo);
    }
  }, [
    hasHydrated,
    permission,
    anyPermission,
    allPermissions,
    role,
    anyRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    redirectTo,
    router,
  ]);

  // Show loading while checking permissions
  if (!hasHydrated) {
    return <LoadingScreen message={loadingMessage} />;
  }

  // Check if user has access
  let hasAccess = false;

  if (permission && hasPermission(permission)) {
    hasAccess = true;
  }

  if (anyPermission && hasAnyPermission(anyPermission)) {
    hasAccess = true;
  }

  if (allPermissions && hasAllPermissions(allPermissions)) {
    hasAccess = true;
  }

  if (role && hasRole(role)) {
    hasAccess = true;
  }

  if (anyRole && hasAnyRole(anyRole)) {
    hasAccess = true;
  }

  // Show loading while redirecting
  if (!hasAccess) {
    return <LoadingScreen message="Accesso negato. Reindirizzamento..." />;
  }

  return <>{children}</>;
}


'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/use-permissions';

interface CanProps {
  /**
   * Single permission to check
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
   * Single role to check
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
   * Optional fallback content if user doesn't have permission
   */
  fallback?: ReactNode;
}

/**
 * Component to conditionally render content based on user permissions/roles
 *
 * @example
 * // Show only to users with specific permission
 * <Can permission="users.create">
 *   <Button>Create User</Button>
 * </Can>
 *
 * @example
 * // Show to users with any of these permissions
 * <Can anyPermission={["users.create", "users.edit"]}>
 *   <Button>Manage Users</Button>
 * </Can>
 *
 * @example
 * // Show to users with specific role
 * <Can role="admin">
 *   <AdminPanel />
 * </Can>
 *
 * @example
 * // Show different content based on permission
 * <Can permission="users.delete" fallback={<span>No access</span>}>
 *   <Button variant="destructive">Delete</Button>
 * </Can>
 */
export function Can({
  permission,
  anyPermission,
  allPermissions,
  role,
  anyRole,
  children,
  fallback = null,
}: CanProps) {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
  } = usePermissions();

  let canRender = false;

  // Check permission
  if (permission && hasPermission(permission)) {
    canRender = true;
  }

  // Check any permission
  if (anyPermission && hasAnyPermission(anyPermission)) {
    canRender = true;
  }

  // Check all permissions
  if (allPermissions && hasAllPermissions(allPermissions)) {
    canRender = true;
  }

  // Check role
  if (role && hasRole(role)) {
    canRender = true;
  }

  // Check any role
  if (anyRole && hasAnyRole(anyRole)) {
    canRender = true;
  }

  // If no checks were specified, default to false
  if (!permission && !anyPermission && !allPermissions && !role && !anyRole) {
    canRender = false;
  }

  return canRender ? <>{children}</> : <>{fallback}</>;
}


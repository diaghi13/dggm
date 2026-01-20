import { useAuthStore } from '@/stores/auth-store';
import { useMemo } from 'react';

/**
 * Hook to check user permissions and roles
 */
export function usePermissions() {
  const user = useAuthStore((state) => state.user);

  const permissions = useMemo(() => user?.permissions || [], [user?.permissions]);
  const roles = useMemo(() => user?.roles || [], [user?.roles]);

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    // Super admin and admin have all permissions
    if (roles.includes('super-admin') || roles.includes('admin')) return true;
    return permissions.includes(permission);
  };

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = (permissionList: string[]): boolean => {
    if (!user) return false;
    // Super admin and admin have all permissions
    if (roles.includes('super-admin') || roles.includes('admin')) return true;
    return permissionList.some((permission) => permissions.includes(permission));
  };

  /**
   * Check if user has all of the specified permissions
   */
  const hasAllPermissions = (permissionList: string[]): boolean => {
    if (!user) return false;
    // Super admin and admin have all permissions
    if (roles.includes('super-admin') || roles.includes('admin')) return true;
    return permissionList.every((permission) => permissions.includes(permission));
  };

  /**
   * Check if user has a specific role
   */
  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return roles.includes(role);
  };

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = (roleList: string[]): boolean => {
    if (!user) return false;
    return roleList.some((role) => roles.includes(role));
  };

  /**
   * Check if user is admin (super-admin or admin)
   */
  const isAdmin = (): boolean => {
    if (!user) return false;
    return roles.includes('super-admin') || roles.includes('admin');
  };

  return {
    permissions,
    roles,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isAdmin,
  };
}


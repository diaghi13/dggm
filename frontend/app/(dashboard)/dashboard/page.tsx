'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { usePermissions } from '@/hooks/use-permissions';
import { LoadingScreen } from '@/components/loading-screen';
import AdminDashboard from '@/components/dashboards/admin-dashboard';
export default function DashboardPage() {
  const router = useRouter();
  const { user, hasHydrated } = useAuthStore();
  const { hasRole } = usePermissions();
  useEffect(() => {
    if (!hasHydrated || !user) return;
    // Redirect workers to their specific dashboard
    if (hasRole('worker')) {
      router.replace('/dashboard/worker');
      return;
    }
    // Redirect team leaders to their dashboard
    if (hasRole('team-leader')) {
      router.replace('/dashboard/worker');
      return;
    }
    // Everyone else stays on the main dashboard
  }, [hasHydrated, user, hasRole, router]);
  // Show loading while checking
  if (!hasHydrated) {
    return <LoadingScreen message="Caricamento dashboard..." />;
  }
  // If worker or team-leader, show loading during redirect
  if (hasRole('worker') || hasRole('team-leader')) {
    return <LoadingScreen message="Reindirizzamento..." />;
  }
  // Admin, project-manager, accountant, warehousekeeper see admin dashboard
  return <AdminDashboard />;
}

"use client";

import { useAuthStore } from "@/stores/auth-store";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Activity,
  AlertCircle,
  Archive,
  Building2,
  CreditCard,
  LayoutDashboard,
  LogOut,
  ArrowLeft,
  Megaphone,
  Shield,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/central", label: "Panoramica", icon: LayoutDashboard, exact: true },
  { href: "/central/tenants", label: "Tenant", icon: Building2, exact: false },
  { href: "/central/users", label: "Utenti Globali", icon: Users, exact: false },
  { href: "/central/plans", label: "Piani", icon: CreditCard, exact: false },
  { href: "/central/backups", label: "Backup", icon: Archive, exact: false },
  { href: "/central/monitoring", label: "Monitoring", icon: Activity, exact: false },
  { href: "/central/error-logs", label: "Log Errori", icon: AlertCircle, exact: false },
  { href: "/central/broadcasts", label: "Comunicazioni", icon: Megaphone, exact: false },
];

export default function CentralLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, globalUser, isAuthenticated, hasHydrated, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    // Check if user has landlord admin access:
    // 1. GlobalUser.is_landlord_admin (set after login via global_user field in response)
    // 2. Tenant user with super-admin role (fallback for single-tenant mode)
    const isLandlordAdmin =
      globalUser?.is_landlord_admin === true ||
      (user?.roles ?? []).includes("super-admin");

    if (!isLandlordAdmin) {
      router.replace("/dashboard");
    }
  }, [hasHydrated, isAuthenticated, user, globalUser, router]);

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center gap-3 px-6 py-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Admin Centrale
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Pannello Landlord</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href) &&
                (item.href !== "/central" || pathname === "/central");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="flex-shrink-0 px-3 py-4 border-t border-slate-200 dark:border-slate-800 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 flex-shrink-0" />
            Torna all&apos;app
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logout()}
            className="w-full justify-start gap-3 px-3 text-slate-600 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-950/30"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            Esci
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex-shrink-0 flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Accesso come:{" "}
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {user?.name}
              </span>
            </p>
          </div>
          <ThemeToggle />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

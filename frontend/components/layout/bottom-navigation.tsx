"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useThemeSettings } from "@/hooks/use-settings";
import {
  LayoutDashboard,
  Package,
  FileText,
  Users,
  Clock,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  matchPaths?: string[]; // Additional paths that should be considered active
}

const navItems: NavItem[] = [
  {
    name: "Home",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Anagrafica",
    href: "/registry",
    icon: Users,
    matchPaths: [
      "/customers",
      "/suppliers",
      "/projects",
      "/workers",
      "/invitations",
    ],
  },
  {
    name: "Commerciale",
    href: "/commercial",
    icon: FileText,
    matchPaths: ["/quotes", "/sals"],
  },
  {
    name: "Magazzino",
    href: "/warehouse",
    icon: Package,
    matchPaths: [
      "/products",
      "/warehouses",
      "/inventory",
      "/stock-movements",
      "/ddts",
    ],
  },
  {
    name: "Operativo",
    href: "/operations",
    icon: Clock,
    matchPaths: ["/time-tracking", "/vehicles"],
  },
];

export function BottomNavigation() {
  const pathname = usePathname();
  const { primaryColor } = useThemeSettings();

  return (
    <>
      {/* Spacer to prevent content from being hidden behind fixed nav */}
      <div className="h-16 lg:hidden" />

      {/* Bottom Navigation - Mobile Only */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 lg:hidden"
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)",
        }}
      >
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            // Check if current path matches item or any of its sub-paths
            const isActive =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`) ||
              (item.matchPaths &&
                item.matchPaths.some(
                  (path) =>
                    pathname === path || pathname.startsWith(`${path}/`),
                ));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 min-w-[64px]",
                  "hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95",
                  isActive && "bg-slate-100 dark:bg-slate-800",
                )}
              >
                <div
                  className="relative"
                  style={isActive ? { color: primaryColor } : undefined}
                >
                  <Icon
                    className={cn(
                      "h-6 w-6 transition-colors",
                      !isActive && "text-slate-600 dark:text-slate-400",
                    )}
                  />
                  {/* Active indicator dot */}
                  {isActive && (
                    <div
                      className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                      style={{ backgroundColor: primaryColor }}
                    />
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium transition-colors",
                    isActive
                      ? "font-semibold"
                      : "text-slate-600 dark:text-slate-400",
                  )}
                  style={isActive ? { color: primaryColor } : undefined}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

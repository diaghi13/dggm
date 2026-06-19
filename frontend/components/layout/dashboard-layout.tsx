"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeSettings } from "@/hooks/use-settings";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationCenter } from "@/components/layout/notification-center";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { UserMenuMobile } from "@/components/layout/user-menu-mobile";
import {
  Users,
  Building2,
  FileText,
  Clock,
  Package,
  Truck,
  FileCheck,
  LogOut,
  Factory,
  LayoutDashboard,
  X,
  Warehouse,
  BarChart3,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Settings,
  MapPin,
  UserCheck,
  Mail,
  User,
  DollarSign,
  TrendingDown,
  Zap,
  ChevronsUpDown,
  Check,
  Shield,
  CreditCard,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { storage } from "@/lib/storage";
import { LoadingScreen } from "@/components/loading-screen";
import { usePermissions } from "@/hooks/use-permissions";
import { useMemo } from "react";
import { LucideIcon } from "lucide-react";
import { OfflineIndicator } from "@/components/offline-indicator";
import { SubscriptionBanner } from "@/components/subscription-banner";
import { useQueryClient } from "@tanstack/react-query";
import type { TenantInfo } from "@/lib/types";

interface NavigationItem {
  name: string;
  href?: string;
  icon: LucideIcon;
  permissions?: string[];
  /** Feature key from tenant plan (e.g. 'warehouse', 'workers', 'rental').
   *  If set and features array is non-empty, item is hidden unless the key is included. */
  feature?: string;
  children?: NavigationItem[];
}

const navigationConfig: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard", // Will be overridden dynamically
    icon: LayoutDashboard,
    permissions: [], // Dashboard is visible to all authenticated users
  },
  {
    name: "Dashboard Noleggio",
    href: "/dashboard/rental",
    icon: BarChart3,
    permissions: ["materials.view"],
    feature: "rental",
  },
  {
    name: "Anagrafica",
    icon: Users,
    children: [
      {
        name: "Clienti",
        href: "/customers",
        icon: Users,
        permissions: ["customers.view"],
      },
      {
        name: "Fornitori",
        href: "/suppliers",
        icon: Factory,
        permissions: ["suppliers.view"],
      },
      {
        name: "Progetti",
        href: "/projects",
        icon: MapPin,
        permissions: ["projects.view", "projects.view-own"],
      },
      {
        name: "Collaboratori",
        href: "/workers",
        icon: UserCheck,
        permissions: ["workers.view"],
        feature: "workers",
      },
      {
        name: "Inviti",
        href: "/invitations",
        icon: Mail,
        permissions: ["users.create"],
      },
    ],
  },
  {
    name: "Commerciale",
    icon: FileText,
    children: [
      {
        name: "Preventivi",
        href: "/quotes",
        icon: FileText,
        permissions: ["quotes.view", "quotes.view-own"],
      },
      {
        name: "SAL",
        href: "/sals",
        icon: FileCheck,
        permissions: ["sals.view"],
      },
      {
        name: "Listini",
        href: "/price-lists",
        icon: DollarSign,
        permissions: ["price-lists.view"],
      },
      {
        name: "Final Balance",
        href: "/final-balances",
        icon: FileCheck,
        permissions: ["projects.view"],
      },
    ],
  },
  // {
  //   name: 'Magazzino',
  //   icon: Warehouse,
  //   children: [
  //     {
  //       name: 'Inventario',
  //       href: '/inventory',
  //       icon: Package,
  //       permissions: ['inventory.view']
  //     },
  //     {
  //       name: 'Movimenti Stock',
  //       href: '/stock-movements',
  //       icon: TrendingUp,
  //       permissions: ['stock_movements.view']
  //     },
  //     {
  //       name: 'DDT',
  //       href: '/ddts',
  //       icon: Truck,
  //       permissions: ['ddts.view']
  //     },
  //     {
  //       name: 'Prodotti',
  //       href: '/products',
  //       icon: Package,
  //       permissions: ['products.view']
  //     },
  //   ]
  // },
  {
    name: "Magazzino",
    icon: Package,
    feature: "warehouse",
    children: [
      {
        name: "Prodotti",
        href: "/products",
        icon: Package,
        permissions: ["materials.view"],
      },
      {
        name: "Magazzini",
        href: "/warehouses",
        icon: Warehouse,
        permissions: ["warehouse.view"],
      },
      {
        name: "Inventario",
        href: "/inventory",
        icon: BarChart3,
        permissions: ["warehouse.inventory"],
      },
      {
        name: "Movimenti",
        href: "/stock-movements",
        icon: TrendingUp,
        permissions: ["warehouse.view"],
      },
      {
        name: "DDT",
        href: "/ddts",
        icon: FileCheck,
        permissions: ["ddts.view"],
      },
      {
        name: "Quarantena",
        href: "/warehouse/quarantine",
        icon: ShieldAlert,
        permissions: ["warehouse.view"],
      },
      {
        name: "Riparazioni",
        href: "/warehouse/repair-orders",
        icon: Wrench,
        permissions: ["warehouse.view"],
      },
      {
        name: "Configurazioni",
        href: "/warehouse/configurations",
        icon: Settings,
        permissions: ["warehouse.view"],
      },
    ],
  },
  {
    name: "Operativo",
    icon: Clock,
    children: [
      {
        name: "Timbrature",
        href: "/time-tracking",
        icon: Clock,
        permissions: ["time-trackings.view", "time-trackings.view-own"],
      },
      {
        name: "Mezzi",
        href: "/vehicles",
        icon: Truck,
        permissions: ["vehicles.view"],
      },
    ],
  },
  {
    name: "Sistema",
    icon: Settings,
    children: [
      {
        name: "Utenti",
        href: "/users",
        icon: Users,
        permissions: ["users.view"],
      },
      {
        name: "Impostazioni",
        href: "/settings-index",
        icon: Settings,
        permissions: ["settings.view"],
      },
      {
        name: "Motore Noleggio",
        href: "/settings/rental-engine",
        icon: Zap,
        permissions: ["settings.view"],
        feature: "rental",
      },
      {
        name: "Profili Noleggio",
        href: "/settings/rental-profiles",
        icon: TrendingDown,
        permissions: ["settings.view"],
        feature: "rental",
      },
    ],
  },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    user,
    globalUser,
    logout,
    isAuthChecked,
    settings,
    features,
    currentTenant,
    availableTenants: allTenants,
    switchTenant,
  } = useAuthStore();
  // Show all tenants the user has membership for — non-active ones get a status indicator
  const availableTenants = allTenants;
  const { primaryColor } = useThemeSettings();
  const { hasAnyPermission, isAdmin, hasRole } = usePermissions();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSwitchTenant = (tenant: TenantInfo) => {
    if (tenant.id === currentTenant?.id) return;
    // Invalidate all queries so new tenant data loads fresh
    queryClient.clear();
    switchTenant(tenant);
  };

  // Determine dashboard URL based on role
  const dashboardUrl = useMemo(() => {
    if (hasRole("worker") || hasRole("team-leader")) {
      return "/dashboard/worker";
    }
    return "/dashboard";
  }, [hasRole]);

  // Filter navigation based on user permissions and feature flags.
  // If features array is non-empty, items with a `feature` key are only shown
  // when that feature is included. Empty features = backward-compat (show all).
  const navigation = useMemo(() => {
    if (!user) return [];

    const isFeatureEnabled = (feature?: string): boolean => {
      if (!feature) return true; // no restriction
      if (features.length === 0) return true; // backward compat: no flags set → show all
      return features.includes(feature);
    };

    return navigationConfig
      .map((item) => {
        // Feature-gate the parent item itself
        if (!isFeatureEnabled(item.feature)) return null;

        // If item has children, filter them based on permissions and features
        if (item.children && item.children.length > 0) {
          const filteredChildren = item.children.filter((child) => {
            // Feature gate child
            if (!isFeatureEnabled(child.feature)) return false;
            // If no permissions specified, show to all
            if (!child.permissions || child.permissions.length === 0)
              return true;
            // Admin sees everything
            if (isAdmin()) return true;
            // Check if user has any of the required permissions
            return hasAnyPermission(child.permissions);
          });

          // Only show parent if it has visible children
          if (filteredChildren.length === 0) return null;

          return {
            ...item,
            children: filteredChildren,
          };
        }

        // For items without children, check permissions
        if (item.permissions && item.permissions.length > 0) {
          if (!isAdmin() && !hasAnyPermission(item.permissions)) {
            return null;
          }
        }

        return item;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [user, features, hasAnyPermission, isAdmin]);

  // Load sidebar collapsed state from localStorage
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return storage.get<boolean>("sidebar_collapsed", false);
  });

  // Load expanded items from localStorage
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    return (
      storage.get<string[]>("expanded_items", [
        "Anagrafica",
        "Commerciale",
        "Magazzino",
        "Sistema",
      ]) ?? ["Anagrafica", "Commerciale", "Magazzino", "Sistema"]
    );
  });

  // Save sidebar collapsed state to localStorage
  const toggleSidebarCollapsed = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    storage.set("sidebar_collapsed", newState);
  };

  // Save expanded items to localStorage
  const toggleExpandedItem = (itemName: string) => {
    setExpandedItems((prev) => {
      const newItems = prev.includes(itemName)
        ? prev.filter((name) => name !== itemName)
        : [...prev, itemName];
      storage.set("expanded_items", newItems);
      return newItems;
    });
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  // If not authenticated, redirect to login.
  // Wait for isAuthChecked: only redirect after AuthInitProvider has finished verifying the token.
  useEffect(() => {
    if (isAuthChecked && !user) {
      router.replace("/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthChecked, user]);

  useEffect(() => {
    if (!isAuthChecked) return;
    if (!user) return;
    if (pathname?.startsWith("/setup")) return;
    const setupCompleted = settings?.global?.["app.setup_completed"];
    if (
      (hasRole("super-admin") || hasRole("admin")) &&
      (setupCompleted === undefined ||
        setupCompleted === false ||
        setupCompleted === "0" ||
        setupCompleted === "false")
    ) {
      router.push("/setup");
    }
  }, [isAuthChecked, user, settings, pathname, hasRole, router]);

  if (!user) {
    return null;
  }

  const userInitials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-all duration-300 ease-in-out lg:translate-x-0",
          sidebarCollapsed ? "w-16" : "w-64",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div
            className="flex items-center justify-between h-16 px-4 border-b"
            style={{
              borderBottomColor: `${primaryColor}20`,
              background: `linear-gradient(to right, ${primaryColor}08 0%, transparent 100%)`,
            }}
          >
            {!sidebarCollapsed && (
              <Link
                href={dashboardUrl}
                className="flex items-center gap-3 hover:opacity-90 transition-opacity"
              >
                <div
                  className="w-8 h-8 rounded flex items-center justify-center"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    DGGM ERP
                  </h1>
                  {currentTenant?.name && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[140px]">
                      {currentTenant.name}
                    </p>
                  )}
                </div>
              </Link>
            )}
            {sidebarCollapsed && (
              <Link
                href={dashboardUrl}
                className="w-8 h-8 rounded flex items-center justify-center mx-auto hover:opacity-90 transition-opacity"
                style={{ backgroundColor: primaryColor }}
              >
                <Building2 className="w-5 h-5 text-white" />
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Tenant Switcher — shown only when multiple tenants are available */}
          {availableTenants.length > 1 && !sidebarCollapsed && (
            <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between gap-2 h-9 px-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400" />
                      <span className="truncate">
                        {currentTenant?.name ?? "Seleziona azienda"}
                      </span>
                    </div>
                    <ChevronsUpDown className="w-4 h-4 shrink-0 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel className="text-xs text-slate-500 dark:text-slate-400">
                    Cambia azienda
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {availableTenants.map((tenant) => {
                    const isActiveStatus =
                      !tenant.subscription_status ||
                      tenant.subscription_status === "active" ||
                      tenant.subscription_status === "trial";
                    return (
                      <DropdownMenuItem
                        key={tenant.id}
                        onClick={() => handleSwitchTenant(tenant)}
                        className="cursor-pointer"
                      >
                        <Building2 className="mr-2 h-4 w-4 text-slate-500" />
                        <span className="flex-1 truncate">{tenant.name}</span>
                        {!isActiveStatus && (
                          <span
                            className="ml-2 w-2 h-2 rounded-full bg-amber-400 shrink-0"
                            title={tenant.subscription_status ?? undefined}
                          />
                        )}
                        {tenant.id === currentTenant?.id && (
                          <Check className="ml-1 h-4 w-4 text-green-500 shrink-0" />
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/select-tenant" className="cursor-pointer">
                      <ChevronsUpDown className="mr-2 h-4 w-4 text-slate-500" />
                      Tutte le aziende
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          {availableTenants.length > 1 && sidebarCollapsed && (
            <div className="flex items-center justify-center px-2 py-2 border-b border-slate-200 dark:border-slate-800">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Cambia azienda"
                  >
                    <Building2 className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel className="text-xs text-slate-500 dark:text-slate-400">
                    Cambia azienda
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {availableTenants.map((tenant) => {
                    const isActiveStatus =
                      !tenant.subscription_status ||
                      tenant.subscription_status === "active" ||
                      tenant.subscription_status === "trial";
                    return (
                      <DropdownMenuItem
                        key={tenant.id}
                        onClick={() => handleSwitchTenant(tenant)}
                        className="cursor-pointer"
                      >
                        <Building2 className="mr-2 h-4 w-4 text-slate-500" />
                        <span className="flex-1 truncate">{tenant.name}</span>
                        {!isActiveStatus && (
                          <span
                            className="ml-2 w-2 h-2 rounded-full bg-amber-400 shrink-0"
                            title={tenant.subscription_status ?? undefined}
                          />
                        )}
                        {tenant.id === currentTenant?.id && (
                          <Check className="ml-1 h-4 w-4 text-green-500 shrink-0" />
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Toggle Collapse Button */}
          <div className="hidden lg:flex items-center justify-end px-3 py-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={toggleSidebarCollapsed}
            >
              <ChevronLeft
                className={cn(
                  "h-4 w-4 transition-transform",
                  sidebarCollapsed && "rotate-180",
                )}
              />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isExpanded = expandedItems.includes(item.name);
              const hasChildren = item.children && item.children.length > 0;

              // Check if any child is active
              const isChildActive =
                hasChildren &&
                item.children!.some((child) => pathname === child.href);
              const isActive = item.href && pathname === item.href;

              if (hasChildren) {
                return (
                  <div key={item.name}>
                    <button
                      onClick={() => {
                        if (sidebarCollapsed) {
                          setSidebarCollapsed(false);
                          storage.set("sidebar_collapsed", false);
                        }
                        toggleExpandedItem(item.name);
                      }}
                      className={cn(
                        "flex items-center w-full gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                        sidebarCollapsed ? "justify-center" : "justify-between",
                        isChildActive
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100",
                      )}
                      title={sidebarCollapsed ? item.name : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 shrink-0" />
                        {!sidebarCollapsed && <span>{item.name}</span>}
                      </div>
                      {!sidebarCollapsed &&
                        (isExpanded ? (
                          <ChevronDown className="w-4 h-4 shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 shrink-0" />
                        ))}
                    </button>
                    {isExpanded && !sidebarCollapsed && (
                      <div className="mt-1 ml-8 space-y-0.5">
                        {item.children!.map((child) => {
                          const ChildIcon = child.icon;
                          const isChildItemActive = pathname === child.href;
                          return (
                            <Link
                              key={child.name}
                              href={child.href!}
                              onClick={() => setSidebarOpen(false)}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                isChildItemActive
                                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100",
                              )}
                            >
                              <ChildIcon className="w-4 h-4 shrink-0" />
                              <span>{child.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.name}
                  href={item.name === "Dashboard" ? dashboardUrl : item.href!}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                    sidebarCollapsed && "justify-center",
                    isActive
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100",
                  )}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!sidebarCollapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Landlord Admin Link */}
          {globalUser?.is_landlord_admin && (
            <div
              className={cn(
                "px-3 py-2 border-t border-slate-200 dark:border-slate-800",
                sidebarCollapsed && "px-2",
              )}
            >
              <Link
                href="/central"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30 transition-colors",
                  sidebarCollapsed && "justify-center px-2",
                )}
                title="Area Admin Centrale"
              >
                <Shield className="h-4 w-4 flex-shrink-0" />
                {!sidebarCollapsed && <span>Admin Centrale</span>}
              </Link>
            </div>
          )}

          {/* User Section */}
          <div
            className={cn(
              "p-3 border-t border-slate-200 dark:border-slate-800",
              sidebarCollapsed && "px-2",
            )}
          >
            {!sidebarCollapsed ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-auto py-2 px-2 hover:bg-slate-100 dark:hover:bg-slate-800 mb-3"
                    >
                      <Avatar className="h-9 w-9 bg-slate-900 dark:bg-slate-700">
                        <AvatarFallback className="bg-slate-900 dark:bg-slate-700 text-white text-sm font-medium">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {user.email}
                        </p>
                      </div>
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Il Mio Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        href="/profile"
                        className="flex items-center cursor-pointer"
                      >
                        <User className="mr-2 h-4 w-4" />
                        Profilo
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/settings-index"
                        className="flex items-center cursor-pointer"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Impostazioni
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin() && (
                      <DropdownMenuItem asChild>
                        <Link
                          href="/dashboard/subscription"
                          className="flex items-center cursor-pointer"
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          Abbonamento
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Esci
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="flex items-center justify-center gap-2">
                  <NotificationCenter />
                  <ThemeToggle />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                    >
                      <Avatar className="h-9 w-9 bg-slate-900 dark:bg-slate-700">
                        <AvatarFallback className="bg-slate-900 dark:bg-slate-700 text-white text-sm font-medium">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        href="/profile"
                        className="flex items-center cursor-pointer"
                      >
                        <User className="mr-2 h-4 w-4" />
                        Profilo
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/settings-index"
                        className="flex items-center cursor-pointer"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Impostazioni
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin() && (
                      <DropdownMenuItem asChild>
                        <Link
                          href="/dashboard/subscription"
                          className="flex items-center cursor-pointer"
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          Abbonamento
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Esci
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <NotificationCenter />
                <ThemeToggle />
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div
        className={cn(
          "transition-all duration-300",
          sidebarCollapsed ? "lg:pl-16" : "lg:pl-64",
        )}
      >
        {/* Desktop topbar — tenant + user context */}
        <header className="hidden lg:flex sticky top-0 z-30 items-center justify-end h-12 px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            {currentTenant?.name && (
              <>
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                    {currentTenant.name}
                  </span>
                </div>
                <span className="text-slate-300 dark:text-slate-600">|</span>
              </>
            )}
            <span>
              Accesso come:{" "}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {user.name}
              </span>
            </span>
          </div>
        </header>

        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 lg:hidden">
          {/* Logo - Left */}
          <Link
            href={dashboardUrl}
            className="flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <div
              className="w-8 h-8 rounded flex items-center justify-center"
              style={{ backgroundColor: primaryColor }}
            >
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                DGGM ERP
              </h1>
              {currentTenant?.name && (
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[160px]">
                  {currentTenant.name}
                </p>
              )}
            </div>
          </Link>

          {/* Actions - Right */}
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <ThemeToggle />
            <UserMenuMobile />
          </div>
        </header>

        {/* Subscription warning banner */}
        <SubscriptionBanner />

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>

        {/* Offline indicator */}
        <OfflineIndicator />

        {/* Bottom Navigation - Mobile Only */}
        <BottomNavigation />
      </div>
    </div>
  );
}

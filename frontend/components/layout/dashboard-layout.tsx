'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/theme-toggle';
import { NotificationCenter } from '@/components/layout/notification-center';
import {
  Users,
  Building2,
  FileText,
  Clock,
  Package,
  Truck,
  FileCheck,
  LogOut,
  Menu,
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
  Receipt,
  UserCheck,
  Briefcase,
  Mail
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { storage } from '@/lib/storage';
import { LoadingScreen } from '@/components/loading-screen';
import { usePermissions } from '@/hooks/use-permissions';
import { useMemo } from 'react';
import { LucideIcon } from 'lucide-react';
import { OfflineIndicator } from '@/components/offline-indicator';

interface NavigationItem {
  name: string;
  href?: string;
  icon: LucideIcon;
  permissions?: string[];
  children?: NavigationItem[];
}

const navigationConfig: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard', // Will be overridden dynamically
    icon: LayoutDashboard,
    permissions: [] // Dashboard is visible to all authenticated users
  },
  {
    name: 'Anagrafica',
    icon: Users,
    children: [
      {
        name: 'Clienti',
        href: '/customers',
        icon: Users,
        permissions: ['customers.view']
      },
      {
        name: 'Fornitori',
        href: '/suppliers',
        icon: Factory,
        permissions: ['suppliers.view']
      },
      {
        name: 'Cantieri',
        href: '/sites',
        icon: MapPin,
        permissions: ['sites.view', 'sites.view-own']
      },
      {
        name: 'Collaboratori',
        href: '/workers',
        icon: UserCheck,
        permissions: ['workers.view']
      },
      {
        name: 'Inviti',
        href: '/invitations',
        icon: Mail,
        permissions: ['users.create']
      },
    ]
  },
  {
    name: 'Commerciale',
    icon: FileText,
    children: [
      {
        name: 'Preventivi',
        href: '/quotes',
        icon: FileText,
        permissions: ['quotes.view', 'quotes.view-own']
      },
      {
        name: 'SAL',
        href: '/sals',
        icon: FileCheck,
        permissions: ['sals.view']
      }
    ]
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
    name: 'Magazzino',
    icon: Package,
    children: [
      {
        name: 'Prodotti',
        href: '/products',
        icon: Package,
        permissions: ['materials.view']
      },
      {
        name: 'Magazzini',
        href: '/warehouses',
        icon: Warehouse,
        permissions: ['warehouse.view']
      },
      {
        name: 'Inventario',
        href: '/inventory',
        icon: BarChart3,
        permissions: ['warehouse.inventory']
      },
      {
        name: 'Movimenti',
        href: '/stock-movements',
        icon: TrendingUp,
        permissions: ['warehouse.view']
      },
      {
        name: 'DDT',
        href: '/ddts',
        icon: FileCheck,
        permissions: ['ddts.view']
      },
    ]
  },
  {
    name: 'Operativo',
    icon: Clock,
    children: [
      {
        name: 'Timbrature',
        href: '/time-tracking',
        icon: Clock,
        permissions: ['time-trackings.view', 'time-trackings.view-own']
      },
      {
        name: 'Mezzi',
        href: '/vehicles',
        icon: Truck,
        permissions: ['vehicles.view']
      },
    ]
  },
  {
    name: 'Sistema',
    icon: Settings,
    children: [
      {
        name: 'Utenti',
        href: '/users',
        icon: Users,
        permissions: ['users.view']
      },
      {
        name: 'Ruoli Cantiere',
        href: '/settings/site-roles',
        icon: Briefcase,
        permissions: ['site_roles.view']
      },
      {
        name: 'Impostazioni',
        href: '/settings',
        icon: Settings,
        permissions: ['settings.view']
      },
    ]
  },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, hasHydrated, logout } = useAuthStore();
  const { hasAnyPermission, isAdmin, hasRole } = usePermissions();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Determine dashboard URL based on role
  const dashboardUrl = useMemo(() => {
    if (hasRole('worker') || hasRole('team-leader')) {
      return '/dashboard/worker';
    }
    return '/dashboard';
  }, [hasRole]);

  // Filter navigation based on user permissions
  const navigation = useMemo(() => {
    if (!user) return [];

    return navigationConfig
      .map((item) => {
        // If item has children, filter them based on permissions
        if (item.children && item.children.length > 0) {
          const filteredChildren = item.children.filter((child) => {
            // If no permissions specified, show to all
            if (!child.permissions || child.permissions.length === 0) return true;
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
  }, [user, hasAnyPermission, isAdmin]);

  // Load sidebar collapsed state from localStorage
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return storage.get<boolean>('sidebar_collapsed', false);
  });

  // Load expanded items from localStorage
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    return storage.get<string[]>('expanded_items', ['Anagrafica', 'Commerciale', 'Magazzino', 'Sistema']) ?? ['Anagrafica', 'Commerciale', 'Magazzino', 'Sistema'];
  });

  // Save sidebar collapsed state to localStorage
  const toggleSidebarCollapsed = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    storage.set('sidebar_collapsed', newState);
  };

  // Save expanded items to localStorage
  const toggleExpandedItem = (itemName: string) => {
    setExpandedItems(prev => {
      const newItems = prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName];
      storage.set('expanded_items', newItems);
      return newItems;
    });
  };

  // Redirect to login if not authenticated (only after hydration)
  useEffect(() => {
    if (hasHydrated && (!isAuthenticated || !user)) {
      router.push('/login');
    }
  }, [hasHydrated, isAuthenticated, user, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Show loading screen while hydrating
  if (!hasHydrated) {
    return <LoadingScreen message="Verifica autenticazione..." />;
  }

  // Redirect to login if not authenticated after hydration
  if (!isAuthenticated || !user) {
    return <LoadingScreen message="Reindirizzamento..." />;
  }

  const userInitials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-all duration-300 ease-in-out lg:translate-x-0',
          sidebarCollapsed ? 'w-16' : 'w-64',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-800">
            {!sidebarCollapsed && (
              <Link href={dashboardUrl} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 bg-slate-900 dark:bg-slate-700 rounded flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">DGGM ERP</h1>
                </div>
              </Link>
            )}
            {sidebarCollapsed && (
              <Link href={dashboardUrl} className="w-8 h-8 bg-slate-900 dark:bg-slate-700 rounded flex items-center justify-center mx-auto hover:opacity-80 transition-opacity">
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

          {/* Toggle Collapse Button */}
          <div className="hidden lg:flex items-center justify-end px-3 py-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={toggleSidebarCollapsed}
            >
              <ChevronLeft className={cn("h-4 w-4 transition-transform", sidebarCollapsed && "rotate-180")} />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isExpanded = expandedItems.includes(item.name);
              const hasChildren = item.children && item.children.length > 0;

              // Check if any child is active
              const isChildActive = hasChildren && item.children!.some((child) => pathname === child.href);
              const isActive = item.href && pathname === item.href;

              if (hasChildren) {
                return (
                  <div key={item.name}>
                    <button
                      onClick={() => {
                        if (sidebarCollapsed) {
                          setSidebarCollapsed(false);
                          storage.set('sidebar_collapsed', false);
                        }
                        toggleExpandedItem(item.name);
                      }}
                      className={cn(
                        'flex items-center w-full gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors',
                        sidebarCollapsed ? 'justify-center' : 'justify-between',
                        isChildActive
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                      )}
                      title={sidebarCollapsed ? item.name : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 shrink-0" />
                        {!sidebarCollapsed && <span>{item.name}</span>}
                      </div>
                      {!sidebarCollapsed && (
                        isExpanded ? (
                          <ChevronDown className="w-4 h-4 shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 shrink-0" />
                        )
                      )}
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
                                'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                                isChildItemActive
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
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
                  href={item.name === 'Dashboard' ? dashboardUrl : item.href!}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors',
                    sidebarCollapsed && 'justify-center',
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  )}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!sidebarCollapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className={cn("p-3 border-t border-slate-200 dark:border-slate-800", sidebarCollapsed && "px-2")}>
            {!sidebarCollapsed ? (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-9 w-9 bg-slate-900 dark:bg-slate-700">
                    <AvatarFallback className="bg-slate-900 dark:bg-slate-700 text-white text-sm font-medium">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <NotificationCenter />
                    <ThemeToggle />
                  </div>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full justify-center gap-2 text-sm"
                  size="sm"
                >
                  <LogOut className="w-4 h-4" />
                  Esci
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Avatar className="h-9 w-9 bg-slate-900 dark:bg-slate-700">
                  <AvatarFallback className="bg-slate-900 dark:bg-slate-700 text-white text-sm font-medium">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <NotificationCenter />
                <ThemeToggle />
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="icon"
                  className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Esci"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
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
      <div className={cn("transition-all duration-300", sidebarCollapsed ? "lg:pl-16" : "lg:pl-64")}>
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="text-slate-600 dark:text-slate-400"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link href={dashboardUrl} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 bg-slate-900 dark:bg-slate-700 rounded flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">DGGM ERP</h1>
          </Link>
          <div className="w-10" />
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* Offline indicator */}
        <OfflineIndicator />
      </div>
    </div>
  );
}

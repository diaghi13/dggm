"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Settings,
  Building2,
  Bell,
  Package,
  FileText,
  Mail,
  Palette,
  Flag,
  Layout,
  DollarSign,
  Receipt,
  Menu,
  TrendingDown,
  Zap,
  Wallet,
  Briefcase,
  Users,
  Ruler,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const iconMap = {
  Settings,
  Building2,
  Bell,
  Package,
  FileText,
  Mail,
  Palette,
  Flag,
  Layout,
  DollarSign,
  Receipt,
  TrendingDown,
  Zap,
  Wallet,
  Briefcase,
  Users,
  Ruler,
};

interface SidebarItem {
  key: string;
  label: string;
  icon: string;
  href?: string; // se presente → Link, altrimenti → tab
  tabPage?: string; // pagina di destinazione per navigazione da fuori (default: /admin/settings)
}

interface SidebarGroup {
  category: string;
  items: SidebarItem[];
}

// Definizione dei gruppi con categorizzazione logica
export const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    category: "Sistema",
    items: [
      { key: "general", label: "Generali", icon: "Settings" },
      { key: "company", label: "Azienda", icon: "Building2" },
      { key: "theme", label: "Tema", icon: "Palette" },
      { key: "ui", label: "Interfaccia", icon: "Layout" },
      { key: "users", label: "Utenti & Permessi", icon: "Users", tabPage: "/settings" },
    ],
  },
  {
    category: "Business",
    items: [
      { key: "warehouse", label: "Magazzino", icon: "Package" },
      { key: "pricing", label: "Prezzi & Noleggio", icon: "DollarSign" },
      { key: "quotes", label: "Preventivi", icon: "Receipt" },
      {
        key: "rental-engine",
        label: "Motore Noleggio",
        icon: "Zap",
        href: "/settings/rental-engine",
      },
      {
        key: "rental-profiles",
        label: "Profili Noleggio",
        icon: "TrendingDown",
        href: "/settings/rental-profiles",
      },
      {
        key: "financial-resources",
        label: "Risorse Finanziarie",
        icon: "Wallet",
        href: "/settings/financial-resources",
      },
      {
        key: "site-roles",
        label: "Ruoli Progetto",
        icon: "Briefcase",
        href: "/settings/site-roles",
      },
      {
        key: "unit-types",
        label: "Unità di misura",
        icon: "Ruler",
        href: "/settings/unit-types",
      },
    ],
  },
  {
    category: "Comunicazioni",
    items: [
      { key: "email", label: "Email", icon: "Mail" },
      { key: "notifications", label: "Notifiche", icon: "Bell" },
    ],
  },
  {
    category: "Avanzate",
    items: [
      { key: "files", label: "File", icon: "FileText" },
      { key: "features", label: "Funzionalità", icon: "Flag" },
    ],
  },
];

interface SettingsSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

function SidebarContent({
  activeTab,
  onTabChange,
  onItemClick,
}: SettingsSidebarProps & { onItemClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="space-y-6">
      {SIDEBAR_GROUPS.map((group) => (
        <div key={group.category}>
          <h3 className="px-3 mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {group.category}
          </h3>

          <nav className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = iconMap[item.icon as keyof typeof iconMap] || Settings;

              // Link-based item (pagina separata)
              if (item.href) {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={onItemClick}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                      "hover:bg-slate-100 dark:hover:bg-slate-800/50",
                      isActive
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 dark:hover:bg-primary/90 shadow-sm"
                        : "text-slate-700 dark:text-slate-300",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              }

              // Tab-based item (stesso admin/settings)
              const tabPage = item.tabPage ?? "/admin/settings";
              const isOnTabPage = pathname === tabPage;
              const isActive = isOnTabPage
                ? activeTab === item.key
                : false;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    if (isOnTabPage) {
                      onTabChange(item.key);
                    } else {
                      router.push(`${tabPage}?tab=${item.key}`);
                    }
                    onItemClick?.();
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    "hover:bg-slate-100 dark:hover:bg-slate-800/50",
                    isActive
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 dark:hover:bg-primary/90 shadow-sm"
                      : "text-slate-700 dark:text-slate-300",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate text-left">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      ))}
    </div>
  );
}

export function SettingsSidebar({
  activeTab,
  onTabChange,
}: SettingsSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Desktop: Sidebar sempre visibile */}
      <aside className="hidden md:block w-64 shrink-0">
        <div className="sticky top-6">
          <SidebarContent activeTab={activeTab} onTabChange={onTabChange} />
        </div>
      </aside>

      {/* Mobile: Bottone hamburger + Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="default"
            size="icon"
            className="fixed bottom-20 right-4 z-100 h-14 w-14 rounded-full shadow-2xl md:hidden hover:scale-110 transition-transform"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Menu impostazioni</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Impostazioni
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <SidebarContent
              activeTab={activeTab}
              onTabChange={onTabChange}
              onItemClick={() => setIsOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

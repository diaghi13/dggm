"use client";

import { cn } from "@/lib/utils";
import {
  Building2,
  FileText,
  Users,
  Clock,
  Receipt,
  Package,
  Wrench,
  ShoppingCart,
  Warehouse,
  BarChart2,
  ClipboardList,
  AlertTriangle,
  Scale,
  TrendingUp,
} from "lucide-react";

const iconMap = {
  Building2,
  FileText,
  Users,
  Clock,
  Receipt,
  Package,
  Wrench,
  ShoppingCart,
  Warehouse,
  BarChart2,
  ClipboardList,
  AlertTriangle,
  Scale,
  TrendingUp,
};

export const PROJECT_NAV_GROUPS = [
  {
    category: "Progetto",
    items: [
      { key: "riepilogo", label: "Riepilogo", icon: "Building2" },
      { key: "documenti", label: "Documenti", icon: "FileText" },
    ],
  },
  {
    category: "Personale",
    items: [
      { key: "personale", label: "Personale", icon: "Users" },
      { key: "ore", label: "Ore Lavorate", icon: "Clock" },
      { key: "spese", label: "Spese", icon: "Receipt" },
    ],
  },
  {
    category: "Materiali",
    items: [
      { key: "materiali", label: "Materiali", icon: "Package" },
      { key: "servizi", label: "Servizi", icon: "Wrench" },
      { key: "richieste", label: "Richieste", icon: "ShoppingCart" },
      { key: "stock", label: "Stock Cantiere", icon: "Warehouse" },
    ],
  },
  {
    category: "Analisi",
    items: [
      { key: "disponibilita", label: "Disponibilità", icon: "BarChart2" },
      { key: "ordini", label: "Lista Ordine", icon: "ClipboardList" },
      { key: "segnalazioni", label: "Segnalazioni", icon: "AlertTriangle" },
      { key: "final-balance", label: "Consuntivi", icon: "Scale" },
      { key: "project-summary", label: "Riepilogo P&L", icon: "TrendingUp" },
    ],
  },
];

interface ProjectSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

function SidebarContent({
  activeTab,
  onTabChange,
  onItemClick,
}: ProjectSidebarProps & { onItemClick?: () => void }) {
  return (
    <div className="space-y-6">
      {PROJECT_NAV_GROUPS.map((group) => (
        <div key={group.category}>
          <h3 className="px-3 mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {group.category}
          </h3>
          <nav className="space-y-0.5">
            {group.items.map((item) => {
              const Icon =
                iconMap[item.icon as keyof typeof iconMap] || Building2;
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    onTabChange(item.key);
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

export function ProjectDesktopSidebar({
  activeTab,
  onTabChange,
}: ProjectSidebarProps) {
  return (
    <aside className="hidden md:block w-52 shrink-0">
      <div className="sticky top-6">
        <SidebarContent activeTab={activeTab} onTabChange={onTabChange} />
      </div>
    </aside>
  );
}

export function ProjectMobileNav({
  activeTab,
  onTabChange,
}: ProjectSidebarProps) {
  return (
    <div className="md:hidden w-full overflow-x-auto scrollbar-none border-b border-slate-200 dark:border-slate-800 pb-2 mb-2">
      <div className="flex gap-1 min-w-max px-1">
        {PROJECT_NAV_GROUPS.flatMap((group) =>
          group.items.map((item) => {
            const Icon =
              iconMap[item.icon as keyof typeof iconMap] || Building2;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onTabChange(item.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50",
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {item.label}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}

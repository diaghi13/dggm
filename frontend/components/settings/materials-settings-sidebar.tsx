"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Settings,
  Building2,
  Users,
  Shield,
  Package,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const iconMap = {
  Settings,
  Building2,
  Users,
  Shield,
  Package,
};

// Definizione dei gruppi per settings materiali
export const MATERIALS_SETTINGS_GROUPS = [
  {
    category: "Materiali",
    items: [
      { key: "categories", label: "Categorie", icon: "Package" },
      { key: "dependency-types", label: "Tipi Dipendenza", icon: "Settings" },
    ],
  },
  {
    category: "Sistema",
    items: [
      { key: "users", label: "Utenti", icon: "Users" },
      { key: "company", label: "Azienda", icon: "Building2" },
    ],
  },
];

interface MaterialsSettingsSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

// Componente interno per il contenuto della sidebar (riutilizzabile)
function SidebarContent({
  activeTab,
  onTabChange,
  onItemClick,
}: MaterialsSettingsSidebarProps & { onItemClick?: () => void }) {
  return (
    <div className="space-y-6">
      {MATERIALS_SETTINGS_GROUPS.map((group) => (
        <div key={group.category}>
          {/* Category Label */}
          <h3 className="px-3 mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {group.category}
          </h3>

          {/* Items */}
          <nav className="space-y-0.5">
            {group.items.map((item) => {
              const Icon =
                iconMap[item.icon as keyof typeof iconMap] || Settings;
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

export function MaterialsSettingsSidebar({
  activeTab,
  onTabChange,
}: MaterialsSettingsSidebarProps) {
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

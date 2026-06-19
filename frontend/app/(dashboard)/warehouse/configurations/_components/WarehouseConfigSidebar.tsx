"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Bookmark, FolderOpen, Share2, Menu, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV_ITEMS = [
  { key: "brands", label: "Brand", icon: Bookmark },
  { key: "categories", label: "Categorie prodotto", icon: FolderOpen },
  { key: "relation-types", label: "Tipi relazione", icon: Share2 },
] as const;

interface Props {
  activeSection: string;
  onNavClick: (key: string) => void;
}

function SidebarContent({
  activeSection,
  onNavClick,
  onItemClick,
}: Props & { onItemClick?: () => void }) {
  return (
    <div className="space-y-0.5">
      <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Configurazioni
      </p>
      {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => {
            onNavClick(key);
            onItemClick?.();
          }}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
            "hover:bg-slate-100 dark:hover:bg-slate-800/50",
            activeSection === key
              ? "bg-primary text-primary-foreground hover:bg-primary/90 dark:hover:bg-primary/90 shadow-sm"
              : "text-slate-700 dark:text-slate-300",
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="truncate text-left">{label}</span>
        </button>
      ))}
    </div>
  );
}

export function WarehouseConfigSidebar({ activeSection, onNavClick }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <aside className="hidden md:block w-52 shrink-0">
        <SidebarContent activeSection={activeSection} onNavClick={onNavClick} />
      </aside>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="default"
            size="icon"
            className="fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full shadow-2xl md:hidden"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Navigazione</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurazioni
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <SidebarContent
              activeSection={activeSection}
              onNavClick={onNavClick}
              onItemClick={() => setIsOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

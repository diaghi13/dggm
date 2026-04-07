"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeSettings } from "@/hooks/use-settings";
import { usePermissions } from "@/hooks/use-permissions";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { User, Settings, LogOut, ChevronRight, CreditCard } from "lucide-react";

export function UserMenuMobile() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { primaryColor } = useThemeSettings();
  const { isAdmin } = usePermissions();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const menuItems = useMemo(() => {
    const items = [
      {
        label: "Account",
        icon: User,
        onClick: () => {
          setOpen(false);
          router.push("/profile");
        },
      },
      {
        label: "Impostazioni",
        icon: Settings,
        onClick: () => {
          setOpen(false);
          router.push("/settings-index");
        },
      },
    ];

    if (isAdmin()) {
      items.push({
        label: "Abbonamento",
        icon: CreditCard,
        onClick: () => {
          setOpen(false);
          router.push("/dashboard/subscription");
        },
      });
    }

    return items;
  }, [isAdmin, router]);

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback
              className="text-white text-sm font-semibold"
              style={{ backgroundColor: primaryColor }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle className="sr-only">Menu Utente</SheetTitle>
        </SheetHeader>

        {/* User Info */}
        <div className="flex items-center gap-3 py-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback
              className="text-white text-lg font-semibold"
              style={{ backgroundColor: primaryColor }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </div>

        <Separator />

        {/* Menu Items */}
        <div className="py-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.label}
                variant="ghost"
                className="w-full justify-start"
                onClick={item.onClick}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.label}
                <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
              </Button>
            );
          })}
        </div>

        <Separator />

        {/* Logout */}
        <div className="py-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Esci
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

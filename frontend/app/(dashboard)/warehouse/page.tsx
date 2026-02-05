"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import {
  Package,
  Warehouse,
  BarChart3,
  TrendingUp,
  FileCheck,
} from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";

const warehouseItems = [
  {
    title: "Prodotti",
    description: "Gestisci i prodotti",
    icon: Package,
    href: "/products",
    permission: "materials.view",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/20",
  },
  {
    title: "Magazzini",
    description: "Gestisci i magazzini",
    icon: Warehouse,
    href: "/warehouses",
    permission: "warehouse.view",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/20",
  },
  {
    title: "Inventario",
    description: "Visualizza l'inventario",
    icon: BarChart3,
    href: "/inventory",
    permission: "warehouse.inventory",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/20",
  },
  {
    title: "Movimenti",
    description: "Movimenti di stock",
    icon: TrendingUp,
    href: "/stock-movements",
    permission: "warehouse.view",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/20",
  },
  {
    title: "DDT",
    description: "Documenti di trasporto",
    icon: FileCheck,
    href: "/ddts",
    permission: "ddts.view",
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-100 dark:bg-cyan-900/20",
  },
];

export default function WarehousePage() {
  const router = useRouter();
  const { hasAnyPermission } = usePermissions();

  const visibleItems = warehouseItems.filter((item) => {
    if (!item.permission) return true;
    return hasAnyPermission([item.permission]);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Magazzino</h1>
        <p className="text-muted-foreground mt-1">
          Gestisci prodotti, inventario e movimenti
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.href}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(item.href)}
            >
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${item.bgColor}`}>
                    <Icon className={`h-6 w-6 ${item.color}`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {item.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

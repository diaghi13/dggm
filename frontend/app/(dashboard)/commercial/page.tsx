"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { FileText, FileCheck } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";

const commercialItems = [
  {
    title: "Preventivi",
    description: "Gestisci i preventivi",
    icon: FileText,
    href: "/quotes",
    permission: ["quotes.view", "quotes.view-own"],
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/20",
  },
  {
    title: "SAL",
    description: "Stati avanzamento lavori",
    icon: FileCheck,
    href: "/sals",
    permission: "sals.view",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/20",
  },
];

export default function CommercialPage() {
  const router = useRouter();
  const { hasAnyPermission } = usePermissions();

  const visibleItems = commercialItems.filter((item) => {
    if (!item.permission) return true;
    return hasAnyPermission(
      Array.isArray(item.permission) ? item.permission : [item.permission],
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Commerciale</h1>
        <p className="text-muted-foreground mt-1">
          Gestisci preventivi e stati avanzamento lavori
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

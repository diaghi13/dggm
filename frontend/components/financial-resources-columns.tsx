"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { FinancialResource } from "@/lib/api/financial-resources";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Trash2,
  Building2,
  Wallet,
  CreditCard,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { AvatarTextCell } from "@/components/table-cells";

export const createFinancialResourcesColumns = (
  onEdit: (resource: FinancialResource) => void,
  onDelete: (resource: FinancialResource) => void,
): ColumnDef<FinancialResource>[] => [
  {
    accessorKey: "type",
    header: "Tipo",
    size: 150,
    cell: ({ row }) => {
      const type = row.original.type;
      const getTypeConfig = () => {
        switch (type) {
          case "bank_account":
            return {
              label: "Conto Bancario",
              icon: Building2,
              className:
                "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
            };
          case "cash":
            return {
              label: "Cassa",
              icon: Wallet,
              className:
                "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
            };
          case "card":
            return {
              label: "Carta/POS",
              icon: CreditCard,
              className:
                "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
            };
          default:
            return {
              label: "-",
              icon: Wallet,
              className:
                "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
            };
        }
      };
      const config = getTypeConfig();
      const Icon = config.icon;
      return (
        <Badge
          variant="secondary"
          className={`${config.className} font-medium`}
        >
          <Icon className="h-3 w-3 mr-1" />
          {config.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "name",
    header: "Nome",
    size: 250,
    enableHiding: false,
    cell: ({ row }) => {
      const type = row.original.type;
      const Icon =
        type === "bank_account"
          ? Building2
          : type === "cash"
            ? Wallet
            : CreditCard;
      return <AvatarTextCell icon={Icon} primaryText={row.original.name} />;
    },
  },
  {
    accessorKey: "details",
    header: "Dettagli",
    size: 300,
    cell: ({ row }) => {
      const { type, details } = row.original;
      const detailsObj = details as unknown as Record<string, string> | null;

      if (type === "bank_account" && detailsObj) {
        return (
          <div className="space-y-1 text-sm">
            {detailsObj.bank_name && (
              <div className="text-slate-700 dark:text-slate-300 font-medium">
                {detailsObj.bank_name}
              </div>
            )}
            {detailsObj.iban && (
              <div className="text-slate-500 dark:text-slate-400 font-mono text-xs">
                {detailsObj.iban}
              </div>
            )}
          </div>
        );
      }

      if (type === "cash" && detailsObj?.location) {
        return (
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {detailsObj.location}
          </div>
        );
      }

      if (type === "card" && detailsObj) {
        return (
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {detailsObj.card_type && detailsObj.provider
              ? `${detailsObj.card_type} - ${detailsObj.provider}`
              : detailsObj.card_type || detailsObj.provider || "-"}
            {detailsObj.last_digits && (
              <span className="ml-2 font-mono">
                ****{detailsObj.last_digits}
              </span>
            )}
          </div>
        );
      }

      return <span className="text-slate-400 dark:text-slate-600">-</span>;
    },
  },
  {
    accessorKey: "description",
    header: "Descrizione",
    size: 200,
    cell: ({ row }) => {
      const description = row.original.description;
      return description ? (
        <div className="text-sm text-slate-600 dark:text-slate-400">
          {description}
        </div>
      ) : (
        <span className="text-slate-400 dark:text-slate-600">-</span>
      );
    },
  },
  {
    accessorKey: "is_active",
    header: "Stato",
    size: 100,
    cell: ({ row }) => {
      const isActive = row.original.is_active;
      return isActive ? (
        <Badge
          variant="default"
          className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        >
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Attivo
        </Badge>
      ) : (
        <Badge
          variant="secondary"
          className="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
        >
          <XCircle className="h-3 w-3 mr-1" />
          Inattivo
        </Badge>
      );
    },
  },
  {
    accessorKey: "is_default",
    header: "Default",
    size: 100,
    cell: ({ row }) => {
      const isDefault = row.original.is_default;
      return isDefault ? (
        <Badge
          variant="outline"
          className="border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400"
        >
          ⭐ Preferito
        </Badge>
      ) : (
        <span className="text-slate-400 dark:text-slate-600">-</span>
      );
    },
  },
  {
    id: "actions",
    header: "Azioni",
    size: 120,
    enableHiding: false,
    cell: ({ row }) => {
      const resource = row.original;
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(resource)}
            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(resource)}
            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];

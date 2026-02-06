"use client";

import { ColumnDef } from "@tanstack/react-table";
import { PriceList } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Eye,
  Trash2,
  DollarSign,
  RefreshCw,
} from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { AvatarTextCell, TextCell } from "@/components/table-cells";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export const createPriceListsColumns = (
  onEdit: (priceList: PriceList) => void,
  onDelete: (priceList: PriceList) => void,
  onView: (priceList: PriceList) => void,
  onRegenerate?: (priceList: PriceList) => void,
): ColumnDef<PriceList>[] => [
  {
    accessorKey: "code",
    header: "Codice",
    size: 140,
    enableHiding: false,
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <AvatarTextCell
          icon={DollarSign}
          primaryText={row.original.code}
        />
        {row.original.is_default && (
          <Badge
            variant="secondary"
            className="text-xs w-fit bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          >
            Default
          </Badge>
        )}
      </div>
    ),
  },
  {
    accessorKey: "name",
    header: "Nome Listino",
    size: 250,
    cell: ({ row }) => <TextCell text={row.original.name} bold />,
  },
  {
    accessorKey: "applies_to",
    header: "Applica A",
    size: 130,
    cell: ({ row }) => {
      const type = row.original.applies_to;
      const config = {
        sale: {
          label: "Vendita",
          className:
            "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        },
        rental: {
          label: "Noleggio",
          className:
            "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        },
        both: {
          label: "Entrambi",
          className:
            "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
        },
      }[type];
      return (
        <Badge variant="secondary" className={`${config.className} font-medium`}>
          {config.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "calculation_mode",
    header: "Modalità",
    size: 130,
    cell: ({ row }) => {
      const mode = row.original.calculation_mode;
      const config = {
        automatic: {
          label: "Automatico",
          className:
            "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
        },
        manual: {
          label: "Manuale",
          className:
            "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
        },
      }[mode];
      return (
        <Badge variant="outline" className={`${config.className} font-normal`}>
          {config.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "adjustment_value",
    header: "Aggiustamento",
    size: 150,
    cell: ({ row }) => {
      const { adjustment_type, adjustment_value } = row.original;
      if (adjustment_type === "none" || !adjustment_value) {
        return <span className="text-slate-400 dark:text-slate-600">-</span>;
      }
      const symbol = adjustment_type === "percentage" ? "%" : "€";
      const prefix = adjustment_value > 0 ? "+" : "";
      return (
        <div className="font-medium text-slate-900 dark:text-slate-100">
          {`${prefix}${adjustment_value}${symbol}`}
        </div>
      );
    },
  },
  {
    accessorKey: "valid_from",
    header: "Valido Dal",
    size: 120,
    cell: ({ row }) => {
      const date = row.original.valid_from;
      if (!date) {
        return <span className="text-slate-400 dark:text-slate-600">-</span>;
      }
      return (
        <div className="text-slate-600 dark:text-slate-400">
          {format(new Date(date), "dd/MM/yyyy", { locale: it })}
        </div>
      );
    },
  },
  {
    accessorKey: "valid_to",
    header: "Valido Al",
    size: 120,
    cell: ({ row }) => {
      const date = row.original.valid_to;
      if (!date) {
        return <span className="text-slate-400 dark:text-slate-600">-</span>;
      }
      const isExpired = new Date(date) < new Date();
      return (
        <div
          className={
            isExpired
              ? "text-red-600 dark:text-red-400 font-medium"
              : "text-slate-600 dark:text-slate-400"
          }
        >
          {format(new Date(date), "dd/MM/yyyy", { locale: it })}
        </div>
      );
    },
  },
  {
    accessorKey: "priority",
    header: () => <div className="text-center">Priorità</div>,
    size: 100,
    cell: ({ row }) => (
      <div className="text-center">
        <Badge variant="outline" className="font-mono">
          {row.original.priority}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "items",
    header: () => <div className="text-right">Prodotti</div>,
    size: 100,
    cell: ({ row }) => (
      <div className="text-right font-medium text-slate-900 dark:text-slate-100">
        {row.original.items?.length || 0}
      </div>
    ),
  },
  {
    accessorKey: "is_active",
    header: "Stato",
    size: 100,
    cell: ({ row }) => <StatusBadge active={row.original.is_active ?? false} />,
  },
  {
    id: "actions",
    header: () => <div className="text-right">Azioni</div>,
    size: 140,
    enableHiding: false,
    enableSorting: false,
    cell: ({ row }) => {
      const priceList = row.original;
      return (
        <div className="flex justify-end gap-1">
          {onRegenerate && priceList.calculation_mode === "automatic" && (
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={(e) => {
                e.stopPropagation();
                onRegenerate(priceList);
              }}
              title="Rigenera listino"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={(e) => {
              e.stopPropagation();
              onView(priceList);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(priceList);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-400"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(priceList);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];

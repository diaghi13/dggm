"use client";

import { ColumnDef } from "@tanstack/react-table";
import { PriceListItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Package, Trash2, RefreshCw } from "lucide-react";
import { AvatarTextCell } from "@/components/table-cells";
import { CurrencyDisplay } from "@/components/ui/currency-input";

export const createPriceListItemsColumns = (
  onEdit: (item: PriceListItem) => void,
  onDelete: (item: PriceListItem) => void,
  onRecalculate: (item: PriceListItem) => void,
  appliesTo: "sale" | "rental" | "both",
  showAdvancedRentalColumns: boolean = false,
): ColumnDef<PriceListItem>[] => {
  const columns: ColumnDef<PriceListItem>[] = [
    {
      accessorKey: "product.code",
      header: "Codice",
      cell: ({ row }) => {
        const productType = row.original.product?.product_type;
        let badge = null;

        if (productType === "service") {
          badge = (
            <Badge
              variant="outline"
              className="ml-1 text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
            >
              Servizio
            </Badge>
          );
        } else if (productType === "composite") {
          badge = (
            <Badge
              variant="outline"
              className="ml-1 text-xs bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800"
            >
              Composito
            </Badge>
          );
        }

        return (
          <div className="flex items-center gap-1">
            <AvatarTextCell
              icon={Package}
              primaryText={row.original.product?.code || "-"}
              secondaryText={row.original.product?.name || ""}
            />
            {badge}
          </div>
        );
      },
    },
    {
      accessorKey: "product.name",
      header: "Prodotto",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.product?.name || "-"}</span>
      ),
    },
  ];

  // Colonne prezzi vendita
  if (appliesTo === "sale" || appliesTo === "both") {
    columns.push({
      accessorKey: "final_sale_price",
      header: "Prezzo Vendita",
      cell: ({ row }) => {
        const price = row.original.final_sale_price || row.original.sale_price;
        return (
          <div className="text-right">
            <div className="font-medium">
              <CurrencyDisplay value={price} />
            </div>
            {row.original.is_manual_price && (
              <Badge variant="outline" className="text-xs mt-1">
                Manuale
              </Badge>
            )}
          </div>
        );
      },
    });
  }

  // Colonne noleggio base (sempre visibili se applies_to include rental)
  if (appliesTo === "rental" || appliesTo === "both") {
    // Colonne avanzate (opzionali): orario e mezza giornata — prima del giornaliero
    if (showAdvancedRentalColumns) {
      columns.push(
        {
          accessorKey: "final_rental_hourly",
          header: "Orario",
          cell: ({ row }) => {
            const price =
              row.original.final_rental_hourly || row.original.rental_hourly;
            return (
              <div className="text-right text-slate-700 dark:text-slate-300">
                <CurrencyDisplay value={price} />
              </div>
            );
          },
        },
        {
          accessorKey: "final_rental_half_day",
          header: "½ Giorno",
          cell: ({ row }) => {
            const price =
              row.original.final_rental_half_day ||
              row.original.rental_half_day;
            return (
              <div className="text-right text-slate-700 dark:text-slate-300">
                <CurrencyDisplay value={price} />
              </div>
            );
          },
        },
      );
    }

    // Colonne base sempre visibili: giornaliero e settimanale
    columns.push(
      {
        accessorKey: "final_rental_daily",
        header: "Giornaliero",
        cell: ({ row }) => {
          const price =
            row.original.final_rental_daily || row.original.rental_daily;
          return (
            <div className="text-right font-medium">
              <CurrencyDisplay value={price} />
            </div>
          );
        },
      },
      {
        accessorKey: "final_rental_weekly",
        header: "Settimanale",
        cell: ({ row }) => {
          const price =
            row.original.final_rental_weekly || row.original.rental_weekly;
          return (
            <div className="text-right text-slate-700 dark:text-slate-300">
              <CurrencyDisplay value={price} />
            </div>
          );
        },
      },
    );

    // Colonne avanzate (opzionali): mensile e stagionale — dopo il settimanale
    if (showAdvancedRentalColumns) {
      columns.push(
        {
          accessorKey: "final_rental_monthly",
          header: "Mensile",
          cell: ({ row }) => {
            const price =
              row.original.final_rental_monthly || row.original.rental_monthly;
            return (
              <div className="text-right text-slate-700 dark:text-slate-300">
                <CurrencyDisplay value={price} />
              </div>
            );
          },
        },
        {
          accessorKey: "final_rental_seasonal",
          header: "Stagionale",
          cell: ({ row }) => {
            const price =
              row.original.final_rental_seasonal ||
              row.original.rental_seasonal;
            return (
              <div className="text-right text-slate-700 dark:text-slate-300">
                <CurrencyDisplay value={price} />
              </div>
            );
          },
        },
      );
    }

    // Badge Manuale/Auto per rental — visibile sia per "rental" che per "both"
    columns.push({
      id: "rental_type",
      header: "Tipo Noleggio",
      cell: ({ row }) =>
        row.original.is_manual_rental ? (
          <Badge variant="outline">Manuale</Badge>
        ) : (
          <Badge variant="secondary">Auto</Badge>
        ),
    });
  }

  // Colonna stato
  columns.push({
    accessorKey: "is_active",
    header: "Stato",
    cell: ({ row }) =>
      row.original.is_active ? (
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          Attivo
        </Badge>
      ) : (
        <Badge variant="secondary">Inattivo</Badge>
      ),
  });

  // Colonna azioni
  columns.push({
    id: "actions",
    header: "Azioni",
    size: 120,
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(row.original)}
          title="Modifica prezzi"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRecalculate(row.original)}
          title="Ricalcola prezzi"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(row.original)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
          title="Rimuovi dal listino"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ),
  });

  return columns;
};

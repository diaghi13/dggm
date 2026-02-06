"use client";

import { ColumnDef } from "@tanstack/react-table";
import { PriceListItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Package, Trash2, RefreshCw } from "lucide-react";
import { AvatarTextCell } from "@/components/table-cells";

export const createPriceListItemsColumns = (
  onEdit: (item: PriceListItem) => void,
  onDelete: (item: PriceListItem) => void,
  onRecalculate: (item: PriceListItem) => void,
  appliesTo: "sale" | "rental" | "both"
): ColumnDef<PriceListItem>[] => {
  const columns: ColumnDef<PriceListItem>[] = [
    {
      accessorKey: "product.code",
      header: "Codice",
      cell: ({ row }) => {
        const productType = row.original.product?.product_type;
        let badge = null;
        
        if (productType === 'service') {
          badge = (
            <Badge variant="outline" className="ml-1 text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
              Servizio
            </Badge>
          );
        } else if (productType === 'composite') {
          badge = (
            <Badge variant="outline" className="ml-1 text-xs bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800">
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

  // Aggiungi colonne prezzi vendita se applicabile
  if (appliesTo === "sale" || appliesTo === "both") {
    columns.push({
      accessorKey: "final_sale_price",
      header: "Prezzo Vendita",
      cell: ({ row }) => {
        const price = row.original.final_sale_price || row.original.sale_price;
        return (
          <div className="text-right">
            <div className="font-medium">
              {price ? `€ ${price.toFixed(2)}` : "-"}
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

  // Aggiungi colonne prezzi noleggio se applicabile
  if (appliesTo === "rental" || appliesTo === "both") {
    columns.push(
      {
        accessorKey: "final_rental_daily",
        header: "Noleggio Giorn.",
        cell: ({ row }) => {
          const price =
            row.original.final_rental_daily || row.original.rental_daily;
          return (
            <div className="text-right">
              {price ? `€ ${price.toFixed(2)}` : "-"}
            </div>
          );
        },
      },
      {
        accessorKey: "final_rental_weekly",
        header: "Noleggio Sett.",
        cell: ({ row }) => {
          const price =
            row.original.final_rental_weekly || row.original.rental_weekly;
          return (
            <div className="text-right">
              {price ? `€ ${price.toFixed(2)}` : "-"}
            </div>
          );
        },
      },
      {
        accessorKey: "final_rental_monthly",
        header: "Noleggio Mens.",
        cell: ({ row }) => {
          const price =
            row.original.final_rental_monthly || row.original.rental_monthly;
          return (
            <div className="text-right">
              {price ? `€ ${price.toFixed(2)}` : "-"}
            </div>
          );
        },
      }
    );

    // Badge per prezzi noleggio manuali
    if (appliesTo === "rental") {
      columns.push({
        id: "rental_type",
        header: "Tipo",
        cell: ({ row }) =>
          row.original.is_manual_rental ? (
            <Badge variant="outline">Manuale</Badge>
          ) : (
            <Badge variant="secondary">Auto</Badge>
          ),
      });
    }
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

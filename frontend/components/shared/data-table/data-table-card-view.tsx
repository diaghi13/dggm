"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUISettings } from "@/hooks/use-settings";

interface DataTableCardViewProps<TData, TValue = unknown> {
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  onRowClick?: (row: TData) => void;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  highlightedColumns?: string[]; // Columns to show prominently at top
}

export function DataTableCardView<TData, TValue = unknown>({
  data,
  columns,
  onRowClick,
  isLoading,
  emptyState,
  highlightedColumns = [],
}: DataTableCardViewProps<TData, TValue>) {
  const [expandedRows, setExpandedRows] = React.useState<Set<number>>(
    new Set(),
  );
  const { primaryColor = "#3b82f6" } = useUISettings();

  const toggleRow = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  // Filter out action columns and separate highlighted columns
  const dataColumns = columns.filter(
    (col) => !("id" in col && col.id === "actions"),
  );

  // If no highlighted columns specified, use first 2-3 columns automatically
  const autoHighlightedColumns =
    highlightedColumns.length === 0
      ? dataColumns
          .slice(0, 3)
          .map((col) => {
            if ("accessorKey" in col) return col.accessorKey as string;
            if ("id" in col) return col.id as string;
            return "";
          })
          .filter(Boolean)
      : highlightedColumns;

  const highlighted = dataColumns.filter(
    (col) =>
      ("accessorKey" in col &&
        autoHighlightedColumns.includes(col.accessorKey as string)) ||
      ("id" in col && autoHighlightedColumns.includes(col.id as string)),
  );

  const remaining = dataColumns.filter(
    (col) =>
      !(
        "accessorKey" in col &&
        autoHighlightedColumns.includes(col.accessorKey as string)
      ) && !("id" in col && autoHighlightedColumns.includes(col.id as string)),
  );

  const actionsColumn = columns.find(
    (col) => "id" in col && col.id === "actions",
  );

  const getColumnValue = (
    row: TData,
    column: ColumnDef<TData, TValue>,
    rowIndex: number,
  ) => {
    // If column has a custom cell renderer, use it (preserves badges, links, icons, etc.)
    if ("cell" in column && column.cell) {
      if (typeof column.cell === "function") {
        // Pass full context to cell renderer so it works exactly like in table
        return column.cell({
          row: {
            original: row,
            index: rowIndex,
            id: String(rowIndex),
          },
          column: { id: "id" in column ? column.id : "" },
          getValue: () => {
            if ("accessorKey" in column && column.accessorKey) {
              return (row as Record<string, unknown>)[
                column.accessorKey as string
              ];
            }
            return undefined;
          },
        } as never);
      }
    }

    // Fallback to raw value
    if ("accessorKey" in column && column.accessorKey) {
      const value = (row as Record<string, unknown>)[
        column.accessorKey as string
      ];
      // Handle various data types
      if (value === null || value === undefined) return "-";
      if (typeof value === "boolean") return value ? "Sì" : "No";
      if (
        typeof value === "object" &&
        value !== null &&
        "name" in value &&
        typeof value.name === "string"
      )
        return value.name;
      return String(value);
    }

    return null;
  };

  const getColumnHeader = (column: ColumnDef<TData, TValue>) => {
    if ("header" in column) {
      if (typeof column.header === "string") {
        return column.header;
      }
      // If header is a function, try to render it and extract text
      if (typeof column.header === "function") {
        try {
          const rendered = column.header({} as never);
          // If it returns a string, use it
          if (typeof rendered === "string") {
            return rendered;
          }
          // If it's a React element, try to extract text content
          if (rendered && typeof rendered === "object" && "props" in rendered) {
            // Try to get children text
            if (rendered.props?.children) {
              if (typeof rendered.props.children === "string") {
                return rendered.props.children;
              }
            }
          }
        } catch {
          // If rendering fails, continue to fallback
        }
      }
    }
    // Fallback to accessorKey or id, but format it nicely
    if ("accessorKey" in column) {
      const key = String(column.accessorKey);
      // Convert snake_case or camelCase to Title Case
      return key
        .replace(/_/g, " ")
        .replace(/([A-Z])/g, " $1")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
        .trim();
    }
    if ("id" in column) {
      const id = column.id || "";
      return id
        .replace(/_/g, " ")
        .replace(/([A-Z])/g, " $1")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
        .trim();
    }
    return "";
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-8 text-center">
        {emptyState || (
          <div className="text-slate-600 dark:text-slate-400">
            Nessun risultato trovato.
          </div>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((row, index) => {
        const isExpanded = expandedRows.has(index);

        return (
          <Card
            key={index}
            className={cn(
              "overflow-hidden transition-all duration-200",
              onRowClick && "cursor-pointer hover:shadow-md",
              "border-slate-200 dark:border-slate-800",
            )}
          >
            {/* Card Header - Highlighted Fields */}
            <div
              className="p-4 space-y-2"
              onClick={() => onRowClick?.(row)}
              style={{
                background: `linear-gradient(135deg, ${primaryColor}08 0%, transparent 100%)`,
              }}
            >
              {highlighted.length > 0 ? (
                highlighted.map((col, colIndex) => (
                  <div key={colIndex} className="break-words">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                      {getColumnHeader(col)}
                    </div>
                    <div className="text-base font-semibold text-slate-900 dark:text-slate-100 [&>*]:inline-flex [&>*]:items-center [&>*]:gap-1">
                      {getColumnValue(row, col, index)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Elemento {index + 1}
                </div>
              )}

              {/* Actions in header if available */}
              {actionsColumn && (
                <div className="pt-2 flex items-center justify-between">
                  <div onClick={(e) => e.stopPropagation()}>
                    {getColumnValue(row, actionsColumn, index)}
                  </div>

                  {remaining.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRow(index);
                      }}
                      className="h-8 -mr-2"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          <span className="text-xs">Chiudi</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          <span className="text-xs">Dettagli</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}

              {!actionsColumn && remaining.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRow(index);
                  }}
                  className="h-8 w-full mt-2"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      <span className="text-xs">Chiudi dettagli</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      <span className="text-xs">Mostra tutti i dettagli</span>
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Collapsible Details */}
            {isExpanded && remaining.length > 0 && (
              <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="p-4 space-y-3">
                  {remaining.map((col, colIndex) => (
                    <div
                      key={colIndex}
                      className="flex items-start justify-between gap-4 text-sm"
                    >
                      <div className="font-medium text-slate-600 dark:text-slate-400 min-w-[120px] flex-shrink-0">
                        {getColumnHeader(col)}
                      </div>
                      <div className="text-slate-900 dark:text-slate-100 text-right flex-1 break-words">
                        {getColumnValue(row, col, index)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

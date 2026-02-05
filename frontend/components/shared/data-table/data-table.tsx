"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  ColumnSizingState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Settings2,
  Eye,
  EyeOff,
  RotateCcw,
  AlertCircle,
  Table as TableIcon,
  LayoutGrid,
} from "lucide-react";
import { useUISettings } from "@/hooks/use-settings";
import { DataTableCardView } from "./data-table-card-view";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  onRowClick?: (row: TData) => void;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  storageKey: string; // Required unique key for localStorage persistence
  pagination?: {
    page: number;
    perPage: number;
    total: number;
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: number) => void;
  };
  mobileHiddenColumns?: string[]; // Column IDs to hide on mobile (< 1024px)
  mobileCardView?: boolean; // Enable card view on mobile (default: true)
  mobileCardHighlightedColumns?: string[]; // Columns to highlight in card view
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowClick,
  isLoading,
  emptyState,
  storageKey,
  pagination: serverPagination,
  mobileHiddenColumns = [],
  mobileCardView = true,
  mobileCardHighlightedColumns = [],
}: DataTableProps<TData, TValue>) {
  const { itemsPerPage: defaultItemsPerPage } = useUISettings();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({});
  const [pageSize, setPageSize] = React.useState(defaultItemsPerPage || 10);
  const [isStateLoaded, setIsStateLoaded] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<"table" | "cards">("cards");

  // Detect mobile viewport
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Apply mobile column hiding
  React.useEffect(() => {
    if (isMobile && mobileHiddenColumns.length > 0) {
      setColumnVisibility((prev) => {
        const newVisibility = { ...prev };
        mobileHiddenColumns.forEach((colId) => {
          newVisibility[colId] = false;
        });
        return newVisibility;
      });
    } else if (!isMobile && mobileHiddenColumns.length > 0) {
      // Restore columns when switching to desktop
      setColumnVisibility((prev) => {
        const newVisibility = { ...prev };
        mobileHiddenColumns.forEach((colId) => {
          if (newVisibility[colId] === false) {
            delete newVisibility[colId]; // Remove from visibility (default to visible)
          }
        });
        return newVisibility;
      });
    }
  }, [isMobile, mobileHiddenColumns]);

  // Calculate default sizing from columns
  const defaultSizing = React.useMemo(() => {
    const sizing: ColumnSizingState = {};
    columns.forEach((col) => {
      if (
        "accessorKey" in col &&
        col.accessorKey &&
        "size" in col &&
        col.size
      ) {
        sizing[col.accessorKey as string] = col.size as number;
      } else if ("id" in col && col.id && "size" in col && col.size) {
        sizing[col.id] = col.size as number;
      }
    });
    return sizing;
  }, [columns]);

  // Load persisted state from localStorage on mount only
  React.useEffect(() => {
    if (typeof window !== "undefined" && storageKey && !isStateLoaded) {
      try {
        const saved = localStorage.getItem(`${storageKey}-visibility`);
        if (saved) {
          setColumnVisibility(JSON.parse(saved));
        }
        const savedSizing = localStorage.getItem(`${storageKey}-sizing`);
        if (savedSizing) {
          setColumnSizing(JSON.parse(savedSizing));
        }
        const savedPageSize = localStorage.getItem(`${storageKey}-pageSize`);
        if (savedPageSize) {
          setPageSize(parseInt(savedPageSize, 10));
        }
      } catch (error) {
        console.error("Error loading table state:", error);
      } finally {
        setIsStateLoaded(true);
      }
    }
  }, [storageKey, isStateLoaded]);

  // Save state to localStorage when it changes (but only after initial load)
  React.useEffect(() => {
    if (typeof window !== "undefined" && storageKey && isStateLoaded) {
      try {
        localStorage.setItem(
          `${storageKey}-visibility`,
          JSON.stringify(columnVisibility),
        );
      } catch (error) {
        console.error("Error saving table visibility:", error);
      }
    }
  }, [columnVisibility, storageKey, isStateLoaded]);

  React.useEffect(() => {
    if (typeof window !== "undefined" && storageKey && isStateLoaded) {
      try {
        localStorage.setItem(
          `${storageKey}-sizing`,
          JSON.stringify(columnSizing),
        );
      } catch (error) {
        console.error("Error saving table sizing:", error);
      }
    }
  }, [columnSizing, storageKey, isStateLoaded]);

  React.useEffect(() => {
    if (typeof window !== "undefined" && storageKey && isStateLoaded) {
      try {
        localStorage.setItem(`${storageKey}-pageSize`, pageSize.toString());
      } catch (error) {
        console.error("Error saving page size:", error);
      }
    }
  }, [pageSize, storageKey, isStateLoaded]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: serverPagination
      ? undefined
      : getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    columnResizeDirection: "ltr",
    manualPagination: !!serverPagination,
    pageCount: serverPagination
      ? Math.ceil(serverPagination.total / serverPagination.perPage)
      : undefined,
    defaultColumn: {
      minSize: 50,
      maxSize: 1000,
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      columnSizing:
        Object.keys(columnSizing).length > 0 ? columnSizing : defaultSizing,
      pagination: {
        pageIndex: serverPagination ? serverPagination.page - 1 : 0,
        pageSize: serverPagination ? serverPagination.perPage : pageSize,
      },
    },
    initialState: {
      pagination: {
        pageSize: serverPagination ? serverPagination.perPage : pageSize,
      },
    },
  });

  // Check if there are hidden columns
  const hiddenColumnsCount = React.useMemo(() => {
    return table
      .getAllColumns()
      .filter((col) => !col.getIsVisible() && col.getCanHide()).length;
  }, [table, columnVisibility]);

  // Reset table to default state
  const handleReset = React.useCallback(() => {
    setColumnVisibility({});
    setColumnSizing(defaultSizing);
    setSorting([]);
    setPageSize(defaultItemsPerPage || 10);

    if (typeof window !== "undefined" && storageKey) {
      localStorage.removeItem(`${storageKey}-visibility`);
      localStorage.removeItem(`${storageKey}-sizing`);
      localStorage.removeItem(`${storageKey}-pageSize`);
    }
  }, [storageKey, defaultSizing]);

  return (
    <div className="space-y-4">
      {/* Hidden Columns Alert */}
      {hiddenColumnsCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <p className="text-sm text-blue-700 dark:text-blue-300 flex-1">
            {hiddenColumnsCount}{" "}
            {hiddenColumnsCount === 1 ? "colonna nascosta" : "colonne nascoste"}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-8 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50"
          >
            <RotateCcw className="mr-2 h-3.5 w-3.5" />
            Ripristina
          </Button>
        </div>
      )}

      {/* Column Visibility Controls */}
      <div className="flex items-center justify-between gap-2">
        {/* Mobile View Toggle */}
        {mobileCardView && isMobile && (
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <Button
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
              className="h-8 px-3"
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              <span className="text-xs">Cards</span>
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="h-8 px-3"
            >
              <TableIcon className="h-4 w-4 mr-1" />
              <span className="text-xs">Tabella</span>
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="h-9 border-slate-300 dark:border-slate-700"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 border-slate-300 dark:border-slate-700"
              >
                <Settings2 className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Colonne</span>
                {hiddenColumnsCount > 0 && (
                  <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-xs font-medium text-blue-700 dark:text-blue-300">
                    {hiddenColumnsCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel className="text-slate-900 dark:text-slate-100">
                Mostra/Nascondi Colonne
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      <span className="flex items-center gap-2">
                        {column.getIsVisible() ? (
                          <Eye className="h-3.5 w-3.5" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5" />
                        )}
                        {typeof column.columnDef.header === "string"
                          ? column.columnDef.header
                          : column.id}
                      </span>
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Render Card View on Mobile or Table View */}
      {mobileCardView && isMobile && viewMode === "cards" ? (
        <DataTableCardView
          data={
            serverPagination
              ? data
              : table.getRowModel().rows.map((row) => row.original)
          }
          columns={columns}
          onRowClick={onRowClick}
          isLoading={isLoading}
          emptyState={emptyState}
          highlightedColumns={mobileCardHighlightedColumns}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Mobile: Show scroll hint on mobile */}
          <div className="lg:hidden px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
              ← Scorri per vedere tutte le colonne →
            </p>
          </div>
          <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
            <Table
              style={{ tableLayout: "fixed", width: table.getTotalSize() }}
            >
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700"
                  >
                    {headerGroup.headers.map((header, index) => {
                      return (
                        <TableHead
                          key={header.id}
                          className={cn(
                            "font-semibold text-slate-900 dark:text-slate-100 relative h-12",
                            "first:pl-3 last:pr-3 lg:first:pl-6 lg:last:pr-6",
                            "text-xs lg:text-sm",
                            index !== headerGroup.headers.length - 1 &&
                              "pr-2 lg:pr-4",
                          )}
                          style={{
                            width: header.getSize(),
                            minWidth: header.column.columnDef.minSize,
                            maxWidth: header.column.columnDef.maxSize,
                          }}
                        >
                          {header.isPlaceholder ? null : (
                            <div className="flex items-center h-full">
                              <div
                                className={cn(
                                  "flex items-center gap-2 flex-1 min-w-0",
                                  header.column.getCanSort() &&
                                    "cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-300",
                                )}
                                onClick={header.column.getToggleSortingHandler()}
                              >
                                <span className="truncate">
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext(),
                                  )}
                                </span>
                                {header.column.getCanSort() && (
                                  <span className="flex-shrink-0">
                                    {header.column.getIsSorted() === "asc" ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : header.column.getIsSorted() ===
                                      "desc" ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronsUpDown className="h-4 w-4 text-slate-400" />
                                    )}
                                  </span>
                                )}
                              </div>
                              {/* Resize Handle */}
                              {index !== headerGroup.headers.length - 1 && (
                                <div
                                  onMouseDown={header.getResizeHandler()}
                                  onTouchStart={header.getResizeHandler()}
                                  className={cn(
                                    "absolute right-0 top-0 h-full w-3 cursor-col-resize select-none touch-none",
                                    "flex items-center justify-center group/resize",
                                  )}
                                  title="Trascina per ridimensionare"
                                >
                                  <div
                                    className={cn(
                                      "w-0.5 h-8 rounded-full transition-all duration-150",
                                      "bg-slate-300 dark:bg-slate-600",
                                      "group-hover/resize:bg-blue-500 dark:group-hover/resize:bg-blue-400",
                                      "group-hover/resize:w-1 group-hover/resize:h-10",
                                      header.column.getIsResizing() &&
                                        "bg-blue-500 dark:bg-blue-400 w-1 h-10",
                                    )}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-slate-600 dark:text-slate-400"
                    >
                      Caricamento...
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row, rowIndex) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className={cn(
                        "group transition-all duration-150",
                        "hover:bg-slate-50/80 dark:hover:bg-slate-800/40",
                        "border-b border-slate-100 dark:border-slate-800",
                        rowIndex % 2 === 0
                          ? "bg-white dark:bg-slate-900"
                          : "bg-slate-50/30 dark:bg-slate-900/50",
                        onRowClick && "cursor-pointer hover:shadow-sm",
                      )}
                      onClick={() => onRowClick?.(row.original)}
                    >
                      {row.getVisibleCells().map((cell, index) => (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            "text-slate-700 dark:text-slate-300",
                            "first:pl-3 last:pr-3 lg:first:pl-6 lg:last:pr-6",
                            "text-xs lg:text-sm py-2 lg:py-3",
                            "transition-colors duration-150",
                          )}
                          style={{
                            width: cell.column.getSize(),
                            minWidth: cell.column.columnDef.minSize,
                            maxWidth: cell.column.columnDef.maxSize,
                          }}
                        >
                          <div className="truncate">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      {emptyState || (
                        <div className="text-slate-600 dark:text-slate-400">
                          Nessun risultato trovato.
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {(serverPagination && serverPagination.total > 0
        ? serverPagination.total > serverPagination.perPage
        : table.getPageCount() > 1) && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 text-center sm:text-left">
              <span className="hidden sm:inline">Mostrando </span>
              <span className="font-medium">
                {serverPagination
                  ? (serverPagination.page - 1) * serverPagination.perPage + 1
                  : table.getState().pagination.pageIndex *
                      table.getState().pagination.pageSize +
                    1}
              </span>{" "}
              <span className="hidden sm:inline">a </span>
              <span className="sm:hidden">-</span>
              <span className="font-medium">
                {serverPagination
                  ? Math.min(
                      serverPagination.page * serverPagination.perPage,
                      serverPagination.total,
                    )
                  : Math.min(
                      (table.getState().pagination.pageIndex + 1) *
                        table.getState().pagination.pageSize,
                      table.getFilteredRowModel().rows.length,
                    )}
              </span>{" "}
              <span className="hidden sm:inline">di </span>
              <span className="sm:hidden">/</span>
              <span className="font-medium">
                {serverPagination
                  ? serverPagination.total
                  : table.getFilteredRowModel().rows.length}
              </span>
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                <span className="hidden sm:inline">Righe per pagina:</span>
                <span className="sm:hidden">Per pagina:</span>
              </span>
              <Select
                value={
                  serverPagination
                    ? serverPagination.perPage.toString()
                    : pageSize.toString()
                }
                onValueChange={(value) => {
                  if (serverPagination) {
                    serverPagination.onPerPageChange(Number(value));
                  } else {
                    setPageSize(Number(value));
                    table.setPageSize(Number(value));
                  }
                }}
              >
                <SelectTrigger className="h-8 w-[60px] sm:w-[70px] border-slate-300 dark:border-slate-700">
                  <SelectValue
                    placeholder={
                      serverPagination
                        ? serverPagination.perPage.toString()
                        : pageSize.toString()
                    }
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 50, 100].map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (serverPagination) {
                  serverPagination.onPageChange(serverPagination.page - 1);
                } else {
                  table.previousPage();
                }
              }}
              disabled={
                serverPagination
                  ? serverPagination.page <= 1
                  : !table.getCanPreviousPage()
              }
              className="border-slate-300 dark:border-slate-700 flex-1 sm:flex-none"
            >
              <span className="hidden sm:inline">Precedente</span>
              <span className="sm:hidden">Prec</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (serverPagination) {
                  serverPagination.onPageChange(serverPagination.page + 1);
                } else {
                  table.nextPage();
                }
              }}
              disabled={
                serverPagination
                  ? serverPagination.page >=
                    Math.ceil(serverPagination.total / serverPagination.perPage)
                  : !table.getCanNextPage()
              }
              className="border-slate-300 dark:border-slate-700 flex-1 sm:flex-none"
            >
              <span className="hidden sm:inline">Successiva</span>
              <span className="sm:hidden">Succ</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

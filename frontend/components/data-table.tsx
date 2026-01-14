'use client';

import * as React from 'react';
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
} from '@tanstack/react-table';
import { ChevronDown, ChevronUp, ChevronsUpDown, Settings2, Eye, EyeOff, RotateCcw, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  onRowClick?: (row: TData) => void;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  storageKey: string; // Required unique key for localStorage persistence
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowClick,
  isLoading,
  emptyState,
  storageKey,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({});
  const [pageSize, setPageSize] = React.useState(10);
  const [isStateLoaded, setIsStateLoaded] = React.useState(false);

  // Calculate default sizing from columns
  const defaultSizing = React.useMemo(() => {
    const sizing: ColumnSizingState = {};
    columns.forEach((col) => {
      if ('accessorKey' in col && col.accessorKey && 'size' in col && col.size) {
        sizing[col.accessorKey as string] = col.size as number;
      } else if ('id' in col && col.id && 'size' in col && col.size) {
        sizing[col.id] = col.size as number;
      }
    });
    return sizing;
  }, [columns]);

  // Load persisted state from localStorage on mount only
  React.useEffect(() => {
    if (typeof window !== 'undefined' && storageKey && !isStateLoaded) {
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
        console.error('Error loading table state:', error);
      } finally {
        setIsStateLoaded(true);
      }
    }
  }, [storageKey, isStateLoaded]);

  // Save state to localStorage when it changes (but only after initial load)
  React.useEffect(() => {
    if (typeof window !== 'undefined' && storageKey && isStateLoaded) {
      try {
        localStorage.setItem(`${storageKey}-visibility`, JSON.stringify(columnVisibility));
      } catch (error) {
        console.error('Error saving table visibility:', error);
      }
    }
  }, [columnVisibility, storageKey, isStateLoaded]);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && storageKey && isStateLoaded) {
      try {
        localStorage.setItem(`${storageKey}-sizing`, JSON.stringify(columnSizing));
      } catch (error) {
        console.error('Error saving table sizing:', error);
      }
    }
  }, [columnSizing, storageKey, isStateLoaded]);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && storageKey && isStateLoaded) {
      try {
        localStorage.setItem(`${storageKey}-pageSize`, pageSize.toString());
      } catch (error) {
        console.error('Error saving page size:', error);
      }
    }
  }, [pageSize, storageKey, isStateLoaded]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    columnResizeDirection: 'ltr',
    defaultColumn: {
      minSize: 50,
      maxSize: 1000,
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      columnSizing: Object.keys(columnSizing).length > 0 ? columnSizing : defaultSizing,
      pagination: {
        pageIndex: 0,
        pageSize,
      },
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  // Check if there are hidden columns
  const hiddenColumnsCount = React.useMemo(() => {
    return table.getAllColumns().filter((col) => !col.getIsVisible() && col.getCanHide()).length;
  }, [table, columnVisibility]);

  // Reset table to default state
  const handleReset = React.useCallback(() => {
    setColumnVisibility({});
    setColumnSizing(defaultSizing);
    setSorting([]);
    setPageSize(10);

    if (typeof window !== 'undefined' && storageKey) {
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
            {hiddenColumnsCount} {hiddenColumnsCount === 1 ? 'colonna nascosta' : 'colonne nascoste'}
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
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="h-9 border-slate-300 dark:border-slate-700"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 border-slate-300 dark:border-slate-700">
              <Settings2 className="mr-2 h-4 w-4" />
              Colonne
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
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    <span className="flex items-center gap-2">
                      {column.getIsVisible() ? (
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5" />
                      )}
                      {typeof column.columnDef.header === 'string'
                        ? column.columnDef.header
                        : column.id}
                    </span>
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <Table style={{ tableLayout: 'fixed', width: table.getTotalSize() }}>
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
                          "first:pl-6 last:pr-6",
                          index !== headerGroup.headers.length - 1 && "pr-4"
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
                                'flex items-center gap-2 flex-1 min-w-0',
                                header.column.getCanSort() &&
                                  'cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-300'
                              )}
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              <span className="truncate">
                                {flexRender(header.column.columnDef.header, header.getContext())}
                              </span>
                              {header.column.getCanSort() && (
                                <span className="flex-shrink-0">
                                  {header.column.getIsSorted() === 'asc' ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : header.column.getIsSorted() === 'desc' ? (
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
                                  'absolute right-0 top-0 h-full w-3 cursor-col-resize select-none touch-none',
                                  'flex items-center justify-center group/resize'
                                )}
                                title="Trascina per ridimensionare"
                              >
                                <div className={cn(
                                  'w-0.5 h-8 rounded-full transition-all duration-150',
                                  'bg-slate-300 dark:bg-slate-600',
                                  'group-hover/resize:bg-blue-500 dark:group-hover/resize:bg-blue-400',
                                  'group-hover/resize:w-1 group-hover/resize:h-10',
                                  header.column.getIsResizing() && 'bg-blue-500 dark:bg-blue-400 w-1 h-10'
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
                  data-state={row.getIsSelected() && 'selected'}
                  className={cn(
                    'group transition-all duration-150',
                    'hover:bg-slate-50/80 dark:hover:bg-slate-800/40',
                    'border-b border-slate-100 dark:border-slate-800',
                    rowIndex % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/30 dark:bg-slate-900/50',
                    onRowClick && 'cursor-pointer hover:shadow-sm'
                  )}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell, index) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "text-slate-700 dark:text-slate-300",
                        "first:pl-6 last:pr-6",
                        "transition-colors duration-150"
                      )}
                      style={{
                        width: cell.column.getSize(),
                        minWidth: cell.column.columnDef.minSize,
                        maxWidth: cell.column.columnDef.maxSize,
                      }}
                    >
                      <div className="truncate">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyState || (
                    <div className="text-slate-600 dark:text-slate-400">Nessun risultato trovato.</div>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Mostrando{' '}
              <span className="font-medium">
                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
              </span>{' '}
              a{' '}
              <span className="font-medium">
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length
                )}
              </span>{' '}
              di <span className="font-medium">{table.getFilteredRowModel().rows.length}</span>{' '}
              risultati
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Righe per pagina:</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="h-8 w-[70px] border-slate-300 dark:border-slate-700">
                  <SelectValue placeholder={pageSize.toString()} />
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="border-slate-300 dark:border-slate-700"
            >
              Precedente
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="border-slate-300 dark:border-slate-700"
            >
              Successiva
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}


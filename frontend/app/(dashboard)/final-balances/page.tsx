"use client";

import React, { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { finalBalancesApi } from "@/lib/api/final-balances";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileCheck, Plus, Search, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/features/auth/protected-route";
import { Can } from "@/components/features/auth/can";
import { CurrencyDisplay } from "@/components/ui/currency-input";
import type { FinalBalanceDoc, FinalBalanceStatus } from "@/lib/types";

type StatusFilter = "all" | FinalBalanceStatus;

const statusFilterLabels: Record<StatusFilter, string> = {
  all: "Tutti",
  draft: "Bozza",
  finalized: "Finalizzato",
  approved: "Approvato",
};

const statusBadgeConfig: Record<
  FinalBalanceStatus,
  {
    label: string;
    className: string;
  }
> = {
  draft: {
    label: "Bozza",
    className:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-600",
  },
  finalized: {
    label: "Finalizzato",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700",
  },
  approved: {
    label: "Approvato",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-300 dark:border-green-700",
  },
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("it-IT");
}

export default function FinalBalancesPage() {
  return (
    <ProtectedRoute permission="projects.view">
      <FinalBalancesPageContent />
    </ProtectedRoute>
  );
}

function FinalBalancesPageContent() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useQuery({
    queryKey: [
      "final-balances",
      { search: debouncedSearch, status: activeFilter, page },
    ],
    queryFn: () =>
      finalBalancesApi.getAll({
        search: debouncedSearch || undefined,
        status: activeFilter === "all" ? undefined : activeFilter,
        page,
      }),
  });

  const items: FinalBalanceDoc[] = Array.isArray(data?.data) ? data.data : [];
  const meta = data?.meta;

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
      setPage(1);
    },
    []
  );

  const handleFilterChange = useCallback((filter: StatusFilter) => {
    setActiveFilter(filter);
    setPage(1);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Final Balance
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Consuntivi e rendiconto finale dei progetti
          </p>
        </div>
        <Can permission="projects.view">
          <Link href="/final-balances/new">
            <Button className="shadow-md">
              <Plus className="mr-2 h-4 w-4" />
              Nuovo Final Balance
            </Button>
          </Link>
        </Can>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(statusFilterLabels) as StatusFilter[]).map((filter) => (
          <Button
            key={filter}
            variant={activeFilter === filter ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange(filter)}
            className={
              activeFilter === filter
                ? ""
                : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }
          >
            {statusFilterLabels[filter]}
          </Button>
        ))}
      </div>

      {/* Search */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">Ricerca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cerca per codice, titolo, cliente..."
              value={search}
              onChange={handleSearchChange}
              className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">
            {statusFilterLabels[activeFilter]}
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            {meta?.total !== undefined
              ? `${meta.total} consuntivi totali`
              : "Elenco consuntivi"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-slate-500 dark:text-slate-400">
                Caricamento...
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <FileCheck className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                Nessun consuntivo trovato
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {search || activeFilter !== "all"
                  ? "Prova a modificare i filtri"
                  : "Inizia creando il tuo primo Final Balance"}
              </p>
              {!search && activeFilter === "all" && (
                <Can permission="projects.view">
                  <Link href="/final-balances/new">
                    <Button className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Crea Final Balance
                    </Button>
                  </Link>
                </Can>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200 dark:border-slate-800">
                      <TableHead className="text-slate-700 dark:text-slate-300">
                        Codice
                      </TableHead>
                      <TableHead className="text-slate-700 dark:text-slate-300">
                        Titolo
                      </TableHead>
                      <TableHead className="text-slate-700 dark:text-slate-300">
                        Progetto
                      </TableHead>
                      <TableHead className="text-slate-700 dark:text-slate-300">
                        Cliente
                      </TableHead>
                      <TableHead className="text-right text-slate-700 dark:text-slate-300">
                        Totale
                      </TableHead>
                      <TableHead className="text-slate-700 dark:text-slate-300">
                        Stato
                      </TableHead>
                      <TableHead className="text-slate-700 dark:text-slate-300">
                        Data
                      </TableHead>
                      <TableHead className="text-right text-slate-700 dark:text-slate-300">
                        Azioni
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => {
                      const statusConfig = statusBadgeConfig[item.status];
                      return (
                        <TableRow
                          key={item.id}
                          className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                          onClick={() => router.push(`/final-balances/${item.id}`)}
                        >
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="font-mono text-xs border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                            >
                              {item.code}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium text-slate-900 dark:text-slate-100 max-w-[180px]">
                            <div className="flex items-center gap-2">
                              <span className="truncate">{item.title}</span>
                              {item.is_partial && (
                                <Badge
                                  variant="outline"
                                  className="text-xs shrink-0 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400"
                                >
                                  Parziale
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400">
                            {item.project_name ?? (
                              <span className="italic text-slate-400 dark:text-slate-500">
                                Standalone
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400">
                            {item.customer_name ?? (
                              <span className="text-slate-400 dark:text-slate-500">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                            <CurrencyDisplay value={item.total_amount} />
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={statusConfig.className}
                            >
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {formatDate(item.issue_date)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/final-balances/${item.id}`);
                              }}
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Pagina {meta.current_page} di {meta.last_page} (
                    {meta.total} totali)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      Precedente
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= meta.last_page}
                      onClick={() => setPage((p) => p + 1)}
                      className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      Successiva
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

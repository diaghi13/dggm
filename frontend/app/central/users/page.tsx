"use client";

import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { landlordApi } from "@/lib/api/landlord";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Search, Shield, Users } from "lucide-react";
import Link from "next/link";

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function GlobalUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const perPage = 20;

  // Debounce search: update debouncedSearch after 400ms of inactivity
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(value), 400);
  };

  const { data, isLoading } = useQuery({
    queryKey: ["landlord-global-users", { page, perPage, search: debouncedSearch }],
    queryFn: () =>
      landlordApi.getGlobalUsers({ page, per_page: perPage, search: debouncedSearch || undefined }),
  });

  const users = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Utenti Globali
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Identità registrate nel sistema landlord (cross-tenant)
        </p>
      </div>

      {/* Search */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <Input
            placeholder="Cerca per nome o email..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 h-10 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-64" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <Users className="h-8 w-8 text-slate-400 dark:text-slate-600" />
            </div>
            <p className="text-base font-medium text-slate-900 dark:text-slate-100">
              Nessun utente trovato
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {search
                ? "Prova a cambiare i termini di ricerca"
                : "Non ci sono utenti globali registrati"}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Utente
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">
                  Ruolo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                  Registrato il
                </th>
                <th className="px-4 py-3 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((user) => {
                const tenantsCount = (user as App.Data.Landlord.GlobalUserData & { tenants_count?: number }).tenants_count;
                return (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-4">
                      <Link
                        href={`/central/users/${user.id}`}
                        className="flex items-center gap-3"
                      >
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm">
                          {getInitials(user.name)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900 dark:text-slate-100">
                              {user.name}
                            </p>
                            {tenantsCount != null && tenantsCount > 0 && (
                              <span className="inline-flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium px-1.5 py-0.5 min-w-[20px]">
                                {tenantsCount}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 sm:hidden">
                            {user.email}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell text-slate-600 dark:text-slate-400">
                      <Link href={`/central/users/${user.id}`} className="block">
                        {user.email}
                      </Link>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <Link href={`/central/users/${user.id}`} className="block">
                        {user.is_landlord_admin ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400">
                            <Shield className="h-3 w-3" />
                            Landlord Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            <Users className="h-3 w-3" />
                            Utente
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell text-slate-600 dark:text-slate-400 text-sm">
                      <Link href={`/central/users/${user.id}`} className="block">
                        {formatDate(user.created_at)}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link href={`/central/users/${user.id}`} className="block">
                        <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-600 ml-auto" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Mostrando{" "}
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {meta.from}
            </span>{" "}
            a{" "}
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {meta.to}
            </span>{" "}
            di{" "}
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {meta.total}
            </span>{" "}
            utenti
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="border-slate-300 dark:border-slate-700"
            >
              Precedente
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === meta.last_page}
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

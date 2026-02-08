"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Filter, Search } from "lucide-react";

interface PriceListItemsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  activeFilter: string;
  onActiveFilterChange: (value: string) => void;
  manualPriceFilter: string;
  onManualPriceFilterChange: (value: string) => void;
  productTypeFilter: string;
  onProductTypeFilterChange: (value: string) => void;
}

export function PriceListItemsFilters({
  search,
  onSearchChange,
  activeFilter,
  onActiveFilterChange,
  manualPriceFilter,
  onManualPriceFilterChange,
  productTypeFilter,
  onProductTypeFilterChange,
}: PriceListItemsFiltersProps) {
  return (
    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
          Filtri
        </h3>
      </div>
      <div className="flex flex-col gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <Input
            placeholder="Cerca per codice o nome prodotto..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-10 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={activeFilter} onValueChange={onActiveFilterChange}>
            <SelectTrigger className="w-full sm:w-40 h-10 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700">
              <SelectValue placeholder="Stato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti</SelectItem>
              <SelectItem value="active">Solo Attivi</SelectItem>
              <SelectItem value="inactive">Solo Inattivi</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={manualPriceFilter}
            onValueChange={onManualPriceFilterChange}
          >
            <SelectTrigger className="w-full sm:w-48 h-10 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700">
              <SelectValue placeholder="Tipo Prezzo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i prezzi</SelectItem>
              <SelectItem value="manual">Prezzi Manuali</SelectItem>
              <SelectItem value="automatic">Prezzi Automatici</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={productTypeFilter}
            onValueChange={onProductTypeFilterChange}
          >
            <SelectTrigger className="w-full sm:w-48 h-10 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700">
              <SelectValue placeholder="Tipo Prodotto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i tipi</SelectItem>
              <SelectItem value="article">Articoli</SelectItem>
              <SelectItem value="service">Servizi</SelectItem>
              <SelectItem value="composite">Compositi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

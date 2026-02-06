"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface PriceListFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  appliesToFilter: string;
  onAppliesToChange: (value: string) => void;
  activeFilter: string;
  onActiveFilterChange: (value: string) => void;
}

export function PriceListFilters({
  search,
  onSearchChange,
  appliesToFilter,
  onAppliesToChange,
  activeFilter,
  onActiveFilterChange,
}: PriceListFiltersProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <Input
            placeholder="Cerca per nome, codice..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-11 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
          />
        </div>
        <Select value={appliesToFilter} onValueChange={onAppliesToChange}>
          <SelectTrigger className="w-full sm:w-48 h-11 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700">
            <SelectValue placeholder="Applica A" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti</SelectItem>
            <SelectItem value="sale">Vendita</SelectItem>
            <SelectItem value="rental">Noleggio</SelectItem>
            <SelectItem value="both">Entrambi</SelectItem>
          </SelectContent>
        </Select>
        <Select value={activeFilter} onValueChange={onActiveFilterChange}>
          <SelectTrigger className="w-full sm:w-40 h-11 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700">
            <SelectValue placeholder="Stato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stati</SelectItem>
            <SelectItem value="active">Attivi</SelectItem>
            <SelectItem value="inactive">Inattivi</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { priceListsApi } from "@/lib/api/price-lists";
import { Package, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CurrencyDisplay } from "@/components/ui/currency-input";

interface PriceListItemAutocompleteProps {
  priceListId: number;
  onSelect: (item: App.Data.PriceListItemData | null) => void;
  value?: string | null;
  quoteType?: string | null;
  placeholder?: string;
  className?: string;
}

const ITEM_TYPE_BADGES: Record<
  string,
  { label: string; className: string }
> = {
  article: {
    label: "Articolo",
    className:
      "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800",
  },
  service: {
    label: "Servizio",
    className:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
  },
  composite: {
    label: "Composito",
    className:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
  },
  kit: {
    label: "Kit",
    className:
      "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800",
  },
};

export function PriceListItemAutocomplete({
  priceListId,
  onSelect,
  value,
  quoteType,
  placeholder = "Cerca per nome o codice...",
  className,
}: PriceListItemAutocompleteProps) {
  const isRentalOrEvent = quoteType === "rental" || quoteType === "event";
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Block modal scroll when popover is open
  useEffect(() => {
    if (open) {
      const dialogContent = document.querySelector('[role="dialog"]');
      if (dialogContent) {
        const originalOverflow = (dialogContent as HTMLElement).style.overflow;
        (dialogContent as HTMLElement).style.overflow = "hidden";
        return () => {
          (dialogContent as HTMLElement).style.overflow = originalOverflow;
        };
      }
    }
  }, [open]);

  const { data: itemsData, isLoading } = useQuery({
    queryKey: [
      "price-list-items-autocomplete",
      priceListId,
      debouncedSearch,
    ],
    queryFn: () =>
      priceListsApi.getItems(priceListId, {
        search: debouncedSearch || undefined,
        is_active: true,
        per_page: 50,
      }),
    enabled: open,
  });

  const items = useMemo(
    () => itemsData?.data ?? [],
    [itemsData?.data],
  );

  const handleSelect = useCallback(
    (itemId: number) => {
      const item = items.find(
        (i: App.Data.PriceListItemData) => i.id === itemId,
      );
      if (item) {
        onSelect(item);
        setOpen(false);
        setSearch("");
      }
    },
    [items, onSelect],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-11 border-slate-300 dark:border-slate-600 hover:border-blue-500 overflow-hidden",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <span className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
            <Package className="h-4 w-4 flex-shrink-0 text-slate-500 dark:text-slate-400" />
            <span className="truncate text-sm">
              {value ?? placeholder}
            </span>
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[600px] p-0 !z-[150]"
        align="start"
        onWheel={(e) => e.stopPropagation()}
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('[role="combobox"]')) {
            e.preventDefault();
          }
        }}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Cerca per codice o nome..."
            value={search}
            onValueChange={setSearch}
            className="h-11"
          />
          <CommandList
            className="max-h-[320px]"
            onWheel={(e) => e.stopPropagation()}
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : items.length === 0 ? (
              <CommandEmpty>
                {search
                  ? "Nessun articolo trovato"
                  : "Nessun articolo nel listino"}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {items.map((item: App.Data.PriceListItemData) => {
                  const typeBadge =
                    item.item_type && ITEM_TYPE_BADGES[item.item_type]
                      ? ITEM_TYPE_BADGES[item.item_type]
                      : null;

                  const displayPrice =
                    isRentalOrEvent
                      ? Number(item.rental_daily ?? item.sale_price ?? 0)
                      : Number(item.sale_price ?? 0);

                  const priceLabel =
                    isRentalOrEvent && item.rental_daily != null
                      ? "noleggio/gg"
                      : "vendita";

                  return (
                    <CommandItem
                      key={item.id}
                      value={item.id?.toString() ?? ""}
                      onSelect={() => item.id && handleSelect(item.id)}
                      className="flex items-center gap-3 py-3 cursor-pointer"
                    >
                      <Package className="h-4 w-4 flex-shrink-0 text-slate-400" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.code && (
                            <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                              {item.code}
                            </span>
                          )}
                          <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                            {item.name ?? "—"}
                          </span>
                          {typeBadge && (
                            <Badge
                              variant="outline"
                              className={cn("text-xs", typeBadge.className)}
                            >
                              {typeBadge.label}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          <CurrencyDisplay value={displayPrice} />
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          {priceLabel}
                        </p>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

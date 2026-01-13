'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Check, ChevronsUpDown, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useDebounce } from '@/hooks/use-debounce';

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
}

interface ComboboxSelectProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  icon?: React.ReactNode;
  onSearchChange?: (search: string) => void;
  debounceMs?: number;
}

export function ComboboxSelect({
  options,
  value,
  onValueChange,
  placeholder = 'Seleziona...',
  searchPlaceholder = 'Cerca...',
  emptyText = 'Nessun risultato trovato',
  disabled = false,
  loading = false,
  className,
  icon,
  onSearchChange,
  debounceMs = 300,
}: ComboboxSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Debounce search for external queries
  const debouncedSearch = useDebounce(search, debounceMs);

  // Call onSearchChange when debounced search changes
  useEffect(() => {
    if (onSearchChange && debouncedSearch !== undefined) {
      onSearchChange(debouncedSearch);
    }
  }, [debouncedSearch, onSearchChange]);

  // Filter options locally if no external search handler
  const filteredOptions = useMemo(() => {
    if (onSearchChange) {
      // External filtering - return all options
      return options;
    }

    // Local filtering
    if (!search) return options;

    const searchLower = search.toLowerCase();
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(searchLower) ||
        option.description?.toLowerCase().includes(searchLower)
    );
  }, [options, search, onSearchChange]);

  const selectedOption = options.find((option) => option.value === value);

  const handleSelect = useCallback(
    (currentValue: string) => {
      if (currentValue === value) {
        onValueChange('');
      } else {
        onValueChange(currentValue);
      }
      setOpen(false);
      setSearch('');
    },
    [value, onValueChange]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading}
          className={cn(
            'h-11 w-full justify-between font-normal hover:bg-white dark:hover:bg-slate-900',
            !value && 'text-slate-500 dark:text-slate-400',
            icon && 'pl-10',
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            {loading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
            <span className="truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
          {icon}
        </div>
      )}
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        onWheel={(e) => e.stopPropagation()}
      >
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder={searchPlaceholder}
              value={search}
              onValueChange={setSearch}
              className="h-11"
            />
          </div>
          <CommandList className="[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : filteredOptions.length === 0 ? (
              <CommandEmpty>{emptyText}</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={handleSelect}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === option.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{option.label}</div>
                      {option.description && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

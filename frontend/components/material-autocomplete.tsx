'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { materialsApi } from '@/lib/api/materials';
import { Check, ChevronsUpDown, Package, Loader2 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';

interface Material {
  id: number;
  code: string;
  name: string;
  unit: string;
  standard_cost: number;
  category: string;
  is_active: boolean;
}

interface MaterialAutocompleteProps {
  value?: number | null;
  onSelect: (material: Material | null) => void;
  placeholder?: string;
  className?: string;
}

export function MaterialAutocomplete({
  value,
  onSelect,
  placeholder = 'Cerca materiale...',
  className,
}: MaterialAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch materials with search
  const { data: materialsData, isLoading } = useQuery({
    queryKey: ['materials', { is_active: true, search: debouncedSearch }],
    queryFn: () =>
      materialsApi.getAll({
        is_active: true,
        search: debouncedSearch,
        per_page: 50,
      }),
    enabled: open, // Only load when popover is open
  });

  const materials = materialsData?.data ?? [];

  // Find selected material
  const selectedMaterial = materials.find((m: Material) => m.id === value);

  const handleSelect = useCallback(
    (materialId: number) => {
      const material = materials.find((m: Material) => m.id === materialId);
      if (material) {
        onSelect(material);
        setOpen(false);
      }
    },
    [materials, onSelect]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(null);
      setSearch('');
    },
    [onSelect]
  );

  const categoryColors: Record<string, string> = {
    construction: 'bg-blue-100 text-blue-700',
    electrical: 'bg-yellow-100 text-yellow-700',
    plumbing: 'bg-cyan-100 text-cyan-700',
    tools: 'bg-purple-100 text-purple-700',
    equipment: 'bg-orange-100 text-orange-700',
    general: 'bg-slate-100 text-slate-700',
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between h-11 border-slate-300 hover:border-blue-500',
            !value && 'text-muted-foreground',
            className
          )}
        >
          {selectedMaterial ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Package className="h-4 w-4 flex-shrink-0 text-slate-500" />
              <span className="truncate font-medium">{selectedMaterial.code}</span>
              <span className="truncate text-sm text-slate-600">
                - {selectedMaterial.name}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  'ml-auto flex-shrink-0 text-xs',
                  categoryColors[selectedMaterial.category] || categoryColors.general
                )}
              >
                {selectedMaterial.category}
              </Badge>
            </div>
          ) : (
            <span className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              {placeholder}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Cerca per codice o nome..."
            value={search}
            onValueChange={setSearch}
            className="h-11"
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : materials.length === 0 ? (
              <CommandEmpty>
                {search ? 'Nessun materiale trovato' : 'Nessun materiale disponibile'}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {materials.map((material: Material) => (
                  <CommandItem
                    key={material.id}
                    value={material.id.toString()}
                    onSelect={() => handleSelect(material.id)}
                    className="flex items-center gap-3 py-3 cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'h-4 w-4 flex-shrink-0',
                        value === material.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <Package className="h-4 w-4 flex-shrink-0 text-slate-400" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{material.code}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            categoryColors[material.category] || categoryColors.general
                          )}
                        >
                          {material.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 truncate">{material.name}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-medium text-slate-900">
                        € {Number(material.standard_cost || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500">{material.unit}</p>
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

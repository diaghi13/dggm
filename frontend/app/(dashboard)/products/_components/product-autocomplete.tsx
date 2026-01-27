'use client';

import {useState, useEffect, useCallback, useMemo} from 'react';
import {useQuery} from '@tanstack/react-query';
import {productsApi} from '@/lib/api/products';
import {Check, ChevronsUpDown, Package, Loader2, Scan} from 'lucide-react';
import {cn} from '@/lib/utils';
import {Button} from '@/components/ui/button';
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
import {Badge} from '@/components/ui/badge';
import {BarcodeScanner} from '@/components/barcode-scanner';
import {toast} from 'sonner';

interface ProductAutocompleteProps {
  value?: number | null;
  onSelect: (material: App.Data.ProductData | null) => void;
  placeholder?: string;
  className?: string;
  showBarcodeScanner?: boolean;
}

export function ProductAutocomplete({
                                       value,
                                       onSelect,
                                       placeholder = 'Cerca prodotto...',
                                       className,
                                       showBarcodeScanner = true,
                                     }: ProductAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);

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
      // Find the dialog content element
      const dialogContent = document.querySelector('[role="dialog"]');
      if (dialogContent) {
        const originalOverflow = (dialogContent as HTMLElement).style.overflow;
        (dialogContent as HTMLElement).style.overflow = 'hidden';

        return () => {
          (dialogContent as HTMLElement).style.overflow = originalOverflow;
        };
      }
    }
  }, [open]);

  // Fetch materials with search
  const {data: materialsData, isLoading} = useQuery({
    queryKey: ['products', {is_active: true, search: debouncedSearch}],
    queryFn: () =>
      productsApi.getAll({
        is_active: true,
        search: debouncedSearch,
        per_page: 50,
      }),
    enabled: open, // Only load when popover is open
  });

  const materials = useMemo(() => materialsData?.data ?? [], [materialsData?.data]);

  // Find selected material
  const selectedMaterial = materials.find((m: App.Data.ProductData) => m.id === value);

  const handleSelect = useCallback(
    (materialId: number) => {
      const material = materials.find((m: App.Data.ProductData) => m.id === materialId);
      if (material) {
        onSelect(material);
        setOpen(false);
      }
    },
    [materials, onSelect]
  );

  // Handle barcode scan
  const handleBarcodeScan = useCallback(
    async (barcode: string) => {
      try {
        const response = await productsApi.getAll({
          barcode,
          is_active: true,
          per_page: 1,
        });

        const products = response.data;
        if (products && products.length > 0) {
          const product = products[0];
          onSelect(product);
          toast.success('Prodotto trovato', {
            description: `${product.code} - ${product.name}`,
          });
        } else {
          toast.error('Prodotto non trovato', {
            description: `Nessun prodotto con barcode: ${barcode}`,
          });
        }
      } catch (error) {
        console.error('Errore ricerca barcode:', error);
        toast.error('Errore ricerca', {
          description: 'Impossibile cercare il prodotto',
        });
      }
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
    <>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                'flex-1 justify-between h-11 border-slate-300 hover:border-blue-500',
                !value && 'text-muted-foreground',
                className
              )}
            >
              {selectedMaterial ? (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Package className="h-4 w-4 flex-shrink-0 text-slate-500"/>
                  <span className="truncate font-medium">{selectedMaterial.code}</span>
                  <span className="truncate text-sm text-slate-600">
                    - {selectedMaterial.name}
                  </span>
                  {selectedMaterial.category && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'ml-auto flex-shrink-0 text-xs',
                        categoryColors[selectedMaterial.category.code || 'general'] || categoryColors.general
                      )}
                    >
                      {selectedMaterial.category.name}
                    </Badge>
                  )}
                </div>
              ) : (
                <span className="flex items-center gap-2">
                  <Package className="h-4 w-4"/>
                  {placeholder}
                </span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[600px] p-0 !z-[150]"
            align="start"
            onWheel={(e) => e.stopPropagation()}
            onInteractOutside={(e) => {
              // Prevent closing when clicking on scrollbar
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
            onWheel={(e) => {
              // Stop propagation to prevent modal scroll
              e.stopPropagation();
            }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400"/>
              </div>
            ) : materials.length === 0 ? (
              <CommandEmpty>
                {search ? 'Nessun materiale trovato' : 'Nessun materiale disponibile'}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {materials.map((material: App.Data.ProductData) => (
                  <CommandItem
                    key={material.id}
                    value={material.id?.toString() || ''}
                    onSelect={() => material.id && handleSelect(material.id)}
                    className="flex items-center gap-3 py-3 cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'h-4 w-4 flex-shrink-0',
                        value === material.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <Package className="h-4 w-4 flex-shrink-0 text-slate-400"/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{material.code}</span>
                        {material.category && (
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs',
                              categoryColors[material.category.code || 'general'] || categoryColors.general
                            )}
                          >
                            {material.category.name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 truncate">{material.name}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-medium text-slate-900">
                        € {Number(material.purchase_price || 0).toFixed(2)}
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

        {showBarcodeScanner && (
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 flex-shrink-0"
            onClick={() => setScannerOpen(true)}
            title="Scansiona barcode"
          >
            <Scan className="h-5 w-5" />
          </Button>
        )}
      </div>

      <BarcodeScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={handleBarcodeScan}
        title="Scansiona Barcode Prodotto"
        description="Inquadra il barcode del prodotto con la fotocamera"
      />
    </>
  );
}

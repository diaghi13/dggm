'use client';

import { useQuery } from '@tanstack/react-query';
import { warehousesApi } from '@/lib/api/warehouses';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

interface StockMovementFiltersProps {
  filters: {
    type?: string;
    warehouse_id?: number;
    product_id?: number;
    from_date?: string;
    to_date?: string;
  };
  onFiltersChange: (filters: Record<string, string | number | undefined>) => void;
}

const movementTypes: { value: string; label: string }[] = [
  { value: 'intake', label: 'Carico' },
  { value: 'output', label: 'Scarico' },
  { value: 'transfer', label: 'Trasferimento' },
  { value: 'adjustment', label: 'Rettifica' },
  { value: 'return', label: 'Reso' },
  { value: 'waste', label: 'Scarto' },
  { value: 'rental_out', label: 'Noleggio Uscita' },
  { value: 'rental_return', label: 'Noleggio Rientro' },
  { value: 'site_allocation', label: 'Allocazione Cantiere' },
  { value: 'site_return', label: 'Rientro Cantiere' },
];

export function StockMovementFilters({
  filters,
  onFiltersChange,
}: StockMovementFiltersProps) {
  // Fetch warehouses
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses', { is_active: true, per_page: 100 }],
    queryFn: () => warehousesApi.getAll({ is_active: true, per_page: 100 }),
  });

  const warehouses = (warehousesData?.data ?? []) as Array<{ id: number; name: string }>;

  const handleClearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Type Filter */}
      <div className="space-y-2">
        <Label htmlFor="type-filter">Tipo Movimento</Label>
        <Select
          value={filters.type || 'all'}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              type: value === 'all' ? undefined : value,
            })
          }
        >
          <SelectTrigger id="type-filter">
            <SelectValue placeholder="Tutti i tipi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i tipi</SelectItem>
            {movementTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Warehouse Filter */}
      <div className="space-y-2">
        <Label htmlFor="warehouse-filter">Magazzino</Label>
        <Select
          value={filters.warehouse_id?.toString() || 'all'}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              warehouse_id: value === 'all' ? undefined : parseInt(value),
            })
          }
        >
          <SelectTrigger id="warehouse-filter">
            <SelectValue placeholder="Tutti i magazzini" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i magazzini</SelectItem>
            {warehouses.map((warehouse) => (
              <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                {warehouse.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* From Date Filter */}
      <div className="space-y-2">
        <Label htmlFor="from-date-filter">Data Da</Label>
        <Input
          id="from-date-filter"
          type="date"
          value={filters.from_date || ''}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              from_date: e.target.value || undefined,
            })
          }
        />
      </div>

      {/* To Date Filter */}
      <div className="space-y-2">
        <Label htmlFor="to-date-filter">Data A</Label>
        <Input
          id="to-date-filter"
          type="date"
          value={filters.to_date || ''}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              to_date: e.target.value || undefined,
            })
          }
        />
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex items-end">
          <Button
            variant="outline"
            onClick={handleClearFilters}
            className="w-full"
          >
            <X className="mr-2 h-4 w-4" />
            Pulisci Filtri
          </Button>
        </div>
      )}
    </div>
  );
}

<?php

namespace App\Domains\Warehouse\Queries;

use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Collection;

/**
 * GetWarehouseInventoryQuery
 *
 * Query class per ottenere l'inventory di un warehouse con filtri.
 * Vantaggi:
 * - Riusabile: stessa query in pi� punti
 * - Testabile: facile testare la logica di query
 * - Modificabile: cambi la query in un solo punto
 */
class GetWarehouseInventoryQuery
{
    public function __construct(
        private readonly Warehouse $warehouse
    ) {}

    /**
     * Esegue la query con filtri opzionali
     */
    public function execute(array $filters = []): Collection
    {
        $query = $this->warehouse->inventory()->with(['product']);

        // Filtra solo low stock items
        if (isset($filters['low_stock']) && filter_var($filters['low_stock'], FILTER_VALIDATE_BOOLEAN)) {
            $query->whereRaw('quantity_available <= minimum_stock');
        }

        // Ricerca prodotti
        if (isset($filters['search']) && $filters['search'] !== '') {
            $search = $filters['search'];
            $query->whereHas('product', function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%");
            });
        }

        // Filtra per categoria prodotto
        if (isset($filters['product_category']) && $filters['product_category'] !== '') {
            $query->whereHas('product', function ($q) use ($filters) {
                $q->where('category', $filters['product_category']);
            });
        }

        // Ordinamento
        $sortField = $filters['sort_field'] ?? 'product.name';
        $sortDirection = $filters['sort_direction'] ?? 'asc';

        // Se ordiniamo per campo del prodotto, usiamo join
        if (str_starts_with($sortField, 'product.')) {
            $productField = str_replace('product.', '', $sortField);
            $query->join('products', 'inventory.product_id', '=', 'products.id')
                ->orderBy("products.{$productField}", $sortDirection)
                ->select('inventory.*'); // Solo colonne inventory
        } else {
            $query->orderBy($sortField, $sortDirection);
        }

        return $query->get();
    }
}

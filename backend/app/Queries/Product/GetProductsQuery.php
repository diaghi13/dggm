<?php

namespace App\Queries\Product;

use App\Enums\ProductType;
use App\Models\Product;
use App\Services\EmbeddingService;
use Illuminate\Pagination\LengthAwarePaginator;

class GetProductsQuery
{
    /**
     * @param  array{'is_active': bool,'category': string,'product_type': string,'rentable': bool,'composites': bool,'low_stock': number,'search': string,'semantic_search': string,'sort_field': string,'sort_direction': string}  $filters
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator|\Illuminate\Database\Eloquent\Collection
     */
    public static function execute(array $filters = [], ?int $perPage = null)
    {
        $query = \App\Models\Product::query()->with(['defaultSupplier', 'category']);

        if (! empty($filters['semantic_search'])) {
            return (new static)->semanticSearch($filters, $perPage ?? 20);
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
        }

        if (! empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (! empty($filters['product_type'])) {
            $productType = ProductType::tryFrom($filters['product_type']);
            if ($productType) {
                $query->byProductType($productType);
            }
        }

        if (isset($filters['rentable'])) {
            $query->where('rentable', filter_var($filters['rentable'], FILTER_VALIDATE_BOOLEAN));
        }

        if (isset($filters['composites'])) {
            if ($filters['composites']) {
                $query->whereNotNull('composite_of');
            } else {
                $query->whereNull('composite_of');
            }
        }

        if (isset($filters['low_stock']) && $filters['low_stock']) {
            $query->whereColumn('stock_quantity', '<=', 'stock_minimum');
        }

        if (! empty($filters['search'])) {
            $searchTerm = '%'.$filters['search'].'%';
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', $searchTerm)
                    ->orWhere('code', 'like', $searchTerm)
                    ->orWhere('barcode', 'like', $searchTerm)
                    ->orWhere('description', 'like', $searchTerm);
            });
        }

        // Ricerca diretta per barcode (prioritaria)
        if (! empty($filters['barcode'])) {
            $query->where('barcode', $filters['barcode']);
        }

        if (! empty($filters['sort_field']) && ! empty($filters['sort_direction'])) {
            $query->orderBy($filters['sort_field'], $filters['sort_direction']);
        } else {
            $query->orderBy('code', 'asc');
        }

        if ($perPage) {
            return $query->paginate($perPage);
        } else {
            return $query->get();
        }
    }

    /**
     * Ricerca semantica basata su descrizione/caratteristiche
     */
    private function semanticSearch(array $filters, int $perPage): LengthAwarePaginator
    {
        $query = Product::query()->with(['defaultSupplier']);

        // Applica comunque i filtri standard
        if (isset($filters['is_active'])) {
            $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
        }

        if (isset($filters['category']) && $filters['category'] !== '') {
            $query->where('category', $filters['category']);
        }

        if (isset($filters['product_type']) && $filters['product_type'] !== '') {
            $productType = ProductType::tryFrom($filters['product_type']);
            if ($productType) {
                $query->byProductType($productType);
            }
        }

        if (isset($filters['rentable']) && filter_var($filters['rentable'], FILTER_VALIDATE_BOOLEAN)) {
            $query->rentable();
        }

        if (isset($filters['composites']) && filter_var($filters['composites'], FILTER_VALIDATE_BOOLEAN)) {
            $query->composites();
        }

        // Recupera i materiali filtrati
        $products = $query->get();

        if ($products->isEmpty()) {
            return new LengthAwarePaginator([], 0, $perPage);
        }

        try {
            // Calcola similarità semantica
            $searchQuery = $filters['semantic_search'];
            $texts = $products->map(function ($product) {
                // Combina i campi rilevanti per la ricerca semantica
                return implode(' ', array_filter([
                    $product->name,
                    $product->description,
                    $product->category,
                    $product->code,
                ]));
            })->toArray();

            $embeddingService = new EmbeddingService;
            $similarities = $embeddingService->search($searchQuery, $texts);

            // Combina materiali con score di similarità
            $results = $products->map(function ($product, $index) use ($similarities) {
                $product->similarity_score = $similarities[$index];

                return $product;
            })
                ->sortByDesc('similarity_score')
                ->values();

            // Paginazione manuale
            $page = request()->get('page', 1);
            $offset = ($page - 1) * $perPage;
            $items = $results->slice($offset, $perPage)->values();

            return new LengthAwarePaginator(
                $items,
                $results->count(),
                $perPage,
                $page,
                ['path' => request()->url(), 'query' => request()->query()]
            );

        } catch (\Exception $e) {
            // Fallback a ricerca normale in caso di errore
            \Log::error('Vector search failed: '.$e->getMessage());

            $query = Product::query()->with(['defaultSupplier']);
            $search = $filters['semantic_search'];
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });

            return $query->paginate($perPage);
        }
    }
}

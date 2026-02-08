<?php

namespace App\Queries\PriceList;

use App\Models\PriceList;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

/**
 * Get Active Price Lists Query
 *
 * Retrieves all active and valid price lists with pagination support.
 * IMPORTANT: Does NOT eager load items (too heavy for index).
 */
class GetActivePriceListsQuery
{
    public function __construct(
        private readonly ?int $productId = null,
        private readonly ?int $perPage = null
    ) {}

    /**
     * Execute the query
     */
    public function execute(): Collection|LengthAwarePaginator
    {
        $query = PriceList::query()
            ->active()
            ->valid()
            ->with(['category']) // Only load category, NOT items (too heavy)
            ->withCount('items') // Add items count instead
            ->orderByDesc('priority')
            ->orderByDesc('is_default')
            ->orderBy('name');

        // Filter by product if specified
        if ($this->productId) {
            $query->whereHas('items', fn ($q) => $q->where('product_id', $this->productId)
                ->where('is_active', true)
            );
        }

        // Return paginated or all results
        return $this->perPage
            ? $query->paginate($this->perPage)
            : $query->get();
    }
}

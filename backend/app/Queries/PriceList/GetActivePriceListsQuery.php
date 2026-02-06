<?php

namespace App\Queries\PriceList;

use App\Models\PriceList;
use Illuminate\Database\Eloquent\Collection;

/**
 * Get Active Price Lists Query
 *
 * Retrieves all active and valid price lists
 * Optionally filters by product availability
 */
class GetActivePriceListsQuery
{
    public function __construct(
        private readonly ?int $productId = null
    ) {}

    /**
     * Execute the query
     */
    public function execute(): Collection
    {
        $query = PriceList::active()
            ->valid()
            ->with(['category', 'activeItems.product'])
            ->orderByDesc('priority')
            ->orderByDesc('is_default')
            ->orderBy('name');

        // Filter by product if specified
        if ($this->productId) {
            $query->whereHas('items', fn ($q) => $q->where('product_id', $this->productId)
                ->where('is_active', true)
            );
        }

        return $query->get();
    }
}

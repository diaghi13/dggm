<?php

namespace App\Queries\Product;

use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;

/**
 * GetProductRelationsQuery
 *
 * Query class to get product relations with filters
 */
readonly class GetProductRelationsQuery
{
    public function __construct(
        private Product $product
    ) {}

    public function execute(array $filters = []): Collection
    {
        $query = $this->product->relations()
            ->with(['relatedProduct', 'relationType'])
            ->ordered();

        // Filter: relation type
        if (isset($filters['relation_type_id'])) {
            $query->where('relation_type_id', $filters['relation_type_id']);
        }

        // Filter: visible in quote
        if (isset($filters['visible_in_quote']) && filter_var($filters['visible_in_quote'], FILTER_VALIDATE_BOOLEAN)) {
            $query->where('is_visible_in_quote', true);
        }

        // Filter: visible in material list
        if (isset($filters['visible_in_material_list']) && filter_var($filters['visible_in_material_list'], FILTER_VALIDATE_BOOLEAN)) {
            $query->where('is_visible_in_material_list', true);
        }

        // Filter: required for stock
        if (isset($filters['required_for_stock']) && filter_var($filters['required_for_stock'], FILTER_VALIDATE_BOOLEAN)) {
            $query->where('is_required_for_stock', true);
        }

        // Filter: components only
        if (isset($filters['components_only']) && filter_var($filters['components_only'], FILTER_VALIDATE_BOOLEAN)) {
            $query->components();
        }

        // Filter: dependencies only (not components)
        if (isset($filters['dependencies_only']) && filter_var($filters['dependencies_only'], FILTER_VALIDATE_BOOLEAN)) {
            $query->dependencies();
        }

        return $query->get();
    }
}

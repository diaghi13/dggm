<?php

namespace App\Actions\Product;

use App\Data\ProductRelationData;
use App\Models\ProductRelation;
use Illuminate\Support\Facades\DB;

class UpdateProductRelationAction
{
    /**
     * Update an existing product relation
     */
    public function execute(ProductRelation $relation, ProductRelationData $data): ProductRelation
    {
        return DB::transaction(function () use ($relation, $data) {
            // Convert DTO to array, excluding computed properties, relationships and immutable fields
            $relationData = $data->except(
                'id',
                'product_id',           // Immutable foreign key
                'related_product_id',   // Immutable foreign key
                'product',              // Lazy relationship
                'relatedProduct',       // Lazy relationship
                'relationType'          // Lazy relationship
            )->toArray();

            // Update relation using Eloquent
            $relation->update($relationData);

            // Reload with relationships
            return $relation->fresh(['product', 'relatedProduct', 'relationType']);
        });
    }
}

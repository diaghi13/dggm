<?php

namespace App\Actions\Product;

use App\Data\ProductRelationData;
use App\Models\ProductRelation;
use Illuminate\Support\Facades\DB;

class CreateProductRelationAction
{
    /**
     * Create a new product relation
     */
    public function execute(ProductRelationData $data): ProductRelation
    {
        return DB::transaction(function () use ($data) {
            // Convert DTO to array, excluding computed properties and relationships
            $relationData = $data->except(
                'id',
                'product',
                'relatedProduct',
                'relationType'
            )->toArray();

            // Create relation using Eloquent
            $relation = ProductRelation::create($relationData);

            // Reload with relationships
            return $relation->fresh(['product', 'relatedProduct', 'relationType']);
        });
    }
}

<?php

namespace App\Actions\Product;

use App\Models\ProductRelation;
use Illuminate\Support\Facades\DB;

class DeleteProductRelationAction
{
    /**
     * Delete a product relation
     */
    public function execute(ProductRelation $relation): bool
    {
        return DB::transaction(function () use ($relation) {
            return $relation->delete();
        });
    }
}

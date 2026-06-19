<?php

namespace App\Domains\Product\Actions;

use App\Domains\Product\Models\ProductRelation;
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

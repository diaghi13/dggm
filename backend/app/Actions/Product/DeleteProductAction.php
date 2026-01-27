<?php

namespace App\Actions\Product;

use App\Models\Product;
use Illuminate\Support\Facades\DB;

class DeleteProductAction
{
    /**
     * Delete a product (soft delete)
     *
     * @throws \Exception
     */
    public function execute(Product $product): bool
    {
        return DB::transaction(function () use ($product) {
            // Check if product is used in any composites
            if ($product->usedInComposites()->exists()) {
                throw new \Exception('Cannot delete product that is used in composite products. Remove from composites first.');
            }

            // Check if product has active inventory
            if ($product->total_stock > 0) {
                throw new \Exception('Cannot delete product with active inventory. Adjust stock to zero first.');
            }

            return $product->delete();
        });
    }
}

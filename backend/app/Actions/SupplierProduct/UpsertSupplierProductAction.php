<?php

namespace App\Actions\SupplierProduct;

use App\Data\SupplierProductData;
use App\Models\SupplierProduct;
use Illuminate\Support\Facades\DB;

class UpsertSupplierProductAction
{
    /**
     * Upsert supplier product (create or update)
     */
    public function execute(SupplierProductData $data): SupplierProduct
    {
        return DB::transaction(function () use ($data) {
            // Convert DTO to array, excluding relationships and computed properties
            $supplierProductData = $data->except(
                'id',
                'supplier',
                'product',
                'discountFamily',
                'paymentTerm',
                'final_price',
                'effective_discounts',
                'created_at',
                'updated_at'
            )->toArray();

            // Apply defaults for fields that might be null
            $supplierProductData = array_merge([
                'package_quantity' => 1,
                'minimum_order_quantity' => 1,
                'price_multiplier' => 1.00,
                'currency' => 'EUR',
                'is_preferred_supplier' => false,
                'is_active' => true,
            ], array_filter($supplierProductData, fn ($value) => $value !== null));

            // Upsert using unique constraint (supplier_id + product_id)
            $supplierProduct = SupplierProduct::updateOrCreate(
                [
                    'supplier_id' => $supplierProductData['supplier_id'],
                    'product_id' => $supplierProductData['product_id'],
                ],
                $supplierProductData
            );

            // Reload with relationships
            return $supplierProduct->fresh([
                'supplier',
                'product',
                'discountFamily',
                'paymentTerm',
            ]);
        });
    }
}

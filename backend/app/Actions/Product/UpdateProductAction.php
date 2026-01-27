<?php

namespace App\Actions\Product;

use App\Data\ProductData;
use App\Enums\ProductType;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class UpdateProductAction
{
    /**
     * Update an existing product
     */
    public function execute(Product $product, ProductData $data): Product
    {
        return DB::transaction(function () use ($product, $data) {
            // Extract components if present
            $relations = $data->relations instanceof \Spatie\LaravelData\Lazy
                ? null
                : ($data->relations ?? null);

            // Convert DTO to array, excluding computed properties and relationships
            $productData = $data->except(
                'id',
                'calculated_sale_price',
                'composite_total_cost',
                'total_stock',
                'available_stock',
                'relations',
                'defaultSupplier',
                'created_at',
                'updated_at',
                'deleted_at'
            )->toArray();

            // Update product using Eloquent
            $product->update($productData);

            // Update components if provided and product is composite
            if ($product->product_type === ProductType::COMPOSITE && $relations !== null) {
                // Delete existing components
                $product->relations()->delete();

                // Create new components
                foreach ($relations as $component) {
                    $product->relations()->create([
                        'component_product_id' => $component['component_product_id'] ?? $component->component_product_id,
                        'quantity' => $component['quantity'] ?? $component->quantity,
                        'notes' => $component['notes'] ?? $component->notes ?? null,
                    ]);
                }
            }

            // Reload with relationships
            return $product->fresh(['defaultSupplier', 'components.componentProduct']);
        });
    }
}

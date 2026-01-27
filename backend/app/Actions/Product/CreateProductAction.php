<?php

namespace App\Actions\Product;

use App\Data\ProductData;
use App\Enums\ProductType;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class CreateProductAction
{
    /**
     * Create a new product
     */
    public function execute(ProductData $data): Product
    {
        return DB::transaction(function () use ($data) {
            // Extract components if present (for composite products)
            $components = $data->components instanceof \Spatie\LaravelData\Lazy
                ? []
                : ($data->components ?? []);

            // Convert DTO to array, excluding computed properties and relationships
            $productData = $data->except(
                'id',
                'calculated_sale_price',
                'composite_total_cost',
                'total_stock',
                'available_stock',
                'components',
                'defaultSupplier',
                'created_at',
                'updated_at',
                'deleted_at'
            )->toArray();

            // Create product using Eloquent
            $product = Product::create($productData);

            // If it's a composite and has components, attach them
            if ($product->product_type === ProductType::COMPOSITE && ! empty($components)) {
                foreach ($components as $component) {
                    $product->components()->create([
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

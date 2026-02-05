<?php

namespace App\Actions\Product;

use App\Data\ProductData;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Spatie\LaravelData\Lazy;

class UpdateProductAction
{
    /**
     * Update an existing product with optional relations
     */
    public function execute(Product $product, ProductData $data): Product
    {
        return DB::transaction(function () use ($product, $data) {
            // Extract relations if present (not Lazy)
            $relations = $this->extractRelations($data);

            // Convert DTO to array, excluding computed properties and relationships
            $productData = $data->except(
                'id',
                'calculated_sale_price',
                'composite_total_cost',
                'total_stock',
                'available_stock',
                'relations',
                'category',
                'brand',
                'defaultSupplier',
                'created_at',
                'updated_at',
                'deleted_at'
            )->toArray();

            // Update product using Eloquent
            $product->update($productData);

            // Update relations if provided
            if ($relations !== null) {
                $this->syncRelations($product, $relations);
            }

            // Reload with relationships
            return $product->fresh([
                'category',
                'brand',
                'defaultSupplier',
                'relations.relatedProduct',
                'relations.relationType',
            ]);
        });
    }

    /**
     * Extract relations from ProductData (if not Lazy)
     *
     * @return array|null null means Lazy (don't update), array means update relations
     */
    private function extractRelations(ProductData $data): ?array
    {
        // If relations is Lazy, return null (means "don't touch relations")
        if ($data->relations instanceof Lazy) {
            return null;
        }

        // If relations is null or empty, return empty array (means "remove all relations")
        if ($data->relations === null || $data->relations->isEmpty()) {
            return [];
        }

        // Convert DataCollection to array
        return $data->relations->toArray();
    }

    /**
     * Sync relations for product
     *
     * Note: IDE may warn about guarded attributes, but ProductRelation has $fillable defined.
     * This is a false positive from static analysis.
     */
    private function syncRelations(Product $product, array $relations): void
    {
        // Delete existing relations
        $product->relations()->delete();

        // Create new relations
        foreach ($relations as $relationData) {
            $product->relations()->create([
                'related_product_id' => $relationData['related_product_id'],
                'relation_type_id' => $relationData['relation_type_id'],
                'quantity_type' => $relationData['quantity_type'],
                'quantity_value' => $relationData['quantity_value'],
                'is_visible_in_quote' => $relationData['is_visible_in_quote'] ?? false,
                'is_visible_in_material_list' => $relationData['is_visible_in_material_list'] ?? false,
                'is_required_for_stock' => $relationData['is_required_for_stock'] ?? false,
                'is_optional' => $relationData['is_optional'] ?? false,
                'min_quantity_trigger' => $relationData['min_quantity_trigger'] ?? null,
                'max_quantity_trigger' => $relationData['max_quantity_trigger'] ?? null,
                'sort_order' => $relationData['sort_order'] ?? 0,
                'notes' => $relationData['notes'] ?? null,
            ]);
        }
    }
}

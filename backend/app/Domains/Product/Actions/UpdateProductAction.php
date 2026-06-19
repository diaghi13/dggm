<?php

namespace App\Domains\Product\Actions;

use App\Domains\Product\Data\ProductData;
use App\Domains\Product\Enums\ProductType;
use App\Domains\Product\Models\Product;
use App\Domains\Product\Services\ProductPricingService;
use App\Jobs\RecalculatePriceListItemsForProductJob;
use Illuminate\Support\Facades\DB;
use Spatie\LaravelData\Lazy;

class UpdateProductAction
{
    public function __construct(
        private readonly ProductPricingService $pricingService
    ) {}

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

            // Filter Optional fields and nulls to avoid overwriting with null
            $productData = array_filter($productData, function ($value) {
                return ! ($value instanceof \Spatie\LaravelData\Optional) && $value !== null;
            });

            // Update product using Eloquent
            $product->update($productData);

            // Update relations if provided
            $relationsChanged = false;
            if ($relations !== null) {
                $this->syncRelations($product, $relations);
                $relationsChanged = true;
            }

            // For composite products: always recalculate derived prices (standard_cost,
            // estimated_base_day) on every save so the stored value stays in sync with
            // current component prices — even when the relations themselves didn't change.
            if ($product->product_type === ProductType::COMPOSITE) {
                $product->refresh();
                $this->recalculateCompositeDerivedFields($product);
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
     * Recalculate and persist standard_cost and estimated_base_day for a composite product.
     * Dispatches a queued job to also update price list items asynchronously.
     */
    private function recalculateCompositeDerivedFields(Product $product): void
    {
        $prices = $this->pricingService->calculateCompositePrices($product);

        if ($prices['components_count'] === 0) {
            return;
        }

        $updates = [
            'standard_cost' => $prices['standard_cost'],
        ];

        // Only update estimated_base_day if user has not manually locked it
        if (! $product->rental_price_estimated && $prices['estimated_base_day'] > 0) {
            $updates['estimated_base_day'] = $prices['estimated_base_day'];
        }

        $product->update($updates);

        // Dispatch job to recalculate price list items for this composite product
        // (same job used for article products — it updates non-manual price list items)
        RecalculatePriceListItemsForProductJob::dispatch($product->id);
    }

    /**
     * Extract relations from ProductData (if not Lazy)
     *
     * @return array|null null means "don't touch relations", array means "sync to this list"
     *
     * Null is returned for both Lazy (relation not loaded) AND null (relation key absent from
     * the request payload). This prevents partial updates — e.g. PATCH {standard_cost} — from
     * inadvertently wiping all component relations of a composite product.
     * An empty array is only returned when the caller explicitly sends `"relations": []`.
     */
    private function extractRelations(ProductData $data): ?array
    {
        // If relations is Lazy or null (key absent from payload), return null (don't touch)
        if ($data->relations instanceof Lazy || $data->relations === null) {
            return null;
        }

        // relations was explicitly sent as an empty list → remove all relations
        if ($data->relations->count() === 0) {
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

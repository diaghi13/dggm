<?php

namespace App\Actions\Product;

use App\Data\ProductData;
use App\Enums\ProductType;
use App\Jobs\RecalculatePriceListItemsForProductJob;
use App\Models\Product;
use App\Services\ProductPricingService;
use Illuminate\Support\Facades\DB;
use Spatie\LaravelData\Lazy;

class CreateProductAction
{
    public function __construct(
        private readonly ProductPricingService $pricingService
    ) {}

    /**
     * Create a new product with optional relations
     */
    public function execute(ProductData $data): Product
    {
        return DB::transaction(function () use ($data) {
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

            // Filter Optional fields and nulls to let DB defaults apply
            $productData = array_filter($productData, function ($value) {
                return ! ($value instanceof \Spatie\LaravelData\Optional) && $value !== null;
            });

            // Create product using Eloquent
            $product = Product::create($productData);

            // Attach relations if provided
            if (! empty($relations)) {
                $this->attachRelations($product, $relations);
            }

            // For composite products created with components: derive standard_cost and
            // estimated_base_day from the components synchronously before returning.
            if ($product->product_type === ProductType::COMPOSITE && ! empty($relations)) {
                $product->refresh();
                $prices = $this->pricingService->calculateCompositePrices($product);

                if ($prices['components_count'] > 0) {
                    $updates = ['standard_cost' => $prices['standard_cost']];

                    if (! $product->rental_price_estimated && $prices['estimated_base_day'] > 0) {
                        $updates['estimated_base_day'] = $prices['estimated_base_day'];
                    }

                    $product->update($updates);

                    // Dispatch queued job to also update price list items
                    RecalculatePriceListItemsForProductJob::dispatch($product->id);
                }
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
     */
    private function extractRelations(ProductData $data): array
    {
        // If relations is Lazy, return empty array
        if ($data->relations instanceof Lazy) {
            return [];
        }

        // If relations is null or empty, return empty array
        if ($data->relations === null || $data->relations->isEmpty()) {
            return [];
        }

        // Convert DataCollection to array
        return $data->relations->toArray();
    }

    /**
     * Attach relations to product
     *
     * Note: IDE may warn about guarded attributes, but ProductRelation has $fillable defined.
     * This is a false positive from static analysis.
     */
    private function attachRelations(Product $product, array $relations): void
    {
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

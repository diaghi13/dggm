<?php

namespace App\Listeners;

use App\Domains\Product\Enums\ProductType;
use App\Domains\Product\Events\ProductCostUpdated;
use App\Domains\Product\Models\Product;
use App\Domains\Warehouse\Models\StockMovement;
use App\Enums\StockMovementType;
use App\Events\StockMovementCreated;
use App\Jobs\RecalculatePriceListItemsForProductJob;
use App\Models\Setting;
use App\Services\PriceCalculatorService;
use App\Services\RentalEngineService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

/**
 * UpdateProductStandardCostListener
 *
 * Automatically updates product.standard_cost when INTAKE stock movements occur.
 * - Only processes ARTICLE products (inventoriable)
 * - Calculates purchase price from active supplier prices (strategy: highest/lowest/weighted_average)
 * - Updates standard_cost only if it is null/zero OR if new cost is higher
 * - Updates manufacturer_cost_price if movement has no supplier and unit_cost is higher
 * - Dispatches ProductCostUpdated when cost changes
 * - Optionally dispatches RecalculatePriceListItemsForProductJob based on setting
 * - Runs asynchronously via queue
 */
class UpdateProductStandardCostListener implements ShouldQueue
{
    use InteractsWithQueue;

    public int $tries = 3;

    public int $timeout = 30;

    /**
     * Create the event listener.
     */
    public function __construct(
        private readonly PriceCalculatorService $priceCalculator,
        private readonly RentalEngineService $rentalEngine,
    ) {}

    /**
     * Handle the event.
     */
    public function handle(StockMovementCreated $event): void
    {
        $movement = $event->movement;

        // Only process INTAKE movements
        if ($movement->type !== StockMovementType::INTAKE) {
            return;
        }

        $product = Product::with([
            'suppliers' => fn ($q) => $q->wherePivot('is_active', true),
        ])->find($movement->product_id);

        if (! $product) {
            return;
        }

        // Only process ARTICLE products (inventoriable)
        if ($product->product_type !== ProductType::ARTICLE) {
            return;
        }

        $costUpdated = false;

        // 1. Calculate new standard cost from active suppliers
        $newCost = $this->calculateStandardCost($product);

        // Use movement unit_cost as candidate if it exceeds the supplier-calculated cost.
        // This handles the race condition where the supplier pivot hasn't been written yet
        // (UpsertSupplierProductFromDdtListener runs in a separate queued job) and ensures
        // the price the user actually paid on the DDT is always considered.
        $movementUnitCost = (float) ($movement->unit_cost ?? 0);
        if ($movementUnitCost > 0 && $movementUnitCost > $newCost) {
            $newCost = $movementUnitCost;
        }

        // 2. Update standard_cost only if null/zero OR if new cost is higher
        $currentStandardCost = (float) ($product->standard_cost ?? 0);
        if ($newCost > 0 && ($currentStandardCost <= 0 || $newCost > $currentStandardCost)) {
            $product->standard_cost = $newCost;
            $costUpdated = true;
        }

        // 3. If movement has no supplier, update manufacturer_cost_price with same rule
        if (! $this->movementHasSupplier($movement) && $movementUnitCost > 0) {
            $currentMfgCost = (float) ($product->manufacturer_cost_price ?? 0);
            if ($currentMfgCost <= 0 || $movementUnitCost > $currentMfgCost) {
                $product->manufacturer_cost_price = $movementUnitCost;
                $costUpdated = true;
            }
        }

        if (! $costUpdated) {
            return;
        }

        $product->save();

        Log::info('Product standard_cost updated', [
            'product_id' => $product->id,
            'product_code' => $product->code,
            'new_standard_cost' => $product->standard_cost,
            'movement_id' => $movement->id,
        ]);

        ProductCostUpdated::dispatch($product, [
            'trigger' => 'stock_movement',
            'movement_id' => $movement->id,
            'new_cost' => $newCost,
        ]);

        // Always update estimated_base_day for rentable products, regardless of the
        // auto_recalculate setting (which controls only the full price list recalculation).
        if ($product->is_rentable && ! $product->rental_price_estimated) {
            $salePrice = $this->priceCalculator->calculateProductSalePrice($product);
            $estimatedBaseDay = $this->rentalEngine->calculateEstimatedBaseDay(
                $salePrice,
                (bool) $product->is_premium
            );
            $product->update(['estimated_base_day' => $estimatedBaseDay]);

            Log::info('Product estimated_base_day updated', [
                'product_id' => $product->id,
                'sale_price' => $salePrice,
                'estimated_base_day' => $estimatedBaseDay,
            ]);
        }

        $autoRecalculate = (bool) Setting::get('pricing.auto_recalculate_price_list_on_purchase', false);
        if ($autoRecalculate) {
            RecalculatePriceListItemsForProductJob::dispatch($product->id);
        }
    }

    /**
     * Calculate standard cost from active supplier pivot prices only.
     * Does NOT fall back to manufacturer_cost_price (that is a catalog reference, not purchase cost).
     */
    private function calculateStandardCost(Product $product): float
    {
        $strategy = Setting::get('pricing.purchase_price_strategy', 'highest');

        $suppliers = $product->suppliers()
            ->wherePivot('is_active', true)
            ->get();

        if ($suppliers->isEmpty()) {
            return 0.0;
        }

        return match ($strategy) {
            'lowest' => (float) $suppliers->min('pivot.purchase_price'),
            'weighted_average' => $this->priceCalculator->calculateWeightedAverageSupplierPrice($suppliers),
            default => (float) $suppliers->max('pivot.purchase_price'),
        };
    }

    /**
     * Determine whether the stock movement is linked to a supplier.
     * Checks both a direct supplier_id on the movement and the associated DDT's supplier.
     */
    private function movementHasSupplier(StockMovement $movement): bool
    {
        if (! empty($movement->supplier_id)) {
            return true;
        }

        // A DDT-linked movement inherits the DDT's supplier
        if (! empty($movement->ddt_id)) {
            $ddt = $movement->ddt;
            if ($ddt && ! empty($ddt->supplier_id)) {
                return true;
            }
        }

        return false;
    }
}

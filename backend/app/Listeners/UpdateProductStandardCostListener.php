<?php

namespace App\Listeners;

use App\Enums\ProductType;
use App\Enums\StockMovementType;
use App\Events\StockMovementCreated;
use App\Models\Setting;
use App\Services\PriceCalculatorService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * UpdateProductStandardCostListener
 *
 * Automatically updates product.standard_cost when INTAKE stock movements occur.
 * - Only processes ARTICLE products (inventoriable)
 * - Calculates weighted average from supplier_product.purchase_price
 * - Respects pricing.purchase_price_strategy setting (highest, lowest, weighted_average)
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
        private readonly PriceCalculatorService $priceCalculator
    ) {
        //
    }

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

        $product = $movement->product;

        // Only process ARTICLE products (inventoriable)
        if ($product->product_type !== ProductType::ARTICLE) {
            return;
        }

        // Calculate and update standard_cost
        $standardCost = $this->calculateStandardCost($product);

        DB::transaction(function () use ($product, $standardCost) {
            $product->update(['standard_cost' => $standardCost]);
        });

        Log::info('Product standard_cost updated', [
            'product_id' => $product->id,
            'product_code' => $product->code,
            'new_standard_cost' => $standardCost,
            'movement_id' => $event->movement->id,
        ]);
    }

    /**
     * Calculate standard cost based on supplier prices and strategy
     * Uses PriceCalculatorService to apply pricing.purchase_price_strategy setting
     */
    private function calculateStandardCost($product): ?float
    {
        $strategy = Setting::get('pricing.purchase_price_strategy', 'highest');

        // Use PriceCalculatorService instead of duplicating logic
        return $this->priceCalculator->calculateProductPurchasePrice($product, $strategy);
    }
}

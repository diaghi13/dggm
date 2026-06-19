<?php

namespace App\Domains\Product\Events;

use App\Domains\Product\Models\Product;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * ProductCostUpdated Event
 *
 * Triggered when a product's purchase cost changes (e.g. after a stock load or DDT).
 *
 * Listeners / consumers:
 * - RecalculatePriceListItemsForProductJob — dispatched conditionally based on
 *   the setting pricing.auto_recalculate_price_list_on_purchase.
 */
class ProductCostUpdated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Product $product,
        public readonly array $metadata = []
    ) {}
}

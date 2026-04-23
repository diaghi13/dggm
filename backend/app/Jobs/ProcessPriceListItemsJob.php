<?php

namespace App\Jobs;

use App\Models\PriceList;
use App\Models\PriceListItem;
use App\Models\Product;
use App\Services\ProductPricingService;
use Illuminate\Bus\Batchable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Process Price List Items Job
 *
 * Processes a chunk of products to generate price list items.
 * Part of batched async generation to prevent timeout on large datasets.
 *
 * ARCHITECTURE:
 * - Queued job with retry policy
 * - Processes chunk of products (default: 500)
 * - Used within Laravel Batch for progress tracking
 */
class ProcessPriceListItemsJob implements ShouldQueue
{
    use Batchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Number of times the job may be attempted
     */
    public int $tries = 3;

    /**
     * Maximum execution time (5 minutes per chunk)
     */
    public int $timeout = 300;

    /**
     * Create a new job instance
     *
     * @param  int  $priceListId  Price list ID
     * @param  int  $offset  Starting offset for product query
     * @param  int  $limit  Number of products to process
     */
    public function __construct(
        public readonly int $priceListId,
        public readonly int $offset,
        public readonly int $limit
    ) {}

    /**
     * Execute the job
     */
    public function handle(ProductPricingService $pricingService): void
    {
        $priceList = PriceList::findOrFail($this->priceListId);

        // Get products chunk filtered by category if specified
        $products = Product::active()
            ->when($priceList->category_id, fn ($q) => $q->where('category_id', $priceList->category_id))
            ->skip($this->offset)
            ->take($this->limit)
            ->get();

        $itemsCreated = 0;

        foreach ($products as $product) {
            try {
                // Generate item data based on calculation mode
                $itemData = $priceList->calculation_mode->value === 'automatic'
                    ? $pricingService->generateAutomaticPriceListItem($product, $priceList)
                    : $pricingService->generateManualPriceListItem($product);

                PriceListItem::create([
                    'price_list_id' => $priceList->id,
                    'product_id' => $product->id,
                    'name' => $product->name,
                    'code' => $product->code,
                    'unit' => $product->unit ?? null,
                    'item_type' => $product->product_type->value,
                    ...$itemData,
                ]);

                $itemsCreated++;
            } catch (\Exception $e) {
                Log::error('Failed to generate price list item', [
                    'price_list_id' => $priceList->id,
                    'product_id' => $product->id,
                    'error' => $e->getMessage(),
                ]);

                // Continue with next product instead of failing entire chunk
                continue;
            }
        }

        Log::info('Price list items chunk processed', [
            'price_list_id' => $priceList->id,
            'offset' => $this->offset,
            'limit' => $this->limit,
            'items_created' => $itemsCreated,
        ]);
    }
}

<?php

namespace App\Actions\PriceList;

use App\Data\PriceListData;
use App\Events\PriceListGenerated;
use App\Models\PriceList;
use App\Models\PriceListItem;
use App\Models\Product;
use App\Services\ProductPricingService;
use Illuminate\Support\Facades\DB;

/**
 * Generate Price List Action
 *
 * Creates a price list and generates items for all applicable products.
 * Supports automatic (calculated) and manual (custom) price lists.
 *
 * ARCHITECTURE RULES:
 * - Uses DB::transaction() for atomicity
 * - Accepts Spatie Data DTO as parameter
 * - Returns Eloquent Model
 * - Dispatches Events AFTER persistence
 * - NO HTTP concerns (authorization/validation in Controller)
 */
class GeneratePriceListAction
{
    public function __construct(
        private readonly ProductPricingService $pricingService
    ) {}

    /**
     * Execute the action
     *
     * @param  PriceListData  $data  Price list configuration data
     * @param  bool  $generateItems  Whether to generate price list items
     * @return PriceList Created price list with items
     */
    public function execute(PriceListData $data, bool $generateItems = true): PriceList
    {
        return DB::transaction(function () use ($data, $generateItems) {
            // Create price list
            $priceList = PriceList::create($data->except('id', 'items')->toArray());

            $itemsCreated = 0;

            if ($generateItems) {
                // Get products filtered by category if specified
                $products = Product::active()
                    ->when($priceList->category_id, fn ($q) => $q->where('category_id', $priceList->category_id)
                    )
                    ->get();

                // Generate items based on calculation mode
                foreach ($products as $product) {
                    $itemData = $priceList->calculation_mode === 'automatic'
                        ? $this->pricingService->generateAutomaticPriceListItem($product, $priceList)
                        : $this->pricingService->generateManualPriceListItem($product);

                    PriceListItem::create([
                        'price_list_id' => $priceList->id,
                        'product_id' => $product->id,
                        ...$itemData,
                    ]);

                    $itemsCreated++;
                }
            }

            // Dispatch event AFTER persistence
            PriceListGenerated::dispatch($priceList, [
                'items_created' => $itemsCreated,
                'user_id' => auth()->id(),
            ]);

            return $priceList->fresh(['items', 'category']);
        });
    }
}

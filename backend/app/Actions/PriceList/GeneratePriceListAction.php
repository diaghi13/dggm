<?php

namespace App\Actions\PriceList;

use App\Data\PriceListData;
use App\Events\PriceListGenerated;
use App\Models\PriceList;
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
    /**
     * Execute the action
     *
     * Creates the price list entity. If generateItems is true, items generation
     * is delegated to background jobs via PriceListGenerated event.
     *
     * @param  PriceListData  $data  Price list configuration data
     * @param  bool  $generateItems  Whether to generate price list items (async via jobs)
     * @return PriceList Created price list
     */
    public function execute(PriceListData $data, bool $generateItems = true): PriceList
    {
        return DB::transaction(function () use ($data, $generateItems) {
            // Create price list
            $priceList = PriceList::create($data->except('id', 'items')->toArray());

            // Dispatch event AFTER persistence
            // If generateItems=true, listener will dispatch background jobs to create items
            PriceListGenerated::dispatch($priceList, [
                'generate_items' => $generateItems,
                'user_id' => auth()->id(),
            ]);

            return $priceList->fresh(['category']);
        });
    }
}

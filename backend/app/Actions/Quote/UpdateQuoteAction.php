<?php

namespace App\Actions\Quote;

use App\Data\QuoteData;
use App\Events\QuoteUpdated;
use App\Models\Quote;
use App\Models\QuoteItem;
use Illuminate\Support\Facades\DB;

class UpdateQuoteAction
{
    public function execute(Quote $quote, QuoteData $data): Quote
    {
        return DB::transaction(function () use ($quote, $data) {
            $quote->update($data->except('id', 'items', 'code', 'customer', 'projectManager', 'priceList', 'paymentTerm', 'financialResource', 'warrantyType', 'project', 'full_address')->toArray());

            // Update items if provided (with hierarchy support)
            if ($data->items instanceof \Spatie\LaravelData\DataCollection) {
                // Collect all item IDs (including children) recursively
                $allItemIds = $this->collectAllItemIds($data->items);

                // Delete removed items
                $quote->items()->whereNotIn('id', $allItemIds)->delete();

                // Pre-load all existing items into memory to avoid N+1 (one SELECT per item)
                $existingItemsMap = $quote->items()->get()->keyBy('id');

                // Update/create items with hierarchy
                foreach ($data->items as $itemData) {
                    $this->updateOrCreateItemWithChildren($quote, $itemData, null, $existingItemsMap);
                }
            }

            // Recalculate totals
            $quote->calculateTotals();

            QuoteUpdated::dispatch($quote, [
                'user_id' => auth()->id(),
                'changes' => $quote->getChanges(),
            ]);

            return $quote->fresh(['items.children', 'customer', 'projectManager', 'priceList', 'paymentTerm', 'financialResource', 'warrantyType']);
        });
    }

    /**
     * Recursively collect all item IDs from data
     */
    private function collectAllItemIds(\Spatie\LaravelData\DataCollection $items): array
    {
        $ids = [];

        foreach ($items as $itemData) {
            if (! ($itemData->id instanceof \Spatie\LaravelData\Optional) && $itemData->id) {
                $ids[] = $itemData->id;
            }

            if (isset($itemData->children) && $itemData->children instanceof \Spatie\LaravelData\DataCollection) {
                $ids = array_merge($ids, $this->collectAllItemIds($itemData->children));
            }
        }

        return $ids;
    }

    /**
     * Recursively update or create item with children.
     *
     * Uses $existingItemsMap (keyed by id) to avoid one SELECT per item.
     * Uses saveQuietly() to skip model events (updating/saved) which would otherwise
     * trigger calculateTotals() on the quote for every single item — 145× with a large quote.
     * calculateTotal() (per-item totals) is called manually with the quote relation pre-set
     * to avoid the lazy load in the `updating` event.
     * The quote's calculateTotals() is called once explicitly at the end of execute().
     */
    private function updateOrCreateItemWithChildren(Quote $quote, $itemData, ?int $parentId, \Illuminate\Support\Collection $existingItemsMap): void
    {
        $itemArray = $itemData->except('id', 'product', 'priceListItem', 'parent', 'children')->toArray();

        // If called as child (parentId passed), use that; otherwise preserve parent_id from data
        // This fixes the bug where items were moved out of sections incorrectly
        $itemArray['parent_id'] = $parentId ?? ($itemArray['parent_id'] ?? null);

        $itemId = (! ($itemData->id instanceof \Spatie\LaravelData\Optional)) ? $itemData->id : null;
        $existingItem = $itemId ? $existingItemsMap->get($itemId) : null;

        if ($existingItem) {
            $existingItem->fill($itemArray);
            // Pre-set relation to avoid lazy load triggered by calculateTotal()
            $existingItem->setRelation('quote', $quote);
            $existingItem->calculateTotal();
            $existingItem->saveQuietly(); // skips updating/saved events → no cascading calculateTotals()
            $item = $existingItem;
        } else {
            $newItem = new QuoteItem(array_merge(['quote_id' => $quote->id], $itemArray));
            $newItem->discount_percentage = $newItem->discount_percentage ?? 0;
            $newItem->setRelation('quote', $quote);
            $newItem->calculateTotal();
            $newItem->saveQuietly();
            $item = $newItem;
        }

        // Update/create children recursively
        if (isset($itemData->children) && $itemData->children instanceof \Spatie\LaravelData\DataCollection) {
            foreach ($itemData->children as $childData) {
                $this->updateOrCreateItemWithChildren($quote, $childData, $item->id, $existingItemsMap);
            }
        }
    }
}

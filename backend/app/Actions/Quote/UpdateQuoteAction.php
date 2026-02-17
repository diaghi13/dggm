<?php

namespace App\Actions\Quote;

use App\Data\QuoteData;
use App\Events\QuoteUpdated;
use App\Models\Quote;
use Illuminate\Support\Facades\DB;

class UpdateQuoteAction
{
    public function execute(Quote $quote, QuoteData $data): Quote
    {
        return DB::transaction(function () use ($quote, $data) {
            $quote->update($data->except('id', 'items', 'code', 'customer', 'projectManager', 'priceList', 'paymentTerm', 'financialResource', 'warrantyType', 'site', 'full_address')->toArray());

            // Update items if provided (with hierarchy support)
            if ($data->items instanceof \Spatie\LaravelData\DataCollection) {
                // Collect all item IDs (including children) recursively
                $allItemIds = $this->collectAllItemIds($data->items);

                // Delete removed items
                $quote->items()->whereNotIn('id', $allItemIds)->delete();

                // Update/create items with hierarchy
                foreach ($data->items as $itemData) {
                    $this->updateOrCreateItemWithChildren($quote, $itemData);
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
     * Recursively update or create item with children
     */
    private function updateOrCreateItemWithChildren(Quote $quote, $itemData, ?int $parentId = null): void
    {
        $itemArray = $itemData->except('id', 'product', 'priceListItem', 'parent', 'children')->toArray();

        // If called as child (parentId passed), use that; otherwise preserve parent_id from data
        // This fixes the bug where items were moved out of sections incorrectly
        $itemArray['parent_id'] = $parentId ?? ($itemArray['parent_id'] ?? null);

        // Check if ID is valid and exists in database
        $existingItem = null;
        if (! ($itemData->id instanceof \Spatie\LaravelData\Optional) && $itemData->id) {
            $existingItem = $quote->items()->find($itemData->id);
        }

        if ($existingItem) {
            // Update existing item
            $existingItem->update($itemArray);
            $item = $existingItem;
        } else {
            // Create new item (either no ID or ID doesn't exist - temporary ID from frontend)
            $item = $quote->items()->create($itemArray);
        }

        // Update/create children recursively
        if (isset($itemData->children) && $itemData->children instanceof \Spatie\LaravelData\DataCollection) {
            foreach ($itemData->children as $childData) {
                $this->updateOrCreateItemWithChildren($quote, $childData, $item->id);
            }
        }
    }
}

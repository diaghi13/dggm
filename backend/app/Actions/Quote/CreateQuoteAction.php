<?php

namespace App\Actions\Quote;

use App\Data\QuoteData;
use App\Events\QuoteCreated;
use App\Models\Quote;
use Illuminate\Support\Facades\DB;

class CreateQuoteAction
{
    public function execute(QuoteData $data): Quote
    {
        return DB::transaction(function () use ($data) {
            $quote = Quote::create($data->except('id', 'items', 'customer', 'projectManager', 'priceList', 'paymentTerm', 'warrantyType', 'site', 'full_address')->toArray());

            // Create items if provided (with hierarchy support)
            if ($data->items instanceof \Spatie\LaravelData\DataCollection) {
                foreach ($data->items as $itemData) {
                    $this->createItemWithChildren($quote, $itemData);
                }
            }

            // Recalculate totals
            $quote->calculateTotals();

            // Dispatch event
            QuoteCreated::dispatch($quote, [
                'user_id' => auth()->id(),
                'ip_address' => request()->ip(),
            ]);

            return $quote->fresh(['items.children', 'customer', 'projectManager', 'priceList', 'paymentTerm', 'warrantyType']);
        });
    }

    /**
     * Recursively create item with children
     */
    private function createItemWithChildren(Quote $quote, $itemData, ?int $parentId = null): void
    {
        // Create the item
        $item = $quote->items()->create([
            ...$itemData->except('id', 'product', 'priceListItem', 'parent', 'children')->toArray(),
            'parent_id' => $parentId,
        ]);

        // Create children recursively
        if (isset($itemData->children) && $itemData->children instanceof \Spatie\LaravelData\DataCollection) {
            foreach ($itemData->children as $childData) {
                $this->createItemWithChildren($quote, $childData, $item->id);
            }
        }
    }
}

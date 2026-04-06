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
            $quote->update($data->except('id', 'items', 'customer', 'projectManager', 'priceList', 'paymentTerm', 'financialResource', 'warrantyType', 'project', 'full_address')->toArray());

            // Update items if provided (with hierarchy support)
            if ($data->items instanceof \Spatie\LaravelData\DataCollection) {
                // Collect all item IDs (including children) recursively
                $allItemIds = $this->collectAllItemIds($data->items);

                // Delete removed items
                $quote->items()->whereNotIn('id', $allItemIds)->delete();

                // Pre-load all existing items into memory to avoid N+1 (one SELECT per item)
                $existingItemsMap = $quote->items()->get()->keyBy('id');

                // Track IDs of parents persisted in this transaction (for FK validation)
                $savedParentIds = collect();

                // Update/create items with hierarchy
                foreach ($data->items as $itemData) {
                    $this->updateOrCreateItemWithChildren($quote, $itemData, null, $existingItemsMap, $savedParentIds);
                }
            }

            // Recalculate totals
            $quote->calculateTotals();

            // Update deposits if provided (last percentage deposit absorbs rounding remainder)
            if ($data->deposits instanceof \Spatie\LaravelData\DataCollection) {
                $keepIds = $data->deposits->toCollection()
                    ->filter(fn ($d) => ! ($d->id instanceof \Spatie\LaravelData\Optional) && $d->id)
                    ->pluck('id')
                    ->toArray();

                $quote->deposits()->whereNotIn('id', $keepIds)->delete();

                $deposits = $data->deposits->toCollection();
                $pctDeposits = $deposits->filter(fn ($d) => ! $d->is_fixed_amount && $d->percentage !== null);
                $totalPct = $pctDeposits->sum('percentage');
                $isFullSchedule = abs($totalPct - 100) < 0.01;
                $runningSum = 0.0;
                $pctProcessed = 0;
                $pctTotal = $pctDeposits->count();

                foreach ($deposits as $depositData) {
                    $arr = $depositData->except('id')->toArray();
                    if (! $depositData->is_fixed_amount && $depositData->percentage !== null) {
                        $pctProcessed++;
                        if ($isFullSchedule && $pctProcessed === $pctTotal) {
                            $arr['amount'] = round($quote->total_amount - $runningSum, 2);
                        } else {
                            $arr['amount'] = round(($quote->total_amount * $depositData->percentage) / 100, 2);
                            $runningSum += $arr['amount'];
                        }
                    }

                    $depositId = ! ($depositData->id instanceof \Spatie\LaravelData\Optional) ? $depositData->id : null;
                    if ($depositId) {
                        $quote->deposits()->where('id', $depositId)->update($arr);
                    } else {
                        $quote->deposits()->create($arr);
                    }
                }
            }

            QuoteUpdated::dispatch($quote, [
                'user_id' => auth()->id(),
                'changes' => $quote->getChanges(),
            ]);

            return $quote->fresh(['items.children', 'customer', 'projectManager', 'priceList', 'paymentTerm', 'financialResource', 'warrantyType', 'deposits']);
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
     *
     * @param  \Illuminate\Support\Collection<int, QuoteItem>  $savedParentIds  IDs of parents already persisted in this transaction
     */
    private function updateOrCreateItemWithChildren(Quote $quote, $itemData, ?int $parentId, \Illuminate\Support\Collection $existingItemsMap, \Illuminate\Support\Collection $savedParentIds): void
    {
        $itemArray = $itemData->except('id', 'quote_id', 'product', 'priceListItem', 'parent', 'children')->toArray();

        // If called as child (parentId passed), use that; otherwise preserve parent_id from data
        // This fixes the bug where items were moved out of sections incorrectly
        $resolvedParentId = $parentId ?? ($itemArray['parent_id'] ?? null);

        // Defensive check: if parent_id points to an ID that does not exist in DB and was not
        // created in this same transaction, the FK constraint will fail. Skip the item to avoid
        // SQLSTATE[23000] and log a warning so it can be investigated.
        if ($resolvedParentId !== null) {
            $parentExistsInDb = $existingItemsMap->has($resolvedParentId);
            $parentCreatedInTransaction = $savedParentIds->contains($resolvedParentId);

            if (! $parentExistsInDb && ! $parentCreatedInTransaction) {
                \Log::warning('UpdateQuoteAction: skipping item with missing parent_id', [
                    'quote_id' => $quote->id,
                    'item_description' => $itemData->description ?? null,
                    'missing_parent_id' => $resolvedParentId,
                ]);

                return;
            }
        }

        $itemArray['parent_id'] = $resolvedParentId;

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

        // Track this item's persisted ID so children can validate their parent_id
        $savedParentIds->push($item->id);

        // Update/create children recursively
        if (isset($itemData->children) && $itemData->children instanceof \Spatie\LaravelData\DataCollection) {
            foreach ($itemData->children as $childData) {
                $this->updateOrCreateItemWithChildren($quote, $childData, $item->id, $existingItemsMap, $savedParentIds);
            }
        }
    }
}

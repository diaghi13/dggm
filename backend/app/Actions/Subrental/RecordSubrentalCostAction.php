<?php

namespace App\Actions\Subrental;

use App\Domains\Quote\Models\Quote;
use App\Models\SubrentalCostHistory;
use Illuminate\Support\Facades\DB;

class RecordSubrentalCostAction
{
    public function execute(Quote $quote): void
    {
        DB::transaction(function () use ($quote) {
            $quote->load('items.product.preferredSubrentalSupplier');

            foreach ($quote->items as $item) {
                $product = $item->product;

                if (! $product || $product->ownership_type === 'owned') {
                    continue;
                }

                $supplier = $product->preferredSubrentalSupplier?->supplier
                    ?? $product->subrentalSuppliers()->orderByDesc('is_preferred')->first()?->supplier;

                if (! $supplier) {
                    continue;
                }

                $supplierRecord = $product->subrentalSuppliers()
                    ->where('supplier_id', $supplier->id)
                    ->first();

                if (! $supplierRecord) {
                    continue;
                }

                $duration = $item->duration ?? $quote->event_days ?? 1;
                $actualCost = $supplierRecord->day_rate * $duration * ($item->quantity ?? 1);
                $marginGenerated = $item->total - $actualCost;

                SubrentalCostHistory::create([
                    'product_id' => $product->id,
                    'supplier_id' => $supplier->id,
                    'quote_id' => $quote->id,
                    'actual_cost' => $actualCost,
                    'duration_days' => $duration,
                    'margin_generated' => $marginGenerated,
                    'date' => now()->toDateString(),
                ]);
            }
        });
    }
}

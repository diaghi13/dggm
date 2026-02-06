<?php

namespace App\Listeners;

use App\Enums\DdtType;
use App\Events\DdtConfirmed;
use App\Models\Setting;
use App\Models\SupplierProduct;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

/**
 * Auto-populate supplier_product table from incoming DDT
 *
 * When a DDT of type Incoming is confirmed, this listener will:
 * 1. Create or update supplier_product records for each item
 * 2. Update purchase_price ONLY if new price is higher (avoid temporary discounts)
 * 3. Set is_preferred_supplier if product has no preferred supplier yet
 *
 * NOTE: This listener runs SYNCHRONOUSLY (not queued) to ensure immediate execution
 */
class UpsertSupplierProductFromDdtListener implements ShouldQueue
{
    /**
     * Handle the event.
     */
    public function handle(DdtConfirmed $event): void
    {
        $ddt = $event->ddt;

        // Only process incoming DDTs (from suppliers)
        if ($ddt->type !== DdtType::Incoming) {
            return;
        }

        // Must have a supplier
        if (! $ddt->supplier_id) {
            Log::warning('DDT confirmed without supplier_id', ['ddt_id' => $ddt->id]);

            return;
        }

        foreach ($ddt->items as $item) {
            $this->upsertSupplierProduct($ddt, $item);
        }

        Log::info('Supplier products updated from DDT', [
            'ddt_id' => $ddt->id,
            'supplier_id' => $ddt->supplier_id,
            'items_count' => $ddt->items->count(),
        ]);
    }

    /**
     * Upsert supplier_product record from DDT item
     */
    private function upsertSupplierProduct($ddt, $item): void
    {
        $product = $item->product;

        // Find existing supplier_product record
        $existing = SupplierProduct::where('supplier_id', $ddt->supplier_id)
            ->where('product_id', $item->product_id)
            ->first();

        // Get pricing settings
        $autoUpdateOnPurchase = (bool) Setting::get('pricing.auto_update_on_purchase', true);
        $updateOnlyIfHigher = (bool) Setting::get('pricing.update_only_if_higher', true);

        // Determine if we should update the price
        $shouldUpdatePrice = false;
        $newPrice = (float) $item->unit_cost;

        if (! $existing) {
            // No existing record → always create with new price
            $shouldUpdatePrice = true;
        } elseif ($autoUpdateOnPurchase) {
            // Existing record and auto-update enabled
            if ($updateOnlyIfHigher) {
                // Only update if new price is higher (avoid temporary discounts)
                $shouldUpdatePrice = $newPrice > (float) $existing->purchase_price;
            } else {
                // Always update price on purchase
                $shouldUpdatePrice = true;
            }
        }
        // If auto_update_on_purchase is false → never update existing prices

        // Check if product has a preferred supplier
        $hasPreferredSupplier = SupplierProduct::where('product_id', $item->product_id)
            ->where('is_preferred_supplier', true)
            ->exists();

        // Prepare data for upsert
        $data = [
            'supplier_id' => $ddt->supplier_id,
            'product_id' => $item->product_id,
        ];

        if (! $existing) {
            // CREATION: Deduce fields from Product
            $updates = [
                // Codes
                'supplier_product_code' => $product->code,
                'supplier_ean' => $product->ean, // From product

                // Pricing
                'purchase_price' => $newPrice,
                'retail_price' => $product->manufacturer_retail_price, // From product
                'last_price_update' => now(),

                // Order constraints (deduce from product if available)
                'package_quantity' => 1,
                'minimum_order_quantity' => 1,
                'lead_time_days' => $product->lead_time_days, // From product

                // Discount family (cannot deduce from supplier)
                'discount_family_id' => null,

                // Set as preferred supplier if product has none
                'is_preferred_supplier' => ! $hasPreferredSupplier,

                // Always active
                'is_active' => true,

                // Currency
                'currency' => 'EUR',
            ];
        } else {
            // UPDATE: Only update price if higher, keep everything else
            $updates = [];

            // Update price only if higher
            if ($shouldUpdatePrice) {
                $updates['purchase_price'] = $newPrice;
                $updates['last_price_update'] = now();
            }

            // Always ensure active
            $updates['is_active'] = true;
        }

        // Upsert
        SupplierProduct::updateOrCreate($data, $updates);

        Log::debug('Supplier product upserted', [
            'supplier_id' => $ddt->supplier_id,
            'product_id' => $item->product_id,
            'action' => $existing ? 'updated' : 'created',
            'price_updated' => $shouldUpdatePrice,
            'new_price' => $newPrice,
            'old_price' => $existing?->purchase_price,
            'settings' => [
                'auto_update' => $autoUpdateOnPurchase,
                'only_if_higher' => $updateOnlyIfHigher,
            ],
        ]);
    }
}

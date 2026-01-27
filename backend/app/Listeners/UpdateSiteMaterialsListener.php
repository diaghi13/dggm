<?php

namespace App\Listeners;

use App\Enums\DdtType;
use App\Events\DdtDelivered;
use App\Models\SiteMaterial;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * UpdateSiteMaterialsListener
 *
 * CRITICAL LISTENER - Updates site_materials table when outgoing DDT to site is delivered.
 *
 * Must run synchronously (NOT queued) to ensure site inventory is updated before response.
 */
class UpdateSiteMaterialsListener
{
    public function handle(DdtDelivered $event): void
    {
        $ddt = $event->ddt->fresh(['items.product']);

        // Only process outgoing DDTs to sites
        if ($ddt->type !== DdtType::Outgoing || ! $ddt->site_id) {
            return;
        }

        DB::transaction(function () use ($ddt) {
            foreach ($ddt->items as $item) {
                // Update or create site_materials record
                $siteMaterial = SiteMaterial::updateOrCreate(
                    [
                        'site_id' => $ddt->site_id,
                        'product_id' => $item->product_id,
                    ],
                    [
                        'quantity_delivered' => DB::raw("COALESCE(quantity_delivered, 0) + {$item->quantity}"),
                    ]
                );

                Log::info('Site material updated after DDT delivery', [
                    'site_id' => $ddt->site_id,
                    'product_id' => $item->product_id,
                    'quantity_added' => $item->quantity,
                    'ddt_code' => $ddt->code,
                ]);
            }

            Log::info('Site materials updated for delivered DDT', [
                'ddt_id' => $ddt->id,
                'ddt_code' => $ddt->code,
                'site_id' => $ddt->site_id,
                'items_count' => $ddt->items->count(),
            ]);
        });
    }
}

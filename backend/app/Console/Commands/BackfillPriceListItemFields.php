<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\PriceListItem;
use App\Models\Tenant;
use Illuminate\Console\Command;

class BackfillPriceListItemFields extends Command
{
    protected $signature = 'price-list-items:backfill-fields';

    protected $description = 'Backfill name, code, unit fields on price_list_items from associated products';

    public function handle(): int
    {
        $tenants = Tenant::all();

        if ($tenants->isEmpty()) {
            $this->info('No tenants found.');

            return Command::SUCCESS;
        }

        $this->info("Processing {$tenants->count()} tenant(s)...");

        $totalUpdated = 0;

        foreach ($tenants as $tenant) {
            $slug = $tenant->slug ?? $tenant->id;

            tenancy()->initialize($tenant);

            try {
                $updated = $this->backfillForTenant($slug);
                $totalUpdated += $updated;
            } finally {
                tenancy()->end();
            }
        }

        $this->info("Done. Total records updated: {$totalUpdated}");

        return Command::SUCCESS;
    }

    private function backfillForTenant(string $slug): int
    {
        $updated = 0;

        PriceListItem::query()
            ->whereNotNull('product_id')
            ->where(function ($query): void {
                $query->whereNull('name')
                    ->orWhereNull('code')
                    ->orWhereNull('item_type');
            })
            ->with('product')
            ->chunk(200, function ($items) use (&$updated): void {
                foreach ($items as $item) {
                    if (! $item->product) {
                        continue;
                    }

                    $item->update([
                        'name' => $item->name ?? $item->product->name,
                        'code' => $item->code ?? $item->product->code,
                        'unit' => $item->unit ?? $item->product->unit,
                        'item_type' => $item->item_type ?? $item->product->product_type->value,
                    ]);

                    $updated++;
                }
            });

        $this->line("  [{$slug}] Updated: {$updated} item(s)");

        return $updated;
    }
}

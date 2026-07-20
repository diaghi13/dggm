<?php

namespace App\Console\Commands;

use App\Models\Quote;
use App\Models\Tenant;
use Illuminate\Console\Command;

class RecalculateQuoteTotalsCommand extends Command
{
    protected $signature = 'quotes:recalculate-totals
                            {--tenant= : Slug o ID del tenant specifico (ometti per tutti i tenant)}
                            {--dry-run : Mostra solo quanti preventivi verrebbero aggiornati senza salvare}';

    protected $description = 'Ricalcola gross_total, items_discount, taxable_amount, tax_amount e total_amount per tutti i preventivi';

    public function handle(): int
    {
        $tenants = $this->resolveTenants();

        if ($tenants->isEmpty()) {
            $this->warn('Nessun tenant trovato.');

            return Command::SUCCESS;
        }

        $isDryRun = $this->option('dry-run');

        if ($isDryRun) {
            $this->info('[DRY RUN] Nessuna modifica verrà salvata.');
        }

        $this->info("Trovati {$tenants->count()} tenant(s). Avvio ricalcolo...");

        $totalProcessed = 0;
        $totalErrors = 0;

        foreach ($tenants as $tenant) {
            $slug = $tenant->slug ?? $tenant->id;

            tenancy()->initialize($tenant);

            try {
                [$processed, $errors] = $this->recalculateForTenant($slug, $isDryRun);
                $totalProcessed += $processed;
                $totalErrors += $errors;
            } finally {
                tenancy()->end();
            }
        }

        $this->newLine();
        $this->info("Completato. Preventivi processati: {$totalProcessed} | Errori: {$totalErrors}");

        return $totalErrors > 0 ? Command::FAILURE : Command::SUCCESS;
    }

    private function resolveTenants(): \Illuminate\Support\Collection
    {
        $tenantFilter = $this->option('tenant');

        if ($tenantFilter) {
            $tenant = Tenant::where('slug', $tenantFilter)
                ->orWhere('id', $tenantFilter)
                ->first();

            if (! $tenant) {
                $this->error("Tenant '{$tenantFilter}' non trovato.");

                return collect();
            }

            return collect([$tenant]);
        }

        return Tenant::all();
    }

    private function recalculateForTenant(string $slug, bool $isDryRun): array
    {
        $processed = 0;
        $errors = 0;

        $total = Quote::withTrashed()->count();
        $this->line("  [{$slug}] Preventivi da processare: {$total}");

        Quote::withTrashed()
            ->with(['items' => fn ($q) => $q->whereNull('parent_id')->with('children')])
            ->chunk(50, function ($quotes) use ($slug, $isDryRun, &$processed, &$errors): void {
                foreach ($quotes as $quote) {
                    try {
                        if (! $isDryRun) {
                            $quote->calculateTotals();
                        }
                        $processed++;
                    } catch (\Throwable $e) {
                        $errors++;
                        $this->warn("  [{$slug}] Errore su preventivo #{$quote->id}: {$e->getMessage()}");
                    }
                }
            });

        $this->line("  [{$slug}] Aggiornati: {$processed} | Errori: {$errors}");

        return [$processed, $errors];
    }
}

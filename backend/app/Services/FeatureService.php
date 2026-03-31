<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Landlord\TenantSubscription;
use Illuminate\Support\Facades\Cache;

class FeatureService
{
    /**
     * Verifica se una feature è abilitata per il tenant corrente.
     * Usa cache per evitare query ripetute.
     */
    public function enabled(string $featureKey): bool
    {
        if (! tenancy()->initialized) {
            return true; // fuori dal contesto tenant, non limitare
        }

        $tenantId = tenancy()->tenant->id;
        $features = $this->getTenantFeatures($tenantId);

        return in_array($featureKey, $features);
    }

    /**
     * Lancia 403 se la feature non è abilitata.
     */
    public function check(string $featureKey): void
    {
        if (! $this->enabled($featureKey)) {
            abort(403, "La funzionalità '{$featureKey}' non è inclusa nel tuo piano.");
        }
    }

    /**
     * Restituisce l'array di feature keys attive per il tenant.
     */
    public function getTenantFeatures(string $tenantId): array
    {
        return Cache::remember(
            "tenant_features_{$tenantId}",
            now()->addMinutes(5),
            function () use ($tenantId) {
                $subscription = TenantSubscription::where('tenant_id', $tenantId)
                    ->whereIn('status', ['active', 'trial'])
                    ->with(['plan.features', 'subscriptionFeatures'])
                    ->orderBy('created_at', 'desc')
                    ->first();

                if (! $subscription) {
                    return [];
                }

                // Subscription with a hard end date that has already passed
                if ($subscription->isExpired()) {
                    return [];
                }

                // Trial period has elapsed
                if ($subscription->isTrialExpired()) {
                    return [];
                }

                // Base included features (price null or 0)
                $included = $subscription->plan->features
                    ->filter(fn ($f) => is_null($f->price) || $f->price == 0)
                    ->pluck('feature_key')
                    ->toArray();

                // Purchased add-ons
                $addons = $subscription->subscriptionFeatures
                    ->pluck('feature_key')
                    ->toArray();

                return array_values(array_unique(array_merge($included, $addons)));
            }
        );
    }

    /**
     * Invalida la cache delle feature per un tenant.
     * Da chiamare quando la subscription viene aggiornata.
     */
    public function clearCache(string $tenantId): void
    {
        Cache::forget("tenant_features_{$tenantId}");
    }
}

<?php

declare(strict_types=1);

namespace App\Actions\Subscription;

use App\Models\Landlord\GlobalUser;
use App\Models\Landlord\PlanFeature;
use App\Models\Landlord\RenewalRequest;
use App\Models\Landlord\TenantSubscription;
use App\Models\Landlord\TenantSubscriptionFeature;
use App\Notifications\RenewalRequestedAdminNotification;
use App\Services\ProrationCalculatorService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;

class RequestAddonAction
{
    public function __construct(
        private readonly ProrationCalculatorService $prorationCalculator
    ) {}

    public function execute(
        TenantSubscription $subscription,
        GlobalUser $requestedBy,
        array $addonFeatureKeys,
        ?string $notes = null
    ): RenewalRequest {
        // Verify addon feature keys are not already active
        $activeFeatureKeys = TenantSubscriptionFeature::where('tenant_subscription_id', $subscription->id)
            ->pluck('feature_key')
            ->toArray();

        $alreadyActive = array_intersect($addonFeatureKeys, $activeFeatureKeys);
        if (! empty($alreadyActive)) {
            throw ValidationException::withMessages([
                'addons' => ['I seguenti addon sono già attivi: '.implode(', ', $alreadyActive)],
            ]);
        }

        // Verify addon features exist in the plan and have a price > 0
        $billingCycle = $subscription->billing_cycle;

        $planFeatures = PlanFeature::where('plan_id', $subscription->plan_id)
            ->whereIn('feature_key', $addonFeatureKeys)
            ->get()
            ->keyBy('feature_key');

        $missingFeatures = array_diff($addonFeatureKeys, $planFeatures->keys()->toArray());
        if (! empty($missingFeatures)) {
            throw ValidationException::withMessages([
                'addons' => ['I seguenti addon non esistono nel piano corrente: '.implode(', ', $missingFeatures)],
            ]);
        }

        // Build addon list with prices
        $addonsWithPrices = [];
        foreach ($addonFeatureKeys as $featureKey) {
            /** @var PlanFeature $feature */
            $feature = $planFeatures->get($featureKey);
            $price = $billingCycle === 'yearly'
                ? (float) $feature->price_yearly
                : (float) $feature->price;

            if ($price <= 0) {
                throw ValidationException::withMessages([
                    'addons' => ["L'addon '{$featureKey}' non ha un prezzo configurato."],
                ]);
            }

            $addonsWithPrices[] = [
                'feature_key' => $featureKey,
                'price' => $price,
            ];
        }

        // Calculate prorated amount
        $prorationResult = $this->prorationCalculator->calculateMultipleAddonsProration(
            $addonsWithPrices,
            $billingCycle,
            $subscription->renews_at
        );

        return DB::connection('landlord')->transaction(function () use (
            $subscription, $requestedBy, $addonFeatureKeys, $notes, $billingCycle, $prorationResult
        ): RenewalRequest {
            $renewalRequest = RenewalRequest::create([
                'tenant_id' => $subscription->tenant_id,
                'tenant_subscription_id' => $subscription->id,
                'type' => 'addon_add',
                'status' => 'pending',
                'requested_by_global_user_id' => $requestedBy->id,
                'addons' => $addonFeatureKeys,
                'prorated_amount' => $prorationResult['total_prorated'],
                'cycle_days_total' => $prorationResult['cycle_days_total'],
                'cycle_days_remaining' => $prorationResult['cycle_days_remaining'],
                'billing_cycle' => $billingCycle,
                'notes' => $notes,
            ]);

            // Notify all landlord admins via email
            $adminUsers = GlobalUser::where('is_landlord_admin', true)->get();

            Notification::send($adminUsers, new RenewalRequestedAdminNotification($renewalRequest, $subscription));

            return $renewalRequest;
        });
    }
}

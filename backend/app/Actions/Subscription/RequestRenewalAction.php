<?php

declare(strict_types=1);

namespace App\Actions\Subscription;

use App\Models\Landlord\GlobalUser;
use App\Models\Landlord\PlanFeature;
use App\Models\Landlord\RenewalRequest;
use App\Models\Landlord\TenantSubscription;
use App\Notifications\RenewalRequestedAdminNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

class RequestRenewalAction
{
    public function execute(
        TenantSubscription $subscription,
        GlobalUser $requestedBy,
        ?string $notes = null,
        ?array $addonFeatureKeys = null
    ): RenewalRequest {
        $hasAddons = ! empty($addonFeatureKeys);
        $type = $hasAddons ? 'renewal_with_addons' : 'renewal';

        // Idempotency: return existing pending renewal request if one exists
        $existing = RenewalRequest::where('tenant_subscription_id', $subscription->id)
            ->whereIn('type', ['renewal', 'renewal_with_addons'])
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            return $existing;
        }

        $addonPriceData = [];
        $proratedAmount = null;

        if ($hasAddons) {
            $subscription->loadMissing('plan');
            $billingCycle = $subscription->billing_cycle;

            $planFeatures = PlanFeature::where('plan_id', $subscription->plan_id)
                ->whereIn('feature_key', $addonFeatureKeys)
                ->get()
                ->keyBy('feature_key');

            foreach ($addonFeatureKeys as $featureKey) {
                /** @var PlanFeature|null $feature */
                $feature = $planFeatures->get($featureKey);

                if ($feature) {
                    $price = $billingCycle === 'yearly'
                        ? (float) $feature->price_yearly
                        : (float) $feature->price;

                    $addonPriceData[] = [
                        'feature_key' => $featureKey,
                        'price' => $price,
                    ];

                    $proratedAmount = ($proratedAmount ?? 0.0) + $price;
                }
            }
        }

        return DB::connection('landlord')->transaction(function () use (
            $subscription, $requestedBy, $notes, $addonFeatureKeys, $type, $proratedAmount, $hasAddons
        ): RenewalRequest {
            $renewalRequest = RenewalRequest::create([
                'tenant_id' => $subscription->tenant_id,
                'tenant_subscription_id' => $subscription->id,
                'type' => $type,
                'status' => 'pending',
                'requested_by_global_user_id' => $requestedBy->id,
                'addons' => $hasAddons ? $addonFeatureKeys : null,
                'prorated_amount' => $proratedAmount,
                'billing_cycle' => $subscription->billing_cycle,
                'notes' => $notes,
            ]);

            // Notify all landlord admins via email
            $adminUsers = GlobalUser::where('is_landlord_admin', true)->get();

            Notification::send($adminUsers, new RenewalRequestedAdminNotification($renewalRequest, $subscription));

            return $renewalRequest;
        });
    }
}

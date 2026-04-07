<?php

declare(strict_types=1);

namespace App\Actions\Subscription;

use App\Models\Landlord\GlobalUser;
use App\Models\Landlord\RenewalRequest;
use App\Models\Landlord\TenantMembership;
use App\Models\Landlord\TenantSubscription;
use App\Models\Landlord\TenantSubscriptionFeature;
use App\Notifications\SubscriptionActivatedNotification;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;

class ApproveRenewalAction
{
    public function execute(
        RenewalRequest $renewalRequest,
        GlobalUser $approvedBy,
        ?string $adminNotes = null
    ): TenantSubscription {
        if (! $renewalRequest->isPending()) {
            throw ValidationException::withMessages([
                'status' => ['Questa richiesta non è in stato pending.'],
            ]);
        }

        return DB::connection('landlord')->transaction(function () use ($renewalRequest, $approvedBy, $adminNotes): TenantSubscription {
            // Mark the request as approved
            $renewalRequest->update([
                'status' => 'approved',
                'processed_at' => now(),
                'processed_by_global_user_id' => $approvedBy->id,
                'admin_notes' => $adminNotes,
            ]);

            $subscription = $renewalRequest->tenantSubscription;

            // Calculate new renews_at
            $currentRenewsAt = $subscription->renews_at;
            $baseDate = ($currentRenewsAt === null || $currentRenewsAt->isPast())
                ? Carbon::now()
                : $currentRenewsAt;

            $newRenewsAt = $subscription->billing_cycle === 'yearly'
                ? $baseDate->copy()->addYear()
                : $baseDate->copy()->addMonth();

            // Update subscription
            $updateData = [
                'status' => 'active',
                'renews_at' => $newRenewsAt,
            ];

            // If subscription was pending or trial, set starts_at to now
            if (in_array($subscription->status, ['pending', 'trial'], true)) {
                $updateData['starts_at'] = now();
            }

            $subscription->update($updateData);

            // Handle addon features if present
            if (in_array($renewalRequest->type, ['renewal_with_addons', 'addon_add'], true) && ! empty($renewalRequest->addons)) {
                $addonKeys = $renewalRequest->addons;
                $addonCount = count($addonKeys);

                foreach ($addonKeys as $featureKey) {
                    $priceAtPurchase = $addonCount > 0
                        ? round((float) $renewalRequest->prorated_amount / $addonCount, 2)
                        : 0.0;

                    TenantSubscriptionFeature::updateOrCreate(
                        [
                            'tenant_subscription_id' => $subscription->id,
                            'feature_key' => $featureKey,
                        ],
                        [
                            'price_at_purchase' => $priceAtPurchase,
                        ]
                    );
                }
            }

            // Invalidate feature cache
            Cache::forget("tenant_features_{$subscription->tenant_id}");

            // Notify the tenant admin(s) in-app
            $tenantAdmins = TenantMembership::where('tenant_id', $subscription->tenant_id)
                ->where('role', 'admin')
                ->where('status', 'active')
                ->with('globalUser')
                ->get()
                ->pluck('globalUser')
                ->filter();

            Notification::send($tenantAdmins, new SubscriptionActivatedNotification($subscription));

            return $subscription->fresh();
        });
    }
}

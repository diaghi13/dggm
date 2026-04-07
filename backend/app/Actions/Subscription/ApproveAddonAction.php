<?php

declare(strict_types=1);

namespace App\Actions\Subscription;

use App\Models\Landlord\GlobalUser;
use App\Models\Landlord\RenewalRequest;
use App\Models\Landlord\TenantMembership;
use App\Models\Landlord\TenantSubscription;
use App\Models\Landlord\TenantSubscriptionFeature;
use App\Notifications\SubscriptionActivatedNotification;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;

class ApproveAddonAction
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

        if (! $renewalRequest->isAddonRequest()) {
            throw ValidationException::withMessages([
                'type' => ['Questa richiesta non è di tipo addon_add.'],
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
            $addonKeys = $renewalRequest->addons ?? [];
            $addonCount = count($addonKeys);

            // Create/update TenantSubscriptionFeature for each addon
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

            Notification::send($tenantAdmins, new SubscriptionActivatedNotification($subscription, addonKeys: $addonKeys));

            return $subscription->fresh();
        });
    }
}

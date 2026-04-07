<?php

declare(strict_types=1);

namespace App\Actions\Subscription;

use App\Models\Landlord\GlobalUser;
use App\Models\Landlord\Plan;
use App\Models\Landlord\RenewalRequest;
use App\Models\Landlord\TenantSubscription;
use App\Notifications\RenewalRequestedAdminNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

class RequestPlanChangeAction
{
    public function execute(
        TenantSubscription $subscription,
        GlobalUser $requestedBy,
        Plan $targetPlan,
        ?string $notes = null
    ): RenewalRequest {
        // Idempotency: return existing pending plan change request if one exists
        $existing = RenewalRequest::where('tenant_subscription_id', $subscription->id)
            ->whereIn('type', ['upgrade', 'downgrade'])
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            return $existing;
        }

        // Determine type: compare feature counts to decide upgrade vs downgrade
        $subscription->loadMissing('plan');

        $currentFeatureCount = $subscription->plan
            ? $subscription->plan->features()->count()
            : 0;

        $targetFeatureCount = $targetPlan->features()->count();

        // Fall back to sort_order if feature counts are equal
        if ($targetFeatureCount > $currentFeatureCount) {
            $type = 'upgrade';
        } elseif ($targetFeatureCount < $currentFeatureCount) {
            $type = 'downgrade';
        } else {
            // Same feature count — use sort_order as tiebreaker
            $currentSortOrder = $subscription->plan?->sort_order ?? 0;
            $type = ($targetPlan->sort_order ?? 0) >= $currentSortOrder ? 'upgrade' : 'downgrade';
        }

        return DB::connection('landlord')->transaction(function () use (
            $subscription, $requestedBy, $targetPlan, $notes, $type
        ): RenewalRequest {
            $renewalRequest = RenewalRequest::create([
                'tenant_id' => $subscription->tenant_id,
                'tenant_subscription_id' => $subscription->id,
                'type' => $type,
                'status' => 'pending',
                'requested_by_global_user_id' => $requestedBy->id,
                'target_plan_id' => $targetPlan->id,
                'billing_cycle' => $subscription->billing_cycle,
                'notes' => $notes,
            ]);

            // Notify all landlord admins
            $adminUsers = GlobalUser::where('is_landlord_admin', true)->get();

            Notification::send($adminUsers, new RenewalRequestedAdminNotification($renewalRequest, $subscription));

            return $renewalRequest;
        });
    }
}

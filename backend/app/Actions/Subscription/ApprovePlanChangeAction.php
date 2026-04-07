<?php

declare(strict_types=1);

namespace App\Actions\Subscription;

use App\Models\Landlord\GlobalUser;
use App\Models\Landlord\PlanFeature;
use App\Models\Landlord\RenewalRequest;
use App\Models\Landlord\TenantSubscriptionFeature;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ApprovePlanChangeAction
{
    public function execute(
        RenewalRequest $renewalRequest,
        GlobalUser $approvedBy,
        ?string $adminNotes = null
    ): void {
        if (! $renewalRequest->isPending()) {
            throw ValidationException::withMessages([
                'status' => ['Questa richiesta non è in stato pending.'],
            ]);
        }

        if (! $renewalRequest->isPlanChangeRequest()) {
            throw ValidationException::withMessages([
                'type' => ['Questa richiesta non è una richiesta di cambio piano.'],
            ]);
        }

        DB::connection('landlord')->transaction(function () use ($renewalRequest, $approvedBy, $adminNotes): void {
            $subscription = $renewalRequest->tenantSubscription;
            $targetPlanId = $renewalRequest->target_plan_id;

            // Get included feature keys for the new plan (price = null or 0)
            $newPlanFeatureKeys = PlanFeature::where('plan_id', $targetPlanId)
                ->get()
                ->filter(fn ($f) => is_null($f->price) || (float) $f->price == 0)
                ->pluck('feature_key')
                ->toArray();

            // Remove purchased addon features that are NOT in the new plan's included features
            // (addons that were separately purchased but now irrelevant or included)
            TenantSubscriptionFeature::where('tenant_subscription_id', $subscription->id)
                ->whereNotIn('feature_key', $newPlanFeatureKeys)
                ->delete();

            // Switch the subscription to the new plan
            $subscription->update(['plan_id' => $targetPlanId]);

            // Mark the request as approved
            $renewalRequest->update([
                'status' => 'approved',
                'processed_at' => now(),
                'processed_by_global_user_id' => $approvedBy->id,
                'admin_notes' => $adminNotes,
            ]);

            // Invalidate feature cache
            Cache::forget("tenant_features_{$subscription->tenant_id}");
        });
    }
}

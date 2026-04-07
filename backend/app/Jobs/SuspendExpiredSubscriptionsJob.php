<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Landlord\LandlordSetting;
use App\Models\Landlord\TenantSubscription;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * SuspendExpiredSubscriptionsJob
 *
 * Runs daily (00:00) and suspends any tenant whose subscription or trial
 * has expired and whose grace period has elapsed.
 *
 * Only the landlord DB is touched — no tenant context switch needed.
 * The tenant feature cache is invalidated so the next request picks up the
 * suspended status immediately.
 */
class SuspendExpiredSubscriptionsJob implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 60;

    public function handle(): void
    {
        $gracePeriodDays = (int) LandlordSetting::get('subscription.grace_period_days', 7);
        $cutoffDate = now()->subDays($gracePeriodDays);

        $suspendedCount = 0;

        // --- Expired active subscriptions (renews_at passed grace period) ---
        TenantSubscription::query()
            ->where('status', 'active')
            ->whereNotNull('renews_at')
            ->where('renews_at', '<=', $cutoffDate)
            ->each(function (TenantSubscription $subscription) use (&$suspendedCount): void {
                $subscription->update(['status' => 'suspended']);

                Cache::forget("tenant_features_{$subscription->tenant_id}");

                Log::warning('SuspendExpiredSubscriptionsJob: tenant sospeso per mancato rinnovo', [
                    'tenant_id' => $subscription->tenant_id,
                    'subscription_id' => $subscription->id,
                    'renews_at' => $subscription->renews_at?->toDateString(),
                ]);

                $suspendedCount++;
            });

        // --- Expired trials (trial_ends_at passed grace period) ---
        TenantSubscription::query()
            ->where('status', 'trial')
            ->whereNotNull('trial_ends_at')
            ->where('trial_ends_at', '<=', $cutoffDate)
            ->each(function (TenantSubscription $subscription) use (&$suspendedCount): void {
                $subscription->update(['status' => 'suspended']);

                Cache::forget("tenant_features_{$subscription->tenant_id}");

                Log::warning('SuspendExpiredSubscriptionsJob: tenant sospeso per trial scaduto', [
                    'tenant_id' => $subscription->tenant_id,
                    'subscription_id' => $subscription->id,
                    'trial_ends_at' => $subscription->trial_ends_at?->toDateString(),
                ]);

                $suspendedCount++;
            });

        Log::info("SuspendExpiredSubscriptionsJob: completed — suspended={$suspendedCount}, grace_period={$gracePeriodDays}d.");
    }
}

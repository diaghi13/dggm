<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Landlord\TenantMembership;
use App\Models\Landlord\TenantSubscription;
use App\Models\Tenant;
use App\Models\User as TenantUser;
use App\Notifications\SubscriptionReminderNotification;
use App\Notifications\TrialExpiringNotification;
use App\Services\SubscriptionReminderScheduleService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * ProcessSubscriptionRemindersJob
 *
 * Runs daily (08:00) and sends renewal/trial expiration reminders to the
 * admin user of each tenant whose subscription matches a configured reminder day.
 *
 * De-duplication: a Cache key with 23-hour TTL prevents re-sending the same
 * reminder type on the same day, even if the job is re-dispatched accidentally.
 *
 * Notification channel: `database` (stored in the tenant DB via tenancy context).
 */
class ProcessSubscriptionRemindersJob implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 120;

    public function handle(SubscriptionReminderScheduleService $scheduleService): void
    {
        $subscriptions = TenantSubscription::query()
            ->whereIn('status', ['active', 'trial'])
            ->with('plan')
            ->get();

        $sent = 0;
        $skipped = 0;

        foreach ($subscriptions as $subscription) {
            try {
                $daysRemaining = $subscription->status === 'trial'
                    ? $scheduleService->shouldSendTrialReminderToday($subscription)
                    : $scheduleService->shouldSendReminderToday($subscription);

                if ($daysRemaining === null) {
                    $skipped++;

                    continue;
                }

                // De-duplication: skip if we already sent this exact reminder in the last 23h.
                $type = $subscription->status === 'trial' ? 'trial' : 'renewal';
                $cacheKey = "subscription_reminder_{$subscription->tenant_id}_{$type}_{$daysRemaining}";

                if (Cache::has($cacheKey)) {
                    $skipped++;

                    continue;
                }

                // Find the active admin membership for this tenant.
                $adminMembership = TenantMembership::where('tenant_id', $subscription->tenant_id)
                    ->where('role', 'admin')
                    ->where('status', 'active')
                    ->with('globalUser')
                    ->first();

                if ($adminMembership === null || $adminMembership->globalUser === null) {
                    Log::warning('ProcessSubscriptionRemindersJob: no active admin found for tenant', [
                        'tenant_id' => $subscription->tenant_id,
                        'subscription_id' => $subscription->id,
                    ]);
                    $skipped++;

                    continue;
                }

                // Send the notification inside the tenant context so it is
                // stored in the correct tenant database.
                $tenant = Tenant::find($subscription->tenant_id);

                if ($tenant === null) {
                    $skipped++;

                    continue;
                }

                tenancy()->initialize($tenant);

                try {
                    // The tenant DB's users table maps to global_user_id via the `email` column.
                    // Look up the tenant-side user by email from GlobalUser.
                    $globalEmail = $adminMembership->globalUser->email;
                    $tenantUser = TenantUser::where('email', $globalEmail)->first();

                    if ($tenantUser === null) {
                        Log::warning('ProcessSubscriptionRemindersJob: admin not found in tenant DB', [
                            'tenant_id' => $subscription->tenant_id,
                            'global_user_id' => $adminMembership->global_user_id,
                            'email' => $globalEmail,
                        ]);
                        $skipped++;

                        continue;
                    }

                    $notification = $subscription->status === 'trial'
                        ? new TrialExpiringNotification($subscription, $daysRemaining)
                        : new SubscriptionReminderNotification($subscription, $daysRemaining);

                    $tenantUser->notify($notification);

                    // Mark as sent for 23 hours to prevent re-delivery.
                    Cache::put($cacheKey, true, now()->addHours(23));

                    $sent++;

                    Log::info('ProcessSubscriptionRemindersJob: reminder sent', [
                        'tenant_id' => $subscription->tenant_id,
                        'type' => $type,
                        'days_remaining' => $daysRemaining,
                    ]);
                } finally {
                    tenancy()->end();
                }
            } catch (Throwable $e) {
                Log::error('ProcessSubscriptionRemindersJob: error processing subscription', [
                    'subscription_id' => $subscription->id,
                    'tenant_id' => $subscription->tenant_id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        Log::info("ProcessSubscriptionRemindersJob: completed — sent={$sent}, skipped={$skipped}.");
    }
}

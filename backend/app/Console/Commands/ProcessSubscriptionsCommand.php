<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Jobs\ProcessSubscriptionRemindersJob;
use App\Jobs\SuspendExpiredSubscriptionsJob;
use App\Models\Landlord\LandlordSetting;
use App\Models\Landlord\TenantSubscription;
use App\Services\SubscriptionReminderScheduleService;
use Illuminate\Console\Command;

class ProcessSubscriptionsCommand extends Command
{
    protected $signature = 'subscription:process
                            {--reminders : Invia solo i reminder di rinnovo/trial}
                            {--suspend   : Sospende solo le subscription scadute}
                            {--dry-run   : Mostra cosa verrebbe fatto senza modificare nulla}';

    protected $description = 'Processa reminder e/o sospensioni degli abbonamenti tenant';

    public function handle(SubscriptionReminderScheduleService $scheduleService): int
    {
        $onlyReminders = $this->option('reminders');
        $onlySuspend = $this->option('suspend');
        $dryRun = $this->option('dry-run');
        $runBoth = ! $onlyReminders && ! $onlySuspend;

        if ($dryRun) {
            $this->info('[DRY RUN] Nessuna modifica verrà eseguita.');
            $this->newLine();
        }

        if ($onlyReminders || $runBoth) {
            $this->processReminders($scheduleService, $dryRun);
        }

        if ($onlySuspend || $runBoth) {
            $this->processSuspensions($dryRun);
        }

        return self::SUCCESS;
    }

    private function processReminders(SubscriptionReminderScheduleService $scheduleService, bool $dryRun): void
    {
        $this->info('--- Reminder abbonamenti ---');

        $subscriptions = TenantSubscription::query()
            ->whereIn('status', ['active', 'trial'])
            ->with('plan')
            ->get();

        $remindersToSend = [];

        foreach ($subscriptions as $subscription) {
            $daysRemaining = $subscription->status === 'trial'
                ? $scheduleService->shouldSendTrialReminderToday($subscription)
                : $scheduleService->shouldSendReminderToday($subscription);

            if ($daysRemaining !== null) {
                $type = $subscription->status === 'trial' ? 'trial' : 'renewal';
                $remindersToSend[] = [
                    'tenant_id' => $subscription->tenant_id,
                    'type' => $type,
                    'days_remaining' => $daysRemaining,
                    'status' => $subscription->status,
                ];
            }
        }

        if (empty($remindersToSend)) {
            $this->line('  Nessun reminder da inviare oggi.');
        } else {
            $this->table(
                ['Tenant ID', 'Tipo', 'Giorni rimanenti', 'Status'],
                $remindersToSend
            );
        }

        if (! $dryRun) {
            ProcessSubscriptionRemindersJob::dispatch();
            $this->info('  Job ProcessSubscriptionRemindersJob accodato.');
        } else {
            $this->comment('  [DRY RUN] ProcessSubscriptionRemindersJob NON accodato.');
        }

        $this->newLine();
    }

    private function processSuspensions(bool $dryRun): void
    {
        $this->info('--- Sospensioni abbonamenti ---');

        $gracePeriodDays = (int) LandlordSetting::get('subscription.grace_period_days', 7);
        $cutoffDate = now()->subDays($gracePeriodDays);

        $this->line("  Grace period: {$gracePeriodDays} giorni (cutoff: {$cutoffDate->toDateString()})");

        // Active subscriptions to suspend.
        $expiredActive = TenantSubscription::query()
            ->where('status', 'active')
            ->whereNotNull('renews_at')
            ->where('renews_at', '<=', $cutoffDate)
            ->get(['tenant_id', 'renews_at']);

        // Expired trials to suspend.
        $expiredTrials = TenantSubscription::query()
            ->where('status', 'trial')
            ->whereNotNull('trial_ends_at')
            ->where('trial_ends_at', '<=', $cutoffDate)
            ->get(['tenant_id', 'trial_ends_at']);

        $rows = [];

        foreach ($expiredActive as $sub) {
            $rows[] = [$sub->tenant_id, 'active → suspended', $sub->renews_at?->toDateString()];
        }

        foreach ($expiredTrials as $sub) {
            $rows[] = [$sub->tenant_id, 'trial → suspended', $sub->trial_ends_at?->toDateString()];
        }

        if (empty($rows)) {
            $this->line('  Nessun tenant da sospendere.');
        } else {
            $this->table(['Tenant ID', 'Azione', 'Scadenza'], $rows);
        }

        if (! $dryRun) {
            SuspendExpiredSubscriptionsJob::dispatch();
            $this->info('  Job SuspendExpiredSubscriptionsJob accodato.');
        } else {
            $this->comment('  [DRY RUN] SuspendExpiredSubscriptionsJob NON accodato.');
        }

        $this->newLine();
    }
}

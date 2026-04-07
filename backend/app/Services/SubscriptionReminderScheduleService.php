<?php

namespace App\Services;

use App\Models\Landlord\LandlordSetting;
use App\Models\Landlord\TenantSubscription;
use Illuminate\Support\Carbon;

/**
 * SubscriptionReminderScheduleService
 *
 * Determina se oggi deve essere inviato un reminder per una subscription,
 * basandosi sui giorni configurati nelle impostazioni.
 *
 * Setting keys (CSV di interi):
 *   - subscription.reminder_days_monthly → es. "7,3,2,1"
 *   - subscription.reminder_days_yearly  → es. "30,14,7,3,1"
 *   - subscription.reminder_days_trial   → es. "3,2,1"
 */
class SubscriptionReminderScheduleService
{
    /**
     * Legge da settings i giorni configurati per un determinato tipo di ciclo.
     * Parsa la stringa CSV in array di interi.
     *
     * @return array<int>
     */
    public function getReminderDaysForCycle(string $billingCycle): array
    {
        $key = match ($billingCycle) {
            'yearly' => 'subscription.reminder_days_yearly',
            'trial' => 'subscription.reminder_days_trial',
            default => 'subscription.reminder_days_monthly',
        };

        $raw = LandlordSetting::get($key, '');

        if (empty($raw)) {
            return [];
        }

        return array_values(
            array_filter(
                array_map(
                    fn (string $v) => (int) trim($v),
                    explode(',', (string) $raw)
                ),
                fn (int $v) => $v > 0
            )
        );
    }

    /**
     * Determina quanti giorni mancano a una data.
     * Positivo = futuro, negativo = passato.
     */
    public function daysUntil(Carbon $date): int
    {
        $today = Carbon::today();

        if ($date->isSameDay($today)) {
            return 0;
        }

        $diff = (int) $today->diffInDays($date, false);

        return $diff;
    }

    /**
     * Controlla se oggi è un giorno in cui inviare un reminder per questa subscription.
     * Ritorna il numero di giorni mancanti se deve inviare, null se non deve.
     */
    public function shouldSendReminderToday(TenantSubscription $subscription): ?int
    {
        if ($subscription->status !== 'active') {
            return null;
        }

        if ($subscription->renews_at === null) {
            return null;
        }

        $daysUntil = $this->daysUntil($subscription->renews_at);
        $reminderDays = $this->getReminderDaysForCycle($subscription->billing_cycle);

        if (in_array($daysUntil, $reminderDays, true)) {
            return $daysUntil;
        }

        return null;
    }

    /**
     * Controlla se oggi è un giorno in cui inviare un reminder per il trial.
     * Ritorna il numero di giorni mancanti se deve inviare, null se non deve.
     */
    public function shouldSendTrialReminderToday(TenantSubscription $subscription): ?int
    {
        if ($subscription->status !== 'trial') {
            return null;
        }

        if ($subscription->trial_ends_at === null) {
            return null;
        }

        $daysUntil = $this->daysUntil($subscription->trial_ends_at);
        $reminderDays = $this->getReminderDaysForCycle('trial');

        if (in_array($daysUntil, $reminderDays, true)) {
            return $daysUntil;
        }

        return null;
    }
}

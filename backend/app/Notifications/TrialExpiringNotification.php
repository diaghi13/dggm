<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Landlord\TenantSubscription;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class TrialExpiringNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly TenantSubscription $subscription,
        public readonly int $daysRemaining,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $trialEndsAt = $this->subscription->trial_ends_at?->format('d/m/Y') ?? 'N/D';

        [$type, $title, $message] = $this->resolveAlertContent($this->daysRemaining, $trialEndsAt);

        return [
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'icon' => 'clock',
            'data' => [
                'subscription_id' => $this->subscription->id,
                'tenant_id' => $this->subscription->tenant_id,
                'days_remaining' => $this->daysRemaining,
                'trial_ends_at' => $this->subscription->trial_ends_at?->toDateString(),
            ],
            'action' => [
                'label' => 'Gestisci Abbonamento',
                'url' => '/dashboard/subscription',
            ],
        ];
    }

    public function databaseType(object $notifiable): string
    {
        return 'trial-expiring';
    }

    /**
     * @return array{0: string, 1: string, 2: string}
     */
    private function resolveAlertContent(int $daysRemaining, string $trialEndsAt): array
    {
        if ($daysRemaining <= 1) {
            return [
                'error',
                'Il periodo di prova scade domani!',
                "Il tuo periodo di prova scade domani ({$trialEndsAt}). Contattaci subito per non perdere l'accesso.",
            ];
        }

        return [
            'warning',
            'Il tuo periodo di prova sta per scadere',
            "Il tuo periodo di prova scade tra {$daysRemaining} giorni ({$trialEndsAt}). Contattaci per attivare l'abbonamento.",
        ];
    }
}

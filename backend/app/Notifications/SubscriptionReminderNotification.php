<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Landlord\TenantSubscription;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class SubscriptionReminderNotification extends Notification implements ShouldQueue
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
        $renewsAt = $this->subscription->renews_at?->format('d/m/Y') ?? 'N/D';

        [$type, $title, $message] = $this->resolveAlertContent($this->daysRemaining, $renewsAt);

        return [
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'icon' => 'clock',
            'data' => [
                'subscription_id' => $this->subscription->id,
                'tenant_id' => $this->subscription->tenant_id,
                'days_remaining' => $this->daysRemaining,
                'renews_at' => $this->subscription->renews_at?->toDateString(),
                'billing_cycle' => $this->subscription->billing_cycle,
            ],
            'action' => [
                'label' => 'Gestisci Abbonamento',
                'url' => '/dashboard/subscription',
            ],
        ];
    }

    public function databaseType(object $notifiable): string
    {
        return 'subscription-reminder';
    }

    /**
     * @return array{0: string, 1: string, 2: string}
     */
    private function resolveAlertContent(int $daysRemaining, string $renewsAt): array
    {
        if ($daysRemaining <= 2) {
            $dayLabel = $daysRemaining === 1 ? 'domani' : 'oggi';

            return [
                'error',
                'Abbonamento in scadenza!',
                "Attenzione: il tuo abbonamento scade {$dayLabel} ({$renewsAt}). Rinnova subito per non perdere l'accesso.",
            ];
        }

        if ($daysRemaining <= 7) {
            return [
                'warning',
                'Il tuo abbonamento sta per scadere',
                "Il tuo abbonamento scade tra {$daysRemaining} giorni ({$renewsAt}). Contattaci per rinnovarlo.",
            ];
        }

        return [
            'info',
            'Promemoria abbonamento',
            "Il tuo abbonamento scade tra {$daysRemaining} giorni ({$renewsAt}).",
        ];
    }
}

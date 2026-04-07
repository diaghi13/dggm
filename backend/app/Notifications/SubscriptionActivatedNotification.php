<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Landlord\TenantSubscription;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class SubscriptionActivatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @param  array<int, string>  $addonKeys  When set, indicates this is an addon activation rather than a full renewal.
     */
    public function __construct(
        public readonly TenantSubscription $subscription,
        public readonly array $addonKeys = [],
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
        $isAddonOnly = ! empty($this->addonKeys);

        if ($isAddonOnly) {
            $addonList = implode(', ', $this->addonKeys);
            $title = 'Addon attivati con successo';
            $message = "I seguenti addon sono stati attivati sul tuo abbonamento: {$addonList}. Prossimo rinnovo: {$renewsAt}.";
        } else {
            $title = 'Abbonamento attivato';
            $message = "Il tuo abbonamento è stato attivato/rinnovato con successo. Prossimo rinnovo: {$renewsAt}.";
        }

        return [
            'title' => $title,
            'message' => $message,
            'type' => 'success',
            'icon' => 'check-circle',
            'data' => [
                'subscription_id' => $this->subscription->id,
                'tenant_id' => $this->subscription->tenant_id,
                'status' => $this->subscription->status,
                'renews_at' => $this->subscription->renews_at?->toDateString(),
                'addon_keys' => $this->addonKeys,
            ],
            'action' => [
                'label' => 'Gestisci Abbonamento',
                'url' => '/dashboard/subscription',
            ],
        ];
    }

    public function databaseType(object $notifiable): string
    {
        return 'subscription-activated';
    }
}

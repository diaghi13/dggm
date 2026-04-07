<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Landlord\RenewalRequest;
use App\Models\Landlord\TenantSubscription;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RenewalRequestedAdminNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly RenewalRequest $renewalRequest,
        public readonly TenantSubscription $subscription,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $tenantId = $this->renewalRequest->tenant_id;
        $type = $this->renewalRequest->type;
        $requestedAt = $this->renewalRequest->created_at?->format('d/m/Y H:i') ?? now()->format('d/m/Y H:i');
        $billingCycle = $this->renewalRequest->billing_cycle === 'yearly' ? 'Annuale' : 'Mensile';

        $typeLabel = match ($type) {
            'renewal' => 'Rinnovo abbonamento',
            'renewal_with_addons' => 'Rinnovo abbonamento con addon',
            'addon_add' => 'Aggiunta addon mid-cycle',
            default => ucfirst($type),
        };

        $this->subscription->loadMissing('plan');
        $planName = $this->subscription->plan?->name ?? 'N/D';

        $message = (new MailMessage)
            ->subject("Nuova richiesta di rinnovo — {$tenantId}")
            ->greeting('Ciao,')
            ->line("È arrivata una nuova richiesta da parte del tenant **{$tenantId}**.")
            ->line('')
            ->line("**Tipo richiesta:** {$typeLabel}")
            ->line("**Tenant ID:** {$tenantId}")
            ->line("**Piano corrente:** {$planName}")
            ->line("**Ciclo di fatturazione:** {$billingCycle}")
            ->line("**Data richiesta:** {$requestedAt}");

        // Show addons if present
        if (! empty($this->renewalRequest->addons)) {
            $addonList = implode(', ', $this->renewalRequest->addons);
            $message->line('')->line("**Addon richiesti:** {$addonList}");
        }

        // Show prorated amount if applicable
        if ($this->renewalRequest->prorated_amount !== null && (float) $this->renewalRequest->prorated_amount > 0) {
            $formatted = number_format((float) $this->renewalRequest->prorated_amount, 2, ',', '.');
            $message->line("**Importo prorato:** €{$formatted}");
        }

        if ($this->renewalRequest->notes) {
            $message->line('')->line('**Note del tenant:**')->line($this->renewalRequest->notes);
        }

        $dashboardUrl = rtrim(config('app.url'), '/').'/landlord/renewal-requests/'.$this->renewalRequest->id;

        $message->action('Approva o gestisci la richiesta', $dashboardUrl)
            ->line('Accedi al pannello landlord per approvare o rifiutare la richiesta.');

        return $message;
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'renewal_request_id' => $this->renewalRequest->id,
            'tenant_id' => $this->renewalRequest->tenant_id,
            'type' => $this->renewalRequest->type,
        ];
    }
}

<?php

namespace App\Notifications;

use App\Models\Landlord\GlobalUser;
use App\Models\Landlord\TenantMembership;
use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TenantInvitationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly TenantMembership $membership,
        public readonly GlobalUser $globalUser,
        public readonly Tenant $tenant
    ) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $frontendUrl = config('app.frontend_url', config('app.url'));
        $acceptUrl = "{$frontendUrl}/invitations/tenant/{$this->membership->invitation_token}/accept";
        $tenantName = $this->tenant->name ?? $this->tenant->id;
        $expiresFormatted = $this->membership->expires_at?->format('d/m/Y H:i') ?? '';

        return (new MailMessage)
            ->subject("Sei stato invitato ad accedere a {$tenantName}")
            ->greeting("Ciao {$this->globalUser->name},")
            ->line("Sei stato invitato ad accedere all'azienda **{$tenantName}** come **{$this->membership->role}**.")
            ->line('Clicca sul pulsante qui sotto per accettare l\'invito e accedere alla piattaforma:')
            ->action('Accetta Invito', $acceptUrl)
            ->line("**Importante:** L'invito scade il {$expiresFormatted}.")
            ->line('Se non ti aspettavi questo invito o non sei interessato, puoi ignorare questa email.');
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'tenant_invitation',
            'membership_id' => $this->membership->id,
            'tenant_id' => $this->tenant->id,
            'role' => $this->membership->role,
            'expires_at' => $this->membership->expires_at?->toIso8601String(),
        ];
    }
}

<?php

namespace App\Notifications;

use App\Models\WorkerInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WorkerInvited extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public WorkerInvitation $invitation
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $invitedBy = $this->invitation->invitedBy;
        $companyName = config('app.name');
        $expiresInDays = now()->diffInDays($this->invitation->expires_at);

        $message = (new MailMessage)
            ->subject("Invito a collaborare con {$companyName}")
            ->greeting("Ciao {$this->invitation->first_name},")
            ->line("**{$invitedBy->name}** ti ha invitato a collaborare con **{$companyName}** come collaboratore esterno.");

        if ($this->invitation->job_title) {
            $message->line("**Ruolo:** {$this->invitation->job_title}");
        }

        if ($this->invitation->supplier) {
            $message->line("**Cooperativa/Fornitore:** {$this->invitation->supplier->name}");
        }

        $message->line('Per accettare l\'invito e creare il tuo account, clicca sul pulsante qui sotto:')
            ->action('Accetta Invito e Registrati', $this->invitation->getAcceptUrl())
            ->line("**Importante:** Questo invito scadrà tra {$expiresInDays} giorni ({$this->invitation->expires_at->format('d/m/Y')}).")
            ->line('Una volta registrato, potrai:')
            ->line('• Visualizzare i cantieri a cui sei assegnato')
            ->line('• Timbrare entrate e uscite con il GPS')
            ->line('• Accettare o rifiutare le assegnazioni ai cantieri')
            ->line('• Richiedere materiali aggiuntivi')
            ->line('• Consultare documenti e planimetrie')
            ->line('')
            ->line('Se non hai richiesto questo invito o non sei interessato, puoi ignorare questa email.');

        return $message;
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'worker_invited',
            'invitation_id' => $this->invitation->id,
            'invited_by' => $this->invitation->invitedBy->name,
            'expires_at' => $this->invitation->expires_at->toIso8601String(),
        ];
    }
}

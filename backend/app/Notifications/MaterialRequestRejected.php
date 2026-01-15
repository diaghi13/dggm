<?php

namespace App\Notifications;

use App\Models\MaterialRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MaterialRequestRejected extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public MaterialRequest $materialRequest
    ) {
        //
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $material = $this->materialRequest->material;
        $site = $this->materialRequest->site;
        $rejectedBy = $this->materialRequest->respondedByUser;

        $message = (new MailMessage)
            ->error()
            ->subject("Richiesta Materiale Rifiutata - {$site->name}")
            ->greeting("Ciao {$notifiable->name},")
            ->line('La tua richiesta di materiale è stata **rifiutata**.')
            ->line('')
            ->line("**Cantiere:** {$site->name}")
            ->line("**Materiale:** {$material->name}")
            ->line("**Quantità richiesta:** {$this->materialRequest->quantity_requested} {$this->materialRequest->unit_of_measure}")
            ->line("**Rifiutata da:** {$rejectedBy->name}");

        if ($this->materialRequest->rejection_reason) {
            $message->line('')
                ->line('**Motivazione del rifiuto:**')
                ->line($this->materialRequest->rejection_reason);
        }

        $message->action('Visualizza Dettagli', url("/dashboard/sites/{$site->id}"))
            ->line('Contatta il tuo responsabile per ulteriori informazioni.');

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
            'type' => 'material_request_rejected',
            'material_request_id' => $this->materialRequest->id,
            'site_id' => $this->materialRequest->site_id,
            'site_name' => $this->materialRequest->site->name,
            'material_name' => $this->materialRequest->material->name,
            'rejection_reason' => $this->materialRequest->rejection_reason,
            'rejected_by' => $this->materialRequest->respondedByUser->name,
        ];
    }
}

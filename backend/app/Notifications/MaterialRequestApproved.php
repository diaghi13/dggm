<?php

namespace App\Notifications;

use App\Models\MaterialRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MaterialRequestApproved extends Notification implements ShouldQueue
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
        $approvedBy = $this->materialRequest->approvedByUser;

        $message = (new MailMessage)
            ->subject("Richiesta Materiale Approvata - {$site->name}")
            ->greeting("Ciao {$notifiable->name},")
            ->line('La tua richiesta di materiale è stata **approvata**!')
            ->line('')
            ->line("**Cantiere:** {$site->name}")
            ->line("**Materiale:** {$material->name}")
            ->line("**Quantità richiesta:** {$this->materialRequest->quantity_requested} {$this->materialRequest->unit_of_measure}")
            ->line("**Quantità approvata:** {$this->materialRequest->quantity_approved} {$this->materialRequest->unit_of_measure}")
            ->line("**Approvata da:** {$approvedBy->name}");

        if ($this->materialRequest->response_notes) {
            $message->line('')
                ->line('**Note:**')
                ->line($this->materialRequest->response_notes);
        }

        $message->action('Visualizza Dettagli', url("/dashboard/sites/{$site->id}"))
            ->line('Il materiale sarà presto disponibile in cantiere.');

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
            'type' => 'material_request_approved',
            'material_request_id' => $this->materialRequest->id,
            'site_id' => $this->materialRequest->site_id,
            'site_name' => $this->materialRequest->site->name,
            'material_name' => $this->materialRequest->material->name,
            'quantity_approved' => $this->materialRequest->quantity_approved,
            'approved_by' => $this->materialRequest->approvedByUser->name,
        ];
    }
}

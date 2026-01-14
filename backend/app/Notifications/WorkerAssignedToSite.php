<?php

namespace App\Notifications;

use App\Models\SiteWorker;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WorkerAssignedToSite extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public SiteWorker $siteWorker
    ) {}

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
        $site = $this->siteWorker->site;
        $isPending = $this->siteWorker->status->value === 'pending';
        $rolesText = $this->siteWorker->roles->pluck('name')->join(', ');

        $message = (new MailMessage)
            ->subject('Nuova Assegnazione Cantiere - '.$site->name)
            ->greeting('Ciao '.$notifiable->name.',')
            ->line("Sei stato assegnato al cantiere **{$site->name}**.");

        if ($rolesText) {
            $message->line("**Ruolo/i:** {$rolesText}");
        }

        $message->line("**Cliente:** {$site->customer->name}")
            ->line("**Indirizzo:** {$site->full_address}")
            ->line("**Periodo:** dal {$this->siteWorker->assigned_from->format('d/m/Y')} ".
                ($this->siteWorker->assigned_to ? "al {$this->siteWorker->assigned_to->format('d/m/Y')}" : '(data fine da definire)'));

        if ($this->siteWorker->notes) {
            $message->line("**Note:** {$this->siteWorker->notes}");
        }

        if ($isPending) {
            $acceptUrl = url("/dashboard/assignments/{$this->siteWorker->id}/accept");
            $rejectUrl = url("/dashboard/assignments/{$this->siteWorker->id}/reject");

            $message->line('**Devi confermare la tua disponibilità entro il '.
                $this->siteWorker->response_due_at->format('d/m/Y').'**')
                ->action('Accetta Assegnazione', $acceptUrl)
                ->line("Oppure [rifiuta l'assegnazione]({$rejectUrl}) se non sei disponibile.");
        } else {
            $message->action('Visualizza Dettagli Cantiere', url("/dashboard/sites/{$site->id}"));
        }

        $message->line('Grazie per la collaborazione!');

        return $message;
    }

    /**
     * Get the array representation of the notification (for database storage).
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'worker_assigned',
            'site_worker_id' => $this->siteWorker->id,
            'site_id' => $this->siteWorker->site_id,
            'site_name' => $this->siteWorker->site->name,
            'site_code' => $this->siteWorker->site->code,
            'status' => $this->siteWorker->status->value,
            'assigned_from' => $this->siteWorker->assigned_from->toDateString(),
            'assigned_to' => $this->siteWorker->assigned_to?->toDateString(),
            'roles' => $this->siteWorker->roles->pluck('name')->toArray(),
            'assigned_by' => $this->siteWorker->assignedBy?->name,
            'requires_response' => $this->siteWorker->status->value === 'pending',
            'response_due_at' => $this->siteWorker->response_due_at?->toIso8601String(),
        ];
    }
}

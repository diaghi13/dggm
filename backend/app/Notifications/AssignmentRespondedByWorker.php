<?php

namespace App\Notifications;

use App\Models\SiteWorker;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AssignmentRespondedByWorker extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public SiteWorker $siteWorker,
        public bool $wasAccepted,
        public ?string $reason = null
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
        $worker = $this->siteWorker->worker;
        $workerName = $worker->user?->name ?? $worker->full_name;

        if ($this->wasAccepted) {
            $message = (new MailMessage)
                ->subject('Assegnazione Accettata - '.$workerName)
                ->greeting('Ciao '.$notifiable->name.',')
                ->line("**{$workerName}** ha accettato l'assegnazione al cantiere **{$site->name}**.")
                ->line("**Cliente:** {$site->customer->name}")
                ->line("**Periodo:** dal {$this->siteWorker->assigned_from->format('d/m/Y')} ".
                    ($this->siteWorker->assigned_to ? "al {$this->siteWorker->assigned_to->format('d/m/Y')}" : '(data fine da definire)'));

            if ($this->reason) {
                $message->line("**Note del collaboratore:** {$this->reason}");
            }

            $message->action('Visualizza Cantiere', url("/dashboard/sites/{$site->id}"))
                ->line('Il collaboratore è ora confermato e pronto per iniziare.');
        } else {
            $message = (new MailMessage)
                ->subject('Assegnazione Rifiutata - '.$workerName)
                ->greeting('Ciao '.$notifiable->name.',')
                ->line("**{$workerName}** ha rifiutato l'assegnazione al cantiere **{$site->name}**.")
                ->line("**Cliente:** {$site->customer->name}")
                ->line("**Periodo richiesto:** dal {$this->siteWorker->assigned_from->format('d/m/Y')} ".
                    ($this->siteWorker->assigned_to ? "al {$this->siteWorker->assigned_to->format('d/m/Y')}" : '(data fine da definire)'));

            if ($this->reason) {
                $message->line("**Motivo del rifiuto:** {$this->reason}");
            }

            $message->action('Trova Altro Collaboratore', url("/dashboard/sites/{$site->id}"))
                ->line('Dovrai trovare un altro collaboratore per questo cantiere.');
        }

        return $message;
    }

    /**
     * Get the array representation of the notification (for database storage).
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $worker = $this->siteWorker->worker;

        return [
            'type' => 'assignment_responded',
            'site_worker_id' => $this->siteWorker->id,
            'site_id' => $this->siteWorker->site_id,
            'site_name' => $this->siteWorker->site->name,
            'site_code' => $this->siteWorker->site->code,
            'worker_id' => $worker->id,
            'worker_name' => $worker->user?->name ?? $worker->full_name,
            'was_accepted' => $this->wasAccepted,
            'status' => $this->siteWorker->status->value,
            'reason' => $this->reason,
            'responded_at' => $this->siteWorker->responded_at?->toIso8601String(),
        ];
    }
}

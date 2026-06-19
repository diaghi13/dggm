<?php

namespace App\Notifications;

use App\Domains\Project\Models\ProjectWorker;
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
        public ProjectWorker $projectWorker,
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
        $project = $this->projectWorker->project;
        $worker = $this->projectWorker->worker;
        $workerName = $worker->user?->name ?? $worker->full_name;

        if ($this->wasAccepted) {
            $message = (new MailMessage)
                ->subject('Assegnazione Accettata - '.$workerName)
                ->greeting('Ciao '.$notifiable->name.',')
                ->line("**{$workerName}** ha accettato l'assegnazione al progetto **{$project->name}**.")
                ->line("**Cliente:** {$project->customer->name}")
                ->line("**Periodo:** dal {$this->projectWorker->assigned_from->format('d/m/Y')} ".
                    ($this->projectWorker->assigned_to ? "al {$this->projectWorker->assigned_to->format('d/m/Y')}" : '(data fine da definire)'));

            if ($this->reason) {
                $message->line("**Note del collaboratore:** {$this->reason}");
            }

            $message->action('Visualizza Progetto', url("/dashboard/projects/{$project->id}"))
                ->line('Il collaboratore è ora confermato e pronto per iniziare.');
        } else {
            $message = (new MailMessage)
                ->subject('Assegnazione Rifiutata - '.$workerName)
                ->greeting('Ciao '.$notifiable->name.',')
                ->line("**{$workerName}** ha rifiutato l'assegnazione al progetto **{$project->name}**.")
                ->line("**Cliente:** {$project->customer->name}")
                ->line("**Periodo richiesto:** dal {$this->projectWorker->assigned_from->format('d/m/Y')} ".
                    ($this->projectWorker->assigned_to ? "al {$this->projectWorker->assigned_to->format('d/m/Y')}" : '(data fine da definire)'));

            if ($this->reason) {
                $message->line("**Motivo del rifiuto:** {$this->reason}");
            }

            $message->action('Trova Altro Collaboratore', url("/dashboard/projects/{$project->id}"))
                ->line('Dovrai trovare un altro collaboratore per questo progetto.');
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
        $worker = $this->projectWorker->worker;

        return [
            'type' => 'assignment_responded',
            'project_worker_id' => $this->projectWorker->id,
            'project_id' => $this->projectWorker->project_id,
            'project_name' => $this->projectWorker->project->name,
            'project_code' => $this->projectWorker->project->code,
            'worker_id' => $worker->id,
            'worker_name' => $worker->user?->name ?? $worker->full_name,
            'was_accepted' => $this->wasAccepted,
            'status' => $this->projectWorker->status->value,
            'reason' => $this->reason,
            'responded_at' => $this->projectWorker->responded_at?->toIso8601String(),
        ];
    }
}

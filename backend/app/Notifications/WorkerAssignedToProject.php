<?php

namespace App\Notifications;

use App\Models\ProjectWorker;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WorkerAssignedToProject extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public ProjectWorker $projectWorker
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $project = $this->projectWorker->project;
        $isPending = $this->projectWorker->status->value === 'pending';
        $rolesText = $this->projectWorker->roles->pluck('name')->join(', ');

        $message = (new MailMessage)
            ->subject('Nuova Assegnazione Progetto - '.$project->name)
            ->greeting('Ciao '.$notifiable->name.',')
            ->line("Sei stato assegnato al progetto **{$project->name}**.");

        if ($rolesText) {
            $message->line("**Ruolo/i:** {$rolesText}");
        }

        $message->line("**Cliente:** {$project->customer->name}")
            ->line("**Indirizzo:** {$project->full_address}")
            ->line("**Periodo:** dal {$this->projectWorker->assigned_from->format('d/m/Y')} ".
                ($this->projectWorker->assigned_to ? "al {$this->projectWorker->assigned_to->format('d/m/Y')}" : '(data fine da definire)'));

        if ($this->projectWorker->notes) {
            $message->line("**Note:** {$this->projectWorker->notes}");
        }

        if ($isPending) {
            $acceptUrl = url("/dashboard/assignments/{$this->projectWorker->id}/accept");
            $rejectUrl = url("/dashboard/assignments/{$this->projectWorker->id}/reject");

            $message->line('**Devi confermare la tua disponibilità entro il '.
                $this->projectWorker->response_due_at->format('d/m/Y').'**')
                ->action('Accetta Assegnazione', $acceptUrl)
                ->line("Oppure [rifiuta l'assegnazione]({$rejectUrl}) se non sei disponibile.");
        } else {
            $message->action('Visualizza Dettagli Progetto', url("/dashboard/projects/{$project->id}"));
        }

        $message->line('Grazie per la collaborazione!');

        return $message;
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'worker_assigned_to_project',
            'project_worker_id' => $this->projectWorker->id,
            'project_id' => $this->projectWorker->project_id,
            'project_name' => $this->projectWorker->project->name,
            'project_code' => $this->projectWorker->project->code,
            'status' => $this->projectWorker->status->value,
            'assigned_from' => $this->projectWorker->assigned_from->toDateString(),
            'assigned_to' => $this->projectWorker->assigned_to?->toDateString(),
            'roles' => $this->projectWorker->roles->pluck('name')->toArray(),
            'assigned_by' => $this->projectWorker->assignedBy?->name,
            'requires_response' => $this->projectWorker->status->value === 'pending',
            'response_due_at' => $this->projectWorker->response_due_at?->toIso8601String(),
        ];
    }
}

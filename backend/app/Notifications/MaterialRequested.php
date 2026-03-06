<?php

namespace App\Notifications;

use App\Models\MaterialRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MaterialRequested extends Notification implements ShouldQueue
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
        $worker = $this->materialRequest->requestedByWorker;
        $project = $this->materialRequest->project;
        $priority = $this->materialRequest->priority->label();

        $message = (new MailMessage)
            ->subject("Nuova Richiesta Materiale - {$project->name}")
            ->greeting("Ciao {$notifiable->name},")
            ->line("**{$worker->full_name}** ha richiesto materiale per il progetto **{$project->name}**.")
            ->line('')
            ->line("**Materiale:** {$material->name}")
            ->line("**Quantità:** {$this->materialRequest->quantity_requested} {$this->materialRequest->unit_of_measure}")
            ->line("**Priorità:** {$priority}");

        if ($this->materialRequest->needed_by) {
            $message->line("**Necessario entro:** {$this->materialRequest->needed_by->format('d/m/Y')}");
        }

        if ($this->materialRequest->reason) {
            $message->line('')
                ->line('**Motivazione:**')
                ->line($this->materialRequest->reason);
        }

        $message->action('Visualizza Richiesta', url("/dashboard/projects/{$project->id}?tab=richieste"))
            ->line('Accedi alla piattaforma per approvare o rifiutare la richiesta.');

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
            'type' => 'material_requested',
            'material_request_id' => $this->materialRequest->id,
            'project_id' => $this->materialRequest->project_id,
            'project_name' => $this->materialRequest->project->name,
            'material_name' => $this->materialRequest->material->name,
            'quantity' => $this->materialRequest->quantity_requested,
            'priority' => $this->materialRequest->priority->value,
            'worker_name' => $this->materialRequest->requestedByWorker->full_name,
        ];
    }
}

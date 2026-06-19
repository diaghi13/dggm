<?php

namespace App\Mail;

use App\Domains\Project\Models\ProjectWorker;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WorkerAssignedToProjectMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly ProjectWorker $projectWorker
    ) {}

    public function envelope(): Envelope
    {
        $projectName = $this->projectWorker->project?->name ?? 'Progetto';

        return new Envelope(
            subject: "Nuova Assegnazione Progetto - {$projectName}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.worker-assigned-to-project',
            with: [
                'projectWorker' => $this->projectWorker,
            ],
        );
    }
}

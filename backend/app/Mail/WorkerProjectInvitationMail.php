<?php

namespace App\Mail;

use App\Models\ProjectWorker;
use App\Models\WorkerInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WorkerProjectInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly WorkerInvitation $invitation,
        public readonly ProjectWorker $projectWorker,
    ) {}

    public function envelope(): Envelope
    {
        $projectName = $this->projectWorker->project?->name ?? 'un progetto';

        return new Envelope(
            subject: "Richiesta di collaborazione - {$projectName}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.worker-project-invitation',
            with: [
                'invitation' => $this->invitation,
                'projectWorker' => $this->projectWorker,
            ],
        );
    }
}

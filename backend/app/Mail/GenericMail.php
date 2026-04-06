<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class GenericMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public $subject,
        public readonly string $bodyHtml,
        public readonly ?string $signature = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->subject,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.generic',
            with: [
                'bodyHtml' => $this->bodyHtml,
                'signature' => $this->signature,
            ],
        );
    }
}

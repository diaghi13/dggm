<?php

declare(strict_types=1);

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class VerifyGlobalUserMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $userName,
        public readonly string $email,
        public readonly string $companyName,
        public readonly string $verificationUrl,
        public readonly int $expireMinutes,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            to: $this->email,
            subject: 'Verifica il tuo indirizzo email - '.$this->companyName,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.verify-email',
            with: [
                'userName' => $this->userName,
                'companyName' => $this->companyName,
                'verificationUrl' => $this->verificationUrl,
                'expireMinutes' => $this->expireMinutes,
            ],
        );
    }
}

<?php

namespace App\Mail;

use App\Models\EmailAccount;
use App\Services\EmailSignatureService;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TestMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly EmailAccount $account,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new \Illuminate\Mail\Mailables\Address(
                $this->account->from_email,
                $this->account->from_name ?? $this->account->name,
            ),
            subject: "Test connessione email — {$this->account->name}",
        );
    }

    public function content(): Content
    {
        $signature = app(EmailSignatureService::class)->resolve(
            $this->account->id,
            auth()->id(),
        );

        return new Content(
            view: 'emails.test-connection',
            with: [
                'accountName' => $this->account->name,
                'fromEmail' => $this->account->from_email,
                'provider' => $this->account->provider,
                'signature' => $signature,
            ],
        );
    }
}

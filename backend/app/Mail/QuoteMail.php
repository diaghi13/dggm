<?php

namespace App\Mail;

use App\Models\Quote;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class QuoteMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Quote $quote,
        public readonly string $pdfContent,
        public readonly ?string $signature = null,
        public readonly ?string $customMessage = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Preventivo {$this->quote->code} — {$this->quote->title}",
        );
    }

    public function content(): Content
    {
        $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000')), '/');
        $token = $this->quote->customer_token;

        return new Content(
            view: 'emails.quote',
            with: [
                'quote' => $this->quote,
                'signature' => $this->signature,
                'customMessage' => $this->customMessage,
                'acceptUrl' => $token ? "{$frontendUrl}/quotes/confirm/{$token}?action=accept" : null,
                'rejectUrl' => $token ? "{$frontendUrl}/quotes/confirm/{$token}?action=reject" : null,
            ],
        );
    }

    public function attachments(): array
    {
        return [
            Attachment::fromData(
                fn () => $this->pdfContent,
                "Preventivo_{$this->quote->code}.pdf"
            )->withMime('application/pdf'),
        ];
    }
}

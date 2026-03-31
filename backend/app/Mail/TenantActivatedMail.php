<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\Landlord\GlobalUser;
use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TenantActivatedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Tenant $tenant,
        public readonly GlobalUser $adminUser,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            to: $this->adminUser->email,
            subject: 'Il tuo account DGGM ERP è attivo!',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.tenant-activated',
            with: [
                'tenantName' => $this->tenant->name,
                'userName' => $this->adminUser->name,
                'loginUrl' => config('app.url').'/login',
            ],
        );
    }
}

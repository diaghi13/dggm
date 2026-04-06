<?php

namespace App\Listeners;

use App\Enums\DocumentType;
use App\Events\QuoteSent;
use App\Mail\QuoteMail;
use App\Services\EmailSignatureService;
use App\Services\PdfService;
use App\Services\TenantMailService;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendQuoteEmailListener implements ShouldQueue
{
    public int $tries = 3;

    public int $timeout = 120;

    public function __construct(
        private readonly TenantMailService $tenantMailService,
        private readonly PdfService $pdfService,
        private readonly EmailSignatureService $signatureService,
    ) {}

    public function handle(QuoteSent $event): void
    {
        $quote = $event->quote->load(['customer', 'items', 'projectManager']);

        // No customer email → skip silently
        if (empty($quote->customer?->email)) {
            return;
        }

        // Resolve email account for quotes
        $account = $this->tenantMailService->resolveAccountForDocumentType(DocumentType::Quote);

        // No account configured → skip silently (quote status was already updated)
        if (! $account) {
            return;
        }

        // Generate PDF
        $pdfContent = $this->pdfService->generateQuotePdf($quote);

        // Resolve signature (account → sent_by user → global)
        $signature = $this->signatureService->resolve(
            $account->id,
            $event->metadata['sent_by'] ?? null
        );

        // Determine recipient display name
        $customerName = null;
        if ($quote->customer) {
            if ($quote->customer->type === 'company') {
                $customerName = $quote->customer->company_name;
            } else {
                $fullName = trim(($quote->customer->first_name ?? '').' '.($quote->customer->last_name ?? ''));
                $customerName = $fullName ?: $quote->customer->company_name;
            }
        }

        $mailable = new QuoteMail(
            quote: $quote,
            pdfContent: $pdfContent,
            signature: $signature,
        );

        $this->tenantMailService->sendWithAccount(
            account: $account,
            mailable: $mailable,
            toEmail: $quote->customer->email,
            toName: $customerName,
            documentType: DocumentType::Quote,
            documentId: $quote->id,
        );
    }
}

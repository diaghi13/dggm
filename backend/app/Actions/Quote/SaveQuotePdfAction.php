<?php

namespace App\Actions\Quote;

use App\Domains\Quote\Models\Quote;
use App\Services\PdfService;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class SaveQuotePdfAction
{
    public function __construct(
        private readonly PdfService $pdfService
    ) {}

    public function execute(Quote $quote): Media
    {
        // generateQuotePdf now returns PDF content as string
        $pdfContent = $this->pdfService->generateQuotePdf($quote);

        return $quote->addMediaFromString($pdfContent)
            ->usingFileName("Preventivo-{$quote->code}.pdf")
            ->toMediaCollection('pdfs');
    }
}

<?php

namespace App\Services;

use App\Models\Quote;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\View;

class PdfService
{
    public function generateQuotePdf(Quote $quote): \Barryvdh\DomPDF\PDF
    {
        // Load relationships
        $quote->load([
            'customer',
            'projectManager',
            'items.children',
            'template',
        ]);

        // Get template or use default
        $template = $quote->template ?? $quote->template()->first();

        // Prepare data for view
        $data = [
            'quote' => $quote,
            'template' => $template,
            'company' => $this->getCompanyInfo(),
        ];

        // Generate PDF
        $pdf = Pdf::loadView('pdf.quote', $data);

        // Set PDF options from template
        if ($template) {
            $pdf->setPaper($template->page_size ?? 'A4', $template->orientation ?? 'portrait');
        }

        return $pdf;
    }

    public function downloadQuotePdf(Quote $quote): \Illuminate\Http\Response
    {
        $pdf = $this->generateQuotePdf($quote);
        $filename = $this->generateFilename($quote);

        return $pdf->download($filename);
    }

    public function streamQuotePdf(Quote $quote): \Illuminate\Http\Response
    {
        $pdf = $this->generateQuotePdf($quote);
        $filename = $this->generateFilename($quote);

        return $pdf->stream($filename);
    }

    protected function generateFilename(Quote $quote): string
    {
        $code = str_replace(['/', '\\', ' '], '-', $quote->code);

        return "Preventivo-{$code}.pdf";
    }

    protected function getCompanyInfo(): array
    {
        return [
            'name' => config('app.name', 'DGGM ERP'),
            'address' => 'Via Roma 123',
            'city' => 'Milano',
            'postal_code' => '20100',
            'province' => 'MI',
            'vat' => 'IT12345678901',
            'phone' => '+39 02 1234567',
            'email' => 'info@dggm.it',
            'website' => 'www.dggm.it',
        ];
    }
}

<?php

namespace App\Services;

use App\Domains\Quote\Models\Quote;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\View;
use setasign\Fpdi\Fpdi;
use Spatie\Browsershot\Browsershot;

class PdfService
{
    public function generateQuotePdf(Quote $quote): string
    {
        // Load all necessary relationships
        $quote->load([
            'customer',
            'projectManager',
            'items.product.media',
            'items.priceListItem.product.media',
            'items.children.product.media',
            'items.children.priceListItem.product.media',
            'paymentTerm',
            'financialResource',
            'warrantyType',
            'priceList',
            'template',
        ]);

        // Get template or use default
        $template = $quote->template;

        // Calculate VAT breakdown by rate
        $vatBreakdown = $this->calculateVatBreakdown($quote);

        // Collect product images marked for quotes
        $quoteImages = $this->collectQuoteImages($quote);

        // Prepare data for view
        $data = [
            'quote' => $quote,
            'template' => $template,
            'company' => $this->getCompanyInfo(),
            'vatBreakdown' => $vatBreakdown,
            'colors' => $this->getThemeColors(),
            'quoteImages' => $quoteImages,
        ];

        // Select view based on company template setting
        $templateKey = \App\Models\Setting::get('company.quote_template', 'modern') ?: 'modern';
        $viewMap = ['modern' => 'pdf.quote', 'classic' => 'pdf.quote-classic', 'minimal' => 'pdf.quote-minimal'];
        $viewName = $viewMap[$templateKey] ?? 'pdf.quote';

        // Generate HTML from Blade template
        $html = View::make($viewName, $data)->render();

        // Generate footer HTML
        $footerHtml = $this->generateFooterHtml($data['company']);

        // Generate PDF using Browsershot with configured Node path
        $browsershot = Browsershot::html($html)
            ->showBackground()
            ->format('A4')
            ->margins(0, 0, 30, 0) // top, right, bottom (spazio per footer), left (in mm)
            ->showBrowserHeaderAndFooter()
            ->headerHtml('<div></div>') // Header vuoto per nascondere data/nome file
            ->footerHtml($footerHtml)
            ->waitUntilNetworkIdle();

        // Set custom Node/NPM/Chrome paths if configured
        if ($nodeBinary = config('services.browsershot.node_binary')) {
            $browsershot->setNodeBinary($nodeBinary);
        }
        if ($npmBinary = config('services.browsershot.npm_binary')) {
            $browsershot->setNpmBinary($npmBinary);
        }
        if ($chromePath = config('services.browsershot.chrome_path')) {
            $browsershot->setChromePath($chromePath);
        }

        // Required flags for headless Chrome in server/container environments
        if (config('services.browsershot.no_sandbox')) {
            $browsershot->noSandbox()
                ->addChromiumArguments([
                    'disable-dev-shm-usage',
                    'disable-gpu',
                    'no-first-run',
                    'no-zygote',
                    'disable-breakpad',
                    'disable-crash-reporter',
                ]);
        }

        $pdfContent = $browsershot->pdf();

        return $this->mergeWithAttachments($pdfContent, $quote);
    }

    public function downloadQuotePdf(Quote $quote): Response
    {
        $pdf = $this->generateQuotePdf($quote);

        $filename = $this->generateFilename($quote);

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    public function streamQuotePdf(Quote $quote): Response
    {
        $pdf = $this->generateQuotePdf($quote);
        $filename = $this->generateFilename($quote);

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="'.$filename.'"',
        ]);
    }

    protected function calculateVatBreakdown(Quote $quote): array
    {
        $items = $quote->items()
            ->where('type', '!=', \App\Enums\QuoteItemType::Section->value)
            ->whereNotNull('vat_rate')
            ->where('vat_rate', '>', 0)
            ->get();

        $breakdown = [];
        foreach ($items as $item) {
            $rate = (float) $item->vat_rate;
            if (! isset($breakdown[$rate])) {
                $breakdown[$rate] = 0;
            }
            $breakdown[$rate] += (float) $item->vat_amount;
        }

        // Sort by rate ascending
        ksort($breakdown);

        return $breakdown;
    }

    protected function generateFilename(Quote $quote): string
    {
        $code = str_replace(['/', '\\', ' '], '-', $quote->code);

        return "Preventivo_{$code}.pdf";
    }

    protected function getCompanyInfo(): array
    {
        return [
            'name' => \App\Models\Setting::get('company.name', config('app.name', 'Laravel')) ?: null,
            'address' => \App\Models\Setting::get('company.address') ?: null,
            'city' => \App\Models\Setting::get('company.city') ?: null,
            'postal_code' => \App\Models\Setting::get('company.postal_code') ?: null,
            'province' => \App\Models\Setting::get('company.province') ?: null,
            'vat' => \App\Models\Setting::get('company.vat') ?: null,
            'fiscal_code' => \App\Models\Setting::get('company.fiscal_code') ?: null,
            'phone' => \App\Models\Setting::get('company.phone') ?: null,
            'email' => \App\Models\Setting::get('company.email') ?: null,
            'website' => \App\Models\Setting::get('company.website') ?: null,
            'logo' => $this->getImageAsDataUrl('company.logo'),
            'stamp' => $this->getImageAsDataUrl('company.stamp'),
            'sigla' => $this->getImageAsDataUrl('company.sigla'),
        ];
    }

    protected function getImageAsDataUrl(string $settingKey): ?string
    {
        $relativePath = \App\Models\Setting::get($settingKey);

        if (! $relativePath) {
            return null;
        }

        $filename = basename($relativePath);
        $filePath = Storage::disk('public')->path('company/'.$filename);

        if (! file_exists($filePath)) {
            return null;
        }

        $mimeType = mime_content_type($filePath) ?: 'image/png';

        return 'data:'.$mimeType.';base64,'.base64_encode(file_get_contents($filePath));
    }

    /** @deprecated Use getImageAsDataUrl('company.logo') */
    protected function getLogoAsDataUrl(): ?string
    {
        return $this->getImageAsDataUrl('company.logo');
    }

    protected function getThemeColors(): array
    {
        return [
            'primary' => \App\Models\Setting::get('theme.primary_color', '#2563eb'),
            'secondary' => \App\Models\Setting::get('theme.secondary_color', '#1e40af'),
        ];
    }

    /**
     * Build a lookup of products-by-code for items resolved only via code (prevent N+1).
     */
    private function buildProductsByCode(\Illuminate\Support\Collection $allItems): array
    {
        $codesNeeded = $allItems
            ->filter(fn ($item) => ! $item->product_id && ! $item->price_list_item_id && $item->code)
            ->pluck('code')
            ->unique()
            ->values();

        if ($codesNeeded->isEmpty()) {
            return [];
        }

        return \App\Domains\Product\Models\Product::with('media')
            ->whereIn('code', $codesNeeded->toArray())
            ->get()
            ->keyBy('code')
            ->all();
    }

    protected function collectQuoteImages(Quote $quote): array
    {
        $images = [];
        $allItems = $quote->items->concat($quote->items->flatMap->children)->unique('id');
        $productsByCode = $this->buildProductsByCode($allItems);

        foreach ($allItems as $item) {
            $product = $item->product
                ?? $item->priceListItem?->product
                ?? ($item->code ? $productsByCode[$item->code] ?? null : null);

            if (! $product) {
                continue;
            }

            if ($item->included_media_ids !== null) {
                // Explicit selection: include only the specified IDs (empty = none)
                if (empty($item->included_media_ids)) {
                    continue;
                }
                $productImages = $product->getMedia('images')
                    ->filter(fn ($m) => in_array($m->id, $item->included_media_ids));
            } else {
                // null = default → include all images marked use_in_quotes
                $productImages = $product->getImagesForQuotes();
                if ($productImages->isEmpty()) {
                    continue;
                }
            }

            foreach ($productImages as $media) {
                $mediumPath = $media->getPath('medium');
                $images[] = [
                    'id' => $media->id,
                    'internal_code' => $product->internal_code,
                    'name' => $product->name,
                    'description' => $item->description,
                    'imageUrl' => $media->getUrl('medium'),
                    'imagePath' => file_exists($mediumPath) ? $mediumPath : $media->getPath(),
                ];
            }
        }

        return $images;
    }

    /**
     * Collect product PDFs for the quote, grouped by product for separator pages.
     *
     * @return array<int, array{product_name: string, document_name: string, pdf_media: \Spatie\MediaLibrary\MediaCollections\Models\Media}>
     */
    protected function collectProductPdfsForQuote(Quote $quote): array
    {
        $result = [];
        $seenPdfIds = [];

        $allItems = $quote->items->concat($quote->items->flatMap->children)->unique('id');
        $productsByCode = $this->buildProductsByCode($allItems);

        foreach ($allItems as $item) {
            $product = $item->product
                ?? $item->priceListItem?->product
                ?? ($item->code ? $productsByCode[$item->code] ?? null : null);

            if (! $product) {
                continue;
            }

            // Determine which documents to include for this item
            if ($item->included_media_ids !== null) {
                // Explicit selection: include only the specified IDs (empty = none)
                if (empty($item->included_media_ids)) {
                    continue;
                }
                $documents = $product->getDocumentsForQuotes()
                    ->filter(fn ($m) => in_array($m->id, $item->included_media_ids));
            } else {
                // null = default → include all documents marked use_in_quotes
                $documents = $product->getDocumentsForQuotes();
            }

            foreach ($documents as $media) {
                // Resolve the PDF to merge (native PDF or converted version)
                $pdfMedia = null;
                if ($media->mime_type === 'application/pdf') {
                    $pdfMedia = $media;
                } elseif ($pdfMediaId = $media->getCustomProperty('pdf_media_id')) {
                    $pdfMedia = \Spatie\MediaLibrary\MediaCollections\Models\Media::find($pdfMediaId);
                }

                if (! $pdfMedia || in_array($pdfMedia->id, $seenPdfIds)) {
                    continue; // Skip duplicates and unconverted docs
                }

                $seenPdfIds[] = $pdfMedia->id;
                $result[] = [
                    'product_name' => $product->name,
                    'document_name' => $media->getCustomProperty('description') ?: $media->name,
                    'pdf_media' => $pdfMedia,
                ];
            }
        }

        return $result;
    }

    protected function mergeWithAttachments(string $mainPdfContent, Quote $quote): string
    {
        $productPdfGroups = $this->collectProductPdfsForQuote($quote);

        $quoteAttachments = $quote->getMedia('attachments')
            ->filter(fn ($m) => $m->mime_type === 'application/pdf')
            ->sortBy('order_column')
            ->values();

        if (empty($productPdfGroups) && $quoteAttachments->isEmpty()) {
            return $mainPdfContent;
        }

        $pdf = new Fpdi;
        $tempMain = tempnam(sys_get_temp_dir(), 'quote_main_').'.pdf';
        file_put_contents($tempMain, $mainPdfContent);

        try {
            // Copy main quote pages
            $count = $pdf->setSourceFile($tempMain);
            for ($i = 1; $i <= $count; $i++) {
                $tpl = $pdf->importPage($i);
                $size = $pdf->getTemplateSize($tpl);
                $pdf->addPage($size['orientation'], [$size['width'], $size['height']]);
                $pdf->useTemplate($tpl);
            }

            // Product documents — each optionally preceded by a separator page
            $showSeparator = \App\Models\Setting::get('quotes.show_document_separator_page', '1');
            foreach ($productPdfGroups as $group) {
                if (filter_var($showSeparator, FILTER_VALIDATE_BOOLEAN)) {
                    $this->addSeparatorPage($pdf, $group['product_name'], $group['document_name']);
                }

                $path = $group['pdf_media']->getPath();
                if (! file_exists($path)) {
                    continue;
                }

                $count = $pdf->setSourceFile($path);
                for ($i = 1; $i <= $count; $i++) {
                    $tpl = $pdf->importPage($i);
                    $size = $pdf->getTemplateSize($tpl);
                    $pdf->addPage($size['orientation'], [$size['width'], $size['height']]);
                    $pdf->useTemplate($tpl);
                }
            }

            // Quote-level attachments (no separator — user added them manually)
            foreach ($quoteAttachments as $media) {
                $path = $media->getPath();
                if (! file_exists($path)) {
                    continue;
                }

                $count = $pdf->setSourceFile($path);
                for ($i = 1; $i <= $count; $i++) {
                    $tpl = $pdf->importPage($i);
                    $size = $pdf->getTemplateSize($tpl);
                    $pdf->addPage($size['orientation'], [$size['width'], $size['height']]);
                    $pdf->useTemplate($tpl);
                }
            }
        } finally {
            @unlink($tempMain);
        }

        return $pdf->Output('S');
    }

    /**
     * Add a clean separator page before each product document.
     * Uses ISO-8859-1 encoding (FPDF limitation — accented Italian chars handled via iconv).
     */
    protected function addSeparatorPage(Fpdi $pdf, string $productName, string $documentName): void
    {
        $pdf->AddPage('P', [210, 297]); // A4 portrait

        // Top accent bar (primary blue)
        $pdf->SetFillColor(37, 99, 235);
        $pdf->Rect(0, 0, 210, 6, 'F');

        // Product name
        $pdf->SetFont('Helvetica', 'B', 20);
        $pdf->SetTextColor(15, 23, 42);
        $pdf->SetXY(20, 40);
        $pdf->Cell(170, 12, $this->toFpdfString($productName), 0, 1, 'L');

        // Divider line
        $pdf->SetDrawColor(226, 232, 240);
        $pdf->SetLineWidth(0.3);
        $pdf->Line(20, 57, 190, 57);

        // Document name
        $pdf->SetFont('Helvetica', '', 13);
        $pdf->SetTextColor(100, 116, 139);
        $pdf->SetXY(20, 62);
        $pdf->Cell(170, 8, $this->toFpdfString($documentName), 0, 1, 'L');

        // Bottom accent bar
        $pdf->SetFillColor(37, 99, 235);
        $pdf->Rect(0, 291, 210, 6, 'F');
    }

    /**
     * Convert a UTF-8 string to ISO-8859-1 for FPDF (handles Italian accented chars).
     */
    private function toFpdfString(string $text): string
    {
        return iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $text) ?: $text;
    }

    protected function generateFooterHtml(array $company): string
    {
        $date = now()->format('d/m/Y H:i');

        $contactParts = array_filter([
            $company['email'],
            $company['phone'],
            $company['website'],
        ]);
        $contactLine = implode(' | ', $contactParts);

        $vatParts = array_filter([
            $company['vat'] ? 'P.IVA: '.$company['vat'] : null,
            $company['fiscal_code'] ? 'C.F.: '.$company['fiscal_code'] : null,
        ]);
        $vatLine = implode(' | ', $vatParts);

        $contactHtml = $contactLine ? "<br>{$contactLine}" : '';
        $vatHtml = $vatLine ? "<br><span style=\"font-size: 7pt;\">{$vatLine}</span>" : '';

        return <<<HTML
        <div style="width: 100%; font-size: 8pt; text-align: center; color: #64748b; padding: 10px 20px; border-top: 1px solid #e2e8f0; margin: 0 auto;">
            <div style="max-width: 800px; margin: 0 auto;">
                <strong>{$company['name']}</strong>{$contactHtml}{$vatHtml}<br>
                <span style="font-size: 7pt; color: #94a3b8;">Documento generato il {$date}</span>
            </div>
        </div>
        HTML;
    }
}

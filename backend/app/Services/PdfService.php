<?php

namespace App\Services;

use App\Models\Quote;
use Illuminate\Http\Response;
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
            'items.children.product.media',
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

        // Generate HTML from Blade template
        $html = View::make('pdf.quote', $data)->render();

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
        if ($nodeBinary = env('NODE_BINARY')) {
            $browsershot->setNodeBinary($nodeBinary);
        }
        if ($npmBinary = env('NPM_BINARY')) {
            $browsershot->setNpmBinary($npmBinary);
        }
        if ($chromePath = env('CHROME_PATH')) {
            $browsershot->setChromePath($chromePath);
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
            'name' => \App\Models\Setting::get('company.name', config('app.name', 'Laravel')),
            'address' => \App\Models\Setting::get('company.address', 'Via Roma 123'),
            'city' => \App\Models\Setting::get('company.city', 'Milano'),
            'postal_code' => \App\Models\Setting::get('company.postal_code', '20100'),
            'province' => \App\Models\Setting::get('company.province', 'MI'),
            'vat' => \App\Models\Setting::get('company.vat', 'IT12345678901'),
            'phone' => \App\Models\Setting::get('company.phone', '+39 02 1234567'),
            'email' => \App\Models\Setting::get('company.email', 'info@dggm.it'),
            'website' => \App\Models\Setting::get('company.website', 'www.dggm.it'),
            'logo' => \App\Models\Setting::get('company.logo'), // Path to logo if needed
        ];
    }

    protected function getThemeColors(): array
    {
        return [
            'primary' => \App\Models\Setting::get('theme.primary_color', '#2563eb'),
            'secondary' => \App\Models\Setting::get('theme.secondary_color', '#1e40af'),
        ];
    }

    protected function collectQuoteImages(Quote $quote): array
    {
        $images = [];

        // Get all items (including children) - use unique by ID to avoid duplicates
        $allItems = $quote->items->concat($quote->items->flatMap->children)->unique('id');

        // Collect all codes from items that need images but don't have product_id
        $codesNeeded = $allItems
            ->filter(fn ($item) => $item->include_image && ! $item->product_id && ! $item->price_list_item_id && $item->code)
            ->pluck('code')
            ->unique()
            ->values();

        // Load all products with these codes in one query (prevent N+1)
        $productsByCode = [];
        if ($codesNeeded->isNotEmpty()) {
            $productsByCode = \App\Models\Product::with('media')
                ->whereIn('code', $codesNeeded->toArray())
                ->get()
                ->keyBy('code');
        }

        foreach ($allItems as $item) {
            // Skip if item doesn't want to include image
            if (! $item->include_image) {
                continue;
            }

            // Get product via multiple strategies:
            // 1. Direct product_id relationship
            // 2. Through price_list_item_id -> product relationship
            // 3. Lookup by code from pre-loaded products
            $product = $item->product
                ?? $item->priceListItem?->product
                ?? ($item->code ? $productsByCode[$item->code] ?? null : null);

            // Skip if no product found
            if (! $product) {
                continue;
            }

            // Get images marked for quotes from the product
            $productImages = $product->getImagesForQuotes();

            foreach ($productImages as $media) {
                $images[] = [
                    'id' => $media->id,
                    'name' => $product->name,
                    'description' => $item->description,
                    'imageUrl' => $media->getUrl('medium'), // Use medium conversion for better quality
                    'imagePath' => $media->getPath('medium'),
                ];
            }
        }

        return $images;
    }

    protected function mergeWithAttachments(string $mainPdfContent, Quote $quote): string
    {
        $pdfAttachments = $quote->getMedia('attachments')
            ->filter(fn ($m) => $m->mime_type === 'application/pdf')
            ->sortBy('order_column')
            ->values();

        if ($pdfAttachments->isEmpty()) {
            return $mainPdfContent;
        }

        $pdf = new Fpdi;
        $tempMain = tempnam(sys_get_temp_dir(), 'quote_main_').'.pdf';
        file_put_contents($tempMain, $mainPdfContent);

        try {
            $count = $pdf->setSourceFile($tempMain);
            for ($i = 1; $i <= $count; $i++) {
                $tpl = $pdf->importPage($i);
                $size = $pdf->getTemplateSize($tpl);
                $pdf->addPage($size['orientation'], [$size['width'], $size['height']]);
                $pdf->useTemplate($tpl);
            }

            foreach ($pdfAttachments as $media) {
                $count = $pdf->setSourceFile($media->getPath());
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

    protected function generateFooterHtml(array $company): string
    {
        $date = now()->format('d/m/Y H:i');

        return <<<HTML
        <div style="width: 100%; font-size: 8pt; text-align: center; color: #64748b; padding: 10px 20px; border-top: 1px solid #e2e8f0; margin: 0 auto;">
            <div style="max-width: 800px; margin: 0 auto;">
                <strong>{$company['name']}</strong><br>
                {$company['email']} | {$company['phone']} | {$company['website']}<br>
                <span style="font-size: 7pt; color: #94a3b8;">Documento generato il {$date}</span>
            </div>
        </div>
        HTML;
    }
}

<?php

namespace App\Jobs;

use App\Services\DocumentConverterService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class ConvertDocumentToPdfJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 120;

    public function __construct(
        public readonly int $mediaId
    ) {}

    public function handle(DocumentConverterService $converter): void
    {
        $media = Media::find($this->mediaId);

        if (! $media) {
            Log::warning('ConvertDocumentToPdfJob: media not found', ['media_id' => $this->mediaId]);

            return;
        }

        // Skip if already converted or already a PDF
        if ($media->getCustomProperty('is_pdf_conversion') || $media->mime_type === 'application/pdf') {
            return;
        }

        $sourcePath = $media->getPath();

        if (! file_exists($sourcePath)) {
            Log::error('ConvertDocumentToPdfJob: source file not found', ['path' => $sourcePath]);

            return;
        }

        $pdfPath = null;

        try {
            $pdfPath = $converter->convertToPdf($sourcePath);

            $model = $media->model;

            /** @var Media $pdfMedia */
            $pdfMedia = $model->addMedia($pdfPath)
                ->withCustomProperties([
                    'is_pdf_conversion' => true,
                    'source_media_id' => $media->id,
                    'use_in_quotes' => $media->getCustomProperty('use_in_quotes', false),
                    'description' => $media->getCustomProperty('description'),
                ])
                ->usingName($media->name.' (PDF)')
                ->usingFileName(pathinfo($media->file_name, PATHINFO_FILENAME).'.pdf')
                ->toMediaCollection($media->collection_name);

            // Link original → PDF conversion
            $media->setCustomProperty('pdf_media_id', $pdfMedia->id);
            $media->save();

            Log::info('Document converted to PDF', [
                'source_media_id' => $media->id,
                'pdf_media_id' => $pdfMedia->id,
            ]);
        } catch (\Throwable $e) {
            Log::error('ConvertDocumentToPdfJob failed', [
                'media_id' => $this->mediaId,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        } finally {
            // Clean up temp PDF only if it still exists (Spatie moves it on success)
            if ($pdfPath && file_exists($pdfPath)) {
                @unlink($pdfPath);
            }
        }
    }
}

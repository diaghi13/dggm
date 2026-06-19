<?php

namespace App\Http\Controllers\Api\V1\Products;

use App\Domains\Product\Actions\Media\DeleteProductMediaAction;
use App\Domains\Product\Actions\Media\ReorderProductMediaAction;
use App\Domains\Product\Actions\Media\UpdateProductMediaPropertiesAction;
use App\Domains\Product\Actions\Media\UploadProductMediaAction;
use App\Domains\Product\Data\ProductMediaData;
use App\Domains\Product\Models\Product;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * Product Media Controller
 *
 * Handles media/document management for products using Spatie Media Library
 */
class ProductMediaController extends Controller
{
    /**
     * Get all media for a product, grouped by collection
     */
    public function index(Product $product): JsonResponse
    {
        $this->authorize('view', $product);

        // Map a Media collection to an array of ProductMediaData DTOs.
        // Note: ProductMediaData::collect() returns the original MediaCollection unchanged,
        // so we must map explicitly using from().
        $toDto = fn ($collection) => $collection
            ->map(fn ($m) => ProductMediaData::fromMedia($m))
            ->values()
            ->all();

        // Filter out internal PDF conversions — those are managed automatically
        $excludeConversions = fn ($collection) => $collection
            ->reject(fn ($media) => $media->getCustomProperty('is_pdf_conversion', false));

        $mediaByCollection = [
            'images' => $toDto($product->getMedia('images')),
            'technical_sheets' => $toDto($excludeConversions($product->getMedia('technical_sheets'))),
            'certifications' => $toDto($excludeConversions($product->getMedia('certifications'))),
            'manuals' => $toDto($excludeConversions($product->getMedia('manuals'))),
            'drawings' => $toDto($excludeConversions($product->getMedia('drawings'))),
            'documents' => $toDto($excludeConversions($product->getMedia('documents'))),
        ];

        return response()->json([
            'success' => true,
            'data' => $mediaByCollection,
        ]);
    }

    /**
     * Upload media to product
     */
    public function store(Request $request, Product $product): JsonResponse
    {
        $this->authorize('update', $product);

        // Validate file and collection
        $validated = $request->validate([
            'file' => 'required|file|max:'.$this->getMaxFileSize($request->input('collection_name', 'documents')),
            'collection_name' => 'required|in:images,technical_sheets,certifications,manuals,drawings,documents',
            'description' => 'nullable|string|max:500',
            'is_primary' => 'nullable|boolean',
            'use_in_quotes' => 'nullable|boolean',
            'use_in_projects' => 'nullable|boolean',
            'document_type' => 'nullable|string|max:100',
            'valid_until' => 'nullable|date',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        // Additional file type validation based on collection
        $this->validateFileType($request->file('file'), $validated['collection_name']);

        // Check media limits
        $this->checkMediaLimits($product, $validated['collection_name']);

        // Create ProductMediaData from request
        $mediaData = ProductMediaData::from([
            'collection_name' => $validated['collection_name'],
            'description' => $validated['description'] ?? null,
            'is_primary' => $validated['is_primary'] ?? false,
            'use_in_quotes' => $validated['use_in_quotes'] ?? false,
            'use_in_projects' => $validated['use_in_projects'] ?? false,
            'document_type' => $validated['document_type'] ?? null,
            'valid_until' => $validated['valid_until'] ?? null,
            'sort_order' => $validated['sort_order'] ?? 0,
        ]);

        // Upload via Action
        $media = app(UploadProductMediaAction::class)->execute(
            $product,
            $request->file('file'),
            $mediaData
        );

        return response()->json([
            'success' => true,
            'message' => 'File caricato con successo.',
            'data' => ProductMediaData::fromMedia($media),
        ], 201);
    }

    /**
     * Get single media details
     */
    public function show(Product $product, Media $media): JsonResponse
    {
        $this->authorize('view', $product);

        // Ensure media belongs to product
        if ($media->model_id !== $product->id || $media->model_type !== Product::class) {
            abort(404, 'Media non trovato per questo prodotto.');
        }

        return response()->json([
            'success' => true,
            'data' => ProductMediaData::fromMedia($media),
        ]);
    }

    /**
     * Update media custom properties
     */
    public function update(Request $request, Product $product, Media $media): JsonResponse
    {
        $this->authorize('update', $product);

        // Ensure media belongs to product
        if ($media->model_id !== $product->id || $media->model_type !== Product::class) {
            abort(404, 'Media non trovato per questo prodotto.');
        }

        $validated = $request->validate([
            'description' => 'nullable|string|max:500',
            'is_primary' => 'nullable|boolean',
            'use_in_quotes' => 'nullable|boolean',
            'use_in_projects' => 'nullable|boolean',
            'document_type' => 'nullable|string|max:100',
            'valid_until' => 'nullable|date',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        // Create ProductMediaData for update
        $mediaData = ProductMediaData::from([
            'collection_name' => $media->collection_name,
            'description' => $validated['description'] ?? $media->getCustomProperty('description'),
            'is_primary' => $validated['is_primary'] ?? $media->getCustomProperty('is_primary', false),
            'use_in_quotes' => $validated['use_in_quotes'] ?? $media->getCustomProperty('use_in_quotes', false),
            'use_in_projects' => $validated['use_in_projects'] ?? $media->getCustomProperty('use_in_projects', false),
            'document_type' => $validated['document_type'] ?? $media->getCustomProperty('document_type'),
            'valid_until' => $validated['valid_until'] ?? $media->getCustomProperty('valid_until'),
            'sort_order' => $validated['sort_order'] ?? $media->order_column,
        ]);

        // Update via Action
        $updatedMedia = app(UpdateProductMediaPropertiesAction::class)->execute($media, $mediaData);

        return response()->json([
            'success' => true,
            'message' => 'Proprietà aggiornate con successo.',
            'data' => ProductMediaData::fromMedia($updatedMedia),
        ]);
    }

    /**
     * Delete media
     */
    public function destroy(Product $product, Media $media): JsonResponse
    {
        $this->authorize('update', $product);

        // Ensure media belongs to product
        if ($media->model_id !== $product->id || $media->model_type !== Product::class) {
            abort(404, 'Media non trovato per questo prodotto.');
        }

        app(DeleteProductMediaAction::class)->execute($media);

        return response()->json([
            'success' => true,
            'message' => 'File eliminato con successo.',
        ]);
    }

    /**
     * Reorder media
     */
    public function reorder(Request $request, Product $product, Media $media): JsonResponse
    {
        $this->authorize('update', $product);

        // Ensure media belongs to product
        if ($media->model_id !== $product->id || $media->model_type !== Product::class) {
            abort(404, 'Media non trovato per questo prodotto.');
        }

        $validated = $request->validate([
            'order' => 'required|integer|min:0',
        ]);

        $updatedMedia = app(ReorderProductMediaAction::class)->execute($media, $validated['order']);

        return response()->json([
            'success' => true,
            'message' => 'Ordine aggiornato con successo.',
            'data' => ProductMediaData::fromMedia($updatedMedia),
        ]);
    }

    /**
     * Download all files in a collection as a ZIP archive
     */
    public function downloadCollectionZip(Request $request, Product $product): \Illuminate\Http\Response
    {
        $this->authorize('view', $product);

        $collection = $request->query('collection', 'documents');
        $allowedCollections = ['technical_sheets', 'certifications', 'manuals', 'drawings', 'documents'];

        if (! in_array($collection, $allowedCollections)) {
            abort(400, 'Collezione non valida.');
        }

        $mediaItems = $product->getMedia($collection)
            ->reject(fn ($m) => $m->getCustomProperty('is_pdf_conversion', false));

        if ($mediaItems->isEmpty()) {
            abort(404, 'Nessun file in questa collezione.');
        }

        $zipFilename = tempnam(sys_get_temp_dir(), 'media_zip_').'.zip';

        try {
            $zip = new \ZipArchive;
            $zip->open($zipFilename, \ZipArchive::CREATE);

            foreach ($mediaItems as $media) {
                $path = $media->getPath();
                if (file_exists($path)) {
                    $zip->addFile($path, $media->file_name);
                }
            }

            $zip->close();

            $collectionLabel = str_replace('_', '-', $collection);
            $productCode = str_replace(['/', '\\', ' '], '-', $product->code ?? $product->id);
            $downloadName = "media-{$productCode}-{$collectionLabel}.zip";

            return response(file_get_contents($zipFilename), 200, [
                'Content-Type' => 'application/zip',
                'Content-Disposition' => "attachment; filename=\"{$downloadName}\"",
            ]);
        } finally {
            @unlink($zipFilename);
        }
    }

    /**
     * Get maximum file size in KB based on collection
     */
    private function getMaxFileSize(string $collection): int
    {
        return match ($collection) {
            'images' => 10240,  // 10MB
            default => 51200,   // 50MB for all documents
        };
    }

    /**
     * Validate file type based on collection
     *
     * @throws ValidationException
     */
    private function validateFileType($file, string $collection): void
    {
        if ($collection === 'images') {
            $allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (! in_array($file->getMimeType(), $allowedMimes)) {
                throw ValidationException::withMessages([
                    'file' => ['Tipo di file non valido. Sono accettate solo immagini (JPEG, PNG, WebP).'],
                ]);
            }
        }
        // All other collections accept any file type
    }

    /**
     * Check media limits for collection
     *
     * @throws ValidationException
     */
    private function checkMediaLimits(Product $product, string $collection): void
    {
        $limits = [
            'images' => 20,
            'technical_sheets' => 10,
            'certifications' => 10,
            'manuals' => 10,
            'drawings' => 10,
            'documents' => 10,
        ];

        $currentCount = $product->getMedia($collection)->count();
        $limit = $limits[$collection] ?? 10;

        if ($currentCount >= $limit) {
            throw ValidationException::withMessages([
                'file' => ["Limite massimo di {$limit} file raggiunto per questa collezione."],
            ]);
        }
    }
}

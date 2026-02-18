<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Product\Media\DeleteProductMediaAction;
use App\Actions\Product\Media\ReorderProductMediaAction;
use App\Actions\Product\Media\UpdateProductMediaPropertiesAction;
use App\Actions\Product\Media\UploadProductMediaAction;
use App\Data\ProductMediaData;
use App\Http\Controllers\Controller;
use App\Models\Product;
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
     * Get maximum file size in KB based on collection
     */
    private function getMaxFileSize(string $collection): int
    {
        return match ($collection) {
            'images' => 10240, // 10MB
            'drawings' => 51200, // 50MB
            default => 20480, // 20MB for documents
        };
    }

    /**
     * Validate file type based on collection
     *
     * @throws ValidationException
     */
    private function validateFileType($file, string $collection): void
    {
        $allowedMimes = match ($collection) {
            'images' => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
            'drawings' => ['application/pdf', 'application/x-dxf', 'application/acad', 'image/vnd.dwg'],
            default => ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        };

        if (! in_array($file->getMimeType(), $allowedMimes)) {
            throw ValidationException::withMessages([
                'file' => ['Tipo di file non valido per questa collezione.'],
            ]);
        }
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

<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Models\Quote;
use App\Models\Site;
use Illuminate\Http\Request;

class MediaController extends Controller
{
    /**
     * Upload media for a specific model
     */
    public function upload(Request $request, string $modelType, int $modelId)
    {
        $request->validate([
            'file' => 'required|file|max:10240', // Max 10MB
            'collection' => 'string|in:attachments,contracts,certificates,safety_plans,photos,technical_drawings,documents,reports',
            'type' => 'nullable|string|in:document,image,drawing,other',
            'description' => 'nullable|string|max:500',
        ]);

        // Get model instance
        $model = $this->getModel($modelType, $modelId);

        if (! $model) {
            abort(404, 'Model not found');
        }

        // Authorization check
        if ($model instanceof Quote) {
            $this->authorize('update', $model);
        } elseif ($model instanceof Site) {
            $this->authorize('update', $model);
        }

        $collection = $request->input('collection', 'attachments');

        // Upload media
        $media = $model->addMedia($request->file('file'))
            ->withCustomProperties([
                'type' => $request->input('type', 'document'),
                'description' => $request->input('description'),
            ])
            ->toMediaCollection($collection);

        return response()->json([
            'success' => true,
            'message' => 'File uploaded successfully',
            'data' => [
                'id' => $media->id,
                'name' => $media->name,
                'file_name' => $media->file_name,
                'original_filename' => $media->file_name,
                'mime_type' => $media->mime_type,
                'size' => $media->size,
                'file_size' => $media->size,
                'file_size_human' => $media->human_readable_size,
                'url' => $media->getUrl(),
                'type' => $media->getCustomProperty('type', 'document'),
                'description' => $media->getCustomProperty('description'),
                'created_at' => $media->created_at?->toISOString(),
            ],
        ]);
    }

    /**
     * Download media
     */
    public function download(Media $media)
    {
        // Authorization check for the parent model
        $model = $media->model;

        if ($model instanceof Quote) {
            $this->authorize('view', $model);
        } elseif ($model instanceof Site) {
            $this->authorize('view', $model);
        }

        return response()->download($media->getPath(), $media->file_name);
    }

    /**
     * Delete media (soft delete)
     */
    public function destroy(Media $media)
    {
        // Authorization check for the parent model
        $model = $media->model;

        if ($model instanceof Quote) {
            $this->authorize('update', $model);
        } elseif ($model instanceof Site) {
            $this->authorize('update', $model);
        }

        $media->delete(); // Soft delete grazie al trait SoftDeletes

        return response()->json([
            'success' => true,
            'message' => 'File deleted successfully',
        ]);
    }

    /**
     * Get model instance from type and ID
     */
    protected function getModel(string $type, int $id)
    {
        return match ($type) {
            'quotes' => Quote::find($id),
            'sites' => Site::find($id),
            // Aggiungi altri modelli qui quando implementati
            // 'customers' => Customer::find($id),
            // 'employees' => Employee::find($id),
            default => null,
        };
    }
}

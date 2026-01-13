<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SiteResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'description' => $this->description,
            'customer_id' => $this->customer_id,
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer->id,
                'display_name' => $this->customer->display_name,
                'type' => $this->customer->type,
            ]),
            'quote_id' => $this->quote_id,
            'quote' => $this->whenLoaded('quote', fn () => $this->quote ? [
                'id' => $this->quote->id,
                'code' => $this->quote->code,
                'title' => $this->quote->title,
                'total_amount' => $this->quote->total_amount,
                'status' => $this->quote->status,
            ] : null),
            'address' => $this->address,
            'city' => $this->city,
            'province' => $this->province,
            'postal_code' => $this->postal_code,
            'country' => $this->country,
            'full_address' => $this->full_address,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'gps_radius' => $this->gps_radius,
            'project_manager_id' => $this->project_manager_id,
            'project_manager' => $this->whenLoaded('projectManager', fn () => $this->projectManager ? [
                'id' => $this->projectManager->id,
                'name' => $this->projectManager->name,
                'email' => $this->projectManager->email,
            ] : null),
            'estimated_amount' => $this->estimated_amount,
            'actual_cost' => $this->actual_cost,
            'invoiced_amount' => $this->invoiced_amount,
            'margin' => $this->margin,
            'margin_percentage' => $this->margin_percentage,
            'start_date' => $this->start_date?->format('Y-m-d'),
            'estimated_end_date' => $this->estimated_end_date?->format('Y-m-d'),
            'actual_end_date' => $this->actual_end_date?->format('Y-m-d'),
            'status' => $this->status,
            'priority' => $this->priority,
            'notes' => $this->notes,
            'internal_notes' => $this->internal_notes,
            'is_active' => $this->is_active,
            'media' => $this->whenLoaded('media', function () {
                return $this->media->map(function ($media) {
                    return [
                        'id' => $media->id,
                        'collection_name' => $media->collection_name,
                        'name' => $media->name,
                        'file_name' => $media->file_name,
                        'mime_type' => $media->mime_type,
                        'size' => $media->size,
                        'human_readable_size' => $media->human_readable_size,
                        'url' => $media->getUrl(),
                        'type' => $media->getCustomProperty('type', 'document'),
                        'description' => $media->getCustomProperty('description'),
                        'created_at' => $media->created_at?->toISOString(),
                    ];
                });
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

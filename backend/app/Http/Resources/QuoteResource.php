<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuoteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'title' => $this->title,
            'customer_id' => $this->customer_id,
            'customer' => new CustomerResource($this->whenLoaded('customer')),
            'project_manager_id' => $this->project_manager_id,
            'project_manager' => $this->whenLoaded('projectManager'),
            'description' => $this->description,
            'address' => $this->address,
            'city' => $this->city,
            'province' => $this->province,
            'postal_code' => $this->postal_code,
            'full_address' => $this->full_address,
            'status' => $this->status,
            'issue_date' => $this->issue_date?->format('Y-m-d'),
            'expiry_date' => $this->expiry_date?->format('Y-m-d'),
            'valid_until' => $this->valid_until?->format('Y-m-d'),
            'sent_date' => $this->sent_date?->format('Y-m-d'),
            'approved_date' => $this->approved_date?->format('Y-m-d'),
            'subtotal' => $this->subtotal,
            'discount_percentage' => $this->discount_percentage,
            'discount_amount' => $this->discount_amount,
            'tax_percentage' => $this->tax_percentage,
            'show_tax' => $this->show_tax,
            'tax_included' => $this->tax_included,
            'show_unit_prices' => $this->show_unit_prices,
            'tax_amount' => $this->tax_amount,
            'total_amount' => $this->total_amount,
            'payment_method' => $this->payment_method,
            'payment_terms' => $this->payment_terms,
            'notes' => $this->notes,
            'terms_and_conditions' => $this->terms_and_conditions,
            'footer_text' => $this->footer_text,
            'template_id' => $this->template_id,
            'template' => new QuoteTemplateResource($this->whenLoaded('template')),
            'site_id' => $this->site_id,
            'site' => $this->whenLoaded('site'),
            'items' => QuoteItemResource::collection($this->whenLoaded('items')),
            'attachments' => $this->getMedia('attachments')->map(function ($media) {
                return [
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
                ];
            })->values()->all(),
            'is_active' => $this->is_active,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}

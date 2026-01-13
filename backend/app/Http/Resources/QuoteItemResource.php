<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuoteItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'quote_id' => $this->quote_id,
            'parent_id' => $this->parent_id,
            'material_id' => $this->material_id,
            'type' => $this->type,
            'code' => $this->code,
            'sort_order' => $this->sort_order,
            'description' => $this->description,
            'unit' => $this->unit,
            'quantity' => $this->quantity,
            'unit_price' => $this->unit_price,
            'hide_unit_price' => $this->hide_unit_price,
            'subtotal' => $this->subtotal,
            'discount_percentage' => $this->discount_percentage,
            'discount_amount' => $this->discount_amount,
            'total' => $this->total,
            'notes' => $this->notes,
            'material' => $this->whenLoaded('material', function () {
                return [
                    'id' => $this->material->id,
                    'code' => $this->material->code,
                    'name' => $this->material->name,
                    'unit' => $this->material->unit,
                    'standard_cost' => $this->material->standard_cost,
                    'category' => $this->material->category,
                ];
            }),
            'children' => QuoteItemResource::collection($this->whenLoaded('children')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}

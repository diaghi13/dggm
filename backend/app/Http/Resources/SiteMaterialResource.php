<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SiteMaterialResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'site_id' => $this->site_id,
            'material_id' => $this->material_id,
            'quote_item_id' => $this->quote_item_id,
            'is_extra' => $this->is_extra,
            'requested_by' => $this->requested_by,
            'requested_at' => $this->requested_at?->toISOString(),
            'extra_reason' => $this->extra_reason,
            'planned_quantity' => $this->planned_quantity,
            'allocated_quantity' => $this->allocated_quantity,
            'delivered_quantity' => $this->delivered_quantity,
            'used_quantity' => $this->used_quantity,
            'returned_quantity' => $this->returned_quantity,
            'planned_unit_cost' => $this->planned_unit_cost,
            'actual_unit_cost' => $this->actual_unit_cost,
            'status' => $this->status?->value,
            'status_label' => $this->status?->label(),
            'status_color' => $this->status?->color(),
            'required_date' => $this->required_date?->toISOString(),
            'delivery_date' => $this->delivery_date?->toISOString(),
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relationships
            'material' => $this->whenLoaded('material', fn () => [
                'id' => $this->material->id,
                'code' => $this->material->code,
                'name' => $this->material->name,
                'unit' => $this->material->unit,
                'product_type' => $this->material->product_type?->value,
                'is_kit' => $this->material->is_kit,
                'is_rentable' => $this->material->is_rentable,
            ]),

            'quote_item' => $this->whenLoaded('quoteItem', fn () => $this->quoteItem ? [
                'id' => $this->quoteItem->id,
                'description' => $this->quoteItem->description,
                'quantity' => $this->quoteItem->quantity,
                'unit_price' => $this->quoteItem->unit_price,
            ] : null),

            'requested_by_user' => $this->whenLoaded('requestedBy', fn () => $this->requestedBy ? [
                'id' => $this->requestedBy->id,
                'name' => $this->requestedBy->name,
                'email' => $this->requestedBy->email,
            ] : null),

            // Calculated fields
            'remaining_quantity' => $this->remaining_quantity,
            'usage_percentage' => $this->usage_percentage,
            'planned_total_cost' => $this->planned_total_cost,
            'actual_total_cost' => $this->actual_total_cost,
            'cost_variance' => $this->cost_variance,
            'cost_variance_percentage' => $this->cost_variance_percentage,
            'is_over_budget' => $this->is_over_budget,
            'is_complete' => $this->is_complete,

            // Pending DDT info
            'pending_ddt' => $this->getPendingDdt(),
        ];
    }

    /**
     * Check if there's a DDT in transit for this material
     */
    private function getPendingDdt(): ?array
    {
        $ddt = \App\Models\Ddt::where('site_id', $this->site_id)
            ->whereIn('status', ['issued', 'in_transit'])
            ->whereHas('items', function ($query) {
                $query->where('material_id', $this->material_id);
            })
            ->first();

        if (! $ddt) {
            return null;
        }

        return [
            'id' => $ddt->id,
            'code' => $ddt->code,
            'status' => $ddt->status->value,
            'ddt_date' => $ddt->ddt_date?->toISOString(),
        ];
    }
}

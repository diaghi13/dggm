<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StockMovementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'material_id' => $this->material_id,
            'warehouse_id' => $this->warehouse_id,
            'type' => $this->type?->value,
            'type_label' => $this->type?->label(),
            'type_color' => $this->type?->color(),
            'quantity' => $this->quantity,
            'unit_cost' => $this->unit_cost,
            'total_value' => $this->total_value,
            'movement_date' => $this->movement_date?->toISOString(),
            'from_warehouse_id' => $this->from_warehouse_id,
            'to_warehouse_id' => $this->to_warehouse_id,
            'site_id' => $this->site_id,
            'supplier_id' => $this->supplier_id,
            'supplier_document' => $this->supplier_document,
            'user_id' => $this->user_id,
            'notes' => $this->notes,
            'reference_document' => $this->reference_document,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            'material' => $this->whenLoaded('material', fn () => [
                'id' => $this->material->id,
                'code' => $this->material->code,
                'name' => $this->material->name,
                'unit' => $this->material->unit,
            ]),

            'warehouse' => $this->whenLoaded('warehouse', fn () => [
                'id' => $this->warehouse->id,
                'code' => $this->warehouse->code,
                'name' => $this->warehouse->name,
            ]),

            'from_warehouse' => $this->whenLoaded('fromWarehouse', fn () => $this->fromWarehouse ? [
                'id' => $this->fromWarehouse->id,
                'code' => $this->fromWarehouse->code,
                'name' => $this->fromWarehouse->name,
            ] : null),

            'to_warehouse' => $this->whenLoaded('toWarehouse', fn () => $this->toWarehouse ? [
                'id' => $this->toWarehouse->id,
                'code' => $this->toWarehouse->code,
                'name' => $this->toWarehouse->name,
            ] : null),

            'site' => $this->whenLoaded('site', fn () => $this->site ? [
                'id' => $this->site->id,
                'code' => $this->site->code,
                'name' => $this->site->name,
            ] : null),

            'supplier' => $this->whenLoaded('supplier', fn () => $this->supplier ? [
                'id' => $this->supplier->id,
                'code' => $this->supplier->code,
                'name' => $this->supplier->name,
            ] : null),

            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
            ]),
        ];
    }
}

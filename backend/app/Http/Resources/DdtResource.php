<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DdtResource extends JsonResource
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
            'type' => $this->type,
            'status' => $this->status,

            // Relationships
            'supplier_id' => $this->supplier_id,
            'supplier' => $this->whenLoaded('supplier', fn () => [
                'id' => $this->supplier->id,
                'name' => $this->supplier->name,
                'code' => $this->supplier->code,
            ]),
            'customer_id' => $this->customer_id,
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer->id,
                'name' => $this->customer->name,
                'code' => $this->customer->code,
            ]),
            'site_id' => $this->site_id,
            'site' => $this->whenLoaded('site', fn () => [
                'id' => $this->site->id,
                'code' => $this->site->code,
                'name' => $this->site->name,
            ]),
            'from_warehouse_id' => $this->from_warehouse_id,
            'from_warehouse' => $this->whenLoaded('fromWarehouse', fn () => [
                'id' => $this->fromWarehouse->id,
                'code' => $this->fromWarehouse->code,
                'name' => $this->fromWarehouse->name,
            ]),
            'to_warehouse_id' => $this->to_warehouse_id,
            'to_warehouse' => $this->whenLoaded('toWarehouse', fn () => [
                'id' => $this->toWarehouse->id,
                'code' => $this->toWarehouse->code,
                'name' => $this->toWarehouse->name,
            ]),

            // DDT Data
            'ddt_number' => $this->ddt_number,
            'ddt_date' => $this->ddt_date,
            'transport_date' => $this->transport_date,
            'delivered_at' => $this->delivered_at,
            'carrier_name' => $this->carrier_name,
            'tracking_number' => $this->tracking_number,

            // Rental
            'rental_start_date' => $this->rental_start_date,
            'rental_end_date' => $this->rental_end_date,
            'rental_actual_return_date' => $this->rental_actual_return_date,
            'parent_ddt_id' => $this->parent_ddt_id,

            // Returns
            'return_reason' => $this->return_reason,
            'return_notes' => $this->return_notes,

            'notes' => $this->notes,

            // Items
            'items' => DdtItemResource::collection($this->whenLoaded('items')),

            // Stock Movements
            'stock_movements_count' => $this->whenLoaded('stockMovements', fn () => $this->stockMovements->count()),

            // User
            'created_by' => $this->created_by,
            'created_by_user' => $this->whenLoaded('createdBy', fn () => [
                'id' => $this->createdBy->id,
                'name' => $this->createdBy->name,
            ]),

            // Computed
            'total_items' => $this->total_items,
            'total_quantity' => $this->total_quantity,
            'can_be_confirmed' => $this->canBeConfirmed(),
            'can_be_cancelled' => $this->canBeCancelled(),
            'is_delivered' => $this->isDelivered(),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'deleted_at' => $this->deleted_at,
        ];
    }
}

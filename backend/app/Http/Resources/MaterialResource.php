<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MaterialResource extends JsonResource
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
            'category' => $this->category,
            'product_type' => $this->product_type?->value,
            'product_type_label' => $this->product_type?->label(),
            'is_kit' => $this->is_kit,
            'is_rentable' => $this->is_rentable,
            'quantity_out_on_rental' => $this->quantity_out_on_rental,
            'unit' => $this->unit,
            'standard_cost' => $this->standard_cost,
            'purchase_price' => $this->purchase_price,
            'markup_percentage' => $this->markup_percentage,
            'sale_price' => $this->sale_price,
            'rental_price_daily' => $this->rental_price_daily,
            'rental_price_weekly' => $this->rental_price_weekly,
            'rental_price_monthly' => $this->rental_price_monthly,
            'barcode' => $this->barcode,
            'qr_code' => $this->qr_code,
            'default_supplier_id' => $this->default_supplier_id,
            'reorder_level' => $this->reorder_level,
            'reorder_quantity' => $this->reorder_quantity,
            'lead_time_days' => $this->lead_time_days,
            'location' => $this->location,
            'notes' => $this->notes,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relationships
            'default_supplier' => $this->whenLoaded('defaultSupplier', fn () => [
                'id' => $this->defaultSupplier->id,
                'code' => $this->defaultSupplier->code,
                'name' => $this->defaultSupplier->name,
            ]),

            // Kit components
            'components' => $this->whenLoaded('components', function () {
                return $this->components->map(function ($component) {
                    return [
                        'id' => $component->id,
                        'component_material_id' => $component->component_material_id,
                        'quantity' => $component->quantity,
                        'component' => [
                            'id' => $component->componentMaterial->id,
                            'code' => $component->componentMaterial->code,
                            'name' => $component->componentMaterial->name,
                            'unit' => $component->componentMaterial->unit,
                            'purchase_price' => $component->componentMaterial->purchase_price,
                        ],
                    ];
                });
            }),

            // Inventory across warehouses
            'inventory' => $this->whenLoaded('inventory', function () {
                return $this->inventory->map(function ($inv) {
                    return [
                        'warehouse_id' => $inv->warehouse_id,
                        'warehouse_name' => $inv->warehouse->name,
                        'quantity_available' => $inv->quantity_available,
                        'quantity_reserved' => $inv->quantity_reserved,
                        'quantity_free' => $inv->quantity_free,
                    ];
                });
            }),

            // Calculated fields
            'total_stock' => $this->when($request->input('include_totals'), $this->total_stock),
            'total_reserved' => $this->when($request->input('include_totals'), $this->total_reserved),
            'available_stock' => $this->when($request->input('include_totals'), $this->available_stock),
            'kit_total_cost' => $this->when($this->is_kit, $this->kit_total_cost),
        ];
    }
}

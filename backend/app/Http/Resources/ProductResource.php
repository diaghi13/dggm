<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
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
            'is_package' => $this->is_package,
            'package_weight' => $this->package_weight,
            'package_volume' => $this->package_volume,
            'package_dimensions' => $this->package_dimensions,
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

            // Composite components
            'components' => $this->whenLoaded('components', function () {
                return $this->components->map(function ($component) {
                    return [
                        'id' => $component->id,
                        'component_product_id' => $component->component_product_id,
                        'quantity' => $component->quantity,
                        'notes' => $component->notes,
                        'component' => [
                            'id' => $component->componentProduct->id,
                            'code' => $component->componentProduct->code,
                            'name' => $component->componentProduct->name,
                            'unit' => $component->componentProduct->unit,
                            'purchase_price' => $component->componentProduct->purchase_price,
                            'product_type' => $component->componentProduct->product_type->value,
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
            'composite_total_cost' => $this->when(
                $this->product_type === \App\Enums\ProductType::COMPOSITE,
                $this->composite_total_cost
            ),
        ];
    }
}

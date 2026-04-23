<?php

namespace App\Data;

use App\Enums\RepairType;
use Spatie\LaravelData\Data;

class CreateRepairOrderData extends Data
{
    public function __construct(
        public int $product_id,
        public int $inventory_id,
        public float $quantity,
        public RepairType $repair_type,
        public ?int $supplier_id = null,
        public ?int $incident_id = null,
        public ?int $inspection_item_id = null,
        public ?string $expected_return_date = null,
        public ?string $quarantine_reason = null,
    ) {}

    public static function rules(): array
    {
        return [
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'inventory_id' => ['required', 'integer', 'exists:inventory,id'],
            'quantity' => ['required', 'numeric', 'min:0.01'],
            'repair_type' => ['required', 'string', 'in:internal,external'],
            'supplier_id' => ['nullable', 'integer', 'exists:suppliers,id'],
            'incident_id' => ['nullable', 'integer', 'exists:project_material_incidents,id'],
            'inspection_item_id' => ['nullable', 'integer', 'exists:rental_return_inspection_items,id'],
            'expected_return_date' => ['nullable', 'date', 'after_or_equal:today'],
            'quarantine_reason' => ['nullable', 'string', 'max:500'],
        ];
    }
}

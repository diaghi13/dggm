<?php

namespace App\Data;

use App\Enums\FinalBalanceItemType;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

class FinalBalanceItemData extends Data
{
    public function __construct(
        public int|Optional $id = new Optional,
        public int|Optional $final_balance_id = new Optional,
        public ?int $parent_id = null,
        public ?int $quote_item_id = null,
        public ?int $project_material_id = null,
        public ?int $project_service_id = null,
        public ?int $project_expense_id = null,
        public ?int $incident_id = null,
        public FinalBalanceItemType|Optional $type = new Optional,

        #[Required, Max(65535)]
        public string $description = '',

        public ?string $code = null,
        public ?string $unit = null,
        public float $quantity = 1,
        public float $unit_price = 0,
        public ?float $cost_price = null,
        public float $discount_percentage = 0,
        public float $subtotal = 0,
        public float $total = 0,
        public bool $is_manual = false,
        public int $sort_order = 0,
        public ?string $notes = null,
    ) {}

    public static function rules(): array
    {
        return [
            'type' => ['required', 'string', 'in:section,material,labor,expense,service,damage,transport,quote_reference,other'],
            'description' => ['required', 'string'],
            'unit' => ['nullable', 'string', 'max:50'],
            'quantity' => ['nullable', 'numeric', 'min:0'],
            'unit_price' => ['nullable', 'numeric', 'min:0'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'discount_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'notes' => ['nullable', 'string'],
            'parent_id' => ['nullable', 'exists:final_balance_items,id'],
            'quote_item_id' => ['nullable', 'exists:quote_items,id'],
            'project_material_id' => ['nullable', 'exists:project_materials,id'],
            'project_service_id' => ['nullable', 'exists:project_services,id'],
            'project_expense_id' => ['nullable', 'exists:project_expenses,id'],
            'incident_id' => ['nullable', 'exists:project_material_incidents,id'],
        ];
    }
}

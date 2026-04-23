<?php

namespace App\Data;

use App\Enums\FinalBalanceItemType;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;

class CreateFinalBalanceItemData extends Data
{
    public function __construct(
        #[Required]
        public FinalBalanceItemType $type,

        #[Required]
        public string $description,

        public ?string $unit = null,
        public float $quantity = 1,
        public float $unit_price = 0,
        public ?float $cost_price = null,
        public float $discount_percentage = 0,
        public ?string $notes = null,
        public ?int $parent_id = null,
        public int $sort_order = 0,
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
            'notes' => ['nullable', 'string'],
            'parent_id' => ['nullable', 'exists:final_balance_items,id'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}

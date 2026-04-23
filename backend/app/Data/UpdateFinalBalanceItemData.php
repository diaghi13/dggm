<?php

namespace App\Data;

use App\Enums\FinalBalanceItemType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

class UpdateFinalBalanceItemData extends Data
{
    public function __construct(
        public FinalBalanceItemType|Optional $type = new Optional,
        public string|Optional $description = new Optional,
        public string|Optional|null $unit = new Optional,
        public float|Optional $quantity = new Optional,
        public float|Optional $unit_price = new Optional,
        public float|Optional|null $cost_price = new Optional,
        public float|Optional $discount_percentage = new Optional,
        public string|Optional|null $notes = new Optional,
        public int|Optional $sort_order = new Optional,
    ) {}

    public static function rules(): array
    {
        return [
            'type' => ['sometimes', 'string', 'in:section,material,labor,expense,service,damage,transport,quote_reference,other'],
            'description' => ['sometimes', 'string'],
            'unit' => ['sometimes', 'nullable', 'string', 'max:50'],
            'quantity' => ['sometimes', 'numeric', 'min:0'],
            'unit_price' => ['sometimes', 'numeric', 'min:0'],
            'cost_price' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'discount_percentage' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'notes' => ['sometimes', 'nullable', 'string'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}

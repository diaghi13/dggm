<?php

namespace App\Data;

use Spatie\LaravelData\Data;

class CreateProjectServiceData extends Data
{
    public function __construct(
        public string $description,
        public float $quantity = 1,
        public float $unit_price = 0,
        public ?float $cost_price = null,
        public string $billing_unit = 'flat',
        public bool $is_from_quote = false,
        public ?int $quote_item_id = null,
        public string $status = 'planned',
        public ?string $notes = null,
        /** @var int[]|null */
        public ?array $worker_ids = null,
    ) {}

    public static function rules(): array
    {
        return [
            'description' => ['required', 'string', 'max:1000'],
            'quantity' => ['nullable', 'numeric', 'min:0'],
            'unit_price' => ['nullable', 'numeric', 'min:0'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'billing_unit' => ['nullable', 'string', 'in:hour,day,flat'],
            'is_from_quote' => ['boolean'],
            'quote_item_id' => ['nullable', 'integer', 'exists:quote_items,id'],
            'status' => ['nullable', 'string', 'in:planned,in_progress,completed,cancelled'],
            'notes' => ['nullable', 'string'],
            'worker_ids' => ['nullable', 'array'],
            'worker_ids.*' => ['integer', 'exists:project_workers,id'],
        ];
    }
}

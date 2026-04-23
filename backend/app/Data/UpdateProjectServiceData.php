<?php

namespace App\Data;

use Spatie\LaravelData\Data;

class UpdateProjectServiceData extends Data
{
    public function __construct(
        public ?string $description = null,
        public ?float $quantity = null,
        public ?float $unit_price = null,
        public ?float $cost_price = null,
        public ?string $billing_unit = null,
        public ?bool $is_from_quote = null,
        public ?int $quote_item_id = null,
        public ?string $status = null,
        public ?string $notes = null,
        /** @var int[]|null $worker_ids null = don't sync, [] = detach all */
        public ?array $worker_ids = null,
    ) {}

    public static function rules(): array
    {
        return [
            'description' => ['nullable', 'string', 'max:1000'],
            'quantity' => ['nullable', 'numeric', 'min:0'],
            'unit_price' => ['nullable', 'numeric', 'min:0'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'billing_unit' => ['nullable', 'string', 'in:hour,day,flat'],
            'is_from_quote' => ['nullable', 'boolean'],
            'quote_item_id' => ['nullable', 'integer', 'exists:quote_items,id'],
            'status' => ['nullable', 'string', 'in:planned,in_progress,completed,cancelled'],
            'notes' => ['nullable', 'string'],
            'worker_ids' => ['nullable', 'array'],
            'worker_ids.*' => ['integer', 'exists:project_workers,id'],
        ];
    }
}

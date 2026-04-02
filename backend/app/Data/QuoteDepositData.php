<?php

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

class QuoteDepositData extends Data
{
    public function __construct(
        public int|Optional $id = new Optional,
        public int $sort_order = 0,
        public string $description = '',
        public ?float $percentage = null,
        public ?float $amount = null,
        public bool $is_fixed_amount = false,
        public ?string $due_date = null,
        public ?string $due_event = null,
    ) {}

    public static function rules(): array
    {
        return [
            'description' => ['required', 'string', 'max:255'],
            'percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'amount' => ['nullable', 'numeric', 'min:0'],
            'is_fixed_amount' => ['boolean'],
            'due_date' => ['nullable', 'date'],
            'due_event' => ['nullable', 'string', 'max:255'],
        ];
    }
}

<?php

namespace App\Data;

use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;

class CreateFinalBalanceData extends Data
{
    public function __construct(
        #[Required, Max(255)]
        public string $title,

        public ?int $project_id = null,
        public ?int $quote_id = null,
        public ?int $customer_id = null,
        public ?string $reference_text = null,
        public ?string $notes = null,
        public float $tax_percentage = 22.0,
        public float $discount_percentage = 0.0,
        public bool $is_partial = false,
    ) {}

    public static function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'project_id' => ['nullable', 'exists:projects,id'],
            'quote_id' => ['nullable', 'exists:quotes,id'],
            'customer_id' => ['nullable', 'exists:customers,id'],
            'reference_text' => ['nullable', 'string', 'max:500'],
            'notes' => ['nullable', 'string'],
            'tax_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'discount_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'is_partial' => ['nullable', 'boolean'],
        ];
    }
}

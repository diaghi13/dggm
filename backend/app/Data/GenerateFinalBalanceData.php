<?php

namespace App\Data;

use Spatie\LaravelData\Data;

class GenerateFinalBalanceData extends Data
{
    public function __construct(
        public ?int $project_id = null,
        public ?int $quote_id = null,
        public ?int $customer_id = null,
        public ?string $title = null,
        public ?string $reference_text = null,
        public ?string $notes = null,
        public ?float $tax_percentage = null,
        public ?float $discount_percentage = null,
        public bool $is_partial = false,
        public bool $include_quote_reference = true,
        public bool $include_extra_materials = true,
        public bool $include_services = true,
        public bool $include_expenses = true,
        public bool $include_damages = true,
        public bool $include_overtime = true,
    ) {}

    public static function rules(): array
    {
        return [
            'project_id' => ['nullable', 'exists:projects,id'],
            'quote_id' => ['nullable', 'exists:quotes,id'],
            'customer_id' => ['nullable', 'exists:customers,id'],
            'title' => ['nullable', 'string', 'max:255'],
            'reference_text' => ['nullable', 'string', 'max:500'],
            'notes' => ['nullable', 'string'],
            'tax_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'discount_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'is_partial' => ['nullable', 'boolean'],
            'include_quote_reference' => ['nullable', 'boolean'],
            'include_extra_materials' => ['nullable', 'boolean'],
            'include_services' => ['nullable', 'boolean'],
            'include_expenses' => ['nullable', 'boolean'],
            'include_damages' => ['nullable', 'boolean'],
            'include_overtime' => ['nullable', 'boolean'],
        ];
    }
}

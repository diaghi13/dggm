<?php

namespace App\Data;

use Spatie\LaravelData\Attributes\WithTransformer;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;
use Spatie\LaravelData\Transformers\DateTimeInterfaceTransformer;

class UpdateFinalBalanceData extends Data
{
    public function __construct(
        public string|Optional $title = new Optional,
        public int|Optional|null $project_id = new Optional,
        public int|Optional|null $quote_id = new Optional,
        public int|Optional|null $customer_id = new Optional,
        public string|Optional|null $reference_text = new Optional,
        public string|Optional|null $notes = new Optional,
        public float|Optional $tax_percentage = new Optional,
        public float|Optional $discount_percentage = new Optional,
        public bool|Optional $is_partial = new Optional,
        public bool|Optional $is_manual_override = new Optional,

        #[WithTransformer(DateTimeInterfaceTransformer::class, format: 'Y-m-d')]
        public \Carbon\Carbon|Optional|null $issue_date = new Optional,
    ) {}

    public static function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'project_id' => ['sometimes', 'nullable', 'exists:projects,id'],
            'quote_id' => ['sometimes', 'nullable', 'exists:quotes,id'],
            'customer_id' => ['sometimes', 'nullable', 'exists:customers,id'],
            'reference_text' => ['sometimes', 'nullable', 'string', 'max:500'],
            'notes' => ['sometimes', 'nullable', 'string'],
            'tax_percentage' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'discount_percentage' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'is_partial' => ['sometimes', 'boolean'],
            'is_manual_override' => ['sometimes', 'boolean'],
            'issue_date' => ['sometimes', 'nullable', 'date'],
        ];
    }
}

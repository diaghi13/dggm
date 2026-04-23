<?php

namespace App\Data;

use App\Enums\FinalBalanceStatus;
use Spatie\LaravelData\Attributes\DataCollectionOf;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\WithTransformer;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\DataCollection;
use Spatie\LaravelData\Lazy;
use Spatie\LaravelData\Optional;
use Spatie\LaravelData\Transformers\DateTimeInterfaceTransformer;

class FinalBalanceData extends Data
{
    public function __construct(
        public int|Optional $id = new Optional,

        #[Required, Max(255)]
        public string $title = '',

        public ?int $project_id = null,
        public ?int $quote_id = null,
        public ?int $customer_id = null,
        public string|Optional $code = new Optional,
        public ?string $reference_text = null,
        public ?string $notes = null,
        public FinalBalanceStatus|Optional $status = new Optional,
        public bool $is_partial = false,
        public bool $is_manual_override = false,
        public float $subtotal = 0,
        public float $discount_percentage = 0,
        public float $discount_amount = 0,
        public float $tax_percentage = 22,
        public float $tax_amount = 0,
        public float $total_amount = 0,

        #[WithTransformer(DateTimeInterfaceTransformer::class, format: 'Y-m-d')]
        public ?\Carbon\Carbon $issue_date = null,

        public int|Optional|null $created_by_user_id = new Optional,
        public int|Optional|null $finalized_by_user_id = new Optional,
        public int|Optional|null $approved_by_user_id = new Optional,

        // Relations (output only)
        public string|Lazy|Optional $project_name = new Optional,
        public string|Lazy|Optional $customer_name = new Optional,

        #[DataCollectionOf(FinalBalanceItemData::class)]
        public DataCollection|Lazy|Optional $items = new Optional,
    ) {}

    public static function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'project_id' => ['nullable', 'exists:projects,id'],
            'quote_id' => ['nullable', 'exists:quotes,id'],
            'customer_id' => ['nullable', 'exists:customers,id'],
            'reference_text' => ['nullable', 'string', 'max:500'],
            'notes' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:draft,finalized,approved'],
            'is_partial' => ['nullable', 'boolean'],
            'is_manual_override' => ['nullable', 'boolean'],
            'subtotal' => ['nullable', 'numeric', 'min:0'],
            'discount_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'tax_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'tax_amount' => ['nullable', 'numeric', 'min:0'],
            'total_amount' => ['nullable', 'numeric', 'min:0'],
            'issue_date' => ['nullable', 'date'],
        ];
    }
}

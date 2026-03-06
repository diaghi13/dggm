<?php

namespace App\Data;

use App\Models\SubrentalCostHistory;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

class SubrentalCostHistoryData extends Data
{
    public function __construct(
        public int|Optional $id,

        #[Required]
        public int $product_id,

        #[Required]
        public int $supplier_id,

        public ?int $quote_id,

        #[Required, Min(0)]
        public float $actual_cost,

        #[Required, Min(0)]
        public float $duration_days,

        public ?float $margin_generated,

        #[Required]
        public string $date,

        public ?string $created_at = null,

        public ?string $updated_at = null,
    ) {}

    public static function rules(): array
    {
        return [
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'supplier_id' => ['required', 'integer', 'exists:suppliers,id'],
            'quote_id' => ['nullable', 'integer', 'exists:quotes,id'],
            'actual_cost' => ['required', 'numeric', 'min:0'],
            'duration_days' => ['required', 'numeric', 'min:0'],
            'margin_generated' => ['nullable', 'numeric'],
            'date' => ['required', 'date'],
        ];
    }

    public static function fromModel(SubrentalCostHistory $model): self
    {
        return new self(
            id: $model->id,
            product_id: $model->product_id,
            supplier_id: $model->supplier_id,
            quote_id: $model->quote_id,
            actual_cost: (float) $model->actual_cost,
            duration_days: (float) $model->duration_days,
            margin_generated: $model->margin_generated !== null ? (float) $model->margin_generated : null,
            date: $model->date->toDateString(),
            created_at: $model->created_at?->toIso8601String(),
            updated_at: $model->updated_at?->toIso8601String(),
        );
    }
}

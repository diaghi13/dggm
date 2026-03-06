<?php

namespace App\Data;

use App\Models\ProductSubrentalSupplier;
use Spatie\LaravelData\Attributes\Validation\Exists;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Lazy;
use Spatie\LaravelData\Optional;

class ProductSubrentalSupplierData extends Data
{
    public function __construct(
        public int|Optional $id,

        #[Required]
        #[Exists('products', 'id')]
        public int $product_id,

        #[Required]
        #[Exists('suppliers', 'id')]
        public int $supplier_id,

        #[Required]
        #[Min(0)]
        public float $day_rate,

        #[Min(0)]
        #[Max(5)]
        public float $reliability_score = 3.0,

        public bool $is_preferred = false,

        public ?string $last_updated = null,

        public ?string $notes = null,

        // Timestamps
        public string|Optional $created_at = new Optional,
        public string|Optional $updated_at = new Optional,

        // Lazy relationships (loaded only when Eloquent relation is loaded)
        public ProductData|Lazy|null $product = null,
        public SupplierData|Lazy|null $supplier = null,
    ) {}

    /**
     * Create from Eloquent model with proper Lazy handling.
     */
    public static function fromModel(ProductSubrentalSupplier $record): self
    {
        return new self(
            id: $record->id,
            product_id: $record->product_id,
            supplier_id: $record->supplier_id,
            day_rate: (float) $record->day_rate,
            reliability_score: (float) $record->reliability_score,
            is_preferred: $record->is_preferred,
            last_updated: $record->last_updated?->toDateString(),
            notes: $record->notes,
            created_at: $record->created_at?->toIsoString() ?? '',
            updated_at: $record->updated_at?->toIsoString() ?? '',
            product: Lazy::whenLoaded('product', $record, fn () => ProductData::fromModel($record->product)),
            supplier: Lazy::whenLoaded('supplier', $record, fn () => SupplierData::from($record->supplier)),
        );
    }
}

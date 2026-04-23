<?php

namespace App\Data;

use App\Enums\AvailabilityResolution;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;

class ResolveAvailabilityItemData extends Data
{
    public function __construct(
        #[Required]
        #[Enum(AvailabilityResolution::class)]
        public AvailabilityResolution $resolution,

        #[Nullable]
        public ?int $subrental_supplier_id,

        #[Nullable]
        public ?float $subrental_estimated_cost,

        #[Nullable]
        public ?string $notes,
    ) {}
}

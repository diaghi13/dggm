<?php

namespace App\Data;

use Spatie\LaravelData\Attributes\Validation\Exists;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

class DiscountFamilyData extends Data
{
    public function __construct(
        public int|Optional $id,

        #[Exists('suppliers', 'id')]
        public int $supplier_id,

        #[Max(50)]
        public string $code,

        #[Max(255)]
        public string $name,

        #[Max(1000)]
        public ?string $description,

        #[Min(0), Max(100)]
        public float $discount_1,

        #[Min(0), Max(100)]
        public float $discount_2,

        #[Min(0), Max(100)]
        public float $discount_3,

        public bool $is_active,
    ) {}
}

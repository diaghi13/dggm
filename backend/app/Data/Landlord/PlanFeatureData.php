<?php

declare(strict_types=1);

namespace App\Data\Landlord;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

class PlanFeatureData extends Data
{
    public function __construct(
        public int|Optional $id,
        public int|Optional $plan_id,
        public string $feature_key,
        public ?float $price,
        public ?float $price_yearly,
        public ?array $limits,
    ) {}
}

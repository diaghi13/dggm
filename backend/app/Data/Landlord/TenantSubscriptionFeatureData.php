<?php

declare(strict_types=1);

namespace App\Data\Landlord;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

class TenantSubscriptionFeatureData extends Data
{
    public function __construct(
        public int|Optional $id,
        public string $feature_key,
        public ?float $price_at_purchase,
    ) {}
}

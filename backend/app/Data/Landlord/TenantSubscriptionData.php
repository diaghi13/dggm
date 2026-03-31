<?php

declare(strict_types=1);

namespace App\Data\Landlord;

use Spatie\LaravelData\Attributes\DataCollectionOf;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\DataCollection;
use Spatie\LaravelData\Lazy;
use Spatie\LaravelData\Optional;

class TenantSubscriptionData extends Data
{
    public function __construct(
        public int|Optional $id,
        public string $tenant_id,
        public ?int $plan_id,
        public string $status,
        public ?string $starts_at,
        public ?string $ends_at,
        public ?string $trial_ends_at,
        public string $billing_cycle,
        public ?string $renews_at,
        public ?string $notes,
        public string|Optional $created_at,

        /** Plan relationship (loaded lazily) */
        public PlanData|Lazy|null $plan = null,

        /** Selected addons (subscription features) */
        #[DataCollectionOf(TenantSubscriptionFeatureData::class)]
        public DataCollection|Lazy|null $addons = null,

        /** Total price = plan base price + sum of addon prices */
        public ?float $total_price = null,
    ) {}
}

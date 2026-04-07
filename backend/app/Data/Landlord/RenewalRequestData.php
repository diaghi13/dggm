<?php

declare(strict_types=1);

namespace App\Data\Landlord;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Lazy;
use Spatie\LaravelData\Optional;

class RenewalRequestData extends Data
{
    public function __construct(
        public int|Optional $id,
        public string $tenant_id,
        public int $tenant_subscription_id,
        public string $type,
        public string $status,
        public ?string $requested_by_global_user_id,
        public ?array $addons,
        public ?int $target_plan_id,
        public ?float $prorated_amount,
        public ?int $cycle_days_total,
        public ?int $cycle_days_remaining,
        public ?string $billing_cycle,
        public ?string $notes,
        public ?string $admin_notes,
        public ?string $processed_at,
        public ?string $processed_by_global_user_id,
        public string|Optional $created_at = new Optional,

        /** Subscription relationship (loaded lazily) */
        public TenantSubscriptionData|Lazy|null $subscription = null,
    ) {}
}

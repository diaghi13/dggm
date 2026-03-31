<?php

declare(strict_types=1);

namespace App\Data\Landlord;

use App\Enums\BootstrapStatus;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Lazy;
use Spatie\LaravelData\Optional;

class TenantData extends Data
{
    public function __construct(
        public string|Optional $id,

        #[Required, Max(255)]
        public string $name,

        public ?string $slug,

        public string|Optional $created_at,

        public ?BootstrapStatus $bootstrap_status = null,

        /** Subscription relationship (loaded lazily) */
        public TenantSubscriptionData|Lazy|null $subscription = null,
    ) {}
}

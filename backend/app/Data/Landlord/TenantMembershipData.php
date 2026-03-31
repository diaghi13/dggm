<?php

declare(strict_types=1);

namespace App\Data\Landlord;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

class TenantMembershipData extends Data
{
    public function __construct(
        public int|Optional $id,
        public string $global_user_id,
        public string $tenant_id,
        public string $role,
        public string $status,
        public string|Optional $created_at,
    ) {}
}

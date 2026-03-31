<?php

declare(strict_types=1);

namespace App\Data\Landlord;

use Spatie\LaravelData\Data;

class TenantOverviewItemData extends Data
{
    public function __construct(
        public string $tenant_id,
        public string $tenant_name,
        public string $role,
        public ?int $worker_id,
        public int $projects_count,
    ) {}
}

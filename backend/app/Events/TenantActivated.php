<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\Landlord\GlobalUser;
use App\Models\Tenant;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TenantActivated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Tenant $tenant,
        public readonly GlobalUser $adminUser,
    ) {}
}

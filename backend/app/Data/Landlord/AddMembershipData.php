<?php

declare(strict_types=1);

namespace App\Data\Landlord;

use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;

class AddMembershipData extends Data
{
    public function __construct(
        #[Required]
        public string $tenant_id,

        public string $role = 'admin',
    ) {}
}

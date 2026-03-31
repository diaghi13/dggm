<?php

namespace App\Events;

use App\Models\Landlord\GlobalUser;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GlobalUserUpdated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly GlobalUser $globalUser,
        public readonly array $changedFields,
    ) {}
}

<?php

declare(strict_types=1);

namespace App\Models\Landlord;

use Laravel\Sanctum\PersonalAccessToken;

class LandlordPersonalAccessToken extends PersonalAccessToken
{
    protected $connection = 'landlord';

    protected $table = 'personal_access_tokens';
}

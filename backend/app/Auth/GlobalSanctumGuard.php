<?php

declare(strict_types=1);

namespace App\Auth;

use App\Models\Landlord\LandlordPersonalAccessToken;
use Illuminate\Http\Request;
use Laravel\Sanctum\Guard as SanctumGuard;
use Laravel\Sanctum\Sanctum;

/**
 * Sanctum guard variant that always uses LandlordPersonalAccessToken for token
 * lookup. This allows GlobalUser tokens (stored in the landlord DB) to be
 * authenticated independently from tenant user tokens (stored in each tenant DB).
 */
class GlobalSanctumGuard extends SanctumGuard
{
    public function __invoke(Request $request): mixed
    {
        // Temporarily use LandlordPersonalAccessToken for this lookup, then restore.
        $previousModel = Sanctum::$personalAccessTokenModel;
        Sanctum::usePersonalAccessTokenModel(LandlordPersonalAccessToken::class);

        try {
            return parent::__invoke($request);
        } finally {
            Sanctum::usePersonalAccessTokenModel($previousModel);
        }
    }
}

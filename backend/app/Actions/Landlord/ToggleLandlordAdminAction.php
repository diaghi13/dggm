<?php

declare(strict_types=1);

namespace App\Actions\Landlord;

use App\Models\Landlord\GlobalUser;

class ToggleLandlordAdminAction
{
    public function execute(GlobalUser $user): GlobalUser
    {
        $user->update(['is_landlord_admin' => ! $user->is_landlord_admin]);

        return $user->fresh();
    }
}

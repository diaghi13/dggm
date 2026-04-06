<?php

namespace App\Actions\EmailAccount;

use App\Models\EmailAccount;
use Illuminate\Support\Facades\DB;

class DeleteEmailAccountAction
{
    public function execute(EmailAccount $account): void
    {
        DB::transaction(function () use ($account) {
            $wasDefault = $account->is_default;
            $account->delete();

            if ($wasDefault) {
                EmailAccount::active()->first()?->update(['is_default' => true]);
            }
        });
    }
}

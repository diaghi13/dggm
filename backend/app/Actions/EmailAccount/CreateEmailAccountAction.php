<?php

namespace App\Actions\EmailAccount;

use App\Data\EmailAccountData;
use App\Models\EmailAccount;
use Illuminate\Support\Facades\DB;

class CreateEmailAccountAction
{
    public function execute(EmailAccountData $data): EmailAccount
    {
        return DB::transaction(function () use ($data) {
            if ($data->is_default) {
                EmailAccount::query()->update(['is_default' => false]);
            }

            return EmailAccount::create($data->except('id')->toArray());
        });
    }
}

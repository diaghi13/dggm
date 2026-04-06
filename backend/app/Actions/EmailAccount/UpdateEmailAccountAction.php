<?php

namespace App\Actions\EmailAccount;

use App\Data\EmailAccountData;
use App\Models\EmailAccount;
use Illuminate\Support\Facades\DB;

class UpdateEmailAccountAction
{
    public function execute(EmailAccount $account, EmailAccountData $data): EmailAccount
    {
        return DB::transaction(function () use ($account, $data) {
            if ($data->is_default && ! $account->is_default) {
                EmailAccount::query()->where('id', '!=', $account->id)->update(['is_default' => false]);
            }

            $updateData = $data->except('id')->toArray();

            // Do not overwrite password if not sent
            if (empty($updateData['smtp_password'])) {
                unset($updateData['smtp_password']);
            }

            // Never overwrite OAuth tokens from input (managed separately)
            unset($updateData['oauth_access_token'], $updateData['oauth_refresh_token']);

            $account->update($updateData);

            return $account->fresh();
        });
    }
}

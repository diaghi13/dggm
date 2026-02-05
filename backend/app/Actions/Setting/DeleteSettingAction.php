<?php

namespace App\Actions\Setting;

use App\Events\SettingDeleted;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;

class DeleteSettingAction
{
    public function execute(Setting $setting): bool
    {
        return DB::transaction(function () use ($setting) {
            $settingId = $setting->id;
            $settingKey = $setting->key;

            $deleted = $setting->delete();

            if ($deleted) {
                SettingDeleted::dispatch($settingId, $settingKey, [
                    'user_id' => auth()->id(),
                    'ip_address' => request()->ip(),
                ]);
            }

            return $deleted;
        });
    }
}

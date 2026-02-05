<?php

namespace App\Actions\Setting;

use App\Data\SettingData;
use App\Events\SettingCreated;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;

class CreateSettingAction
{
    public function execute(SettingData $data): Setting
    {
        return DB::transaction(function () use ($data) {
            $setting = new Setting;
            $setting->key = $data->key;
            $setting->group = $data->group;
            $setting->user_id = $data->user_id;
            $setting->is_public = $data->is_public;
            $setting->description = $data->description;

            // Use helper to set typed value
            $setting->setTypedValue($data->value);

            $setting->save();

            SettingCreated::dispatch($setting, [
                'user_id' => auth()->id(),
                'ip_address' => request()->ip(),
            ]);

            return $setting;
        });
    }
}

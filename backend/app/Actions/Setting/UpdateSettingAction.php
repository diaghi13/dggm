<?php

namespace App\Actions\Setting;

use App\Data\SettingData;
use App\Events\SettingUpdated;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;

class UpdateSettingAction
{
    public function execute(Setting $setting, SettingData $data): Setting
    {
        return DB::transaction(function () use ($setting, $data) {
            $setting->key = $data->key;
            $setting->group = $data->group;
            $setting->user_id = $data->user_id;
            $setting->is_public = $data->is_public;
            $setting->description = $data->description;

            // Preserve existing type and convert value accordingly
            $existingType = $setting->type;
            $value = $data->value;

            switch ($existingType) {
                case 'boolean':
                    // Handle string representations of boolean
                    if (is_string($value)) {
                        $value = filter_var($value, FILTER_VALIDATE_BOOLEAN);
                    }
                    $setting->value = $value ? '1' : '0';
                    break;

                case 'number':
                    $setting->value = (string) $value;
                    break;

                case 'json':
                    $setting->value = is_string($value) ? $value : json_encode($value);
                    break;

                case 'email':
                case 'url':
                case 'color':
                case 'date':
                case 'datetime':
                case 'file':
                case 'enum':
                case 'string':
                default:
                    $setting->value = (string) $value;
                    break;
            }

            $setting->save();

            SettingUpdated::dispatch($setting, [
                'user_id' => auth()->id(),
                'ip_address' => request()->ip(),
            ]);

            return $setting;
        });
    }
}

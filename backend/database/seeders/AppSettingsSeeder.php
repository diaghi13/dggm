<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class AppSettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            [
                'key' => 'app.setup_completed',
                'value' => '0',
                'type' => 'boolean',
                'group' => 'app',
                'is_public' => true,
                'description' => 'Indica se il wizard di configurazione iniziale è stato completato',
                'order' => 1,
            ],
        ];

        foreach ($settings as $setting) {
            Setting::firstOrCreate(
                ['key' => $setting['key'], 'user_id' => null],
                $setting
            );
        }
    }
}

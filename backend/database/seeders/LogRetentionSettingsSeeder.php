<?php

namespace Database\Seeders;

use App\Models\Landlord\LandlordSetting;
use Illuminate\Database\Seeder;

class LogRetentionSettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            [
                'key' => 'logs.system_error_retention_days',
                'value' => '30',
                'description' => 'Giorni conservazione errori sistema',
            ],
            [
                'key' => 'logs.email_log_retention_days',
                'value' => '90',
                'description' => 'Giorni conservazione log email',
            ],
            [
                'key' => 'logs.failed_jobs_retention_days',
                'value' => '30',
                'description' => 'Giorni conservazione job falliti',
            ],
        ];

        foreach ($settings as $setting) {
            LandlordSetting::updateOrCreate(
                ['key' => $setting['key']],
                [
                    'value' => $setting['value'],
                    'description' => $setting['description'],
                ]
            );
        }
    }
}

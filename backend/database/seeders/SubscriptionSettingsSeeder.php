<?php

namespace Database\Seeders;

use App\Models\Landlord\LandlordSetting;
use Illuminate\Database\Seeder;

class SubscriptionSettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            [
                'key' => 'subscription.grace_period_days',
                'value' => '7',
                'description' => 'Giorni di grazia dopo la scadenza prima della sospensione automatica',
            ],
            [
                'key' => 'subscription.banner_days_before',
                'value' => '14',
                'description' => 'Giorni prima della scadenza per mostrare il banner di avviso nel tenant',
            ],
            [
                'key' => 'subscription.reminder_days_monthly',
                'value' => '7,3,2,1',
                'description' => 'Giorni prima della scadenza per inviare reminder (abbonamento mensile), separati da virgola',
            ],
            [
                'key' => 'subscription.reminder_days_yearly',
                'value' => '30,14,7,3,1',
                'description' => 'Giorni prima della scadenza per inviare reminder (abbonamento annuale), separati da virgola',
            ],
            [
                'key' => 'subscription.reminder_days_trial',
                'value' => '3,1',
                'description' => 'Giorni prima della scadenza per inviare reminder durante il trial, separati da virgola',
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

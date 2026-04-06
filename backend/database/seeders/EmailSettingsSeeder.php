<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EmailSettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            ['key' => 'email.document_sender.quote', 'description' => 'Account email per preventivi', 'type' => 'string', 'order' => 1, 'default_value' => null],
            ['key' => 'email.document_sender.invoice', 'description' => 'Account email per fatture', 'type' => 'string', 'order' => 2, 'default_value' => null],
            ['key' => 'email.document_sender.ddt', 'description' => 'Account email per DDT', 'type' => 'string', 'order' => 3, 'default_value' => null],
            ['key' => 'email.document_sender.invitation', 'description' => 'Account email per inviti', 'type' => 'string', 'order' => 4, 'default_value' => null],
            ['key' => 'email.signature', 'description' => 'Firma email globale del tenant', 'type' => 'string', 'order' => 5, 'default_value' => null],
        ];

        foreach ($settings as $setting) {
            $exists = DB::table('settings')
                ->where('key', $setting['key'])
                ->whereNull('user_id')
                ->exists();

            if ($exists) {
                DB::table('settings')
                    ->where('key', $setting['key'])
                    ->whereNull('user_id')
                    ->update([
                        'type' => $setting['type'],
                        'group' => 'email',
                        'description' => $setting['description'],
                        'order' => $setting['order'],
                        'default_value' => $setting['default_value'],
                        'updated_at' => now(),
                    ]);
            } else {
                DB::table('settings')->insert([
                    'key' => $setting['key'],
                    'user_id' => null,
                    'value' => null,
                    'type' => $setting['type'],
                    'group' => 'email',
                    'description' => $setting['description'],
                    'order' => $setting['order'],
                    'default_value' => $setting['default_value'],
                    'is_public' => false,
                    'is_feature_flag' => false,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}

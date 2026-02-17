<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CompanySettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            ['key' => 'company.name',        'description' => 'Ragione Sociale',     'type' => 'string', 'order' => 1],
            ['key' => 'company.vat',         'description' => 'Partita IVA',         'type' => 'string', 'order' => 2],
            ['key' => 'company.fiscal_code', 'description' => 'Codice Fiscale',      'type' => 'string', 'order' => 3],
            ['key' => 'company.address',     'description' => 'Indirizzo',           'type' => 'string', 'order' => 4],
            ['key' => 'company.postal_code', 'description' => 'CAP',                 'type' => 'string', 'order' => 5],
            ['key' => 'company.city',        'description' => 'Città',               'type' => 'string', 'order' => 6],
            ['key' => 'company.province',    'description' => 'Provincia',           'type' => 'string', 'order' => 7],
            ['key' => 'company.country',     'description' => 'Paese',               'type' => 'string', 'order' => 8, 'default_value' => 'IT'],
            ['key' => 'company.phone',       'description' => 'Telefono principale', 'type' => 'string', 'order' => 9],
            ['key' => 'company.email',       'description' => 'Email principale',    'type' => 'email',  'order' => 10],
            ['key' => 'company.website',     'description' => 'Sito web',            'type' => 'url',    'order' => 11],
            ['key' => 'company.stamp',       'description' => 'Timbro e Firma',      'type' => 'string', 'order' => 12],
            ['key' => 'company.sigla',           'description' => 'Sigla aziendale',       'type' => 'string', 'order' => 13],
            ['key' => 'company.quote_template',  'description' => 'Template preventivi',   'type' => 'string', 'order' => 14, 'default_value' => 'modern'],
        ];

        // Remove deprecated keys
        DB::table('settings')->where('key', 'company.signature')->whereNull('user_id')->delete();

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
                        'group' => 'company',
                        'description' => $setting['description'],
                        'order' => $setting['order'],
                        'default_value' => $setting['default_value'] ?? null,
                        'updated_at' => now(),
                    ]);
            } else {
                DB::table('settings')->insert([
                    'key' => $setting['key'],
                    'user_id' => null,
                    'value' => null,
                    'type' => $setting['type'],
                    'group' => 'company',
                    'description' => $setting['description'],
                    'order' => $setting['order'],
                    'default_value' => $setting['default_value'] ?? null,
                    'is_public' => false,
                    'is_feature_flag' => false,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}

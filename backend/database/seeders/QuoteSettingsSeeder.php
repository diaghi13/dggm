<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class QuoteSettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // Numerazione
            ['key' => 'quotes.code_prefix',                            'description' => 'Prefisso codice preventivo',                 'type' => 'string',  'order' => 1,  'default_value' => 'PREV'],
            ['key' => 'quotes.code_format',                            'description' => 'Formato codice preventivo',                  'type' => 'string',  'order' => 2,  'default_value' => '{prefix}-{year}-{number:4}'],
            // Validità
            ['key' => 'quotes.default_validity_days',                  'description' => 'Giorni di validità predefiniti',             'type' => 'number',  'order' => 3,  'default_value' => '30'],
            // Impostazioni PDF default
            ['key' => 'quotes.show_unit_prices_by_default',            'description' => 'Mostra prezzi unitari di default',           'type' => 'boolean', 'order' => 4,  'default_value' => '1'],
            ['key' => 'quotes.show_product_codes_by_default',          'description' => 'Mostra codici prodotto di default',          'type' => 'boolean', 'order' => 5,  'default_value' => '1'],
            ['key' => 'quotes.show_vat_by_default',                    'description' => 'Mostra aliquota IVA di default',             'type' => 'boolean', 'order' => 6,  'default_value' => '1'],
            ['key' => 'quotes.show_section_totals_by_default',         'description' => 'Mostra totali di sezione di default',        'type' => 'boolean', 'order' => 7,  'default_value' => '1'],
            ['key' => 'quotes.vat_included_in_prices_by_default',      'description' => 'Prezzi IVA inclusa di default',              'type' => 'boolean', 'order' => 8,  'default_value' => '0'],
            ['key' => 'quotes.tax_included_by_default',                'description' => 'Totale IVA inclusa di default',              'type' => 'boolean', 'order' => 9,  'default_value' => '0'],
            ['key' => 'quotes.include_terms_and_conditions_by_default', 'description' => 'Includi condizioni generali di default',    'type' => 'boolean', 'order' => 10, 'default_value' => '1'],
            ['key' => 'quotes.show_document_separator_page',            'description' => 'Mostra pagina separatrice prima degli allegati prodotto nel PDF', 'type' => 'boolean', 'order' => 11, 'default_value' => '1'],
            // Testi predefiniti
            ['key' => 'quotes.default_notes',                          'description' => 'Note predefinite preventivo',                'type' => 'string',  'order' => 12, 'default_value' => null],
            ['key' => 'quotes.terms_and_conditions_template',          'description' => 'Condizioni generali predefinite',            'type' => 'string',  'order' => 13, 'default_value' => null],
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
                        'group' => 'quotes',
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
                    'group' => 'quotes',
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

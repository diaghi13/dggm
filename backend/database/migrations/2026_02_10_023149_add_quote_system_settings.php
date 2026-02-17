<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Insert default quote system settings
        $settings = [
            // Pricing defaults
            [
                'key' => 'pricing.default_vat_rate',
                'value' => '22',
                'type' => 'number',
                'description' => 'Aliquota IVA predefinita in percentuale',
                'group' => 'pricing',
                'is_public' => true,
                'user_id' => null,
            ],

            // Quote defaults
            [
                'key' => 'quotes.default_validity_days',
                'value' => '30',
                'type' => 'number',
                'description' => 'Giorni di validità predefiniti per i preventivi',
                'group' => 'quotes',
                'is_public' => true,
                'user_id' => null,
            ],

            [
                'key' => 'quotes.terms_and_conditions_template',
                'value' => $this->getDefaultTermsAndConditionsTemplate(),
                'type' => 'text',
                'description' => 'Template predefinito per termini e condizioni',
                'group' => 'quotes',
                'is_public' => true,
                'user_id' => null,
            ],

            // Quote display options
            [
                'key' => 'quotes.show_product_codes_by_default',
                'value' => '1',
                'type' => 'boolean',
                'description' => 'Mostra codici prodotto per default nei nuovi preventivi',
                'group' => 'quotes',
                'is_public' => true,
                'user_id' => null,
            ],

            [
                'key' => 'quotes.show_vat_by_default',
                'value' => '1',
                'type' => 'boolean',
                'description' => 'Mostra IVA per default nei nuovi preventivi',
                'group' => 'quotes',
                'is_public' => true,
                'user_id' => null,
            ],

            [
                'key' => 'quotes.vat_included_in_prices_by_default',
                'value' => '0',
                'type' => 'boolean',
                'description' => 'Prezzi includono IVA per default nei nuovi preventivi',
                'group' => 'quotes',
                'is_public' => true,
                'user_id' => null,
            ],
        ];

        foreach ($settings as $setting) {
            DB::table('settings')->updateOrInsert(
                ['key' => $setting['key'], 'user_id' => null],
                array_merge($setting, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove quote system settings
        DB::table('settings')->whereIn('key', [
            'pricing.default_vat_rate',
            'quotes.default_validity_days',
            'quotes.terms_and_conditions_template',
            'quotes.show_product_codes_by_default',
            'quotes.show_vat_by_default',
            'quotes.vat_included_in_prices_by_default',
        ])->delete();
    }

    /**
     * Get default terms and conditions template.
     */
    private function getDefaultTermsAndConditionsTemplate(): string
    {
        return <<<'EOT'
TERMINI E CONDIZIONI

1. VALIDITÀ DELL'OFFERTA
Il presente preventivo è valido per {validity_days} giorni dalla data di emissione.

2. PAGAMENTO
Le modalità di pagamento concordate sono: {payment_terms}.
{deposit_info}

3. TEMPI DI ESECUZIONE
{work_timeline}

4. GARANZIA
{warranty_info}

5. ESCLUSIONI
- Opere edili e murarie non espressamente indicate
- Smaltimento materiali di risulta
- Eventuali permessi e autorizzazioni comunali

6. VARIAZIONI
Eventuali modifiche al progetto concordato saranno oggetto di preventivo supplementare.

7. SOSPENSIONI
In caso di sospensione dei lavori per causa imputabile al committente, si riserva il diritto di richiedere il pagamento delle opere già eseguite.

8. FORO COMPETENTE
Per qualsiasi controversia è competente il Foro di {company_location}.
EOT;
    }
};

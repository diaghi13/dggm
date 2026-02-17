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
        $settings = [
            // Quotes group (existing group with other settings)
            [
                'key' => 'quotes.code_prefix',
                'value' => 'PREV',
                'type' => 'string',
                'group' => 'quotes',
                'is_public' => false,
                'description' => 'Prefix for quote codes (e.g., PREV-2026-0001)',
                'validation_rules' => json_encode(['required', 'string', 'max:10', 'alpha_dash']),
            ],
            [
                'key' => 'quotes.code_format',
                'value' => '{prefix}-{year}-{number:4}',
                'type' => 'string',
                'group' => 'quotes',
                'is_public' => false,
                'description' => 'Format for quote codes. Available placeholders: {prefix}, {year}, {date}, {number:X}',
            ],

            // Products group (new, for future product-related settings)
            [
                'key' => 'products.code_prefix',
                'value' => 'PRD',
                'type' => 'string',
                'group' => 'products',
                'is_public' => false,
                'description' => 'Prefix for product codes (e.g., PRD-00001)',
                'validation_rules' => json_encode(['required', 'string', 'max:10', 'alpha_dash']),
            ],
            [
                'key' => 'products.code_format',
                'value' => '{prefix}-{number:5}',
                'type' => 'string',
                'group' => 'products',
                'is_public' => false,
                'description' => 'Format for product codes. Available placeholders: {prefix}, {year}, {date}, {number:X}',
            ],

            // Warehouse group (existing group)
            [
                'key' => 'warehouse.ddt_code_prefix',
                'value' => 'DDT',
                'type' => 'string',
                'group' => 'warehouse',
                'is_public' => false,
                'description' => 'Prefix for DDT (transport document) codes (e.g., DDT-2026-0001)',
                'validation_rules' => json_encode(['required', 'string', 'max:10', 'alpha_dash']),
            ],
            [
                'key' => 'warehouse.ddt_code_format',
                'value' => '{prefix}-{year}-{number:4}',
                'type' => 'string',
                'group' => 'warehouse',
                'is_public' => false,
                'description' => 'Format for DDT codes. Available placeholders: {prefix}, {year}, {date}, {number:X}',
            ],
            [
                'key' => 'warehouse.movement_code_prefix',
                'value' => 'MOV',
                'type' => 'string',
                'group' => 'warehouse',
                'is_public' => false,
                'description' => 'Prefix for stock movement codes (e.g., MOV-20260211-001)',
                'validation_rules' => json_encode(['required', 'string', 'max:10', 'alpha_dash']),
            ],
            [
                'key' => 'warehouse.movement_code_format',
                'value' => '{prefix}-{date}-{number:3}',
                'type' => 'string',
                'group' => 'warehouse',
                'is_public' => false,
                'description' => 'Format for stock movement codes. Available placeholders: {prefix}, {year}, {date}, {number:X}',
            ],

            // Sites group (new, for future site-related settings)
            [
                'key' => 'sites.code_prefix',
                'value' => 'CANT',
                'type' => 'string',
                'group' => 'sites',
                'is_public' => false,
                'description' => 'Prefix for construction site codes (e.g., CANT-0001)',
                'validation_rules' => json_encode(['required', 'string', 'max:10', 'alpha_dash']),
            ],
            [
                'key' => 'sites.code_format',
                'value' => '{prefix}-{number:4}',
                'type' => 'string',
                'group' => 'sites',
                'is_public' => false,
                'description' => 'Format for site codes. Available placeholders: {prefix}, {year}, {date}, {number:X}',
            ],

            // Codes group (generic group for entities without other settings)
            [
                'key' => 'codes.supplier_prefix',
                'value' => 'FOR',
                'type' => 'string',
                'group' => 'codes',
                'is_public' => false,
                'description' => 'Prefix for supplier codes (e.g., FOR-00001)',
                'validation_rules' => json_encode(['required', 'string', 'max:10', 'alpha_dash']),
            ],
            [
                'key' => 'codes.supplier_format',
                'value' => '{prefix}-{number:5}',
                'type' => 'string',
                'group' => 'codes',
                'is_public' => false,
                'description' => 'Format for supplier codes. Available placeholders: {prefix}, {year}, {date}, {number:X}',
            ],
            [
                'key' => 'codes.worker_prefix',
                'value' => 'LAV',
                'type' => 'string',
                'group' => 'codes',
                'is_public' => false,
                'description' => 'Prefix for worker codes (e.g., LAV-00001)',
                'validation_rules' => json_encode(['required', 'string', 'max:10', 'alpha_dash']),
            ],
            [
                'key' => 'codes.worker_format',
                'value' => '{prefix}-{number:5}',
                'type' => 'string',
                'group' => 'codes',
                'is_public' => false,
                'description' => 'Format for worker codes. Available placeholders: {prefix}, {year}, {date}, {number:X}',
            ],
            [
                'key' => 'codes.contractor_prefix',
                'value' => 'CON',
                'type' => 'string',
                'group' => 'codes',
                'is_public' => false,
                'description' => 'Prefix for contractor codes (e.g., CON-00001)',
                'validation_rules' => json_encode(['required', 'string', 'max:10', 'alpha_dash']),
            ],
            [
                'key' => 'codes.contractor_format',
                'value' => '{prefix}-{number:5}',
                'type' => 'string',
                'group' => 'codes',
                'is_public' => false,
                'description' => 'Format for contractor codes. Available placeholders: {prefix}, {year}, {date}, {number:X}',
            ],
        ];

        foreach ($settings as $setting) {
            DB::table('settings')->insert([
                ...$setting,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $keys = [
            'quotes.code_prefix',
            'quotes.code_format',
            'products.code_prefix',
            'products.code_format',
            'warehouse.ddt_code_prefix',
            'warehouse.ddt_code_format',
            'warehouse.movement_code_prefix',
            'warehouse.movement_code_format',
            'sites.code_prefix',
            'sites.code_format',
            'codes.supplier_prefix',
            'codes.supplier_format',
            'codes.worker_prefix',
            'codes.worker_format',
            'codes.contractor_prefix',
            'codes.contractor_format',
        ];

        DB::table('settings')->whereIn('key', $keys)->delete();
    }
};

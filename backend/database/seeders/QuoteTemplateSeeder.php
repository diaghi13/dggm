<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class QuoteTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('quote_templates')->insert([
            [
                'name' => 'Default Professional',
                'description' => 'Template professionale predefinito per preventivi',
                'primary_color' => '#3B82F6',
                'secondary_color' => '#64748B',
                'font_family' => 'Inter',
                'font_size' => 10,
                'page_size' => 'A4',
                'orientation' => 'portrait',
                'header_text' => null,
                'footer_text' => 'Grazie per aver scelto i nostri servizi. Per qualsiasi informazione non esitate a contattarci.',
                'show_logo' => true,
                'show_page_numbers' => true,
                'show_item_codes' => false,
                'show_unit_column' => true,
                'group_by_sections' => true,
                'is_default' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}

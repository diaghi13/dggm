<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $globalSettings = [
            // General
            [
                'key' => 'app.name',
                'value' => 'DGGM ERP',
                'type' => 'string',
                'group' => 'general',
                'is_public' => true,
                'description' => 'Application name displayed in the UI',
            ],
            [
                'key' => 'app.timezone',
                'value' => 'Europe/Rome',
                'type' => 'string',
                'group' => 'general',
                'is_public' => true,
                'description' => 'Default timezone for the application',
            ],
            [
                'key' => 'app.locale',
                'value' => 'it',
                'type' => 'string',
                'group' => 'general',
                'is_public' => true,
                'description' => 'Default locale for the application',
            ],

            // Company
            [
                'key' => 'company.name',
                'value' => 'DGGM S.r.l.',
                'type' => 'string',
                'group' => 'company',
                'is_public' => false,
                'description' => 'Company legal name',
            ],
            [
                'key' => 'company.vat',
                'value' => 'IT12345678901',
                'type' => 'string',
                'group' => 'company',
                'is_public' => false,
                'description' => 'Company VAT number',
            ],
            [
                'key' => 'company.email',
                'value' => 'info@dggm.it',
                'type' => 'string',
                'group' => 'company',
                'is_public' => false,
                'description' => 'Company main email',
            ],
            [
                'key' => 'company.phone',
                'value' => '+39 0123 456789',
                'type' => 'string',
                'group' => 'company',
                'is_public' => false,
                'description' => 'Company main phone number',
            ],

            // Warehouse
            [
                'key' => 'warehouse.low_stock_threshold',
                'value' => '10',
                'type' => 'number',
                'group' => 'warehouse',
                'is_public' => false,
                'description' => 'Default threshold for low stock alerts',
            ],
            [
                'key' => 'warehouse.enable_notifications',
                'value' => '1',
                'type' => 'boolean',
                'group' => 'warehouse',
                'is_public' => false,
                'description' => 'Enable warehouse notifications',
            ],

            // Email
            [
                'key' => 'email.enabled',
                'value' => '0',
                'type' => 'boolean',
                'group' => 'email',
                'is_public' => false,
                'description' => 'Enable email sending',
            ],
            [
                'key' => 'email.from_address',
                'value' => 'noreply@dggm.it',
                'type' => 'string',
                'group' => 'email',
                'is_public' => false,
                'description' => 'Default from email address',
            ],

            // Notifications
            [
                'key' => 'notifications.channels',
                'value' => json_encode(['database', 'mail']),
                'type' => 'json',
                'group' => 'notifications',
                'is_public' => false,
                'description' => 'Enabled notification channels',
            ],

            // Features (Feature Flags)
            [
                'key' => 'features.enable_gps_tracking',
                'value' => '1',
                'type' => 'boolean',
                'group' => 'features',
                'is_public' => false,
                'is_feature_flag' => true,
                'description' => 'Enable GPS tracking for time entries',
                'order' => 10,
            ],
            [
                'key' => 'features.enable_material_requests',
                'value' => '1',
                'type' => 'boolean',
                'group' => 'features',
                'is_public' => false,
                'is_feature_flag' => true,
                'description' => 'Enable material request system',
                'order' => 20,
            ],
            [
                'key' => 'features.enable_semantic_search',
                'value' => '1',
                'type' => 'boolean',
                'group' => 'features',
                'is_public' => false,
                'is_feature_flag' => true,
                'description' => 'Enable AI-powered semantic search for products',
                'order' => 30,
            ],
            [
                'key' => 'features.enable_pdf_generation',
                'value' => '1',
                'type' => 'boolean',
                'group' => 'features',
                'is_public' => false,
                'is_feature_flag' => true,
                'description' => 'Enable PDF generation for quotes and invoices',
                'order' => 40,
            ],
            [
                'key' => 'features.enable_notifications',
                'value' => '1',
                'type' => 'boolean',
                'group' => 'features',
                'is_public' => false,
                'is_feature_flag' => true,
                'description' => 'Enable system notifications',
                'order' => 50,
            ],

            // Pricing & Rental
            [
                'key' => 'pricing.default_markup_percent',
                'value' => '30',
                'type' => 'number',
                'group' => 'pricing',
                'is_public' => false,
                'description' => 'Default markup percentage for products',
                'min_value' => 0,
                'max_value' => 1000,
            ],
            [
                'key' => 'rental.daily_rate_percent',
                'value' => '15',
                'type' => 'number',
                'group' => 'pricing',
                'is_public' => false,
                'description' => 'Daily rental rate as percentage of product value (15% = 0.15 * value)',
                'min_value' => 0,
                'max_value' => 100,
            ],
            [
                'key' => 'rental.weekly_multiplier',
                'value' => '2.6457513110645906',
                'type' => 'number',
                'group' => 'pricing',
                'is_public' => false,
                'description' => 'Weekly rental multiplier: daily_rate * sqrt(7)',
            ],
            [
                'key' => 'rental.monthly_multiplier',
                'value' => '5.477225575051661',
                'type' => 'number',
                'group' => 'pricing',
                'is_public' => false,
                'description' => 'Monthly rental multiplier: daily_rate * sqrt(30)',
            ],

            // Theme / UI (Public settings for dynamic UI)
            [
                'key' => 'theme.primary_color',
                'value' => '#0e172b',
                'type' => 'color',
                'group' => 'theme',
                'is_public' => true,
                'description' => 'Primary brand color',
            ],
            [
                'key' => 'theme.secondary_color',
                'value' => '#f5f5f5',
                'type' => 'color',
                'group' => 'theme',
                'is_public' => true,
                'description' => 'Secondary brand color',
            ],
            [
                'key' => 'theme.logo_url',
                'value' => '/images/logo.png',
                'type' => 'string',
                'group' => 'theme',
                'is_public' => true,
                'description' => 'Company logo URL',
            ],
            [
                'key' => 'theme.favicon_url',
                'value' => '/favicon.ico',
                'type' => 'string',
                'group' => 'theme',
                'is_public' => true,
                'description' => 'Favicon URL',
            ],
            [
                'key' => 'ui.items_per_page',
                'value' => '15',
                'type' => 'number',
                'group' => 'ui',
                'is_public' => true,
                'description' => 'Default items per page in tables',
            ],
            [
                'key' => 'ui.date_format',
                'value' => 'DD/MM/YYYY',
                'type' => 'string',
                'group' => 'ui',
                'is_public' => true,
                'description' => 'Date format for UI display',
            ],
        ];

        foreach ($globalSettings as $setting) {
            Setting::firstOrCreate(
                ['key' => $setting['key'], 'user_id' => null],
                $setting
            );
        }
    }
}

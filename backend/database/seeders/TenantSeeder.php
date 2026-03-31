<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class TenantSeeder extends Seeder
{
    public function __construct(
        private readonly string $companyName = '',
    ) {}

    /**
     * Seed a new tenant database with all required defaults.
     * This is called for every new tenant created via CreateTenantJob.
     */
    public function run(): void
    {
        // Use direct instantiation instead of $this->call() so this seeder can be
        // invoked from a queued job (BootstrapTenantJob) where no artisan Command
        // context is available — $this->call() internally calls setCommand($this->command)
        // which requires a non-null Command in Laravel 12.
        $container = app();

        foreach ([
            RoleAndPermissionSeeder::class,
            PaymentTermSeeder::class,
            ProductCategorySeeder::class,
            ProductRelationTypeSeeder::class,
        ] as $class) {
            (new $class)->setContainer($container)->run();
        }

        // Pass company name so SettingSeeder seeds the correct company.name value
        (new SettingSeeder($this->companyName))->setContainer($container)->run();

        foreach ([
            AppSettingsSeeder::class,
            CompanySettingsSeeder::class,
            QuoteSettingsSeeder::class,
            ProjectRoleSeeder::class,
            WarrantyTypeSeeder::class,
            RentalProfileSeeder::class,
        ] as $class) {
            (new $class)->setContainer($container)->run();
        }
    }
}

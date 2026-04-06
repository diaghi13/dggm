<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class TenantSeeder extends Seeder
{
    /**
     * Seed a new tenant database with all required defaults.
     *
     * Called by DatabaseSeeder (via SeedDatabase pipeline job) inside
     * the tenant context, so tenancy()->tenant is available.
     */
    public function run(): void
    {
        $companyName = tenancy()->tenant?->company_name ?? tenancy()->tenant?->name ?? '';

        // Use direct instantiation instead of $this->call() so this seeder can be
        // invoked from a queued job where no artisan Command context is available —
        // $this->call() internally calls setCommand($this->command) which requires
        // a non-null Command in Laravel 12.
        $container = app();

        foreach ([
            RoleAndPermissionSeeder::class,
            PaymentTermSeeder::class,
            ProductCategorySeeder::class,
            ProductRelationTypeSeeder::class,
        ] as $class) {
            (new $class)->setContainer($container)->run();
        }

        (new SettingSeeder($companyName))->setContainer($container)->run();

        foreach ([
            AppSettingsSeeder::class,
            CompanySettingsSeeder::class,
            QuoteSettingsSeeder::class,
            ProjectRoleSeeder::class,
            WarrantyTypeSeeder::class,
            RentalProfileSeeder::class,
            EmailSettingsSeeder::class,
        ] as $class) {
            (new $class)->setContainer($container)->run();
        }
    }
}

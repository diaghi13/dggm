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
        $this->call([
            RoleAndPermissionSeeder::class,
            //DiscountFamilySeeder::class,
            PaymentTermSeeder::class,
            ProductCategorySeeder::class,
            ProductRelationTypeSeeder::class,
        ]);

        // Pass company name so SettingSeeder seeds the correct company.name value
        $seeder = new SettingSeeder($this->companyName);
        $seeder->setContainer(app())->setCommand($this->command)->run();

        $this->call([
            AppSettingsSeeder::class,
            CompanySettingsSeeder::class,
            QuoteSettingsSeeder::class,
            ProjectRoleSeeder::class,
            WarrantyTypeSeeder::class,
            RentalProfileSeeder::class,
        ]);
    }
}

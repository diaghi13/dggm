<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * In a multi-tenant setup this is called by stancl/tenancy's SeedDatabase
     * job inside the tenant context. It delegates to TenantSeeder which reads
     * company_name from the current tenant.
     */
    public function run(): void
    {
        $container = app();

        (new TenantSeeder)->setContainer($container)->run();
    }
}

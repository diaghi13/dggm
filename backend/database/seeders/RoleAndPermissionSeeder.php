<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleAndPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions for each module
        $permissions = [
            // User management
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',

            // Customer management
            'customers.view',
            'customers.create',
            'customers.edit',
            'customers.delete',

            // Supplier management
            'suppliers.view',
            'suppliers.create',
            'suppliers.edit',
            'suppliers.delete',

            // Site (construction site) management
            'sites.view',
            'sites.create',
            'sites.edit',
            'sites.delete',
            'sites.view-own', // View only assigned sites

            // Quote/Estimate management
            'quotes.view',
            'quotes.create',
            'quotes.edit',
            'quotes.delete',
            'quotes.approve',
            'quotes.convert-to-site',

            // Time tracking
            'time-trackings.view',
            'time-trackings.create',
            'time-trackings.edit',
            'time-trackings.delete',
            'time-trackings.view-own', // View only own time trackings
            'time-trackings.approve',

            // Warehouse management
            'warehouse.view',
            'warehouse.create',
            'warehouse.edit',
            'warehouse.delete',
            'warehouse.inventory',

            // Materials management
            'materials.view',
            'materials.create',
            'materials.edit',
            'materials.delete',

            // Invoice management
            'invoices.view',
            'invoices.create',
            'invoices.edit',
            'invoices.delete',
            'invoices.send',

            // Vehicle management
            'vehicles.view',
            'vehicles.create',
            'vehicles.edit',
            'vehicles.delete',

            // Progress billing (SAL)
            'progress-billings.view',
            'progress-billings.create',
            'progress-billings.edit',
            'progress-billings.approve',

            // Worker management
            'workers.view',
            'workers.create',
            'workers.edit',
            'workers.delete',
            'workers.view-rates',
            'workers.manage-rates',
            'workers.view-payroll',
            'workers.manage-payroll',

            // Contractor management
            'contractors.view',
            'contractors.create',
            'contractors.edit',
            'contractors.delete',

            // Labor costs (for consuntivi)
            'labor-costs.view',
            'labor-costs.create',
            'labor-costs.edit',
            'labor-costs.delete',
            'labor-costs.approve',

            // Reports
            'reports.view',
            'reports.financial',
            'reports.sites',
            'reports.time-tracking',

            // Settings
            'settings.view',
            'settings.edit',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Create roles and assign permissions

        // Super Admin - has all permissions
        $superAdmin = Role::firstOrCreate(['name' => 'super-admin']);
        $superAdmin->givePermissionTo(Permission::all());

        // Admin - full access except system settings
        $admin = Role::firstOrCreate(['name' => 'admin']);
        $admin->givePermissionTo(Permission::whereNotIn('name', [
            'settings.edit',
        ])->get());

        // Project Manager - manages sites, quotes, teams
        $projectManager = Role::firstOrCreate(['name' => 'project-manager']);
        $projectManager->givePermissionTo([
            'users.view',
            'customers.view', 'customers.create', 'customers.edit',
            'suppliers.view',
            'sites.view', 'sites.create', 'sites.edit',
            'quotes.view', 'quotes.create', 'quotes.edit', 'quotes.approve', 'quotes.convert-to-site',
            'time-trackings.view', 'time-trackings.approve',
            'warehouse.view',
            'materials.view', 'materials.create', 'materials.edit',
            'invoices.view',
            'vehicles.view',
            'progress-billings.view', 'progress-billings.create', 'progress-billings.edit',
            'workers.view', 'workers.create', 'workers.edit', 'workers.view-rates', 'workers.manage-rates',
            'contractors.view', 'contractors.create', 'contractors.edit',
            'labor-costs.view', 'labor-costs.create', 'labor-costs.edit', 'labor-costs.delete',
            'reports.view', 'reports.sites', 'reports.time-tracking',
        ]);

        // Team Leader (Caposquadra) - manages assigned sites and team
        $teamLeader = Role::firstOrCreate(['name' => 'team-leader']);
        $teamLeader->givePermissionTo([
            'sites.view-own',
            'time-trackings.view', 'time-trackings.create', 'time-trackings.edit',
            'warehouse.view',
            'vehicles.view',
            'workers.view', // Can see workers on their sites
        ]);

        // Worker (Operaio) - time tracking only
        $worker = Role::firstOrCreate(['name' => 'worker']);
        $worker->givePermissionTo([
            'sites.view-own',
            'time-trackings.view-own', 'time-trackings.create',
        ]);

        // Accountant (Contabile) - manages invoices, reports
        $accountant = Role::firstOrCreate(['name' => 'accountant']);
        $accountant->givePermissionTo([
            'customers.view',
            'suppliers.view',
            'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.send',
            'progress-billings.view',
            'workers.view', 'workers.view-payroll', // View payroll data
            'contractors.view',
            'labor-costs.view', 'labor-costs.approve', // Approve contractor invoices
            'reports.view', 'reports.financial',
        ]);

        // Warehousekeeper (Magazziniere) - manages warehouse
        $warehousekeeper = Role::firstOrCreate(['name' => 'warehousekeeper']);
        $warehousekeeper->givePermissionTo([
            'suppliers.view',
            'warehouse.view', 'warehouse.create', 'warehouse.edit', 'warehouse.inventory',
            'materials.view', 'materials.create', 'materials.edit', 'materials.delete',
            'vehicles.view',
        ]);

        // Customer - view only (future portal)
        $customer = Role::firstOrCreate(['name' => 'customer']);
        $customer->givePermissionTo([
            'quotes.view',
            'progress-billings.view',
            'invoices.view',
        ]);

        $this->command->info('Roles and permissions created successfully!');
    }
}

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

            // Role management
            'roles.view',
            'roles.create',
            'roles.edit',
            'roles.delete',

            // Permission management
            'permissions.view',
            'permissions.create',
            'permissions.edit',
            'permissions.delete',
            'permissions.assign',
            'permissions.revoke',
            'permissions.view-roles',
            'permissions.view-users',
            'permissions.view-modules',
            'permissions.view-actions',
            'permissions.view-resources',
            'permissions.view-conditions',
            'permissions.view-contexts',
            'permissions.view-attributes',
            'permissions.view-policies',

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

            // Project management
            'projects.view',
            'projects.create',
            'projects.edit',
            'projects.delete',
            'projects.view-own', // View only assigned projects (own)

            // Project Workers (Team Management)
            'project_workers.view',
            'project_workers.create',
            'project_workers.update',
            'project_workers.delete',

            // Project Roles management
            'project_roles.view',
            'project_roles.create',
            'project_roles.update',
            'project_roles.delete',

            // Project Materials
            'project_materials.view',
            'project_materials.create',
            'project_materials.update',
            'project_materials.delete',

            // Material Requests
            'material_requests.view',
            'material_requests.create',
            'material_requests.update',
            'material_requests.approve',
            'material_requests.reject',
            'material_requests.deliver',
            'material_requests.delete',

            // DDT (Documento Di Trasporto)
            'ddts.view',
            'ddts.create',
            'ddts.update',
            'ddts.delete',
            'ddts.confirm',
            'ddts.cancel',

            // Quote/Estimate management
            'quotes.view',
            'quotes.create',
            'quotes.edit',
            'quotes.delete',
            'quotes.approve',
            'quotes.convert-to-project',

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

            // Materials management (deprecated - use products)
            'materials.view',
            'materials.create',
            'materials.edit',
            'materials.delete',

            // Products management (replaces materials)
            'products.view',
            'products.create',
            'products.edit',
            'products.delete',

            // Product Categories
            'product-categories.view',
            'product-categories.create',
            'product-categories.edit',
            'product-categories.delete',

            // Product Relation Types
            'product-relation-types.view',
            'product-relation-types.create',
            'product-relation-types.edit',
            'product-relation-types.delete',

            // Product Relations
            'product-relations.view',
            'product-relations.create',
            'product-relations.edit',
            'product-relations.delete',

            // Product Brands
            'product-brands.view',
            'product-brands.create',
            'product-brands.edit',
            'product-brands.delete',

            // Payment Terms
            'payment-terms.view',
            'payment-terms.create',
            'payment-terms.edit',
            'payment-terms.delete',

            // Financial Resources (company bank accounts, cash, POS)
            'financial-resources.view',
            'financial-resources.create',
            'financial-resources.edit',
            'financial-resources.delete',

            // Discount Families
            'discount-families.view',
            'discount-families.create',
            'discount-families.edit',
            'discount-families.delete',

            // Warranty Types
            'warranty-types.view',
            'warranty-types.create',
            'warranty-types.edit',
            'warranty-types.delete',

            // Price Lists
            'price-lists.view',
            'price-lists.create',
            'price-lists.edit',
            'price-lists.delete',
            'price-lists.regenerate',

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
            'reports.projects',
            'reports.time-tracking',

            // Settings (key-value system)
            'settings.view',
            'settings.create',
            'settings.edit',
            'settings.delete',
            'settings.view-global', // View global settings
            'settings.edit-global', // Edit global settings (admin only)
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Create roles and assign permissions

        // Super Admin - has all permissions
        $superAdmin = Role::firstOrCreate(['name' => 'super-admin']);
        $superAdmin->givePermissionTo(Permission::all());

        // Admin - full access except system-level global settings
        $admin = Role::firstOrCreate(['name' => 'admin']);
        $admin->givePermissionTo(Permission::whereNotIn('name', [
            'settings.edit-global', // Only super-admin can edit global settings
        ])->get());

        // Project Manager - manages projects, quotes, teams
        $projectManager = Role::firstOrCreate(['name' => 'project-manager']);
        $projectManager->givePermissionTo([
            'users.view',
            'customers.view', 'customers.create', 'customers.edit',
            'suppliers.view',
            'projects.view', 'projects.create', 'projects.edit',
            'project_workers.view', 'project_workers.create', 'project_workers.update', 'project_workers.delete',
            'project_roles.view', 'project_roles.create', 'project_roles.update', 'project_roles.delete',
            'project_materials.view', 'project_materials.create', 'project_materials.update', 'project_materials.delete',
            'material_requests.view', 'material_requests.approve', 'material_requests.reject', 'material_requests.deliver', 'material_requests.delete',
            'ddts.view', 'ddts.create', 'ddts.update', 'ddts.delete', 'ddts.confirm', 'ddts.cancel',
            'quotes.view', 'quotes.create', 'quotes.edit', 'quotes.delete', 'quotes.approve', 'quotes.convert-to-project',
            'time-trackings.view', 'time-trackings.approve',
            'warehouse.view',
            'materials.view', 'materials.create', 'materials.edit',
            'products.view', 'products.create', 'products.edit',
            'product-categories.view', 'product-categories.create', 'product-categories.edit',
            'product-relation-types.view', 'product-relation-types.create', 'product-relation-types.edit',
            'product-relations.view', 'product-relations.create', 'product-relations.edit', 'product-relations.delete',
            'product-brands.view', 'product-brands.create', 'product-brands.edit',
            'payment-terms.view',
            'financial-resources.view',
            'discount-families.view',
            'price-lists.view',
            'invoices.view',
            'vehicles.view',
            'progress-billings.view', 'progress-billings.create', 'progress-billings.edit',
            'workers.view', 'workers.create', 'workers.edit', 'workers.view-rates', 'workers.manage-rates',
            'contractors.view', 'contractors.create', 'contractors.edit',
            'labor-costs.view', 'labor-costs.create', 'labor-costs.edit', 'labor-costs.delete',
            'reports.view', 'reports.projects', 'reports.time-tracking',
        ]);

        // Team Leader (Caposquadra) - manages assigned projects and team
        $teamLeader = Role::firstOrCreate(['name' => 'team-leader']);
        $teamLeader->givePermissionTo([
            'projects.view-own',
            'project_workers.view',
            'project_materials.view',
            'material_requests.view', 'material_requests.create', 'material_requests.update', 'material_requests.delete',
            'time-trackings.view', 'time-trackings.create', 'time-trackings.edit',
            'warehouse.view',
            'vehicles.view',
            'workers.view', // Can see workers on their projects
        ]);

        // Worker (Operaio) - time tracking and material requests
        $worker = Role::firstOrCreate(['name' => 'worker']);
        $worker->givePermissionTo([
            'projects.view-own',
            'project_workers.view',
            'project_materials.view',
            'material_requests.view', 'material_requests.create', 'material_requests.update', 'material_requests.delete',
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
            'projects.view',
            'project_materials.view',
            'material_requests.view', 'material_requests.approve', 'material_requests.reject', 'material_requests.deliver',
            'ddts.view', 'ddts.create', 'ddts.update', 'ddts.delete', 'ddts.confirm', 'ddts.cancel',
            'warehouse.view', 'warehouse.create', 'warehouse.edit', 'warehouse.inventory',
            'materials.view', 'materials.create', 'materials.edit', 'materials.delete',
            'products.view', 'products.create', 'products.edit', 'products.delete',
            'product-categories.view',
            'product-relation-types.view',
            'product-relations.view', 'product-relations.create', 'product-relations.edit', 'product-relations.delete',
            'product-brands.view', 'product-brands.create', 'product-brands.edit', 'product-brands.delete',
            'payment-terms.view', 'payment-terms.create', 'payment-terms.edit', 'payment-terms.delete',
            'financial-resources.view', 'financial-resources.create', 'financial-resources.edit', 'financial-resources.delete',
            'discount-families.view', 'discount-families.create', 'discount-families.edit', 'discount-families.delete',
            'price-lists.view', 'price-lists.create', 'price-lists.edit', 'price-lists.delete', 'price-lists.regenerate',
            'vehicles.view',
        ]);

        // Customer - view only (future portal)
        $customer = Role::firstOrCreate(['name' => 'customer']);
        $customer->givePermissionTo([
            'quotes.view',
            'progress-billings.view',
            'invoices.view',
        ]);

        $this->command?->info('Roles and permissions created successfully!');
    }
}

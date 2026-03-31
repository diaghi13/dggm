<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->string('display_name')->nullable()->after('name');
            $table->text('description')->nullable()->after('display_name');
        });

        // Update existing roles with display names based on their names
        DB::table('roles')->get()->each(function ($role) {
            $displayName = match ($role->name) {
                'super-admin' => 'Super Administrator',
                'admin' => 'Administrator',
                'project-manager' => 'Project Manager',
                'team-leader' => 'Team Leader',
                'worker' => 'Worker',
                'accountant' => 'Accountant',
                'warehousekeeper' => 'Warehouse Keeper',
                'customer' => 'Customer',
                default => ucwords(str_replace('-', ' ', $role->name)),
            };

            $description = match ($role->name) {
                'super-admin' => 'Full system access with all permissions',
                'admin' => 'Complete company management access',
                'project-manager' => 'Manage construction sites, quotes, and SAL',
                'team-leader' => 'View assigned sites and manage team',
                'worker' => 'Time tracking and view assigned sites (read-only)',
                'accountant' => 'Invoicing, accounting, and financial reporting',
                'warehousekeeper' => 'Warehouse management, DDT, and supplier orders',
                'customer' => 'View quotes and SAL (customer portal)',
                default => null,
            };

            DB::table('roles')
                ->where('id', $role->id)
                ->update([
                    'display_name' => $displayName,
                    'description' => $description,
                ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->dropColumn(['display_name', 'description']);
        });
    }
};

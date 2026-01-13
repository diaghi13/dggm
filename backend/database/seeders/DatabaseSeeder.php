<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed roles and permissions first
        $this->call(RoleAndPermissionSeeder::class);

        // Create a super admin user
        $superAdmin = User::firstOrCreate(
            ['email' => 'admin@dggm.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
            ]
        );
        $superAdmin->assignRole('super-admin');

        // Create test users for each role
        $projectManager = User::firstOrCreate(
            ['email' => 'pm@dggm.com'],
            [
                'name' => 'Project Manager',
                'password' => Hash::make('password'),
            ]
        );
        $projectManager->assignRole('project-manager');

        $worker = User::firstOrCreate(
            ['email' => 'worker@dggm.com'],
            [
                'name' => 'Worker',
                'password' => Hash::make('password'),
            ]
        );
        $worker->assignRole('worker');

        $this->command->info('Database seeded successfully!');
        $this->command->info('Super Admin: admin@dggm.com / password');
        $this->command->info('Project Manager: pm@dggm.com / password');
        $this->command->info('Worker: worker@dggm.com / password');
    }
}
